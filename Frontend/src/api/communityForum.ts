import {
  CreatePostData,
  CreateCommentData,
  VoteData,
  ReportData,
  PostsResponse,
  PostResponse,
  CommentsResponse,
  VoteResponse,
  TrendingTagsResponse,
} from '../types/community';
import api from '../lib/api'; // Use centralized api instance with auth interceptor

export const communityForumApi = {
  // Posts
  getPosts: async (params: {
    sort?: 'top' | 'latest';
    tag?: string;
    cursor?: string;
    limit?: number;
    includeTeaser?: boolean;
  }): Promise<PostsResponse> => {
    const response = await api.get('/community/forum/posts', { params });
    return response.data;
  },

  getPostById: async (postId: string): Promise<PostResponse> => {
    const response = await api.get(`/community/forum/posts/${postId}`);
    return response.data;
  },

  createPost: async (data: CreatePostData) => {
    const response = await api.post('/community/forum/posts', data);
    return response.data;
  },

  // Voting
  votePost: async (postId: string, data: VoteData): Promise<VoteResponse> => {
    const response = await api.post(`/community/forum/posts/${postId}/vote`, data);
    return response.data;
  },

  // Comments
  getComments: async (postId: string, params: { cursor?: string; limit?: number }): Promise<CommentsResponse> => {
    const response = await api.get(`/community/forum/posts/${postId}/comments`, { params });
    return response.data;
  },

  createComment: async (postId: string, data: CreateCommentData) => {
    const response = await api.post(`/community/forum/posts/${postId}/comments`, data);
    return response.data;
  },

  // Tags
  getTrendingTags: async (params: { days?: number; limit?: number }): Promise<TrendingTagsResponse> => {
    const response = await api.get('/community/forum/tags/trending', { params });
    return response.data;
  },

  // Reports
  createReport: async (data: ReportData) => {
    const response = await api.post('/community/forum/reports', data);
    return response.data;
  },

  // Solved status
  toggleSolved: async (postId: string, isSolved: boolean) => {
    const response = await api.patch(`/community/forum/posts/${postId}/solved`, { isSolved });
    return response.data;
  },

  // User profile
  getOrCreateProfile: async (data: { name?: string; avatarUrl?: string }) => {
    const response = await api.post('/community/forum/users/profile', data);
    return response.data;
  },
};
