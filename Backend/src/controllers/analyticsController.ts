import { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { DashboardAnalytics, DashboardWidgetType, RefreshFrequency } from '../models/DashboardAnalytics';
import { UserAnalytics } from '../models/UserAnalytics';
import { PlantCareAnalytics } from '../models/PlantCareAnalytics';
import { SystemMetrics } from '../models/SystemMetrics';
import { User } from '../models/User';
import { Plant } from '../models/Plant';
import { CareLog, CareType } from '../models/CareLog';
import { Reminder } from '../models/Reminder';
import { Post } from '../models/Post';
import { Notification } from '../models/Notification';
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
    const careLogsFilter: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      careLogsFilter.careDate = dateFilter;
    }
    if (plantId) careLogsFilter.plantId = new mongoose.Types.ObjectId(plantId as string);

    const careLogs = await CareLog.find(careLogsFilter)
      .populate('plantId', 'name species')
      .sort({ careDate: -1 });

    // Calculate health analytics
    const healthAnalytics = {
      totalPlants: plants.length,
      healthDistribution: {
        excellent: plants.filter(p => p.health === 'Excellent').length,
        good: plants.filter(p => p.health === 'Good').length,
        needsLight: plants.filter(p => p.health === 'Needs light').length,
        needsWater: plants.filter(p => p.health === 'Needs water').length,
        attention: plants.filter(p => p.health === 'Attention').length
      },
      averageHealthScore: plants.reduce((sum, p) => sum + (p.healthScore || 0), 0) / plants.length || 0,
      healthByCategory: {} as Record<string, {
        total: number;
        healthy: number;
        unhealthy: number;
        averageScore: number;
      }>,
      careImpactAnalysis: {},
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
      if (['Excellent', 'Good'].includes(plant.health)) {
        healthAnalytics.healthByCategory[category].healthy += 1;
      } else {
        healthAnalytics.healthByCategory[category].unhealthy += 1;
      }
    });

    // Analyze care impact on health
    const careImpactMap = new Map();
    careLogs.forEach(log => {
      const plantId = log.plantId.toString();
      if (!careImpactMap.has(plantId)) {
        careImpactMap.set(plantId, {
          careCount: 0,
          careTypes: new Set<string>()
        });
      }
      
      const plantData = careImpactMap.get(plantId);
      plantData.careCount += 1;
      plantData.careTypes.add(log.careType);
    });

    // Generate recommendations based on analytics
    const recommendations = generateHealthRecommendations(healthAnalytics, plants);

    return res.json({
      success: true,
      data: {
        ...healthAnalytics,
        recommendations,
        plantDetails: plants,
        recentCareLogs: careLogs.slice(0, 20)
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
export const getCareEffectivenessAnalytics = async (req: AuthenticatedRequest, res: Response) => {
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
    const { startDate, endDate, careType } = req.query;

    // Build filters
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const careFilter: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      careFilter.careDate = dateFilter;
    }
    if (careType) careFilter.careType = careType;

    // Get care logs with plant health data
    const careLogs = await CareLog.find(careFilter)
      .populate('plantId', 'name species category')
      .sort({ careDate: -1 });

    // Get reminders to analyze completion rates
    const reminderFilter: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      reminderFilter.scheduledDate = dateFilter;
    }

    const reminders = await Reminder.find(reminderFilter);

    // Calculate effectiveness metrics
    const effectiveness = {
      totalCareActions: careLogs.length,
      careTypeDistribution: {} as Record<CareType, number>,
      healthImpactByType: {} as Record<CareType, {
        totalImpact: number;
        positiveImpact: number;
        negativeImpact: number;
        averageImpact: number;
      }>,
      consistencyScore: 0,
      timeliness: {
        onTime: 0,
        early: 0,
        late: 0
      },
      reminderCompletion: {
        total: reminders.length,
        completed: reminders.filter(r => r.status === 'completed').length,
        overdue: reminders.filter(r => r.status === 'overdue').length,
        snoozed: reminders.filter(r => r.status === 'snoozed').length
      },
      plantResponseRates: {},
      careQualityMetrics: {},
      improvementSuggestions: []
    };

    // Analyze care type distribution and effectiveness
    careLogs.forEach(log => {
      const type = log.careType;
      if (!effectiveness.careTypeDistribution[type]) {
        effectiveness.careTypeDistribution[type] = 0;
      }
      effectiveness.careTypeDistribution[type] += 1;

      // Analyze health impact (simplified - using health-check logs)
      if (log.careType === 'health-check' && log.metadata?.overallHealth) {
        if (!effectiveness.healthImpactByType[type]) {
          effectiveness.healthImpactByType[type] = {
            totalImpact: 0,
            positiveImpact: 0,
            negativeImpact: 0,
            averageImpact: 0
          };
        }
        // Simplified: just count health checks as positive impact
        effectiveness.healthImpactByType[type].positiveImpact += 1;
      }

      // Analyze timeliness (mock implementation)
      const timeliness = Math.random(); // In real implementation, compare with recommended timing
      if (timeliness > 0.8) effectiveness.timeliness.onTime += 1;
      else if (timeliness > 0.5) effectiveness.timeliness.early += 1;
      else effectiveness.timeliness.late += 1;
    });

    // Calculate averages
    Object.keys(effectiveness.healthImpactByType).forEach(type => {
      const typeData = effectiveness.healthImpactByType[type as CareType];
      const totalActions = effectiveness.careTypeDistribution[type as CareType];
      // Simplified average calculation
      typeData.averageImpact = totalActions > 0 ? typeData.positiveImpact / totalActions : 0;
    });

    // Calculate consistency score
    const totalActions = careLogs.length;
    const onTimeActions = effectiveness.timeliness.onTime;
    effectiveness.consistencyScore = totalActions > 0 ? (onTimeActions / totalActions) * 100 : 0;

    // Generate improvement suggestions
    const suggestions = generateCareImprovementSuggestions(effectiveness);

    return res.json({
      success: true,
      data: {
        ...effectiveness,
        improvementSuggestions: suggestions,
        period: {
          start: startDate || 'N/A',
          end: endDate || 'N/A'
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching care effectiveness analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch care effectiveness analytics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
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
                plantId: plant._id,
                name: plant.name,
                rate: growthRate
              };
            }

            if (!growthAnalytics.slowestGrowing || growthRate < growthAnalytics.slowestGrowing.rate) {
              growthAnalytics.slowestGrowing = {
                plantId: plant._id,
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
  try {
    const { period = 'daily' } = req.query;
    
    // Get latest system metrics
    const metrics = await SystemMetrics.findOne()
      .sort({ timestamp: -1 })
      .lean();

    if (!metrics) {
      return res.json({
        success: true,
        data: {
          message: 'No system metrics available',
          period
        }
      });
    }

    // Get user-specific usage stats
    const userId = new mongoose.Types.ObjectId(req.user!._id.toString());
    const userAnalytics = await UserAnalytics.findOne({ userId }).lean();

    const systemAnalytics = {
      system: {
        uptime: metrics.value || 0, // Simplified - using value field
        memory: metrics.metadata?.memory || {},
        cpu: metrics.metadata?.cpu || {},
        storage: metrics.metadata?.storage || {}
      },
      database: {
        connections: metrics.count || 0,
        responseTime: metrics.average || 0,
        operations: metrics.maximum || 0
      },
      api: {
        totalRequests: metrics.dataPoints || 0,
        errorRate: metrics.changePercentage || 0,
        averageResponseTime: metrics.average || 0,
        activeUsers: metrics.count || 0
      },
      user: {
        totalSessions: 0, // Simplified - would need aggregation
        averageSessionDuration: 0,
        lastActiveDate: null,
        featuresUsed: {}
      },
      period,
      lastUpdated: metrics.timestamp
    };

    return res.json({
      success: true,
      data: systemAnalytics
    });

  } catch (error) {
    logger.error('Error fetching system metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch system metrics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
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
async function generateUserAnalytics(userId: mongoose.Types.ObjectId, period: string) {
  const analytics = {
    plantOverview: {},
    careActivity: {},
    reminders: {},
    growth: {},
    community: {},
    system: {}
  };

  // Get basic counts
  const [plantCount, careLogCount, reminderCount, postCount, notificationCount] = await Promise.all([
    Plant.countDocuments({ userId }),
    CareLog.countDocuments({ userId }),
    Reminder.countDocuments({ userId }),
    Post.countDocuments({ authorId: userId }),
    Notification.countDocuments({ userId })
  ]);

  analytics.plantOverview = {
    totalPlants: plantCount,
    recentActivity: careLogCount
  };

  analytics.careActivity = {
    totalLogs: careLogCount,
    thisWeek: await CareLog.countDocuments({
      userId,
      careDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
  };

  analytics.reminders = {
    total: reminderCount,
    pending: await Reminder.countDocuments({ userId, status: 'pending' })
  };

  analytics.community = {
    posts: postCount,
    notifications: notificationCount
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

  if (analytics.healthDistribution.critical > 0) {
    recommendations.push('Immediate attention needed for critical plants');
  }

  if (analytics.averageHealthScore < 60) {
    recommendations.push('Consider reviewing your care routine');
  }

  if (analytics.healthDistribution.poor > analytics.totalPlants * 0.3) {
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
