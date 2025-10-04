import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Plant } from '../models/Plant';
import { PlantCareAnalytics } from '../models/PlantCareAnalytics';
import { UserAnalytics, AnalyticsEventType } from '../models/UserAnalytics';
import { logger } from '../config/logger';

// Extended Request interfaces for type safety
interface CreatePlantRequest extends Request {
  body: {
    name: string;
    species: string;
    category: 'houseplant' | 'vegetable' | 'herb' | 'flower' | 'tree' | 'succulent';
    variety?: string;
    description?: string;
    images?: string[];
    location: string;
    potSize?: string;
    potType?: string;
    soilType?: string;
    acquisitionDate?: Date;
    acquisitionSource?: string;
    careInstructions?: {
      watering?: {
        frequency?: number;
        amount?: string;
        method?: string;
        notes?: string;
      };
      lighting?: {
        type?: 'direct' | 'indirect' | 'low' | 'bright';
        hours?: number;
        notes?: string;
      };
      fertilizing?: {
        frequency?: number;
        type?: string;
        season?: string;
        notes?: string;
      };
      temperature?: {
        min?: number;
        max?: number;
        optimal?: number;
        notes?: string;
      };
      humidity?: {
        min?: number;
        max?: number;
        optimal?: number;
        notes?: string;
      };
    };
    tags?: string[];
    isPublic?: boolean;
    notes?: string;
  };
}

interface UpdatePlantRequest extends Request {
  body: Partial<CreatePlantRequest['body']>;
}

interface SearchPlantsRequest extends Request {
  query: {
    q?: string;
    category?: string;
    tags?: string;
    location?: string;
    healthStatus?: string;
    careStatus?: string;
    isPublic?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: string;
    limit?: string;
    userId?: string; // For admin searches
  };
}

interface BulkOperationRequest extends Request {
  body: {
    plantIds: string[];
    operation: 'delete' | 'updateLocation' | 'updateTags' | 'updatePublic';
    data?: {
      location?: string;
      tags?: string[];
      isPublic?: boolean;
    };
  };
}

interface ImportPlantsRequest extends Request {
  body: {
    plants: CreatePlantRequest['body'][];
    overwrite?: boolean;
  };
}

export class PlantController {
  /**
   * Create a new plant
   */
  static async createPlant(req: CreatePlantRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const plantData = {
        ...req.body,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const plant = new Plant(plantData);
      await plant.save();

      // Update user analytics
      try {
        await UserAnalytics.findOneAndUpdate(
          { userId },
          { 
            $inc: { totalPlants: 1 },
            $set: { lastActivity: new Date() }
          },
          { upsert: true }
        );

        // Track plant creation event
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.PLANT_ADDED,
          {
            plantId: plant._id,
            category: plant.category,
            species: plant.species,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to update analytics for plant creation:', analyticsError);
      }

      // Create plant care analytics record
      try {
        const careAnalytics = new PlantCareAnalytics({
          userId,
          plantId: plant._id,
          plantName: plant.name,
          species: plant.species,
          category: plant.category
        });
        await careAnalytics.save();
      } catch (careAnalyticsError) {
        logger.warn('Failed to create plant care analytics:', careAnalyticsError);
      }

      res.status(201).json({
        success: true,
        message: 'Plant created successfully',
        data: { plant }
      });
    } catch (error) {
      logger.error('Create plant error:', error);
      next(error);
    }
  }

  /**
   * Get user's plants with filtering and pagination
   */
  static async getPlants(req: SearchPlantsRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const {
        q = '',
        category,
        tags,
        location,
        healthStatus,
        careStatus,
        isPublic,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = '1',
        limit = '20'
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build search query
      const searchQuery: any = { userId };

      if (q) {
        searchQuery.$or = [
          { name: { $regex: q, $options: 'i' } },
          { species: { $regex: q, $options: 'i' } },
          { variety: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ];
      }

      if (category) searchQuery.category = category;
      if (location) searchQuery.location = { $regex: location, $options: 'i' };
      if (healthStatus) searchQuery.healthStatus = healthStatus;
      if (careStatus) searchQuery.careStatus = careStatus;
      if (isPublic !== undefined) searchQuery.isPublic = isPublic === 'true';
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        searchQuery.tags = { $in: tagArray };
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [plants, totalPlants] = await Promise.all([
        Plant.find(searchQuery)
          .sort(sortObj)
          .skip(skip)
          .limit(limitNum)
          .populate('careAnalytics', 'totalCareLogs lastCareDate nextCareDate careScore'),
        Plant.countDocuments(searchQuery)
      ]);

      const totalPages = Math.ceil(totalPlants / limitNum);

      res.status(200).json({
        success: true,
        data: {
          plants,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalPlants,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get plants error:', error);
      next(error);
    }
  }

  /**
   * Get plant by ID
   */
  static async getPlantById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      // Check if plantId is valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(plantId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid plant ID format'
        });
        return;
      }

      const plant = await Plant.findOne({ _id: new mongoose.Types.ObjectId(plantId!), userId })
        .populate('careAnalytics', 'totalCareLogs lastCareDate nextCareDate careScore streakDays');

      if (!plant) {
        res.status(404).json({
          success: false,
          message: 'Plant not found'
        });
        return;
      }

      // Track plant view
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.PLANT_VIEWED,
          {
            plantId: plant._id,
            plantName: plant.name,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track plant view event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        data: { plant }
      });
    } catch (error) {
      logger.error('Get plant by ID error:', error);
      next(error);
    }
  }

  /**
   * Update plant
   */
  static async updatePlant(req: UpdatePlantRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const updateData = { ...req.body, updatedAt: new Date() };

      // Check if plantId is valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(plantId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid plant ID format'
        });
        return;
      }

      const plant = await Plant.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(plantId!), userId },
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('careAnalytics');

      if (!plant) {
        res.status(404).json({
          success: false,
          message: 'Plant not found'
        });
        return;
      }

      // Update plant care analytics if name or species changed
      if (updateData.name || updateData.species || updateData.category) {
        try {
          await PlantCareAnalytics.findOneAndUpdate(
            { plantId: plant._id },
            {
              plantName: plant.name,
              species: plant.species,
              category: plant.category
            }
          );
        } catch (careAnalyticsError) {
          logger.warn('Failed to update plant care analytics:', careAnalyticsError);
        }
      }

      // Track plant update
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.PLANT_UPDATED,
          {
            plantId: plant._id,
            plantName: plant.name,
            fieldsUpdated: Object.keys(req.body),
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track plant update event:', analyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Plant updated successfully',
        data: { plant }
      });
    } catch (error) {
      logger.error('Update plant error:', error);
      next(error);
    }
  }

  /**
   * Delete plant
   */
  static async deletePlant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      // Check if plantId is valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(plantId!)) {
        res.status(400).json({
          success: false,
          message: 'Invalid plant ID format'
        });
        return;
      }

      const plant = await Plant.findOneAndDelete({ _id: new mongoose.Types.ObjectId(plantId!), userId });

      if (!plant) {
        res.status(404).json({
          success: false,
          message: 'Plant not found'
        });
        return;
      }

      // Update user analytics
      try {
        await UserAnalytics.findOneAndUpdate(
          { userId },
          { 
            $inc: { totalPlants: -1 },
            $set: { lastActivity: new Date() }
          }
        );

        // Track plant deletion
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.PLANT_DELETED,
          {
            plantId: plant._id,
            plantName: plant.name,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to update analytics for plant deletion:', analyticsError);
      }

      // Delete associated plant care analytics
      try {
        await PlantCareAnalytics.findOneAndDelete({ plantId: plant._id });
      } catch (careAnalyticsError) {
        logger.warn('Failed to delete plant care analytics:', careAnalyticsError);
      }

      res.status(200).json({
        success: true,
        message: 'Plant deleted successfully'
      });
    } catch (error) {
      logger.error('Delete plant error:', error);
      next(error);
    }
  }

  /**
   * Get plant categories with counts
   */
  static async getPlantCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      const categoryCounts = await Plant.aggregate([
        { $match: { userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const categories = [
        { id: 'houseplant', name: 'Houseplant', count: 0 },
        { id: 'vegetable', name: 'Vegetable', count: 0 },
        { id: 'herb', name: 'Herb', count: 0 },
        { id: 'flower', name: 'Flower', count: 0 },
        { id: 'tree', name: 'Tree', count: 0 },
        { id: 'succulent', name: 'Succulent', count: 0 }
      ];

      // Update counts from aggregation
      categoryCounts.forEach(cat => {
        const category = categories.find(c => c.id === cat._id);
        if (category) category.count = cat.count;
      });

      res.status(200).json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      logger.error('Get plant categories error:', error);
      next(error);
    }
  }

  /**
   * Bulk operations on plants
   */
  static async bulkOperation(req: BulkOperationRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plantIds, operation, data } = req.body;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      // Validate plant IDs
      const validPlantIds = plantIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validPlantIds.length !== plantIds.length) {
        res.status(400).json({
          success: false,
          message: 'One or more plant IDs are invalid'
        });
        return;
      }

      let result;
      let message = '';

      switch (operation) {
        case 'delete':
          result = await Plant.deleteMany({ 
            _id: { $in: validPlantIds }, 
            userId 
          });
          
          // Update user analytics
          await UserAnalytics.findOneAndUpdate(
            { userId },
            { 
              $inc: { totalPlants: -result.deletedCount },
              $set: { lastActivity: new Date() }
            }
          );

          // Delete associated analytics
          await PlantCareAnalytics.deleteMany({ 
            plantId: { $in: validPlantIds } 
          });

          message = `${result.deletedCount} plants deleted successfully`;
          break;

        case 'updateLocation':
          if (!data?.location) {
            res.status(400).json({
              success: false,
              message: 'Location is required for location update operation'
            });
            return;
          }
          
          result = await Plant.updateMany(
            { _id: { $in: validPlantIds }, userId },
            { 
              $set: { 
                location: data.location,
                updatedAt: new Date()
              }
            }
          );
          message = `${result.modifiedCount} plants location updated successfully`;
          break;

        case 'updateTags':
          if (!data?.tags || !Array.isArray(data.tags)) {
            res.status(400).json({
              success: false,
              message: 'Tags array is required for tags update operation'
            });
            return;
          }
          
          result = await Plant.updateMany(
            { _id: { $in: validPlantIds }, userId },
            { 
              $set: { 
                tags: data.tags,
                updatedAt: new Date()
              }
            }
          );
          message = `${result.modifiedCount} plants tags updated successfully`;
          break;

        case 'updatePublic':
          if (data?.isPublic === undefined) {
            res.status(400).json({
              success: false,
              message: 'isPublic boolean is required for public status update operation'
            });
            return;
          }
          
          result = await Plant.updateMany(
            { _id: { $in: validPlantIds }, userId },
            { 
              $set: { 
                isPublic: data.isPublic,
                updatedAt: new Date()
              }
            }
          );
          message = `${result.modifiedCount} plants public status updated successfully`;
          break;

        default:
          res.status(400).json({
            success: false,
            message: 'Invalid bulk operation. Supported operations: delete, updateLocation, updateTags, updatePublic'
          });
          return;
      }

      // Track bulk operation
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.PLANTS_BULK_OPERATION,
          {
            operation,
            plantsCount: validPlantIds.length,
            affectedCount: 'deletedCount' in result ? result.deletedCount : 'modifiedCount' in result ? result.modifiedCount : 0,
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
          requestedCount: validPlantIds.length,
          affectedCount: 'deletedCount' in result ? result.deletedCount : 'modifiedCount' in result ? result.modifiedCount : 0
        }
      });
    } catch (error) {
      logger.error('Bulk operation error:', error);
      next(error);
    }
  }

  /**
   * Import plants from JSON data
   */
  static async importPlants(req: ImportPlantsRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plants, overwrite = false } = req.body;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      if (!Array.isArray(plants) || plants.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Plants array is required and cannot be empty'
        });
        return;
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: 0,
        errorDetails: [] as string[]
      };

      for (const plantData of plants) {
        try {
          const existingPlant = await Plant.findOne({
            userId,
            name: plantData.name,
            species: plantData.species
          });

          if (existingPlant && !overwrite) {
            results.skipped++;
            continue;
          }

          const plantToSave = {
            ...plantData,
            userId,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          if (existingPlant && overwrite) {
            await Plant.findByIdAndUpdate(existingPlant._id, plantToSave);
          } else {
            const plant = new Plant(plantToSave);
            await plant.save();

            // Create plant care analytics
            const careAnalytics = new PlantCareAnalytics({
              userId,
              plantId: plant._id,
              plantName: plant.name,
              species: plant.species,
              category: plant.category
            });
            await careAnalytics.save();
          }

          results.imported++;
        } catch (plantError) {
          results.errors++;
          results.errorDetails.push(`Plant "${plantData.name}": ${(plantError as Error).message}`);
        }
      }

      // Update user analytics
      if (results.imported > 0) {
        try {
          await UserAnalytics.findOneAndUpdate(
            { userId },
            { 
              $inc: { totalPlants: results.imported },
              $set: { lastActivity: new Date() }
            },
            { upsert: true }
          );

          // Track import event
          await UserAnalytics.trackEvent(
            userId,
            AnalyticsEventType.PLANTS_IMPORTED,
            {
              totalPlants: plants.length,
              importedCount: results.imported,
              skippedCount: results.skipped,
              errorCount: results.errors,
              sessionId: req.sessionID
            }
          );
        } catch (analyticsError) {
          logger.warn('Failed to update analytics for plant import:', analyticsError);
        }
      }

      res.status(200).json({
        success: true,
        message: `Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors} errors`,
        data: results
      });
    } catch (error) {
      logger.error('Import plants error:', error);
      next(error);
    }
  }

  /**
   * Export plants to JSON
   */
  static async exportPlants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { format = 'json' } = req.query;

      const plants = await Plant.find({ userId })
        .select('-userId -__v')
        .sort({ createdAt: -1 });

      // Track export event
      try {
        await UserAnalytics.trackEvent(
          userId,
          AnalyticsEventType.PLANTS_EXPORTED,
          {
            plantsCount: plants.length,
            format,
            sessionId: req.sessionID
          }
        );
      } catch (analyticsError) {
        logger.warn('Failed to track plant export event:', analyticsError);
      }

      if (format === 'csv') {
        // For future CSV implementation
        res.status(400).json({
          success: false,
          message: 'CSV export not yet implemented. Use JSON format.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          exportDate: new Date().toISOString(),
          totalPlants: plants.length,
          plants
        }
      });
    } catch (error) {
      logger.error('Export plants error:', error);
      next(error);
    }
  }

  /**
   * Get plant analytics
   */
  static async getPlantAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      const analytics = await Plant.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalPlants: { $sum: 1 },
            healthyPlants: {
              $sum: { $cond: [{ $eq: ['$healthStatus', 'healthy'] }, 1, 0] }
            },
            needsAttentionPlants: {
              $sum: { $cond: [{ $eq: ['$healthStatus', 'needs-attention'] }, 1, 0] }
            },
            criticalPlants: {
              $sum: { $cond: [{ $eq: ['$healthStatus', 'critical'] }, 1, 0] }
            },
            publicPlants: {
              $sum: { $cond: ['$isPublic', 1, 0] }
            },
            averageAge: {
              $avg: {
                $divide: [
                  { $subtract: [new Date(), '$acquisitionDate'] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              }
            }
          }
        }
      ]);

      const categoryBreakdown = await Plant.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const locationBreakdown = await Plant.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const result = {
        overview: analytics[0] || {
          totalPlants: 0,
          healthyPlants: 0,
          needsAttentionPlants: 0,
          criticalPlants: 0,
          publicPlants: 0,
          averageAge: 0
        },
        categoryBreakdown,
        locationBreakdown
      };

      res.status(200).json({
        success: true,
        data: { analytics: result }
      });
    } catch (error) {
      logger.error('Get plant analytics error:', error);
      next(error);
    }
  }
}
