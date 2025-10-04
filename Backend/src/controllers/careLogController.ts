import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { CareLog } from '../models/CareLog';
import { Plant } from '../models/Plant';
import { PlantCareAnalytics } from '../models/PlantCareAnalytics';
import { UserAnalytics, AnalyticsEventType } from '../models/UserAnalytics';
import { Reminder } from '../models/Reminder';
import { logger } from '../config/logger';

// Extended Request interfaces for type safety
interface CreateCareLogRequest extends Request {
  body: {
    plantId: string;
    careType: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'health-check' | 'pest-treatment' | 'soil-change' | 'location-change';
    notes?: string;
    photos?: string[];
    careData?: {
      // Watering specific
      amount?: number;
      waterSource?: string;
      waterQuality?: string;
      
      // Fertilizing specific
      fertilizerType?: string;
      npkRatio?: string;
      dilution?: string;
      
      // Pruning specific
      pruningType?: 'deadheading' | 'pinching' | 'cutting' | 'shaping';
      partsRemoved?: string[];
      
      // Repotting specific
      newPotSize?: string;
      soilType?: string;
      rootCondition?: string;
      
      // Health check specific
      overallHealth?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
      symptoms?: string[];
      
      // Pest treatment specific
      pestType?: string;
      treatmentMethod?: string;
      chemicalUsed?: string;
      
      // Soil change specific
      oldSoilCondition?: string;
      newSoilType?: string;
      
      // Location change specific
      previousLocation?: string;
      newLocation?: string;
      reason?: string;
    };
    environmentData?: {
      temperature?: number;
      humidity?: number;
      lightLevel?: number;
      airQuality?: string;
    };
    scheduledCare?: boolean;
    reminderCompleted?: string; // Reminder ID if this care log completes a reminder
  };
}

interface UpdateCareLogRequest extends Request {
  body: Partial<CreateCareLogRequest['body']>;
}

interface SearchCareLogsRequest extends Request {
  query: {
    plantId?: string;
    careType?: string;
    dateFrom?: string;
    dateTo?: string;
    scheduledCare?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface BulkCareLogRequest extends Request {
  body: {
    careLogIds: string[];
    operation: 'delete' | 'updateNotes';
    data?: {
      notes?: string;
    };
  };
}

export class CareLogController {
  /**
   * Create a new care log entry
   */
  static async createCareLog(req: CreateCareLogRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { plantId, reminderCompleted, ...careLogData } = req.body;

      // Verify plant exists and belongs to user
      const plant = await Plant.findOne({ _id: plantId, userId });
      if (!plant) {
        res.status(404).json({
          success: false,
          message: 'Plant not found or access denied'
        });
        return;
      }

      // Create care log
      const careLog = new CareLog({
        ...careLogData,
        plantId,
        userId,
        plantName: plant.name,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await careLog.save();

      // Update plant's last care information
      const updateData: any = {
        lastCareDate: new Date(),
        updatedAt: new Date()
      };

      // Update health status if health check was performed
      if (careLogData.careType === 'health-check' && careLogData.careData?.overallHealth) {
        const healthMapping = {
          'excellent': 'healthy',
          'good': 'healthy',
          'fair': 'needs-attention',
          'poor': 'needs-attention',
          'critical': 'critical'
        };
        updateData.healthStatus = healthMapping[careLogData.careData.overallHealth];
      }

      // Update location if location change was performed
      if (careLogData.careType === 'location-change' && careLogData.careData?.newLocation) {
        updateData.location = careLogData.careData.newLocation;
      }

      await Plant.findByIdAndUpdate(plantId, updateData);

      // Update plant care analytics
      try {
        await PlantCareAnalytics.findOneAndUpdate(
          { plantId },
          {
            $inc: { totalCareLogs: 1 },
            $set: { 
              lastCareDate: new Date(),
              [`careTypeStats.${careLogData.careType}`]: { $inc: 1 }
            }
          },
          { upsert: true }
        );
      } catch (analyticsError) {
        logger.warn('Failed to update plant care analytics:', analyticsError);
      }

      // Update user analytics
      try {
        await UserAnalytics.findOneAndUpdate(
          { userId },
          {
            $inc: { totalCareLogs: 1 },
            $set: { lastActivity: new Date() }
          },
          { upsert: true }
        );

        // Track care log creation event
        await UserAnalytics.trackEvent(
          new mongoose.Types.ObjectId(userId),
          AnalyticsEventType.CARE_LOG_CREATED,
          {
            plantId,
            plantName: plant.name,
            careType: careLogData.careType,
            scheduledCare: careLogData.scheduledCare || false,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to update user analytics:', analyticsError);
      }

      // Mark reminder as completed if specified
      if (reminderCompleted) {
        try {
          await Reminder.findByIdAndUpdate(
            reminderCompleted,
            {
              status: 'completed',
              completedAt: new Date(),
              completedCareLog: careLog._id
            }
          );
        } catch (reminderError) {
          logger.warn('Failed to update reminder status:', reminderError);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Care log created successfully',
        data: { careLog }
      });
    } catch (error) {
      logger.error('Create care log error:', error);
      next(error);
    }
  }

  /**
   * Get care logs with filtering and pagination
   */
  static async getCareLogs(req: SearchCareLogsRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const {
        plantId,
        careType,
        dateFrom,
        dateTo,
        scheduledCare,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build search query
      const searchQuery: any = { userId };

      if (plantId) {
        // Verify user owns this plant
        const plant = await Plant.findOne({ _id: plantId, userId });
        if (!plant) {
          res.status(404).json({
            success: false,
            message: 'Plant not found or access denied'
          });
          return;
        }
        searchQuery.plantId = plantId;
      }

      if (careType) searchQuery.careType = careType;
      if (scheduledCare !== undefined) searchQuery.scheduledCare = scheduledCare === 'true';

      // Date range filtering
      if (dateFrom || dateTo) {
        searchQuery.createdAt = {};
        if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [careLogs, totalCareLogs] = await Promise.all([
        CareLog.find(searchQuery)
          .populate('plantId', 'name species category location')
          .sort(sortObj)
          .skip(skip)
          .limit(limitNum),
        CareLog.countDocuments(searchQuery)
      ]);

      const totalPages = Math.ceil(totalCareLogs / limitNum);

      res.status(200).json({
        success: true,
        data: {
          careLogs,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalCareLogs,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get care logs error:', error);
      next(error);
    }
  }

  /**
   * Get care log by ID
   */
  static async getCareLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { careLogId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      if (!mongoose.Types.ObjectId.isValid(careLogId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid care log ID format'
        });
        return;
      }

      const careLog = await CareLog.findOne({ _id: new mongoose.Types.ObjectId(careLogId), userId })
        .populate('plantId', 'name species category location images');

      if (!careLog) {
        res.status(404).json({
          success: false,
          message: 'Care log not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { careLog }
      });
    } catch (error) {
      logger.error('Get care log by ID error:', error);
      next(error);
    }
  }

  /**
   * Update care log
   */
  static async updateCareLog(req: UpdateCareLogRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { careLogId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const updateData = { ...req.body, updatedAt: new Date() };

      if (!mongoose.Types.ObjectId.isValid(careLogId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid care log ID format'
        });
        return;
      }

      const careLog = await CareLog.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(careLogId), userId },
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('plantId', 'name species category location');

      if (!careLog) {
        res.status(404).json({
          success: false,
          message: 'Care log not found'
        });
        return;
      }

      // Track care log update
      try {
        await UserAnalytics.trackEvent(
          new mongoose.Types.ObjectId(userId),
          AnalyticsEventType.CARE_LOG_UPDATED,
          {
            careLogId: careLog._id,
            plantId: careLog.plantId,
            careType: careLog.careType,
            fieldsUpdated: Object.keys(req.body),
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track care log update event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Care log updated successfully',
        data: { careLog }
      });
    } catch (error) {
      logger.error('Update care log error:', error);
      next(error);
    }
  }

  /**
   * Delete care log
   */
  static async deleteCareLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { careLogId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      if (!mongoose.Types.ObjectId.isValid(careLogId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid care log ID format'
        });
        return;
      }

      const careLog = await CareLog.findOneAndDelete({ _id: new mongoose.Types.ObjectId(careLogId), userId });

      if (!careLog) {
        res.status(404).json({
          success: false,
          message: 'Care log not found'
        });
        return;
      }

      // Update analytics
      try {
        await UserAnalytics.findOneAndUpdate(
          { userId },
          {
            $inc: { totalCareLogs: -1 },
            $set: { lastActivity: new Date() }
          }
        );

        await PlantCareAnalytics.findOneAndUpdate(
          { plantId: careLog.plantId },
          {
            $inc: { totalCareLogs: -1 }
          }
        );

        // Track care log deletion
        await UserAnalytics.trackEvent(
          new mongoose.Types.ObjectId(userId),
          AnalyticsEventType.CARE_LOG_DELETED,
          {
            careLogId: careLog._id,
            plantId: careLog.plantId,
            careType: careLog.careType,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to update analytics for care log deletion:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Care log deleted successfully'
      });
    } catch (error) {
      logger.error('Delete care log error:', error);
      next(error);
    }
  }

  /**
   * Get care log statistics
   */
  static async getCareLogStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { plantId, period = '30' } = req.query;

      const periodDays = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Build match query
      const matchQuery: any = { 
        userId,
        createdAt: { $gte: startDate }
      };

      if (plantId) {
        matchQuery.plantId = new mongoose.Types.ObjectId(plantId as string);
      }

      const stats = await CareLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalCareLogs: { $sum: 1 },
            careTypeBreakdown: {
              $push: '$careType'
            },
            averagePerDay: {
              $sum: 1
            },
            scheduledCareCount: {
              $sum: { $cond: ['$scheduledCare', 1, 0] }
            }
          }
        },
        {
          $project: {
            totalCareLogs: 1,
            averagePerDay: { $divide: ['$averagePerDay', periodDays] },
            scheduledCarePercentage: {
              $multiply: [
                { $divide: ['$scheduledCareCount', '$totalCareLogs'] },
                100
              ]
            },
            careTypeBreakdown: 1
          }
        }
      ]);

      // Get care type breakdown
      const careTypeStats = await CareLog.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$careType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Get daily activity for the period
      const dailyActivity = await CareLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const result = {
        overview: stats[0] || {
          totalCareLogs: 0,
          averagePerDay: 0,
          scheduledCarePercentage: 0
        },
        careTypeBreakdown: careTypeStats,
        dailyActivity,
        period: periodDays
      };

      res.status(200).json({
        success: true,
        data: { stats: result }
      });
    } catch (error) {
      logger.error('Get care log stats error:', error);
      next(error);
    }
  }

  /**
   * Bulk operations on care logs
   */
  static async bulkOperation(req: BulkCareLogRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { careLogIds, operation, data } = req.body;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      // Validate care log IDs
      const validCareLogIds = careLogIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validCareLogIds.length !== careLogIds.length) {
        res.status(400).json({
          success: false,
          message: 'One or more care log IDs are invalid'
        });
        return;
      }

      let result: any;
      let message = '';
      let affectedCount = 0;

      switch (operation) {
        case 'delete':
          result = await CareLog.deleteMany({
            _id: { $in: validCareLogIds.map(id => new mongoose.Types.ObjectId(id)) },
            userId
          });

          // Update analytics
          await UserAnalytics.findOneAndUpdate(
            { userId },
            {
              $inc: { totalCareLogs: -result.deletedCount },
              $set: { lastActivity: new Date() }
            }
          );

          affectedCount = result.deletedCount;
          message = `${result.deletedCount} care logs deleted successfully`;
          break;

        case 'updateNotes':
          if (!data?.notes) {
            res.status(400).json({
              success: false,
              message: 'Notes are required for notes update operation'
            });
            return;
          }

          result = await CareLog.updateMany(
            { _id: { $in: validCareLogIds.map(id => new mongoose.Types.ObjectId(id)) }, userId },
            {
              $set: {
                notes: data.notes,
                updatedAt: new Date()
              }
            }
          );
          affectedCount = result.modifiedCount;
          message = `${result.modifiedCount} care logs notes updated successfully`;
          break;

        default:
          res.status(400).json({
            success: false,
            message: 'Invalid bulk operation. Supported operations: delete, updateNotes'
          });
          return;
      }

      // Track bulk operation
      try {
        await UserAnalytics.trackEvent(
          new mongoose.Types.ObjectId(userId),
          AnalyticsEventType.CARE_LOGS_BULK_OPERATION,
          {
            operation,
            careLogsCount: validCareLogIds.length,
            affectedCount,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track bulk operation event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message,
        data: {
          operation,
          requestedCount: validCareLogIds.length,
          affectedCount
        }
      });
    } catch (error) {
      logger.error('Bulk operation error:', error);
      next(error);
    }
  }

  /**
   * Get upcoming care recommendations
   */
  static async getCareRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { plantId } = req.query;

      const matchQuery: any = { userId };
      if (plantId) {
        matchQuery._id = new mongoose.Types.ObjectId(plantId as string);
      }

      // Get plants with their care history
      const plants = await Plant.find(matchQuery).populate({
        path: 'careAnalytics',
        select: 'lastCareDate careTypeStats nextCareDate'
      });

      const recommendations = [];

      for (const plant of plants) {
        const lastCareLogs = await CareLog.find({
          plantId: plant._id,
          userId
        })
        .sort({ createdAt: -1 })
        .limit(5);

        // Basic care recommendations based on plant care instructions
        const careInstructions = plant.careInstructions;
        const now = new Date();

        // Watering recommendation
        if (plant.wateringEveryDays) {
          const lastWatering = lastCareLogs.find(log => log.careType === 'watering');
          if (lastWatering) {
            const daysSinceWatering = Math.floor(
              (now.getTime() - lastWatering.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSinceWatering >= plant.wateringEveryDays) {
              recommendations.push({
                plantId: plant._id,
                plantName: plant.name,
                careType: 'watering',
                priority: daysSinceWatering > plant.wateringEveryDays + 2 ? 'high' : 'medium',
                reason: `Last watered ${daysSinceWatering} days ago`,
                daysSinceLastCare: daysSinceWatering
              });
            }
          }
        }

        // Fertilizing recommendation
        if (plant.fertilizerEveryWeeks) {
          const lastFertilizing = lastCareLogs.find(log => log.careType === 'fertilizing');
          if (lastFertilizing) {
            const daysSinceFertilizing = Math.floor(
              (now.getTime() - lastFertilizing.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSinceFertilizing >= plant.fertilizerEveryWeeks * 7) {
              recommendations.push({
                plantId: plant._id,
                plantName: plant.name,
                careType: 'fertilizing',
                priority: daysSinceFertilizing > (plant.fertilizerEveryWeeks * 7) + 7 ? 'high' : 'medium',
                reason: `Last fertilized ${daysSinceFertilizing} days ago`,
                daysSinceLastCare: daysSinceFertilizing
              });
            }
          }
        }

        // Health check recommendation (monthly)
        const lastHealthCheck = lastCareLogs.find(log => log.careType === 'health-check');
        if (!lastHealthCheck || 
            (now.getTime() - lastHealthCheck.createdAt.getTime()) > (30 * 24 * 60 * 60 * 1000)) {
          const daysSinceHealthCheck = lastHealthCheck 
            ? Math.floor((now.getTime() - lastHealthCheck.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          recommendations.push({
            plantId: plant._id,
            plantName: plant.name,
            careType: 'health-check',
            priority: daysSinceHealthCheck > 45 ? 'high' : 'low',
            reason: lastHealthCheck 
              ? `Last health check ${daysSinceHealthCheck} days ago`
              : 'No health check recorded',
            daysSinceLastCare: daysSinceHealthCheck
          });
        }
      }

      // Sort by priority and days since last care
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority as keyof typeof priorityOrder] !== priorityOrder[b.priority as keyof typeof priorityOrder]) {
          return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
        }
        return b.daysSinceLastCare - a.daysSinceLastCare;
      });

      res.status(200).json({
        success: true,
        data: {
          recommendations: recommendations.slice(0, 20) // Limit to top 20
        }
      });
    } catch (error) {
      logger.error('Get care recommendations error:', error);
      next(error);
    }
  }
}
