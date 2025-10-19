import { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { DashboardAnalytics, DashboardWidgetType, RefreshFrequency } from '../models/DashboardAnalytics';
import { UserAnalytics } from '../models/UserAnalytics';
import { User } from '../models/User';
import { Plant } from '../models/Plant';
import { CommunityPost } from '../models/CommunityPost';
import { CommunityComment } from '../models/CommunityComment';
import { CommunityVote } from '../models/CommunityVote';
import { CommunityReport } from '../models/CommunityReport';
import { logger } from '../config/logger';

// Interfaces for request types
interface AuthenticatedRequest extends Request {
  user?: any;
}

interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string;
  plantId?: string;
}

// Get simple dashboard analytics (flat structure for frontend compatibility)
export const getSimpleDashboardAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!._id.toString());

    // Get all counts in parallel for performance
    const [
      totalPlants,
      healthyPlants,
      needsAttention,
      communityPosts,
      postsThisMonth
    ] = await Promise.all([
      // Total plants
      Plant.countDocuments({ userId }),
      
      // Healthy plants (Excellent or Good health)
      Plant.countDocuments({ 
        userId,
        $or: [
          { health: { $in: ['Excellent', 'Good'] } },
          { healthStatus: { $in: ['Excellent', 'Good'] } }
        ]
      }),
      
      // Plants needing attention (not Excellent/Good)
      Plant.countDocuments({ 
        userId,
        $or: [
          { health: { $nin: ['Excellent', 'Good'] } },
          { healthStatus: { $nin: ['Excellent', 'Good'] } }
        ]
      }),
      
      // Community posts by user
      CommunityPost.countDocuments({ authorId: userId }),
      
      // Posts this month
      CommunityPost.countDocuments({
        authorId: userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Calculate critical plants (those needing urgent attention)
    const criticalPlants = await Plant.countDocuments({
      userId,
      $or: [
        { health: 'Critical' },
        { healthStatus: 'Critical' }
      ]
    });

    // Build simple analytics response matching frontend interface
    const analytics = {
      userId: userId.toString(),
      totalPlants,
      healthyPlants,
      needsAttention,
      criticalPlants,
      communityPosts,
      postsThisMonth,
      lastUpdated: new Date().toISOString()
    };

    return res.json({
      success: true,
      data: {
        analytics
      }
    });

  } catch (error) {
    logger.error('Error fetching simple dashboard analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get comprehensive user analytics dashboard
export const getUserDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!._id.toString());
    const period = (req.query.period as string) || 'weekly';
    
    // Get all dashboard widgets for user
    const widgets = await DashboardAnalytics.find({ 
      userId, 
      'config.isEnabled': true 
    }).sort({ 'config.position.y': 1, 'config.position.x': 1 });

    // Generate fresh analytics data
    const analytics = await generateUserAnalytics(userId, period);

    // Update widgets with fresh data
    const updatedWidgets = await Promise.all(
      widgets.map(async (widget) => {
        const freshData = getWidgetData(widget.widgetType, analytics);
        
        if (widget.shouldRefresh()) {
          await widget.updateData(freshData);
        }
        
        return {
          ...widget.toObject(),
          data: freshData
        };
      })
    );

    // If no widgets exist, create default dashboard
    if (widgets.length === 0) {
      const defaultWidgets = await createDefaultDashboard(userId);
      return res.json({
        success: true,
        data: {
          widgets: defaultWidgets,
          analytics,
          period,
          lastUpdated: new Date()
        }
      });
    }

    return res.json({
      success: true,
      data: {
        widgets: updatedWidgets,
        analytics,
        period,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    logger.error('Error fetching user dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get plant health analytics
export const getPlantHealthAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user!._id.toString());
    const { startDate, endDate, plantId } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Build plant filter
    const plantFilter: any = { userId };
    if (plantId) plantFilter._id = new mongoose.Types.ObjectId(plantId as string);

    // Get plants with health data
    const plants = await Plant.find(plantFilter).select('name species healthStatus healthScore category');
    
    // Get care logs for health correlation
    // Note: CareLog collection was removed. Skipping care log aggregation.

    // Calculate health analytics
    const healthAnalytics = {
      totalPlants: plants.length,
      healthDistribution: {
        excellent: plants.filter(p => (p as any).health === 'Excellent' || (p as any).healthStatus === 'Excellent').length,
        good: plants.filter(p => (p as any).health === 'Good' || (p as any).healthStatus === 'Good').length,
        fair: plants.filter(p => (p as any).health === 'Fair' || (p as any).healthStatus === 'Fair').length,
        poor: plants.filter(p => (p as any).health === 'Poor' || (p as any).healthStatus === 'Poor').length,
        critical: plants.filter(p => (p as any).health === 'Critical' || (p as any).healthStatus === 'Critical').length
      },
      averageHealthScore: plants.reduce((sum, p) => sum + (p.healthScore || 0), 0) / plants.length || 0,
      healthByCategory: {} as Record<string, {
        total: number;
        healthy: number;
        unhealthy: number;
        averageScore: number;
      }>,
      careImpactAnalysis: {}, // Not available without care logs
      healthTrends: {},
      riskFactors: [],
      recommendations: []
    };

    // Group by category
    plants.forEach(plant => {
      const category = plant.category || 'Other';
      if (!healthAnalytics.healthByCategory[category]) {
        healthAnalytics.healthByCategory[category] = {
          total: 0,
          healthy: 0,
          unhealthy: 0,
          averageScore: 0
        };
      }
      
      healthAnalytics.healthByCategory[category].total += 1;
      const health = (plant as any).health || (plant as any).healthStatus;
      if (['Excellent', 'Good'].includes(health)) {
        healthAnalytics.healthByCategory[category].healthy += 1;
      } else {
        healthAnalytics.healthByCategory[category].unhealthy += 1;
      }
    });

    // Generate recommendations based on analytics
    const recommendations = generateHealthRecommendations(healthAnalytics, plants);

    return res.json({
      success: true,
      data: {
        ...healthAnalytics,
        recommendations,
        plantDetails: plants,
        recentCareLogs: []
      }
    });

  } catch (error) {
    logger.error('Error fetching plant health analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch plant health analytics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get care effectiveness analytics
export const getCareEffectivenessAnalytics = async (_req: AuthenticatedRequest, res: Response) => {
  // CareLog and Reminder collections are not part of the current schema.
  return res.status(501).json({
    success: false,
    message: 'Care effectiveness analytics are not available in the current deployment.'
  });
};

// Get growth tracking analytics
export const getGrowthAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user!._id.toString());
    const { startDate, endDate, plantId } = req.query;

    // Build filters
    const plantFilter: any = { userId };
    if (plantId) plantFilter._id = new mongoose.Types.ObjectId(plantId as string);

    const plants = await Plant.find(plantFilter).select('name species category measurements');

    // Analyze growth data
    const growthAnalytics = {
      totalPlantsTracked: plants.length,
      plantsWithGrowthData: plants.filter(p => p.measurements && p.measurements.length > 0).length,
      averageGrowthRate: 0,
      growthByCategory: {} as Record<string, {
        count: number;
        averageRate: number;
        totalRate: number;
      }>,
      growthTrends: [],
      fastestGrowing: null as { plantId: mongoose.Types.ObjectId; name: string; rate: number } | null,
      slowestGrowing: null as { plantId: mongoose.Types.ObjectId; name: string; rate: number } | null,
      growthMilestones: [],
      seasonalPatterns: {},
      predictions: []
    };

    let totalGrowthRate = 0;
    let plantsWithGrowth = 0;

    plants.forEach(plant => {
      if (plant.measurements && plant.measurements.length > 1) {
        // Sort measurements by date
        const sortedMeasurements = plant.measurements.sort((a, b) => 
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        );
        
        if (sortedMeasurements.length >= 2) {
          const firstRecord = sortedMeasurements[0]!;
          const lastRecord = sortedMeasurements[sortedMeasurements.length - 1]!;
          
          if (firstRecord.height && lastRecord.height) {
            const timeDiff = (lastRecord.recordedAt.getTime() - firstRecord.recordedAt.getTime()) / (1000 * 60 * 60 * 24); // days
            const heightDiff = lastRecord.height - firstRecord.height;
            const growthRate = heightDiff / timeDiff;
            
            totalGrowthRate += growthRate;
            plantsWithGrowth += 1;

            // Track by category
            const category = plant.category || 'Other';
            if (!growthAnalytics.growthByCategory[category]) {
              growthAnalytics.growthByCategory[category] = {
                count: 0,
                averageRate: 0,
                totalRate: 0
              };
            }
            
            growthAnalytics.growthByCategory[category].count += 1;
            growthAnalytics.growthByCategory[category].totalRate += growthRate;

            // Track fastest/slowest
            if (!growthAnalytics.fastestGrowing || growthRate > growthAnalytics.fastestGrowing.rate) {
              growthAnalytics.fastestGrowing = {
                plantId: plant._id as mongoose.Types.ObjectId,
                name: plant.name,
                rate: growthRate
              };
            }

            if (!growthAnalytics.slowestGrowing || growthRate < growthAnalytics.slowestGrowing.rate) {
              growthAnalytics.slowestGrowing = {
                plantId: plant._id as mongoose.Types.ObjectId,
                name: plant.name,
                rate: growthRate
              };
            }
          }
        }
      }
    });

    // Calculate averages
    growthAnalytics.averageGrowthRate = plantsWithGrowth > 0 ? totalGrowthRate / plantsWithGrowth : 0;

    Object.keys(growthAnalytics.growthByCategory).forEach(category => {
      const categoryData = growthAnalytics.growthByCategory[category];
      if (categoryData) {
        categoryData.averageRate = categoryData.totalRate / categoryData.count;
      }
    });

    return res.json({
      success: true,
      data: growthAnalytics
    });

  } catch (error) {
    logger.error('Error fetching growth analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch growth analytics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get system metrics
export const getSystemMetrics = async (req: AuthenticatedRequest, res: Response) => {
  // SystemMetrics collection is not part of the current schema.
  const { period = 'daily' } = req.query as { period?: string };
  return res.json({
    success: true,
    data: {
      message: 'System metrics are not available in the current deployment.',
      period
    }
  });
};

// Create or update dashboard widget
export const updateDashboardWidget = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = new mongoose.Types.ObjectId(req.user!._id.toString());
    const { widgetType, config, data } = req.body;

    // Find existing widget or create new one
    let widget = await DashboardAnalytics.findOne({ userId, widgetType });

    if (widget) {
      // Update existing widget
      widget.config = { ...widget.config, ...config };
      if (data) {
        await widget.updateData(data);
      }
      await widget.save();
    } else {
      // Create new widget
      widget = new DashboardAnalytics({
        userId,
        widgetType,
        config: {
          refreshFrequency: config?.refreshFrequency || RefreshFrequency.HOURLY,
          isEnabled: config?.isEnabled !== false,
          position: config?.position || { x: 0, y: 0, width: 4, height: 3 },
          customSettings: config?.customSettings || {}
        },
        data: data || {},
        dataMetadata: {
          lastUpdated: new Date(),
          nextUpdate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          dataSource: 'user_input',
          isStale: false,
          errorCount: 0
        },
        performance: {
          loadTime: 0,
          dataSize: JSON.stringify(data || {}).length,
          cacheHit: false,
          queryTime: 0
        }
      });
      await widget.save();
    }

    return res.json({
      success: true,
      message: 'Dashboard widget updated successfully',
      data: widget
    });

  } catch (error) {
    logger.error('Error updating dashboard widget:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update dashboard widget',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Helper functions
export async function generateUserAnalytics(userId: mongoose.Types.ObjectId, period: string) {
  const analytics = {
    plantOverview: {},
    careActivity: {},
    reminders: {},
    growth: {},
    community: {},
    system: {}
  };

  // Get basic counts (limited to supported collections)
  const [plantCount, postCount, commentCount, voteCount] = await Promise.all([
    Plant.countDocuments({ userId }),
    CommunityPost.countDocuments({ authorId: userId }),
    CommunityComment.countDocuments({ authorId: userId }),
    CommunityVote.countDocuments({ userId })
  ]);

  analytics.plantOverview = {
    totalPlants: plantCount,
    recentActivity: 0
  };

  analytics.careActivity = {
    totalLogs: 0,
    thisWeek: 0
  };

  analytics.reminders = {
    total: 0,
    pending: 0
  };

  analytics.community = {
    posts: postCount,
    comments: commentCount,
    votes: voteCount
  };

  return analytics;
}

function getWidgetData(widgetType: DashboardWidgetType, analytics: any) {
  switch (widgetType) {
    case DashboardWidgetType.PLANT_OVERVIEW:
      return analytics.plantOverview;
    case DashboardWidgetType.CARE_SUMMARY:
      return analytics.careActivity;
    case DashboardWidgetType.REMINDER_STATUS:
      return analytics.reminders;
    case DashboardWidgetType.COMMUNITY_STATS:
      return analytics.community;
    default:
      return {};
  }
}

async function createDefaultDashboard(userId: mongoose.Types.ObjectId) {
  const defaultWidgets = [
    {
      widgetType: DashboardWidgetType.PLANT_OVERVIEW,
      position: { x: 0, y: 0, width: 6, height: 4 }
    },
    {
      widgetType: DashboardWidgetType.CARE_SUMMARY,
      position: { x: 6, y: 0, width: 6, height: 4 }
    },
    {
      widgetType: DashboardWidgetType.REMINDER_STATUS,
      position: { x: 0, y: 4, width: 4, height: 3 }
    },
    {
      widgetType: DashboardWidgetType.COMMUNITY_STATS,
      position: { x: 4, y: 4, width: 8, height: 3 }
    }
  ];

  const widgets = await Promise.all(
    defaultWidgets.map(async (widgetConfig) => {
      const widget = new DashboardAnalytics({
        userId,
        widgetType: widgetConfig.widgetType,
        config: {
          refreshFrequency: RefreshFrequency.HOURLY,
          isEnabled: true,
          position: widgetConfig.position,
          customSettings: {}
        },
        data: {},
        dataMetadata: {
          lastUpdated: new Date(),
          nextUpdate: new Date(Date.now() + 60 * 60 * 1000),
          dataSource: 'default',
          isStale: false,
          errorCount: 0
        },
        performance: {
          loadTime: 0,
          dataSize: 0,
          cacheHit: false,
          queryTime: 0
        }
      });
      
      return await widget.save();
    })
  );

  return widgets;
}

function generateHealthRecommendations(analytics: any, plants: any[]) {
  const recommendations = [];

  if ((analytics.healthDistribution.critical || 0) > 0) {
    recommendations.push('Immediate attention needed for critical plants');
  }

  if (analytics.averageHealthScore < 60) {
    recommendations.push('Consider reviewing your care routine');
  }

  if ((analytics.healthDistribution.poor || 0) > analytics.totalPlants * 0.3) {
    recommendations.push('30% of plants need improved care');
  }

  return recommendations;
}

function generateCareImprovementSuggestions(effectiveness: any) {
  const suggestions = [];

  if (effectiveness.consistencyScore < 70) {
    suggestions.push('Improve care consistency by setting regular reminders');
  }

  if (effectiveness.timeliness.late > effectiveness.timeliness.onTime) {
    suggestions.push('Focus on timely care to improve plant health');
  }

  if (effectiveness.reminderCompletion.completed / effectiveness.reminderCompletion.total < 0.8) {
    suggestions.push('Try to complete more reminders for better results');
  }

  return suggestions;
}

// Validation rules
export const analyticsFiltersValidation = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
  query('plantId').optional().isMongoId(),
  query('careType').optional().isString(),
];

export const updateWidgetValidation = [
  body('widgetType').isIn(Object.values(DashboardWidgetType)),
  body('config').optional().isObject(),
  body('data').optional().isObject(),
];
