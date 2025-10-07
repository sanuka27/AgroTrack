import { Request, Response } from 'express';
import { User } from '../models/User';
import { Plant } from '../models/Plant';
import { UserAnalytics } from '../models/UserAnalytics';
import mongoose from 'mongoose';
import { logger } from '../config/logger';

// Define interfaces for expert consultation data structures
interface ExpertProfile {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  specializations: string[];
  yearsOfExperience: number;
  qualifications: string[];
  bio: string;
  hourlyRate: number;
  availability: {
    timezone: string;
    schedule: {
      [key: string]: { // day of week
        available: boolean;
        timeSlots: { start: string; end: string }[];
      };
    };
  };
  rating: {
    average: number;
    totalReviews: number;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  languages: string[];
  profileImage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Consultation {
  _id?: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  expert: mongoose.Types.ObjectId;
  plantId?: mongoose.Types.ObjectId;
  type: 'instant' | 'scheduled' | 'follow-up';
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate: Date;
  duration: number; // in minutes
  topic: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  consultationMethod: 'chat' | 'video' | 'phone';
  pricing: {
    hourlyRate: number;
    totalCost: number;
    paymentStatus: 'pending' | 'paid' | 'refunded';
  };
  chat: {
    messages: {
      sender: mongoose.Types.ObjectId;
      senderType: 'client' | 'expert';
      message: string;
      timestamp: Date;
      messageType: 'text' | 'image' | 'file';
      attachments?: string[];
    }[];
    isActive: boolean;
  };
  outcome: {
    summary?: string;
    recommendations?: string[];
    followUpRequired?: boolean;
    followUpDate?: Date;
    satisfactionRating?: number;
    expertNotes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ExpertReview {
  _id?: mongoose.Types.ObjectId;
  consultation: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  expert: mongoose.Types.ObjectId;
  rating: number;
  review: string;
  aspects: {
    expertise: number;
    communication: number;
    timeliness: number;
    helpfulness: number;
  };
  isVerified: boolean;
  createdAt: Date;
}

// Mock collections for expert data (in real implementation, these would be proper Mongoose models)
const ExpertProfiles: ExpertProfile[] = [];
const Consultations: Consultation[] = [];
const ExpertReviews: ExpertReview[] = [];

export class ExpertController {

  /**
   * Create or update expert profile
   */
  static async createExpertProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const {
        specializations,
        yearsOfExperience,
        qualifications,
        bio,
        hourlyRate,
        availability,
        languages,
        profileImage
      } = req.body;

      // Check if user is eligible to become an expert
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if expert profile already exists
      const existingProfile = ExpertProfiles.find(profile =>
        profile.userId.toString() === userId.toString()
      );      const profileData: ExpertProfile = {
        userId: new mongoose.Types.ObjectId(userId),
        specializations,
        yearsOfExperience,
        qualifications,
        bio,
        hourlyRate,
        availability,
        languages,
        profileImage,
        rating: {
          average: 0,
          totalReviews: 0
        },
        verificationStatus: 'pending',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (existingProfile) {
        // Update existing profile
        Object.assign(existingProfile, profileData);
        existingProfile.updatedAt = new Date();
      } else {
        // Create new profile
        profileData._id = new mongoose.Types.ObjectId();
        ExpertProfiles.push(profileData);
      }

      // Update user role to include expert
      await User.findByIdAndUpdate(userId, {
        $addToSet: { roles: 'expert' },
        expertProfile: profileData._id
      });

      logger.info(`Expert profile ${existingProfile ? 'updated' : 'created'} for user ${userId}`);

      res.status(existingProfile ? 200 : 201).json({
        success: true,
        message: `Expert profile ${existingProfile ? 'updated' : 'created'} successfully`,
        data: {
          profile: profileData
        }
      });

    } catch (error) {
      logger.error('Error creating/updating expert profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create/update expert profile',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get expert profiles with filtering and search
   */
  static async getExperts(req: Request, res: Response): Promise<void> {
    try {
      const {
        specialization,
        minRating = 0,
        maxHourlyRate,
        availability,
        languages,
        verificationStatus = 'verified',
        search,
        sortBy = 'rating',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      // Build filter criteria
      let filteredExperts = ExpertProfiles.filter(expert => {
        if (!expert.isActive) return false;
        if (expert.verificationStatus !== verificationStatus) return false;
        if (expert.rating.average < Number(minRating)) return false;
        if (maxHourlyRate && expert.hourlyRate > Number(maxHourlyRate)) return false;

        if (specialization) {
          const specs = Array.isArray(specialization) ? specialization : [specialization];
          if (!specs.some(spec => expert.specializations.includes(spec as string))) return false;
        }

        if (languages) {
          const langs = Array.isArray(languages) ? languages : [languages];
          if (!langs.some(lang => expert.languages.includes(lang as string))) return false;
        }

        if (search) {
          const searchTerm = (search as string).toLowerCase();
          const searchableText = `${expert.bio} ${expert.qualifications.join(' ')} ${expert.specializations.join(' ')}`.toLowerCase();
          if (!searchableText.includes(searchTerm)) return false;
        }

        return true;
      });

      // Sort experts
      filteredExperts.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'rating':
            aValue = a.rating.average;
            bValue = b.rating.average;
            break;
          case 'hourlyRate':
            aValue = a.hourlyRate;
            bValue = b.hourlyRate;
            break;
          case 'experience':
            aValue = a.yearsOfExperience;
            bValue = b.yearsOfExperience;
            break;
          case 'reviews':
            aValue = a.rating.totalReviews;
            bValue = b.rating.totalReviews;
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
      const paginatedExperts = filteredExperts.slice(skip, skip + Number(limit));

      // Populate user data for response
      const expertsWithUserData = await Promise.all(
        paginatedExperts.map(async expert => {
          const user = await User.findById(expert.userId)
            .select('username profilePicture bio location');
          
          return {
            ...expert,
            user
          };
        })
      );

      const totalExperts = filteredExperts.length;
      const totalPages = Math.ceil(totalExperts / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Experts retrieved successfully',
        data: {
          experts: expertsWithUserData,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalExperts,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting experts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve experts',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get expert profile by ID
   */
  static async getExpertProfile(req: Request, res: Response): Promise<void> {
    try {
      const { expertId } = req.params;

      const expert = ExpertProfiles.find(profile => 
        profile._id?.toString() === expertId || profile.userId.toString() === expertId
      );

      if (!expert) {
        res.status(404).json({
          success: false,
          message: 'Expert profile not found'
        });
        return;
      }

      // Get user data
      const user = await User.findById(expert.userId)
        .select('username profilePicture bio location');

      // Get recent reviews
      const recentReviews = ExpertReviews
        .filter(review => review.expert.toString() === expert._id?.toString())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);

      // Get consultation statistics
      const totalConsultations = Consultations.filter(
        consultation => consultation.expert.toString() === expert._id?.toString()
      ).length;

      const completedConsultations = Consultations.filter(
        consultation => 
          consultation.expert.toString() === expert._id?.toString() && 
          consultation.status === 'completed'
      ).length;

      res.status(200).json({
        success: true,
        message: 'Expert profile retrieved successfully',
        data: {
          expert: {
            ...expert,
            user,
            statistics: {
              totalConsultations,
              completedConsultations,
              completionRate: totalConsultations > 0 ? (completedConsultations / totalConsultations) * 100 : 0
            }
          },
          recentReviews
        }
      });

    } catch (error) {
      logger.error('Error getting expert profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve expert profile',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Book a consultation with an expert
   */
  static async bookConsultation(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const {
        expertId,
        plantId,
        type,
        scheduledDate,
        duration = 60,
        topic,
        description,
        priority = 'medium',
        consultationMethod = 'chat'
      } = req.body;

      // Find expert
      const expert = ExpertProfiles.find(profile => 
        profile._id?.toString() === expertId
      );

      if (!expert || !expert.isActive || expert.verificationStatus !== 'verified') {
        res.status(404).json({
          success: false,
          message: 'Expert not found or not available'
        });
        return;
      }

      // Validate plant if provided
      if (plantId) {
        const plant = await Plant.findOne({ _id: plantId, userId });
        if (!plant) {
          res.status(404).json({
            success: false,
            message: 'Plant not found or not owned by user'
          });
          return;
        }
      }

      // Calculate pricing
      const hourlyRate = expert.hourlyRate;
      const totalCost = (duration / 60) * hourlyRate;

      // Create consultation
      const consultation: Consultation = {
        _id: new mongoose.Types.ObjectId(),
        client: new mongoose.Types.ObjectId(userId),
        expert: expert._id!,
        plantId: plantId ? new mongoose.Types.ObjectId(plantId) : undefined,
        type,
        status: type === 'instant' ? 'pending' : 'confirmed',
        scheduledDate: new Date(scheduledDate),
        duration,
        topic,
        description,
        priority,
        consultationMethod,
        pricing: {
          hourlyRate,
          totalCost,
          paymentStatus: 'pending'
        },
        chat: {
          messages: [],
          isActive: false
        },
        outcome: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      Consultations.push(consultation);

      // Update user analytics
      await UserAnalytics.findOneAndUpdate(
        { userId },
        {
          $inc: {
            'expert.consultationsBooked': 1,
            'engagement.totalActions': 1
          },
          $set: {
            'expert.lastConsultationDate': new Date(),
            lastActivityDate: new Date()
          }
        },
        { upsert: true }
      );

      logger.info(`Consultation booked: ${consultation._id} by user ${userId} with expert ${expertId}`);

      res.status(201).json({
        success: true,
        message: 'Consultation booked successfully',
        data: {
          consultation,
          paymentRequired: totalCost > 0
        }
      });

    } catch (error) {
      logger.error('Error booking consultation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to book consultation',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get user consultations
   */
  static async getConsultations(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const userRole = (req.user as any).role;
      const {
        status,
        type,
        clientId,
        expertId,
        dateFrom,
        dateTo,
        sortBy = 'scheduledDate',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      // Build filter
      let filteredConsultations = Consultations.filter(consultation => {
        // User can see their own consultations as client or expert
        const isClient = consultation.client.toString() === userId.toString();
        const isExpert = consultation.expert.toString() === userId.toString();
        
        if (!isClient && !isExpert && !['admin', 'moderator'].includes(userRole)) {
          return false;
        }

        if (status && consultation.status !== status) return false;
        if (type && consultation.type !== type) return false;
        if (clientId && consultation.client.toString() !== clientId) return false;
        if (expertId && consultation.expert.toString() !== expertId) return false;

        if (dateFrom) {
          const fromDate = new Date(dateFrom as string);
          if (consultation.scheduledDate < fromDate) return false;
        }

        if (dateTo) {
          const toDate = new Date(dateTo as string);
          if (consultation.scheduledDate > toDate) return false;
        }

        return true;
      });

      // Sort consultations
      filteredConsultations.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'scheduledDate':
            aValue = a.scheduledDate;
            bValue = b.scheduledDate;
            break;
          case 'createdAt':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'totalCost':
            aValue = a.pricing.totalCost;
            bValue = b.pricing.totalCost;
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
      const paginatedConsultations = filteredConsultations.slice(skip, skip + Number(limit));

      // Populate related data
      const consultationsWithData = await Promise.all(
        paginatedConsultations.map(async consultation => {
          const [client, expert, plant] = await Promise.all([
            User.findById(consultation.client).select('username profilePicture'),
            User.findById(consultation.expert).select('username profilePicture'),
            consultation.plantId ? Plant.findById(consultation.plantId).select('name species images') : null
          ]);

          return {
            ...consultation,
            client,
            expert,
            plant
          };
        })
      );

      const totalConsultations = filteredConsultations.length;
      const totalPages = Math.ceil(totalConsultations / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Consultations retrieved successfully',
        data: {
          consultations: consultationsWithData,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalConsultations,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting consultations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve consultations',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Update consultation status
   */
  static async updateConsultationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { consultationId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { status, expertNotes, summary, recommendations } = req.body;

      const consultation = Consultations.find(c => c._id?.toString() === consultationId);
      if (!consultation) {
        res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
        return;
      }

      // Check authorization
      const isExpert = consultation.expert.toString() === userId.toString();
      const isClient = consultation.client.toString() === userId.toString();

      if (!isExpert && !isClient) {
        res.status(403).json({
          success: false,
          message: 'Not authorized to update this consultation'
        });
        return;
      }      // Validate status transitions
      const validTransitions: { [key: string]: string[] } = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['in-progress', 'cancelled'],
        'in-progress': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
      };

      if (!validTransitions[consultation.status]?.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Cannot change status from ${consultation.status} to ${status}`
        });
        return;
      }

      // Update consultation
      consultation.status = status;
      consultation.updatedAt = new Date();

      // Update outcome if provided (expert only)
      if (isExpert && status === 'completed') {
        consultation.outcome = {
          ...consultation.outcome,
          summary,
          recommendations,
          expertNotes
        };
      }

      // Activate chat when consultation starts
      if (status === 'in-progress') {
        consultation.chat.isActive = true;
      }

      logger.info(`Consultation ${consultationId} status updated to ${status} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Consultation status updated successfully',
        data: {
          consultation
        }
      });

    } catch (error) {
      logger.error('Error updating consultation status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update consultation status',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Send message in consultation chat
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { consultationId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { message, messageType = 'text', attachments = [] } = req.body;

      const consultation = Consultations.find(c => c._id?.toString() === consultationId);
      if (!consultation) {
        res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
        return;
      }

      // Check authorization
      const isExpert = consultation.expert.toString() === userId.toString();
      const isClient = consultation.client.toString() === userId.toString();

      if (!isExpert && !isClient) {
        res.status(403).json({
          success: false,
          message: 'Not authorized to send messages in this consultation'
        });
        return;
      }

      // Check if chat is active
      if (!consultation.chat.isActive) {
        res.status(400).json({
          success: false,
          message: 'Chat is not active for this consultation'
        });
        return;
      }      // Create message
      const newMessage = {
        sender: new mongoose.Types.ObjectId(userId),
        senderType: isExpert ? 'expert' as const : 'client' as const,
        message,
        timestamp: new Date(),
        messageType,
        attachments
      };

      consultation.chat.messages.push(newMessage);
      consultation.updatedAt = new Date();

      logger.info(`Message sent in consultation ${consultationId} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: {
          message: newMessage
        }
      });

    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get consultation chat messages
   */
  static async getChatMessages(req: Request, res: Response): Promise<void> {
    try {
      const { consultationId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { page = 1, limit = 50 } = req.query;

      const consultation = Consultations.find(c => c._id?.toString() === consultationId);
      if (!consultation) {
        res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
        return;
      }

      // Check authorization
      const isExpert = consultation.expert.toString() === userId.toString();
      const isClient = consultation.client.toString() === userId.toString();

      if (!isExpert && !isClient) {
        res.status(403).json({
          success: false,
          message: 'Not authorized to view messages in this consultation'
        });
        return;
      }      // Get messages with pagination
      const messages = consultation.chat.messages
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const skip = (Number(page) - 1) * Number(limit);
      const paginatedMessages = messages.slice(skip, skip + Number(limit));

      // Populate sender information
      const messagesWithSenderInfo = await Promise.all(
        paginatedMessages.map(async msg => {
          const sender = await User.findById(msg.sender).select('username profilePicture');
          return {
            ...msg,
            sender: sender
          };
        })
      );

      const totalMessages = messages.length;
      const totalPages = Math.ceil(totalMessages / Number(limit));

      res.status(200).json({
        success: true,
        message: 'Chat messages retrieved successfully',
        data: {
          messages: messagesWithSenderInfo.reverse(), // Return in chronological order
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalMessages,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting chat messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat messages',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Submit expert review
   */
  static async submitReview(req: Request, res: Response): Promise<void> {
    try {
      const { consultationId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const {
        rating,
        review,
        aspects = {
          expertise: rating,
          communication: rating,
          timeliness: rating,
          helpfulness: rating
        }
      } = req.body;

      const consultation = Consultations.find(c => c._id?.toString() === consultationId);
      if (!consultation) {
        res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
        return;
      }

      // Only client can review the expert
      if (consultation.client.toString() !== userId.toString()) {
        res.status(403).json({
          success: false,
          message: 'Only the client can review the expert'
        });
        return;
      }

      // Check if consultation is completed
      if (consultation.status !== 'completed') {
        res.status(400).json({
          success: false,
          message: 'Can only review completed consultations'
        });
        return;
      }

      // Check if review already exists
      const existingReview = ExpertReviews.find(r => 
        r.consultation.toString() === consultationId
      );

      if (existingReview) {
        res.status(400).json({
          success: false,
          message: 'Review already submitted for this consultation'
        });
        return;
      }

      // Create review
      const expertReview: ExpertReview = {
        _id: new mongoose.Types.ObjectId(),
        consultation: consultation._id!,
        client: consultation.client,
        expert: consultation.expert,
        rating,
        review,
        aspects,
        isVerified: true,
        createdAt: new Date()
      };

      ExpertReviews.push(expertReview);

      // Update expert's rating
      const expert = ExpertProfiles.find(p => p._id?.toString() === consultation.expert.toString());
      if (expert) {
        const expertReviews = ExpertReviews.filter(r => 
          r.expert.toString() === expert._id?.toString()
        );
        
        const totalRating = expertReviews.reduce((sum, r) => sum + r.rating, 0);
        expert.rating.average = totalRating / expertReviews.length;
        expert.rating.totalReviews = expertReviews.length;
        expert.updatedAt = new Date();
      }

      // Update consultation with satisfaction rating
      consultation.outcome.satisfactionRating = rating;

      logger.info(`Expert review submitted for consultation ${consultationId} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: {
          review: expertReview
        }
      });

    } catch (error) {
      logger.error('Error submitting review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit review',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get expert reviews
   */
  static async getExpertReviews(req: Request, res: Response): Promise<void> {
    try {
      const { expertId } = req.params;
      const {
        minRating,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      // Filter reviews
      let filteredReviews = ExpertReviews.filter(review => {
        if (review.expert.toString() !== expertId) return false;
        if (minRating && review.rating < Number(minRating)) return false;
        return true;
      });

      // Sort reviews
      filteredReviews.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'rating':
            aValue = a.rating;
            bValue = b.rating;
            break;
          case 'createdAt':
            aValue = a.createdAt;
            bValue = b.createdAt;
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
      const paginatedReviews = filteredReviews.slice(skip, skip + Number(limit));

      // Populate client information
      const reviewsWithClientInfo = await Promise.all(
        paginatedReviews.map(async review => {
          const client = await User.findById(review.client).select('username profilePicture');
          return {
            ...review,
            client
          };
        })
      );

      const totalReviews = filteredReviews.length;
      const totalPages = Math.ceil(totalReviews / Number(limit));

      // Calculate review statistics
      const ratingDistribution = {
        5: filteredReviews.filter(r => r.rating === 5).length,
        4: filteredReviews.filter(r => r.rating === 4).length,
        3: filteredReviews.filter(r => r.rating === 3).length,
        2: filteredReviews.filter(r => r.rating === 2).length,
        1: filteredReviews.filter(r => r.rating === 1).length
      };

      const averageRating = filteredReviews.length > 0 
        ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length 
        : 0;

      res.status(200).json({
        success: true,
        message: 'Expert reviews retrieved successfully',
        data: {
          reviews: reviewsWithClientInfo,
          statistics: {
            totalReviews,
            averageRating: Math.round(averageRating * 10) / 10,
            ratingDistribution
          },
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalReviews,
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting expert reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve expert reviews',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get expert dashboard statistics
   */
  static async getExpertDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      // Find expert profile
      const expert = ExpertProfiles.find(profile => 
        profile.userId.toString() === userId.toString()
      );

      if (!expert) {
        res.status(404).json({
          success: false,
          message: 'Expert profile not found'
        });
        return;
      }

      // Get consultation statistics
      const expertConsultations = Consultations.filter(c => 
        c.expert.toString() === expert._id?.toString()
      );

      const totalConsultations = expertConsultations.length;
      const completedConsultations = expertConsultations.filter(c => c.status === 'completed').length;
      const pendingConsultations = expertConsultations.filter(c => c.status === 'pending').length;
      const upcomingConsultations = expertConsultations.filter(c => 
        c.status === 'confirmed' && c.scheduledDate > new Date()
      ).length;

      // Calculate earnings
      const totalEarnings = expertConsultations
        .filter(c => c.status === 'completed' && c.pricing.paymentStatus === 'paid')
        .reduce((sum, c) => sum + c.pricing.totalCost, 0);

      // Get recent reviews
      const recentReviews = ExpertReviews
        .filter(review => review.expert.toString() === expert._id?.toString())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      // Get upcoming consultations
      const upcomingConsultationDetails = expertConsultations
        .filter(c => c.status === 'confirmed' && c.scheduledDate > new Date())
        .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
        .slice(0, 5);

      res.status(200).json({
        success: true,
        message: 'Expert dashboard retrieved successfully',
        data: {
          profile: expert,
          statistics: {
            totalConsultations,
            completedConsultations,
            pendingConsultations,
            upcomingConsultations,
            completionRate: totalConsultations > 0 ? (completedConsultations / totalConsultations) * 100 : 0,
            totalEarnings,
            averageRating: expert.rating.average,
            totalReviews: expert.rating.totalReviews
          },
          recentReviews,
          upcomingConsultations: upcomingConsultationDetails
        }
      });

    } catch (error) {
      logger.error('Error getting expert dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve expert dashboard',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }
}
