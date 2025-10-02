import { Request, Response } from 'express';
import { User } from '../models/User';
import { Plant } from '../models/Plant';
import { CareLog } from '../models/CareLog';
import { Reminder } from '../models/Reminder';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Notification } from '../models/Notification';
import { NotificationPreference } from '../models/NotificationPreference';
import { ExportImportOperation } from '../models/ExportImportOperation';
import { createObjectCsvWriter } from 'csv-writer';
import { Parser } from 'json2csv';
import path from 'path';
import fs from 'fs/promises';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

interface ExportOptions {
  format: 'json' | 'csv' | 'both';
  dataTypes: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeMedia?: boolean;
}

interface ImportResult {
  success: boolean;
  imported: {
    plants?: number;
    careLogs?: number;
    reminders?: number;
    posts?: number;
    notifications?: number;
  };
  errors: string[];
  warnings: string[];
}

class ExportImportController {
  // Export user data
  async exportUserData(req: Request, res: Response): Promise<void> {
    let operation: any = null;
    
    try {
      const userId = req.user?.id;
      const options: ExportOptions = {
        format: req.body.format || 'json',
        dataTypes: req.body.dataTypes || ['plants', 'careLogs', 'reminders', 'profile'],
        dateRange: req.body.dateRange,
        includeMedia: req.body.includeMedia || false
      };

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Create operation tracking record
      const exportId = uuidv4();
      operation = new ExportImportOperation({
        userId: new mongoose.Types.ObjectId(userId),
        operationType: 'export',
        exportId,
        format: options.format,
        dataTypes: options.dataTypes,
        options: {
          dateRange: options.dateRange,
          includeMedia: options.includeMedia
        }
      });

      await operation.save();
      operation.markAsStarted();
      await operation.save();

      // Create export directory
      const exportDir = path.join(process.env.UPLOAD_PATH || 'uploads', 'exports', exportId);
      await fs.mkdir(exportDir, { recursive: true });

      const exportData: any = {
        exportInfo: {
          exportId,
          userId,
          timestamp: new Date(),
          format: options.format,
          dataTypes: options.dataTypes,
          version: '1.0.0'
        }
      };

      // Export user profile
      if (options.dataTypes.includes('profile')) {
        const user = await User.findById(userId).select('-password -refreshToken');
        exportData.profile = user;
      }

      // Export notification preferences
      if (options.dataTypes.includes('preferences')) {
        const preferences = await NotificationPreference.findOne({ userId });
        exportData.preferences = preferences;
      }

      // Export plants
      if (options.dataTypes.includes('plants')) {
        const plants = await Plant.find({ userId });
        exportData.plants = plants;
      }

      // Export care logs
      if (options.dataTypes.includes('careLogs')) {
        let careLogQuery: any = { userId };
        
        if (options.dateRange) {
          careLogQuery.date = {
            $gte: options.dateRange.start,
            $lte: options.dateRange.end
          };
        }

        const careLogs = await CareLog.find(careLogQuery).populate('plantId', 'name species');
        exportData.careLogs = careLogs;
      }

      // Export reminders
      if (options.dataTypes.includes('reminders')) {
        const reminders = await Reminder.find({ userId }).populate('plantId', 'name species');
        exportData.reminders = reminders;
      }

      // Export community posts
      if (options.dataTypes.includes('posts')) {
        const posts = await Post.find({ authorId: userId }).populate('plantId', 'name species');
        const comments = await Comment.find({ authorId: userId }).populate('postId', 'title');
        exportData.posts = posts;
        exportData.comments = comments;
      }

      // Export notifications
      if (options.dataTypes.includes('notifications')) {
        let notificationQuery: any = { userId };
        
        if (options.dateRange) {
          notificationQuery.createdAt = {
            $gte: options.dateRange.start,
            $lte: options.dateRange.end
          };
        }

        const notifications = await Notification.find(notificationQuery);
        exportData.notifications = notifications;
      }

      // Save data in requested format(s)
      const files: string[] = [];

      if (options.format === 'json' || options.format === 'both') {
        const jsonFile = path.join(exportDir, `agrotrack-export-${exportId}.json`);
        await fs.writeFile(jsonFile, JSON.stringify(exportData, null, 2));
        files.push(jsonFile);
      }

      if (options.format === 'csv' || options.format === 'both') {
        // Create CSV files for each data type
        for (const dataType of options.dataTypes) {
          if (exportData[dataType] && Array.isArray(exportData[dataType])) {
            const csvFile = path.join(exportDir, `${dataType}-${exportId}.csv`);
            const parser = new Parser();
            const csv = parser.parse(exportData[dataType]);
            await fs.writeFile(csvFile, csv);
            files.push(csvFile);
          }
        }

        // Create export info CSV
        const infoFile = path.join(exportDir, `export-info-${exportId}.csv`);
        const infoParser = new Parser();
        const infoCsv = infoParser.parse([exportData.exportInfo]);
        await fs.writeFile(infoFile, infoCsv);
        files.push(infoFile);
      }

      // Create ZIP archive
      const zipFile = path.join(exportDir, `agrotrack-export-${exportId}.zip`);
      await this.createZipArchive(files, zipFile);

      // Generate download URL
      const downloadUrl = `/api/export-import/download/${exportId}`;

      // Mark operation as completed
      const recordCounts = {
        plants: exportData.plants?.length || 0,
        careLogs: exportData.careLogs?.length || 0,
        reminders: exportData.reminders?.length || 0,
        posts: exportData.posts?.length || 0,
        notifications: exportData.notifications?.length || 0
      };

      operation.markAsCompleted({ recordCounts });
      await operation.save();

      res.json({
        message: 'Export completed successfully',
        exportId,
        downloadUrl,
        files: files.map(f => path.basename(f)),
        dataTypes: options.dataTypes,
        recordCounts,
        operationId: operation._id
      });

    } catch (error) {
      console.error('Export error:', error);
      
      // Mark operation as failed if it exists
      if (operation) {
        operation.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
        await operation.save().catch(() => {}); // Ignore save errors here
      }

      res.status(500).json({ 
        message: 'Export failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Import user data
  async importUserData(req: Request, res: Response): Promise<void> {
    let operation: any = null;
    
    try {
      const userId = req.user?.id;
      const file = req.file;
      const options = {
        overwrite: req.body.overwrite === 'true',
        validateOnly: req.body.validateOnly === 'true',
        dataTypes: req.body.dataTypes ? JSON.parse(req.body.dataTypes) : null
      };

      if (!userId || !file) {
        res.status(400).json({ message: 'User ID and file are required' });
        return;
      }

      // Create operation tracking record
      operation = new ExportImportOperation({
        userId: new mongoose.Types.ObjectId(userId),
        operationType: 'import',
        format: file.mimetype === 'application/json' ? 'json' : 'csv',
        dataTypes: options.dataTypes || ['plants', 'careLogs', 'reminders'],
        options: {
          overwrite: options.overwrite,
          validateOnly: options.validateOnly
        },
        fileInfo: {
          originalName: file.originalname,
          fileName: file.filename,
          fileSize: file.size,
          mimeType: file.mimetype
        }
      });

      await operation.save();
      
      if (!options.validateOnly) {
        operation.markAsStarted();
        await operation.save();
      }

      // Parse import data
      const importData = await this.parseImportFile(file);
      
      // Validate import data
      const validation = await this.validateImportData(importData, userId);
      if (!validation.valid) {
        res.status(400).json({
          message: 'Import validation failed',
          errors: validation.errors
        });
        return;
      }

      // If validation only, return validation results
      if (options.validateOnly) {
        operation.markAsCompleted({ preview: validation.preview });
        await operation.save();
        
        res.json({
          message: 'Import validation successful',
          preview: validation.preview,
          operationId: operation._id
        });
        return;
      }

      // Perform import
      const result = await this.performImport(importData, userId, options);

      // Mark operation as completed
      operation.markAsCompleted({
        imported: result.imported,
        errors: result.errors,
        warnings: result.warnings
      });
      await operation.save();

      res.json({
        message: result.success ? 'Import completed successfully' : 'Import completed with errors',
        result,
        operationId: operation._id
      });

    } catch (error) {
      console.error('Import error:', error);
      
      // Mark operation as failed if it exists
      if (operation) {
        operation.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
        await operation.save().catch(() => {}); // Ignore save errors here
      }

      res.status(500).json({ 
        message: 'Import failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Download exported data
  async downloadExport(req: Request, res: Response): Promise<void> {
    try {
      const { exportId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Find and verify the export operation
      const operation = await ExportImportOperation.findOne({
        exportId,
        userId: new mongoose.Types.ObjectId(userId),
        operationType: 'export',
        status: 'completed'
      });

      if (!operation) {
        res.status(404).json({ message: 'Export not found or not accessible' });
        return;
      }

      const exportDir = path.join(process.env.UPLOAD_PATH || 'uploads', 'exports', exportId!);
      const zipFile = path.join(exportDir, `agrotrack-export-${exportId}.zip`);

      // Check if file exists
      try {
        await fs.access(zipFile);
      } catch {
        res.status(404).json({ message: 'Export file not found' });
        return;
      }

      // Track download
      (operation as any).incrementDownloadCount();
      await operation.save();

      // Set headers for download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="agrotrack-export-${exportId}.zip"`);

      // Stream file
      const fileBuffer = await fs.readFile(zipFile);
      res.send(fileBuffer);

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ 
        message: 'Download failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Get export history
  async getExportHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const operationType = req.query.type as 'export' | 'import' | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Get operations from database
      const operations = await (ExportImportOperation as any).getUserOperations(
        new mongoose.Types.ObjectId(userId),
        operationType,
        limit
      );

      // Get summary stats
      const stats = await (ExportImportOperation as any).getOperationStats(
        new mongoose.Types.ObjectId(userId)
      );

      res.json({
        operations: operations.map((op: any) => ({
          id: op._id,
          operationType: op.operationType,
          status: op.status,
          exportId: op.exportId,
          format: op.format,
          dataTypes: op.dataTypes,
          recordCounts: op.results?.recordCounts,
          imported: op.results?.imported,
          downloadCount: op.downloadCount,
          lastDownloadAt: op.lastDownloadAt,
          createdAt: op.createdAt,
          completedAt: op.completedAt,
          duration: op.duration,
          downloadUrl: op.exportId ? `/api/export-import/download/${op.exportId}` : null,
          hasErrors: op.results?.errors && op.results.errors.length > 0,
          hasWarnings: op.results?.warnings && op.results.warnings.length > 0
        })),
        stats
      });

    } catch (error) {
      console.error('Export history error:', error);
      res.status(500).json({ 
        message: 'Failed to get export/import history', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Helper methods
  private async createZipArchive(files: string[], zipFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(zipFile);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      files.forEach(file => {
        archive.file(file, { name: path.basename(file) });
      });

      archive.finalize();
    });
  }

  private async parseImportFile(file: Express.Multer.File): Promise<any> {
    const content = file.buffer.toString('utf-8');
    
    if (file.mimetype === 'application/json') {
      return JSON.parse(content);
    } else if (file.mimetype === 'text/csv') {
      // Parse CSV - simplified implementation
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('Empty CSV file');
      }
      
      const headers = lines[0].split(',');
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim();
        });
        return obj;
      });
      return { importData: data };
    }
    
    throw new Error('Unsupported file format');
  }

  private async validateImportData(importData: any, userId: string): Promise<{ valid: boolean; errors: string[]; preview?: any }> {
    const errors: string[] = [];
    const preview: any = {};

    // Validate structure
    if (!importData.exportInfo && !importData.importData) {
      errors.push('Invalid import file structure');
    }

    // Validate data types
    if (importData.plants) {
      preview.plants = importData.plants.length;
      // Validate plant structure
      for (const plant of importData.plants.slice(0, 5)) { // Check first 5
        if (!plant.name || !plant.species) {
          errors.push('Invalid plant data structure');
          break;
        }
      }
    }

    if (importData.careLogs) {
      preview.careLogs = importData.careLogs.length;
    }

    if (importData.reminders) {
      preview.reminders = importData.reminders.length;
    }

    return {
      valid: errors.length === 0,
      errors,
      preview
    };
  }

  private async performImport(importData: any, userId: string, options: any): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: {},
      errors: [],
      warnings: []
    };

    try {
      // Import plants
      if (importData.plants && (!options.dataTypes || options.dataTypes.includes('plants'))) {
        let importedPlants = 0;
        for (const plantData of importData.plants) {
          try {
            // Remove old ID and set new user
            delete plantData._id;
            plantData.userId = userId;
            
            if (options.overwrite) {
              await Plant.findOneAndUpdate(
                { userId, name: plantData.name, species: plantData.species },
                plantData,
                { upsert: true }
              );
            } else {
              const existingPlant = await Plant.findOne({ 
                userId, 
                name: plantData.name, 
                species: plantData.species 
              });
              
              if (!existingPlant) {
                await Plant.create(plantData);
                importedPlants++;
              } else {
                result.warnings.push(`Plant ${plantData.name} already exists, skipped`);
              }
            }
          } catch (error) {
            result.errors.push(`Failed to import plant ${plantData.name}: ${error}`);
          }
        }
        result.imported.plants = importedPlants;
      }

      // Import care logs
      if (importData.careLogs && (!options.dataTypes || options.dataTypes.includes('careLogs'))) {
        let importedLogs = 0;
        for (const logData of importData.careLogs) {
          try {
            delete logData._id;
            logData.userId = userId;
            
            // Find matching plant by name/species if plantId is invalid
            if (logData.plantId && typeof logData.plantId === 'object' && logData.plantId.name) {
              const plant = await Plant.findOne({
                userId,
                name: logData.plantId.name,
                species: logData.plantId.species
              });
              logData.plantId = plant?._id;
            }
            
            if (logData.plantId) {
              await CareLog.create(logData);
              importedLogs++;
            }
          } catch (error) {
            result.errors.push(`Failed to import care log: ${error}`);
          }
        }
        result.imported.careLogs = importedLogs;
      }

      // Import reminders
      if (importData.reminders && (!options.dataTypes || options.dataTypes.includes('reminders'))) {
        let importedReminders = 0;
        for (const reminderData of importData.reminders) {
          try {
            delete reminderData._id;
            reminderData.userId = userId;
            
            // Find matching plant
            if (reminderData.plantId && typeof reminderData.plantId === 'object' && reminderData.plantId.name) {
              const plant = await Plant.findOne({
                userId,
                name: reminderData.plantId.name,
                species: reminderData.plantId.species
              });
              reminderData.plantId = plant?._id;
            }
            
            if (reminderData.plantId) {
              await Reminder.create(reminderData);
              importedReminders++;
            }
          } catch (error) {
            result.errors.push(`Failed to import reminder: ${error}`);
          }
        }
        result.imported.reminders = importedReminders;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Import failed: ${error}`);
    }

    return result;
  }

  // Get detailed operation information
  async getOperationDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { operationId } = req.params;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const operation = await ExportImportOperation.findOne({
        _id: operationId,
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (!operation) {
        res.status(404).json({ message: 'Operation not found' });
        return;
      }

      res.json({
        operation: {
          id: operation._id,
          operationType: operation.operationType,
          status: operation.status,
          exportId: operation.exportId,
          format: operation.format,
          dataTypes: operation.dataTypes,
          options: operation.options,
          fileInfo: operation.fileInfo,
          results: operation.results,
          downloadCount: operation.downloadCount,
          lastDownloadAt: operation.lastDownloadAt,
          createdAt: operation.createdAt,
          startedAt: operation.startedAt,
          completedAt: operation.completedAt,
          duration: operation.duration,
          expiresAt: operation.expiresAt,
          downloadUrl: operation.exportId ? `/api/export-import/download/${operation.exportId}` : null
        }
      });

    } catch (error) {
      console.error('Operation details error:', error);
      res.status(500).json({ 
        message: 'Failed to get operation details', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Delete old exports (cleanup)
  async cleanupExports(req: Request, res: Response): Promise<void> {
    try {
      const daysOld = parseInt(req.query.days as string) || 30;
      
      // Clean up database records
      const deletedOperations = await (ExportImportOperation as any).cleanupExpiredOperations();

      // Clean up files
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const exportsDir = path.join(process.env.UPLOAD_PATH || 'uploads', 'exports');
      let deletedFiles = 0;

      try {
        const exportDirs = await fs.readdir(exportsDir);

        for (const exportDir of exportDirs) {
          const exportPath = path.join(exportsDir, exportDir);
          const stats = await fs.stat(exportPath);
          
          if (stats.mtime < cutoffDate) {
            await fs.rm(exportPath, { recursive: true, force: true });
            deletedFiles++;
          }
        }
      } catch (error) {
        // Directory might not exist, that's okay
        console.log('Exports directory not found or empty');
      }

      res.json({
        message: 'Cleanup completed',
        deletedOperations,
        deletedFiles,
        cutoffDate
      });

    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({ 
        message: 'Cleanup failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
}

export default new ExportImportController();