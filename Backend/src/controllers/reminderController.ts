import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Reminder } from '../models/Reminder';
import { Plant } from '../models/Plant';
import { CareLog } from '../models/CareLog';
import { UserAnalytics, AnalyticsEventType } from '../models/UserAnalytics';
import { logger } from '../config/logger';

// Extended Request interfaces for type safety
interface CreateReminderRequest extends Request {
  body: {
    plantId: string;
    careType: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'health-check' | 'pest-treatment' | 'soil-change' | 'location-change';
    title: string;
    description?: string;
    scheduledDate: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    isRecurring?: boolean;
    recurringPattern?: {
      frequency: number; // days
      endDate?: Date;
      maxOccurrences?: number;
    };
    customInstructions?: string;
    weatherDependent?: boolean;
    seasonalAdjustment?: boolean;
    notificationSettings?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
      advanceNotice?: number; // hours before
    };
  };
}

interface UpdateReminderRequest extends Request {
  body: Partial<CreateReminderRequest['body']>;
}

interface SearchRemindersRequest extends Request {
  query: {
    plantId?: string;
    careType?: string;
    status?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
    isRecurring?: string;
    weatherDependent?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface BulkReminderRequest extends Request {
  body: {
    reminderIds: string[];
    operation: 'delete' | 'complete' | 'snooze' | 'updatePriority';
    data?: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      snoozeHours?: number;
      completionNotes?: string;
    };
  };
}

interface SmartScheduleRequest extends Request {
  body: {
    plantId: string;
    careTypes: string[];
    analysisDepth?: 'basic' | 'advanced' | 'ai-powered';
    considerWeather?: boolean;
    considerSeason?: boolean;
    optimizeForUser?: boolean;
  };
}

export class ReminderController {
  /**
   * Create a new reminder
   */
  static async createReminder(req: CreateReminderRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const reminderData = req.body;

      // Verify plant exists and belongs to user
      const plant = await Plant.findOne({ _id: reminderData.plantId, userId });
      if (!plant) {
        res.status(404).json({
          success: false,
          message: 'Plant not found or access denied'
        });
        return;
      }

      // Create reminder
      const reminder = new Reminder({
        ...reminderData,
        userId,
        plantName: plant.name,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        aiInsights: {
          confidence: 0.7, // Default confidence for manual reminders
          reasoning: 'User-created reminder',
          suggestedAdjustments: []
        }
      });

      await reminder.save();

      // Create recurring reminders if specified
      if (reminderData.isRecurring && reminderData.recurringPattern) {
        const pattern = reminderData.recurringPattern;
        const occurrences = pattern.maxOccurrences || 10; // Default limit
        const endDate = pattern.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default

        for (let i = 1; i < occurrences; i++) {
          const nextDate = new Date(reminderData.scheduledDate);
          nextDate.setDate(nextDate.getDate() + (pattern.frequency * i));

          if (nextDate > endDate) break;

          const recurringReminder = new Reminder({
            ...reminderData,
            userId,
            plantName: plant.name,
            scheduledDate: nextDate,
            status: 'pending',
            parentReminder: reminder._id,
            createdAt: new Date(),
            updatedAt: new Date(),
            aiInsights: {
              confidence: 0.7,
              reasoning: 'Recurring reminder based on user pattern',
              suggestedAdjustments: []
            }
          });

          await recurringReminder.save();
        }
      }

      // Track reminder creation
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.REMINDER_CREATED,
          {
            plantId: plant._id,
            plantName: plant.name,
            careType: reminderData.careType,
            priority: reminderData.priority,
            isRecurring: reminderData.isRecurring || false,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track reminder creation event:', analyticsError);
      }

      res.status(201).json({
        success: true,
        message: 'Reminder created successfully',
        data: { reminder }
      });
    } catch (error) {
      logger.error('Create reminder error:', error);
      next(error);
    }
  }

  /**
   * Get reminders with filtering and pagination
   */
  static async getReminders(req: SearchRemindersRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const {
        plantId,
        careType,
        status,
        priority,
        dateFrom,
        dateTo,
        isRecurring,
        weatherDependent,
        page = '1',
        limit = '20',
        sortBy = 'scheduledDate',
        sortOrder = 'asc'
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
      if (status) searchQuery.status = status;
      if (priority) searchQuery.priority = priority;
      if (isRecurring !== undefined) searchQuery.isRecurring = isRecurring === 'true';
      if (weatherDependent !== undefined) searchQuery.weatherDependent = weatherDependent === 'true';

      // Date range filtering
      if (dateFrom || dateTo) {
        searchQuery.scheduledDate = {};
        if (dateFrom) searchQuery.scheduledDate.$gte = new Date(dateFrom);
        if (dateTo) searchQuery.scheduledDate.$lte = new Date(dateTo);
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [reminders, totalReminders] = await Promise.all([
        Reminder.find(searchQuery)
          .populate('plantId', 'name species category location images')
          .sort(sortObj)
          .skip(skip)
          .limit(limitNum),
        Reminder.countDocuments(searchQuery)
      ]);

      const totalPages = Math.ceil(totalReminders / limitNum);

      res.status(200).json({
        success: true,
        data: {
          reminders,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalReminders,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get reminders error:', error);
      next(error);
    }
  }

  /**
   * Get reminder by ID
   */
  static async getReminderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reminderId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      if (!reminderId || !mongoose.Types.ObjectId.isValid(reminderId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid reminder ID format'
        });
        return;
      }

      const reminder = await Reminder.findOne({ _id: reminderId, userId })
        .populate('plantId', 'name species category location images careInstructions');

      if (!reminder) {
        res.status(404).json({
          success: false,
          message: 'Reminder not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { reminder }
      });
    } catch (error) {
      logger.error('Get reminder by ID error:', error);
      next(error);
    }
  }

  /**
   * Update reminder
   */
  static async updateReminder(req: UpdateReminderRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reminderId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const updateData = { ...req.body, updatedAt: new Date() };

      if (!reminderId || !mongoose.Types.ObjectId.isValid(reminderId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid reminder ID format'
        });
        return;
      }

      const reminder = await Reminder.findOneAndUpdate(
        { _id: reminderId, userId },
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('plantId', 'name species category location');

      if (!reminder) {
        res.status(404).json({
          success: false,
          message: 'Reminder not found'
        });
        return;
      }

      // Track reminder update
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.REMINDER_UPDATED,
          {
            reminderId: reminder._id,
            plantId: reminder.plantId,
            careType: reminder.careType,
            fieldsUpdated: Object.keys(req.body),
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track reminder update event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Reminder updated successfully',
        data: { reminder }
      });
    } catch (error) {
      logger.error('Update reminder error:', error);
      next(error);
    }
  }

  /**
   * Delete reminder
   */
  static async deleteReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reminderId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      if (!reminderId || !mongoose.Types.ObjectId.isValid(reminderId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid reminder ID format'
        });
        return;
      }

      const reminder = await Reminder.findOneAndDelete({ _id: reminderId, userId });

      if (!reminder) {
        res.status(404).json({
          success: false,
          message: 'Reminder not found'
        });
        return;
      }

      // Delete child recurring reminders if this is a parent
      if (reminder.isRecurring) {
        await Reminder.deleteMany({ parentReminder: reminder._id, userId });
      }

      // Track reminder deletion
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.REMINDER_DELETED,
          {
            reminderId: reminder._id,
            plantId: reminder.plantId,
            careType: reminder.careType,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track reminder deletion event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Reminder deleted successfully'
      });
    } catch (error) {
      logger.error('Delete reminder error:', error);
      next(error);
    }
  }

  /**
   * Complete a reminder
   */
  static async completeReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reminderId } = req.params;
      const { notes, createCareLog = false } = req.body;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      if (!reminderId || !mongoose.Types.ObjectId.isValid(reminderId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid reminder ID format'
        });
        return;
      }

      const reminder = await Reminder.findOneAndUpdate(
        { _id: reminderId, userId },
        {
          status: 'completed',
          completedAt: new Date(),
          completionNotes: notes,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('plantId');

      if (!reminder) {
        res.status(404).json({
          success: false,
          message: 'Reminder not found'
        });
        return;
      }

      // Optionally create a care log entry
      let careLog = null;
      if (createCareLog && reminder.plantId) {
        try {
          careLog = new CareLog({
            userId,
            plantId: reminder.plantId._id,
            plantName: reminder.plantName,
            careType: reminder.careType,
            notes: notes || reminder.description,
            scheduledCare: true,
            reminderCompleted: reminder._id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await careLog.save();
        } catch (careLogError) {
          logger.warn('Failed to create care log for completed reminder:', careLogError);
        }
      }

      // Track reminder completion
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.REMINDER_COMPLETED,
          {
            reminderId: reminder._id,
            plantId: reminder.plantId?._id,
            careType: reminder.careType,
            createdCareLog: !!careLog,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track reminder completion event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Reminder completed successfully',
        data: { 
          reminder,
          careLog: careLog || undefined
        }
      });
    } catch (error) {
      logger.error('Complete reminder error:', error);
      next(error);
    }
  }

  /**
   * Snooze a reminder
   */
  static async snoozeReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reminderId } = req.params;
      const { hours = 24, reason } = req.body;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      if (!reminderId || !mongoose.Types.ObjectId.isValid(reminderId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid reminder ID format'
        });
        return;
      }

      const newScheduledDate = new Date();
      newScheduledDate.setHours(newScheduledDate.getHours() + hours);

      const reminder = await Reminder.findOneAndUpdate(
        { _id: reminderId, userId },
        {
          scheduledDate: newScheduledDate,
          status: 'snoozed',
          snoozeHistory: {
            $push: {
              originalDate: new Date(), // This should be the previous scheduledDate
              newDate: newScheduledDate,
              reason: reason || 'No reason provided',
              snoozedAt: new Date()
            }
          },
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!reminder) {
        res.status(404).json({
          success: false,
          message: 'Reminder not found'
        });
        return;
      }

      // Track reminder snooze
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.REMINDER_SNOOZED,
          {
            reminderId: reminder._id,
            plantId: reminder.plantId,
            careType: reminder.careType,
            snoozeHours: hours,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track reminder snooze event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: `Reminder snoozed for ${hours} hours`,
        data: { reminder }
      });
    } catch (error) {
      logger.error('Snooze reminder error:', error);
      next(error);
    }
  }

  /**
   * Get upcoming reminders (next 7 days)
   */
  static async getUpcomingReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { days = '7' } = req.query;

      const daysAhead = parseInt(days as string);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      const reminders = await Reminder.find({
        userId,
        status: { $in: ['pending', 'snoozed'] },
        scheduledDate: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .populate('plantId', 'name species category location images')
      .sort({ scheduledDate: 1 });

      // Group by date
      const groupedReminders = reminders.reduce((groups, reminder) => {
        const date = reminder.scheduledDate.toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(reminder);
        return groups;
      }, {} as Record<string, typeof reminders>);

      res.status(200).json({
        success: true,
        data: {
          upcomingReminders: groupedReminders,
          totalCount: reminders.length,
          period: daysAhead
        }
      });
    } catch (error) {
      logger.error('Get upcoming reminders error:', error);
      next(error);
    }
  }

  /**
   * Generate smart schedule recommendations
   */
  static async generateSmartSchedule(req: SmartScheduleRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { plantId, careTypes, analysisDepth = 'basic', considerWeather = false, considerSeason = true, optimizeForUser = true } = req.body;

      // Verify plant exists and belongs to user
      const plant = await Plant.findOne({ _id: plantId, userId });
      if (!plant) {
        res.status(404).json({
          success: false,
          message: 'Plant not found or access denied'
        });
        return;
      }

      // Get plant's care history
      const careHistory = await CareLog.find({ plantId, userId })
        .sort({ createdAt: -1 })
        .limit(50);

      // Get user's care patterns if optimizing for user
      let userPatterns = null;
      if (optimizeForUser) {
        userPatterns = await CareLog.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          {
            $group: {
              _id: {
                careType: '$careType',
                dayOfWeek: { $dayOfWeek: '$createdAt' },
                hour: { $hour: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]);
      }

      const recommendations = [];
      const now = new Date();

      for (const careType of careTypes) {
        // Basic scheduling based on plant care instructions
        const careInstructions = plant.careInstructions?.[careType];
        
        if (careInstructions?.frequency) {
          // Find last care of this type
          const lastCare = careHistory.find(log => log.careType === careType);
          
          let nextCareDate = new Date();
          if (lastCare) {
            nextCareDate = new Date(lastCare.createdAt);
            nextCareDate.setDate(nextCareDate.getDate() + careInstructions.frequency);
          } else {
            // No history, schedule based on plant needs
            nextCareDate.setDate(nextCareDate.getDate() + Math.floor(careInstructions.frequency / 2));
          }

          // Seasonal adjustments
          if (considerSeason) {
            const month = now.getMonth();
            const isWinter = month >= 11 || month <= 1;
            const isSummer = month >= 5 && month <= 7;

            if (careType === 'watering') {
              if (isWinter) {
                nextCareDate.setDate(nextCareDate.getDate() + 2); // Water less in winter
              } else if (isSummer) {
                nextCareDate.setDate(nextCareDate.getDate() - 1); // Water more in summer
              }
            } else if (careType === 'fertilizing') {
              if (isWinter) {
                nextCareDate.setDate(nextCareDate.getDate() + 14); // Fertilize less in winter
              }
            }
          }

          // User pattern optimization
          const preferredTime = { hour: 9, dayOfWeek: null }; // Default to 9 AM
          if (userPatterns) {
            const userPattern = userPatterns.find(p => p._id.careType === careType);
            if (userPattern) {
              preferredTime.hour = userPattern._id.hour;
              preferredTime.dayOfWeek = userPattern._id.dayOfWeek;
            }
          }

          // Adjust to preferred time
          nextCareDate.setHours(preferredTime.hour, 0, 0, 0);

          // Calculate confidence based on available data
          let confidence = 0.5; // Base confidence
          if (lastCare) confidence += 0.2;
          if (careInstructions) confidence += 0.2;
          if (userPatterns) confidence += 0.1;

          // Priority calculation
          const daysSinceLastCare = lastCare 
            ? Math.floor((now.getTime() - lastCare.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
          if (daysSinceLastCare > (careInstructions.frequency * 1.5)) {
            priority = 'high';
          } else if (daysSinceLastCare > (careInstructions.frequency * 2)) {
            priority = 'critical';
          } else if (daysSinceLastCare < careInstructions.frequency) {
            priority = 'low';
          }

          recommendations.push({
            careType,
            scheduledDate: nextCareDate,
            priority,
            confidence,
            reasoning: lastCare 
              ? `Based on last ${careType} ${daysSinceLastCare} days ago and plant care frequency of ${careInstructions.frequency} days`
              : `Based on plant care frequency of ${careInstructions.frequency} days (no previous care history)`,
            suggestedAdjustments: considerSeason 
              ? [`Seasonal adjustment applied for ${now.toLocaleString('default', { month: 'long' })}`]
              : [],
            plantCareInstructions: careInstructions
          });
        }
      }

      // Sort by priority and date
      recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.scheduledDate.getTime() - b.scheduledDate.getTime();
      });

      // Track smart schedule generation
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.SMART_SCHEDULE_GENERATED,
          {
            plantId,
            plantName: plant.name,
            careTypes,
            analysisDepth,
            recommendationsCount: recommendations.length,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track smart schedule generation event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        data: {
          plant: {
            id: plant._id,
            name: plant.name,
            species: plant.species,
            category: plant.category
          },
          recommendations,
          metadata: {
            analysisDepth,
            considerWeather,
            considerSeason,
            optimizeForUser,
            careHistoryCount: careHistory.length,
            userPatternsAvailable: !!userPatterns
          }
        }
      });
    } catch (error) {
      logger.error('Generate smart schedule error:', error);
      next(error);
    }
  }

  /**
   * Bulk operations on reminders
   */
  static async bulkOperation(req: BulkReminderRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reminderIds, operation, data } = req.body;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      // Validate reminder IDs
      const validReminderIds = reminderIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validReminderIds.length !== reminderIds.length) {
        res.status(400).json({
          success: false,
          message: 'One or more reminder IDs are invalid'
        });
        return;
      }

      let result;
      let message = '';

      switch (operation) {
        case 'delete':
          result = await Reminder.deleteMany({
            _id: { $in: validReminderIds },
            userId
          });
          message = `${result.deletedCount} reminders deleted successfully`;
          break;

        case 'complete':
          result = await Reminder.updateMany(
            { _id: { $in: validReminderIds }, userId },
            {
              $set: {
                status: 'completed',
                completedAt: new Date(),
                completionNotes: data?.completionNotes || 'Bulk completed',
                updatedAt: new Date()
              }
            }
          );
          message = `${result.modifiedCount} reminders completed successfully`;
          break;

        case 'snooze': {
          const snoozeHours = data?.snoozeHours || 24;
          const newSnoozeDate = new Date();
          newSnoozeDate.setHours(newSnoozeDate.getHours() + snoozeHours);

          result = await Reminder.updateMany(
            { _id: { $in: validReminderIds }, userId },
            {
              $set: {
                scheduledDate: newSnoozeDate,
                status: 'snoozed',
                updatedAt: new Date()
              }
            }
          );
          message = `${result.modifiedCount} reminders snoozed for ${snoozeHours} hours`;
          break;
        }

        case 'updatePriority':
          if (!data?.priority) {
            res.status(400).json({
              success: false,
              message: 'Priority is required for priority update operation'
            });
            return;
          }

          result = await Reminder.updateMany(
            { _id: { $in: validReminderIds }, userId },
            {
              $set: {
                priority: data.priority,
                updatedAt: new Date()
              }
            }
          );
          message = `${result.modifiedCount} reminders priority updated to ${data.priority}`;
          break;

        default:
          res.status(400).json({
            success: false,
            message: 'Invalid bulk operation. Supported operations: delete, complete, snooze, updatePriority'
          });
          return;
      }

      // Track bulk operation
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.REMINDERS_BULK_OPERATION,
          {
            operation,
            remindersCount: validReminderIds.length,
            affectedCount: 'deletedCount' in result ? result.deletedCount : ('modifiedCount' in result ? result.modifiedCount : 0),
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
          requestedCount: validReminderIds.length,
          affectedCount: 'deletedCount' in result ? result.deletedCount : ('modifiedCount' in result ? result.modifiedCount : 0)
        }
      });
    } catch (error) {
      logger.error('Bulk operation error:', error);
      next(error);
    }
  }
}
