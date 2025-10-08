import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Plant } from '../models/Plant';
import { CareLog } from '../models/CareLog';
import { Reminder } from '../models/Reminder';
import { Post } from '../models/Post';
import { SearchAnalytics, PopularSearchTerm } from '../models/SearchAnalytics';

interface SearchFilters {
  category?: string;
  health?: string;
  sunlight?: string;
  careType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  type: 'plant' | 'care-log' | 'reminder' | 'post';
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  relevance: number;
  metadata: Record<string, any>;
}

interface UniversalSearchResponse {
  results: SearchResult[];
  totalCount: number;
  suggestions: string[];
  facets: {
    categories: { name: string; count: number }[];
    types: { name: string; count: number }[];
    authors: { name: string; count: number }[];
  };
  executionTime: number;
}

interface SearchSuggestion {
  query: string;
  type: 'recent' | 'trending' | 'completion';
  count?: number;
}

interface SearchFacets {
  categories: { name: string; count: number }[];
  types: { name: string; count: number }[];
  authors: { name: string; count: number }[];
  dateRanges: { name: string; count: number }[];
}

export class SearchController {
  // Universal search across all content types
  async universalSearch(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { 
        q: query = '', 
        type, 
        category, 
        health, 
        sunlight, 
        careType, 
        status, 
        dateFrom, 
        dateTo, 
        limit = 20, 
        offset = 0,
        sortBy = 'relevance',
        sortOrder = 'desc'
      } = req.query;

      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const filters: SearchFilters = {
        category: category as string,
        health: health as string,
        sunlight: sunlight as string,
        careType: careType as string,
        status: status as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        limit: parseInt(limit as string) || 20,
        offset: parseInt(offset as string) || 0
      };

      const allResults: SearchResult[] = [];
      
      // Search across different content types
      if (!type || type === 'plant') {
        const plantResults = await this.searchPlantsPrivate(userId.toString(), query as string, filters);
        allResults.push(...plantResults);
      }
      
      if (!type || type === 'care-log') {
        const careLogResults = await this.searchCareLogs(userId.toString(), query as string, filters);
        allResults.push(...careLogResults);
      }
      
      if (!type || type === 'reminder') {
        const reminderResults = await this.searchReminders(userId.toString(), query as string, filters);
        allResults.push(...reminderResults);
      }
      
      if (!type || type === 'post') {
        const postResults = await this.searchPosts(userId.toString(), query as string, filters);
        allResults.push(...postResults);
      }

      // Sort results by relevance or other criteria
      this.sortResults(allResults, sortBy as string, sortOrder as string);

      // Apply pagination
      const paginatedResults = allResults.slice(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 20));

      // Generate suggestions and facets
      const suggestions = await this.generateSuggestions(query as string, userId.toString());
      const facets = await this.calculateFacets(userId.toString(), filters);

      const executionTime = Date.now() - startTime;

      // Track search analytics
      await this.trackSearchAnalytics(
        userId.toString(),
        query as string,
        type as string || 'universal',
        allResults.length,
        executionTime,
        (req as any).sessionID || 'unknown',
        req.ip
      );

      const response: UniversalSearchResponse = {
        results: paginatedResults,
        totalCount: allResults.length,
        suggestions,
        facets,
        executionTime
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Universal search error:', error);
      res.status(500).json({
        success: false,
        message: 'Search failed',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Search plants with text and filters
  private async searchPlantsPrivate(userId: string, query: string, filters: SearchFilters): Promise<SearchResult[]> {
    const mongoQuery: any = { userId: new mongoose.Types.ObjectId(userId) };
    
    if (query.trim()) {
      mongoQuery.$text = { $search: query };
    }
    
    // Apply filters
    if (filters.category) {
      mongoQuery.category = filters.category;
    }
    if (filters.health) {
      mongoQuery.health = filters.health;
    }
    if (filters.sunlight) {
      mongoQuery.sunlight = filters.sunlight;
    }
    if (filters.dateFrom || filters.dateTo) {
      mongoQuery.createdAt = {};
      if (filters.dateFrom) mongoQuery.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) mongoQuery.createdAt.$lte = new Date(filters.dateTo);
    }
    
    const plants = await Plant.find(mongoQuery)
      .limit(filters.limit || 10)
      .lean();
    
    return plants.map((plant: any) => ({
      id: plant._id.toString(),
      type: 'plant' as const,
      title: plant.name,
      description: `${plant.scientificName || 'Plant'}${plant.commonNames?.length ? ` (${plant.commonNames[0]})` : ''} - ${plant.category || 'Plant'}`,
      imageUrl: plant.images?.[0],
      createdAt: plant.createdAt,
      updatedAt: plant.updatedAt,
      relevance: this.calculateRelevance(query, plant.name + ' ' + (plant.scientificName || '') + ' ' + (plant.commonNames?.[0] || '')),
      metadata: {
        scientificName: plant.scientificName,
        category: plant.category,
        health: plant.health,
        lastWatered: plant.lastWatered
      }
    }));
  }

  // Search care logs
  private async searchCareLogs(userId: string, query: string, filters: SearchFilters): Promise<SearchResult[]> {
    const mongoQuery: any = { userId: new mongoose.Types.ObjectId(userId) };
    
    if (query.trim()) {
      mongoQuery.$text = { $search: query };
    }
    
    if (filters.careType) {
      mongoQuery.careType = filters.careType;
    }
    if (filters.dateFrom || filters.dateTo) {
      mongoQuery.date = {};
      if (filters.dateFrom) mongoQuery.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) mongoQuery.date.$lte = new Date(filters.dateTo);
    }
    
    const careLogs = await CareLog.find(mongoQuery)
      .populate('plantId', 'name')
      .limit(filters.limit || 10)
      .lean();
    
    return careLogs.map((log: any) => ({
      id: log._id.toString(),
      type: 'care-log' as const,
      title: `${log.careType} - ${(log.plantId as any)?.name || 'Unknown Plant'}`,
      description: log.notes || `${log.careType} care performed`,
      imageUrl: log.photos?.[0],
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      relevance: this.calculateRelevance(query, log.careType + ' ' + (log.notes || '')),
      metadata: {
        careType: log.careType,
        plantName: (log.plantId as any)?.name
      }
    }));
  }

  // Search reminders
  private async searchReminders(userId: string, query: string, filters: SearchFilters): Promise<SearchResult[]> {
    const mongoQuery: any = { userId: new mongoose.Types.ObjectId(userId) };
    
    if (query.trim()) {
      mongoQuery.$text = { $search: query };
    }
    
    if (filters.status) {
      mongoQuery.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      mongoQuery.dueDate = {};
      if (filters.dateFrom) mongoQuery.dueDate.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) mongoQuery.dueDate.$lte = new Date(filters.dateTo);
    }
    
    const reminders = await Reminder.find(mongoQuery)
      .populate('plantId', 'name')
      .limit(filters.limit || 10)
      .lean();
    
    return reminders.map((reminder: any) => ({
      id: reminder._id.toString(),
      type: 'reminder' as const,
      title: reminder.title,
      description: reminder.description || `${reminder.type} reminder for ${(reminder.plantId as any)?.name}`,
      createdAt: reminder.createdAt,
      updatedAt: reminder.updatedAt,
      relevance: this.calculateRelevance(query, reminder.title + ' ' + (reminder.description || '')),
      metadata: {
        type: reminder.type,
        status: reminder.status,
        dueDate: reminder.dueDate,
        plantName: (reminder.plantId as any)?.name
      }
    }));
  }

  // Search posts
  private async searchPosts(userId: string, query: string, filters: SearchFilters): Promise<SearchResult[]> {
    const mongoQuery: any = {};
    
    if (query.trim()) {
      mongoQuery.$text = { $search: query };
    }
    
    if (filters.dateFrom || filters.dateTo) {
      mongoQuery.createdAt = {};
      if (filters.dateFrom) mongoQuery.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) mongoQuery.createdAt.$lte = new Date(filters.dateTo);
    }
    
    const posts = await Post.find(mongoQuery)
      .populate('author', 'username')
      .limit(filters.limit || 10)
      .lean();
    
    return posts.map((post: any) => ({
      id: post._id.toString(),
      type: 'post' as const,
      title: post.title,
      description: post.content.substring(0, 200) + '...',
      imageUrl: post.images?.[0],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      relevance: this.calculateRelevance(query, post.title + ' ' + post.content),
      metadata: {
        author: (post.author as any)?.username,
        likes: post.likes || 0,
        comments: post.comments?.length || 0
      }
    }));
  }

  // Calculate relevance score for search results
  private calculateRelevance(query: string, text: string): number {
    if (!query.trim()) return 1;
    
    const queryWords = query.toLowerCase().split(' ');
    const textLower = (text || '').toLowerCase();
    let score = 0;
    
    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        score += 1;
        // Boost for exact matches
        if (textLower.startsWith(word)) score += 0.5;
        // Boost for word boundaries
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = textLower.match(regex);
        if (matches) score += matches.length * 0.3;
      }
    });
    
    return Math.max(0.1, score / queryWords.length);
  }

  // Sort search results
  private sortResults(results: SearchResult[], sortBy: string, sortOrder: string): void {
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'relevance':
          comparison = b.relevance - a.relevance;
          break;
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = b.relevance - a.relevance;
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });
  }

  // Generate search suggestions
  private async generateSuggestions(query: string, userId: string): Promise<string[]> {
    const suggestions = new Set<string>();
    
    if (!query.trim()) return [];
    
    // Get plant names that match query
    const plants = await Plant.find({ 
      userId: new mongoose.Types.ObjectId(userId),
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { scientificName: { $regex: query, $options: 'i' } },
        { commonNames: { $elemMatch: { $regex: query, $options: 'i' } } }
      ]
    }).limit(5).lean();
    
    plants.forEach(plant => {
      if (plant.scientificName?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(plant.scientificName);
      }
      if (plant.commonNames) {
        plant.commonNames.forEach(commonName => {
          if (commonName.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(commonName);
          }
        });
      }
    });
    
    // Get popular search terms
    const popularTerms = await PopularSearchTerm.find({
      term: { $regex: query, $options: 'i' }
    }).sort({ searchCount: -1 }).limit(3).lean();
    
    popularTerms.forEach(term => suggestions.add(term.term));
    
    return Array.from(suggestions).slice(0, 8);
  }

  // Calculate search facets
  private async calculateFacets(userId: string, filters: SearchFilters): Promise<SearchFacets> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Calculate category facets from plants
    const categoryFacets = await Plant.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Calculate type facets from content types
    const [plantCount, careLogCount, reminderCount] = await Promise.all([
      Plant.countDocuments({ userId: userObjectId }),
      CareLog.countDocuments({ userId: userObjectId }),
      Reminder.countDocuments({ userId: userObjectId })
    ]);
    
    return {
      categories: categoryFacets.map(f => ({ name: f._id, count: f.count })),
      types: [
        { name: 'plant', count: plantCount },
        { name: 'care-log', count: careLogCount },
        { name: 'reminder', count: reminderCount }
      ],
      authors: [], // Not applicable for personal data
      dateRanges: [] // Could be implemented based on date ranges
    };
  }

  // Track search analytics
  private async trackSearchAnalytics(
    userId: string, 
    query: string, 
    type: string, 
    resultCount: number, 
    executionTime: number,
    sessionId: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Create search analytics record
      const analytics = new SearchAnalytics({
        userId: new mongoose.Types.ObjectId(userId),
        query: query.trim(),
        type,
        resultCount,
        executionTime,
        sessionId,
        ipAddress,
        timestamp: new Date()
      });
      
      await analytics.save();
      
      // Update popular search terms
      if (query.trim()) {
        await PopularSearchTerm.updateSearchTerm(query.trim(), resultCount, executionTime);
      }
    } catch (error) {
      console.error('Failed to track search analytics:', error);
    }
  }

  // Get search suggestions endpoint
  async getSearchSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { q: query = '' } = req.query;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      
      const suggestions = await this.generateSuggestions(query as string, userId.toString());
      
      res.json({
        success: true,
        data: { suggestions }
      });
    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get suggestions',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Plant-specific search endpoint
  async searchPlants(req: Request, res: Response): Promise<void> {
    try {
      const { 
        q: query = '', 
        category, 
        health, 
        sunlight, 
        limit = 20, 
        offset = 0 
      } = req.query;
      
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const filters: SearchFilters = {
        category: category as string,
        health: health as string,
        sunlight: sunlight as string,
        limit: parseInt(limit as string) || 20,
        offset: parseInt(offset as string) || 0
      };
      
      const results = await this.searchPlantsPrivate(userId.toString(), query as string, filters);
      
      res.json({
        success: true,
        data: {
          results,
          totalCount: results.length
        }
      });
    } catch (error) {
      console.error('Plant search error:', error);
      res.status(500).json({
        success: false,
        message: 'Plant search failed',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Get search facets endpoint
  async getSearchFacets(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const facets = await this.calculateFacets(userId.toString(), {});
      
      res.json({
        success: true,
        data: { facets }
      });
    } catch (error) {
      console.error('Get facets error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get facets',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Get search history
  async getSearchHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { limit = 10 } = req.query;
      
      const history = await SearchAnalytics.find({ 
        userId: new mongoose.Types.ObjectId(userId),
        query: { $ne: '' }
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .select('query type resultCount timestamp')
      .lean();
      
      res.json({
        success: true,
        data: { history }
      });
    } catch (error) {
      console.error('Get search history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get search history',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Get trending searches
  async getTrendingSearches(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;
      
      const trending = await PopularSearchTerm.find({})
        .sort({ searchCount: -1, lastSearched: -1 })
        .limit(parseInt(limit as string))
        .select('term searchCount lastSearched')
        .lean();
      
      res.json({
        success: true,
        data: { trending }
      });
    } catch (error) {
      console.error('Get trending searches error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trending searches',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Get search analytics
  async getSearchAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { days = 30 } = req.query;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));
      
      const analytics = await SearchAnalytics.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              type: '$type'
            },
            searchCount: { $sum: 1 },
            avgExecutionTime: { $avg: '$executionTime' },
            avgResultCount: { $avg: '$resultCount' }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);
      
      res.json({
        success: true,
        data: { analytics }
      });
    } catch (error) {
      console.error('Get search analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get search analytics',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Track search result click
  async trackSearchClick(req: Request, res: Response): Promise<void> {
    try {
      const { searchId, resultId, resultType, position } = req.body;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      
      // Find the search record and update it with click information
      const searchRecord = await SearchAnalytics.findOne({
        _id: new mongoose.Types.ObjectId(searchId),
        userId: new mongoose.Types.ObjectId(userId)
      });
      
      if (searchRecord && searchRecord.selectedResults) {
        searchRecord.selectedResults.push({
          resultId,
          resultType,
          position,
          clickedAt: new Date()
        });
        await searchRecord.save();
      }
      
      res.json({
        success: true,
        message: 'Click tracked successfully'
      });
    } catch (error) {
      console.error('Track search click error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track click',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }
}

export const searchController = new SearchController();
