import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Plant } from '../models/Plant';
import { CommunityPost } from '../models/CommunityPost';

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
  type: 'plant' | 'post';
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
      
      // care-log and reminder searches are not available in this deployment
      
      if (!type || type === 'post') {
        const postResults = await this.searchPosts(userId.toString(), query as string, filters);
        allResults.push(...postResults);
      }

      // Sort results by relevance or other criteria
      this.sortResults(allResults, sortBy as string, sortOrder as string);

      // Apply pagination
      const paginatedResults = allResults.slice(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 20));

      // Generate suggestions and facets
  const suggestions: string[] = [];
  const facets = await this.calculateFacets(userId.toString(), filters);

      const executionTime = Date.now() - startTime;

      // Track search analytics
      // Search analytics disabled in this deployment

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
  // care log search removed

  // Search reminders
  // reminder search removed

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
    
    const posts = await CommunityPost.find(mongoQuery)
      .populate('authorId', 'username')
      .limit(filters.limit || 10)
      .lean();
    
    return posts.map((post: any) => ({
      id: post._id.toString(),
      type: 'post' as const,
      title: post.title,
      description: (post.body || '').substring(0, 200) + '...',
      imageUrl: post.images?.[0]?.url,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      relevance: this.calculateRelevance(query, post.title + ' ' + (post.body || '')),
      metadata: {
        author: (post.authorId as any)?.username,
        score: post.score || 0,
        commentsCount: post.commentsCount || 0
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
  // suggestions feature simplified/disabled
  private async generateSuggestions(_query: string, _userId: string): Promise<string[]> { return []; }

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
    const [plantCount] = await Promise.all([
      Plant.countDocuments({ userId: userObjectId })
    ]);
    
    return {
      categories: categoryFacets.map(f => ({ name: f._id, count: f.count })),
      types: [
        { name: 'plant', count: plantCount },
        { name: 'post', count: 0 }
      ],
      authors: [], // Not applicable for personal data
      dateRanges: [] // Could be implemented based on date ranges
    };
  }

  // Track search analytics
  // analytics disabled
  private async trackSearchAnalytics(): Promise<void> { return; }

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
  async getSearchHistory(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Search history is not available in this deployment.'
    });
  }

  // Old implementation (disabled)
  async getSearchHistoryOld(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { limit = 10 } = req.query;
      
      const history: any[] = [];
      
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
      
      const trending: any[] = [];
      
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
  async getSearchAnalytics(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Search analytics are not available in this deployment.'
    });
  }

  // Track search result click
  async trackSearchClick(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'Search analytics tracking is not available in this deployment.'
    });
  }
}

export const searchController = new SearchController();
