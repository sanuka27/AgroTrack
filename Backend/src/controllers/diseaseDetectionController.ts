import { Request, Response } from 'express';
import { Plant } from '../models/Plant';
import { User } from '../models/User';
import { UserAnalytics } from '../models/UserAnalytics';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import { validateAgriculturalImage } from '../ai/gemini';
import { AIRecommendation } from '../models/AIRecommendation';

// Define interfaces for disease detection data structures
interface DiseaseDetection {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  plantId?: mongoose.Types.ObjectId;
  imageUrl: string;
  originalFileName: string;
  detectionResults: {
    diseaseDetected: boolean;
    confidence: number;
    primaryDisease?: {
      name: string;
      scientificName: string;
      category: string;
      severity: 'mild' | 'moderate' | 'severe' | 'critical';
      confidence: number;
    };
    alternativeDiagnoses?: {
      name: string;
      scientificName: string;
      confidence: number;
      category: string;
    }[];
    healthyProbability: number;
    processingTime: number;
  };
  treatmentRecommendations: {
    immediateActions: string[];
    treatments: {
      type: 'chemical' | 'organic' | 'cultural' | 'biological';
      name: string;
      description: string;
      applicationMethod: string;
      frequency: string;
      duration: string;
      effectiveness: number;
      cost: 'low' | 'medium' | 'high';
    }[];
    preventionMeasures: string[];
    followUpRequired: boolean;
    followUpDays: number;
    quarantineRecommended: boolean;
  };
  plantInformation: {
    affectedParts: string[];
    symptoms: string[];
    progressionStage: 'early' | 'intermediate' | 'advanced';
    spreadRisk: 'low' | 'medium' | 'high';
    environmentalFactors: {
      humidity?: number;
      temperature?: number;
      lightConditions?: string;
      airCirculation?: string;
    };
  };
  expertVerification?: {
    verified: boolean;
    verifiedBy?: mongoose.Types.ObjectId;
    verificationDate?: Date;
    expertNotes?: string;
    accuracyRating?: number;
  };
  userFeedback?: {
    helpful: boolean;
    accuracyRating?: number;
    treatmentEffective?: boolean;
    additionalNotes?: string;
    submittedAt?: Date;
  };
  status: 'processing' | 'completed' | 'failed' | 'expert-review';
  createdAt: Date;
  updatedAt: Date;
}

interface DiseaseKnowledgeBase {
  _id?: mongoose.Types.ObjectId;
  name: string;
  scientificName: string;
  commonNames: string[];
  category: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'nutritional' | 'environmental';
  description: string;
  symptoms: string[];
  affectedPlants: string[];
  causativeAgent?: string;
  transmissionMethod: string[];
  environmentalConditions: {
    optimalTemperature?: { min: number; max: number };
    optimalHumidity?: { min: number; max: number };
    season?: string[];
    lightConditions?: string[];
  };
  treatments: {
    type: 'chemical' | 'organic' | 'cultural' | 'biological';
    name: string;
    activeIngredient?: string;
    description: string;
    applicationMethod: string;
    frequency: string;
    duration: string;
    effectiveness: number;
    cost: 'low' | 'medium' | 'high';
    sideEffects?: string[];
  }[];
  prevention: string[];
  references: string[];
  images: string[];
  severity: {
    mild: { symptoms: string[]; damage: string };
    moderate: { symptoms: string[]; damage: string };
    severe: { symptoms: string[]; damage: string };
    critical: { symptoms: string[]; damage: string };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock collections for disease detection data (in real implementation, these would be proper Mongoose models)
const DiseaseDetections: DiseaseDetection[] = [];
const DiseaseKnowledgeBase: DiseaseKnowledgeBase[] = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Powdery Mildew",
    scientificName: "Erysiphales",
    commonNames: ["White Mildew", "Powdery Fungus"],
    category: "fungal",
    description: "A fungal disease that appears as white, powdery spots on leaves and stems",
    symptoms: ["White powdery coating on leaves", "Yellowing leaves", "Stunted growth", "Leaf curling"],
    affectedPlants: ["roses", "tomatoes", "cucumbers", "houseplants"],
    causativeAgent: "Various fungi in the order Erysiphales",
    transmissionMethod: ["airborne spores", "contact"],
    environmentalConditions: {
      optimalTemperature: { min: 20, max: 30 },
      optimalHumidity: { min: 40, max: 70 },
      season: ["spring", "fall"],
      lightConditions: ["partial shade", "low light"]
    },
    treatments: [
      {
        type: "organic",
        name: "Baking Soda Spray",
        description: "Mix baking soda with water and spray on affected areas",
        applicationMethod: "foliar spray",
        frequency: "weekly",
        duration: "2-3 weeks",
        effectiveness: 75,
        cost: "low"
      },
      {
        type: "chemical",
        name: "Fungicide",
        activeIngredient: "Myclobutanil",
        description: "Commercial fungicide for powdery mildew",
        applicationMethod: "foliar spray",
        frequency: "bi-weekly",
        duration: "3-4 weeks",
        effectiveness: 90,
        cost: "medium"
      }
    ],
    prevention: [
      "Improve air circulation",
      "Reduce humidity",
      "Avoid overhead watering",
      "Remove affected leaves promptly"
    ],
    references: ["Plant Pathology textbook", "Agricultural extension guides"],
    images: ["powdery_mildew_1.jpg", "powdery_mildew_2.jpg"],
    severity: {
      mild: {
        symptoms: ["Small white spots on few leaves"],
        damage: "Minimal impact on plant health"
      },
      moderate: {
        symptoms: ["White coating on multiple leaves", "Some yellowing"],
        damage: "Reduced photosynthesis, slower growth"
      },
      severe: {
        symptoms: ["Extensive white coating", "Significant yellowing", "Leaf drop"],
        damage: "Severely compromised plant health"
      },
      critical: {
        symptoms: ["Complete leaf coverage", "Plant defoliation", "Stunted growth"],
        damage: "Plant death possible without immediate treatment"
      }
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export class DiseaseDetectionController {
  
  /**
   * AI-powered plant disease detection from image
   */
  static async detectDisease(req: Request, res: Response): Promise<void> {
    try {
      // Handle both authenticated and guest users
      const isGuest = !req.user;
      const userId = isGuest
        ? new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') // Guest user ID
        : new mongoose.Types.ObjectId((req.user as any)._id!.toString());

  const { imageUrl, plantId, originalFileName, plantName: plantNameBody, imageStoragePath, description, selectedSymptoms } = req.body;

      // For guest users, skip plant validation (they don't have plants)
  let plantName: string | null = plantNameBody || null;
      if (!isGuest && plantId) {
        const plant = await Plant.findOne({ _id: plantId, userId });
        if (!plant) {
          res.status(404).json({
            success: false,
            message: 'Plant not found or not owned by user'
          });
          return;
        }
        plantName = plant.name;
      }

      // Validate that the image contains agricultural/plant content
      logger.info(`Validating image content for user ${userId}: ${imageUrl}`);
      const imageValidation = await validateAgriculturalImage(imageUrl);

      if (!imageValidation.isValid) {
        logger.warn(`Image validation failed for user ${userId}: ${imageValidation.message}`);
        res.status(400).json({
          success: false,
          message: 'Invalid image content. Please upload a photo showing plants, trees, crops, or agricultural content only.',
          details: {
            reason: imageValidation.message,
            category: imageValidation.category,
            confidence: imageValidation.confidence
          }
        });
        return;
      }

      logger.info(`Image validation passed for user ${userId}: ${imageValidation.category} (confidence: ${imageValidation.confidence})`);

      // Create initial detection record
      const detection: DiseaseDetection = {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(userId),
        plantId: plantId ? new mongoose.Types.ObjectId(plantId) : undefined,
        imageUrl,
        originalFileName: originalFileName || 'uploaded_image.jpg',
        detectionResults: {
          diseaseDetected: false,
          confidence: 0,
          healthyProbability: 0,
          processingTime: 0
        },
        treatmentRecommendations: {
          immediateActions: [],
          treatments: [],
          preventionMeasures: [],
          followUpRequired: false,
          followUpDays: 0,
          quarantineRecommended: false
        },
        plantInformation: {
          affectedParts: [],
          symptoms: [],
          progressionStage: 'early',
          spreadRisk: 'low',
          environmentalFactors: {}
        },
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      DiseaseDetections.push(detection);

      // Simulate AI processing (in real implementation, this would call an ML model)
      const processingStartTime = Date.now();
      
      // Mock AI analysis - in production, this would be replaced with actual AI/ML service
      const aiResults = await DiseaseDetectionController.simulateAIDetection(
        imageUrl,
        { description: req.body?.description, selectedSymptoms: req.body?.selectedSymptoms }
      );
      
      const processingTime = Date.now() - processingStartTime;

      // Update detection with AI results
      detection.detectionResults = {
        ...aiResults,
        processingTime
      };

      // Generate treatment recommendations based on detection
      if (aiResults.diseaseDetected && aiResults.primaryDisease) {
        const recommendations = await DiseaseDetectionController.generateTreatmentRecommendations(
          aiResults.primaryDisease.name,
          aiResults.primaryDisease.severity,
          plantId
        );
        detection.treatmentRecommendations = recommendations;
      }

      // Update plant information
      if (aiResults.diseaseDetected && aiResults.primaryDisease) {
        detection.plantInformation = await DiseaseDetectionController.analyzePlantCondition(
          aiResults.primaryDisease.name,
          aiResults.primaryDisease.severity
        );
      }

      detection.status = 'completed';
      detection.updatedAt = new Date();

      // Update user analytics
      await UserAnalytics.findOneAndUpdate(
        { userId },
        {
          $inc: {
            'plant.diseaseDetections': 1,
            'engagement.totalActions': 1
          },
          $set: {
            'plant.lastDiseaseDetection': new Date(),
            lastActivityDate: new Date()
          }
        },
        { upsert: true }
      );

      // Persist AI analysis recommendation record for later review
      try {
        const rec = new AIRecommendation({
          userId: isGuest ? null : new mongoose.Types.ObjectId(userId),
          plantId: plantId ? new mongoose.Types.ObjectId(plantId) : null,
          plantName,
          imageUrl,
          imageStoragePath: imageStoragePath || null,
          originalFileName: originalFileName || 'uploaded_image.jpg',
          description: description || null,
          selectedSymptoms: Array.isArray(selectedSymptoms) ? selectedSymptoms : undefined,
          detectionResults: detection.detectionResults,
          recommendations: detection.treatmentRecommendations,
          plantInformation: detection.plantInformation,
          status: detection.status
        });
        await rec.save();
      } catch (persistErr) {
        logger.warn('Failed to persist AI recommendation record:', persistErr);
      }

      logger.info(`Disease detection completed: ${detection._id} for user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Disease detection completed successfully',
        data: {
          detection,
          processingTime: `${processingTime}ms`
        }
      });

    } catch (error) {
      logger.error('Error in disease detection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to detect disease',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
      return;
    }
  }

  /**
   * Get disease detection history
   */
  static async getDetectionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const {
        plantId,
        diseaseDetected,
        status,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      // Build filter
      const filteredDetections = DiseaseDetections.filter(detection => {
        if (detection.userId.toString() !== userId.toString()) return false;
        if (plantId && detection.plantId?.toString() !== plantId) return false;
        if (status && detection.status !== status) return false;
        
        if (diseaseDetected !== undefined) {
          const detected = diseaseDetected === 'true';
          if (detection.detectionResults.diseaseDetected !== detected) return false;
        }

        if (dateFrom) {
          const fromDate = new Date(dateFrom as string);
          if (detection.createdAt < fromDate) return false;
        }

        if (dateTo) {
          const toDate = new Date(dateTo as string);
          if (detection.createdAt > toDate) return false;
        }

        return true;
      });

      // Sort detections
      filteredDetections.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'confidence':
            aValue = a.detectionResults.confidence;
            bValue = b.detectionResults.confidence;
            break;
          case 'createdAt':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'severity':
            aValue = a.detectionResults.primaryDisease?.severity || 'mild';
            bValue = b.detectionResults.primaryDisease?.severity || 'mild';
            break;
          default:
            aValue = a.createdAt;
            bValue = b.createdAt;
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      const paginatedDetections = filteredDetections.slice(skip, skip + Number(limit));

      // Populate plant data
      const detectionsWithPlantData = await Promise.all(
        paginatedDetections.map(async detection => {
          let plant = null;
          if (detection.plantId) {
            plant = await Plant.findById(detection.plantId)
              .select('name species images');
          }
          
          return {
            ...detection,
            plant
          };
        })
      );

      const totalDetections = filteredDetections.length;
      const totalPages = Math.ceil(totalDetections / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Detection history retrieved successfully',
        data: {
          detections: detectionsWithPlantData,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalDetections,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting detection history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve detection history',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
      return;
    }
  }

  /**
   * Get detection details by ID
   */
  static async getDetectionById(req: Request, res: Response): Promise<void> {
    try {
      const { detectionId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      const detection = DiseaseDetections.find(d => 
        d._id?.toString() === detectionId && d.userId.toString() === userId.toString()
      );

      if (!detection) {
        res.status(404).json({
          success: false,
          message: 'Disease detection not found'
        });
        return;
      }

      // Get plant data if exists
      let plant = null;
      if (detection.plantId) {
        plant = await Plant.findById(detection.plantId)
          .select('name species images location');
      }

      // Get disease knowledge if detected
      let diseaseKnowledge = null;
      if (detection.detectionResults.diseaseDetected && detection.detectionResults.primaryDisease) {
        diseaseKnowledge = DiseaseKnowledgeBase.find(disease => 
          disease.name.toLowerCase() === detection.detectionResults.primaryDisease!.name.toLowerCase()
        );
      }

      res.status(200).json({
        success: true,
        message: 'Detection details retrieved successfully',
        data: {
          detection: {
            ...detection,
            plant,
            diseaseKnowledge
          }
        }
      });

    } catch (error) {
      logger.error('Error getting detection details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve detection details',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
      return;
    }
  }

  /**
   * Submit user feedback on detection accuracy
   */
  static async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { detectionId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const {
        helpful,
        accuracyRating,
        treatmentEffective,
        additionalNotes
      } = req.body;

      const detection = DiseaseDetections.find(d => 
        d._id?.toString() === detectionId && d.userId.toString() === userId.toString()
      );

      if (!detection) {
        res.status(404).json({
          success: false,
          message: 'Disease detection not found'
        });
        return;
      }

      // Update feedback
      detection.userFeedback = {
        helpful,
        accuracyRating,
        treatmentEffective,
        additionalNotes,
        submittedAt: new Date()
      };

      detection.updatedAt = new Date();

      logger.info(`User feedback submitted for detection ${detectionId} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: {
          feedback: detection.userFeedback
        }
      });

    } catch (error) {
      logger.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
      return;
    }
  }

  /**
   * Get disease knowledge base
   */
  static async getDiseaseKnowledge(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        search,
        affectedPlant,
        sortBy = 'name',
        sortOrder = 'asc',
        page = 1,
        limit = 20
      } = req.query;

      // Filter diseases
      const filteredDiseases = DiseaseKnowledgeBase.filter(disease => {
        if (!disease.isActive) return false;
        if (category && disease.category !== category) return false;
        if (affectedPlant && !disease.affectedPlants.includes(affectedPlant as string)) return false;

        if (search) {
          const searchTerm = (search as string).toLowerCase();
          const searchableText = `${disease.name} ${disease.commonNames.join(' ')} ${disease.description} ${disease.symptoms.join(' ')}`.toLowerCase();
          if (!searchableText.includes(searchTerm)) return false;
        }

        return true;
      });

      // Sort diseases
      filteredDiseases.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'category':
            aValue = a.category;
            bValue = b.category;
            break;
          case 'createdAt':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          default:
            aValue = a.name;
            bValue = b.name;
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      const paginatedDiseases = filteredDiseases.slice(skip, skip + Number(limit));

      const totalDiseases = filteredDiseases.length;
      const totalPages = Math.ceil(totalDiseases / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Disease knowledge retrieved successfully',
        data: {
          diseases: paginatedDiseases,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalDiseases,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting disease knowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve disease knowledge',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
      return;
    }
  }

  /**
   * Get disease by ID from knowledge base
   */
  static async getDiseaseById(req: Request, res: Response): Promise<void> {
    try {
      const { diseaseId } = req.params;

      const disease = DiseaseKnowledgeBase.find(d => 
        d._id?.toString() === diseaseId && d.isActive
      );

      if (!disease) {
        res.status(404).json({
          success: false,
          message: 'Disease information not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Disease information retrieved successfully',
        data: {
          disease
        }
      });

    } catch (error) {
      logger.error('Error getting disease by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve disease information',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
      return;
    }
  }

  /**
   * Get detection statistics for user
   */
  static async getDetectionStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { timeframe = '30d' } = req.query;

      // Calculate date range
      let dateFilter: Date | undefined;
      if (timeframe !== 'all') {
        const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - days);
      }

      // Filter user's detections
      const userDetections = DiseaseDetections.filter(detection => {
        if (detection.userId.toString() !== userId.toString()) return false;
        if (dateFilter && detection.createdAt < dateFilter) return false;
        return true;
      });

      // Calculate statistics
      const totalDetections = userDetections.length;
      const diseaseDetections = userDetections.filter(d => d.detectionResults.diseaseDetected);
      const healthyDetections = userDetections.filter(d => !d.detectionResults.diseaseDetected);

      // Disease distribution
      const diseaseDistribution: { [key: string]: number } = {};
      diseaseDetections.forEach(detection => {
        if (detection.detectionResults.primaryDisease) {
          const diseaseName = detection.detectionResults.primaryDisease.name;
          diseaseDistribution[diseaseName] = (diseaseDistribution[diseaseName] || 0) + 1;
        }
      });

      // Severity distribution
      const severityDistribution = {
        mild: diseaseDetections.filter(d => d.detectionResults.primaryDisease?.severity === 'mild').length,
        moderate: diseaseDetections.filter(d => d.detectionResults.primaryDisease?.severity === 'moderate').length,
        severe: diseaseDetections.filter(d => d.detectionResults.primaryDisease?.severity === 'severe').length,
        critical: diseaseDetections.filter(d => d.detectionResults.primaryDisease?.severity === 'critical').length
      };

      // Average confidence
      const avgConfidence = userDetections.length > 0 
        ? userDetections.reduce((sum, d) => sum + d.detectionResults.confidence, 0) / userDetections.length 
        : 0;

      // Recent detections
      const recentDetections = userDetections
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      res.status(200).json({
        success: true,
        message: 'Detection statistics retrieved successfully',
        data: {
          overview: {
            totalDetections,
            diseaseDetections: diseaseDetections.length,
            healthyDetections: healthyDetections.length,
            diseaseRate: totalDetections > 0 ? (diseaseDetections.length / totalDetections) * 100 : 0,
            averageConfidence: Math.round(avgConfidence * 100) / 100
          },
          diseaseDistribution,
          severityDistribution,
          recentDetections,
          timeframe
        }
      });

    } catch (error) {
      logger.error('Error getting detection stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve detection statistics',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
      return;
    }
  }

  // Helper methods

  /**
   * Simulate AI disease detection (mock implementation)
   */
  private static async simulateAIDetection(imageUrl: string, context?: { description?: string; selectedSymptoms?: string[] }): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI results - in production, this would call actual AI/ML service
    const mockResults = [
      {
        diseaseDetected: true,
        confidence: 0.87,
        primaryDisease: {
          name: "Powdery Mildew",
          scientificName: "Erysiphales",
          category: "fungal",
          severity: "moderate" as const,
          confidence: 0.87
        },
        alternativeDiagnoses: [
          {
            name: "Early Blight",
            scientificName: "Alternaria solani",
            confidence: 0.23,
            category: "fungal"
          }
        ],
        healthyProbability: 0.13
      },
      {
        diseaseDetected: false,
        confidence: 0.92,
        healthyProbability: 0.92
      }
    ];

    // Simple heuristic: if user mentions powdery/white spots, bias toward mildew
    const text = `${context?.description || ''} ${(context?.selectedSymptoms || []).join(' ')}`.toLowerCase();
    if (/powdery|white\s+spots|mildew/.test(text)) {
      return mockResults[0];
    }
    // Otherwise random for demo
    return Math.random() > 0.3 ? mockResults[0] : mockResults[1];
  }

  /**
   * Generate treatment recommendations based on detected disease
   */
  private static async generateTreatmentRecommendations(
    diseaseName: string, 
    severity: string, 
    plantId?: string
  ): Promise<any> {
    const disease = DiseaseKnowledgeBase.find(d => 
      d.name.toLowerCase() === diseaseName.toLowerCase()
    );

    if (!disease) {
      return {
        immediateActions: ['Isolate the plant', 'Remove affected parts'],
        treatments: [],
        preventionMeasures: ['Monitor plant regularly'],
        followUpRequired: true,
        followUpDays: 7,
        quarantineRecommended: true
      };
    }

    const immediateActions = [];
    let quarantineRecommended = false;

    switch (severity) {
      case 'critical':
        immediateActions.push('URGENT: Immediate isolation required');
        immediateActions.push('Remove all severely affected parts');
        immediateActions.push('Apply treatment immediately');
        quarantineRecommended = true;
        break;
      case 'severe':
        immediateActions.push('Isolate plant from other plants');
        immediateActions.push('Remove affected leaves/parts');
        quarantineRecommended = true;
        break;
      case 'moderate':
        immediateActions.push('Monitor closely and isolate if spreading');
        immediateActions.push('Remove visibly affected areas');
        break;
      case 'mild':
        immediateActions.push('Begin monitoring and early treatment');
        break;
    }

    return {
      immediateActions,
      treatments: disease.treatments.map(treatment => ({
        ...treatment,
        priority: severity === 'critical' || severity === 'severe' ? 'high' : 'medium'
      })),
      preventionMeasures: disease.prevention,
      followUpRequired: severity !== 'mild',
      followUpDays: severity === 'critical' ? 3 : severity === 'severe' ? 5 : 7,
      quarantineRecommended
    };
  }

  /**
   * Analyze plant condition based on detected disease
   */
  private static async analyzePlantCondition(
    diseaseName: string, 
    severity: string
  ): Promise<any> {
    const disease = DiseaseKnowledgeBase.find(d => 
      d.name.toLowerCase() === diseaseName.toLowerCase()
    );

    if (!disease) {
      return {
        affectedParts: ['unknown'],
        symptoms: ['requires expert analysis'],
        progressionStage: 'unknown' as const,
        spreadRisk: 'medium' as const,
        environmentalFactors: {}
      };
    }

    let progressionStage: 'early' | 'intermediate' | 'advanced';
    let spreadRisk: 'low' | 'medium' | 'high';

    switch (severity) {
      case 'mild':
        progressionStage = 'early';
        spreadRisk = 'low';
        break;
      case 'moderate':
        progressionStage = 'intermediate';
        spreadRisk = 'medium';
        break;
      case 'severe':
        progressionStage = 'advanced';
        spreadRisk = 'high';
        break;
      case 'critical':
        progressionStage = 'advanced';
        spreadRisk = 'high';
        break;
      default:
        progressionStage = 'early';
        spreadRisk = 'low';
    }

    return {
      affectedParts: ['leaves'], // Would be determined by AI in real implementation
      symptoms: disease.symptoms,
      progressionStage,
      spreadRisk,
      environmentalFactors: {
        humidity: disease.environmentalConditions.optimalHumidity?.max,
        temperature: disease.environmentalConditions.optimalTemperature?.max
      }
    };
  }
}