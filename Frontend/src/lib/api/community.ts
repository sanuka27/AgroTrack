/**
 * Community API Module
 * 
 * Handles all community-related API operations:
 * - Get posts
 * - Create, update, delete posts
 * - Like/unlike posts and comments
 * - Add, edit, delete comments
 * - Reply to comments
 * 
 * Backend Endpoints: /api/community
 * MongoDB Collections: posts, comments, likes
 */

import api, { getErrorMessage } from '../api';

/**
 * Post type
 */
export interface Post {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  plantId?: {
    _id: string;
    name: string;
    species: string;
    imageUrl?: string;
  };
  title: string;
  content: string;
  images?: string[];
  category?: 'tip' | 'question' | 'showcase' | 'problem' | 'discussion';
  tags?: string[];
  isPublic: boolean;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean; // User has liked this post
}

/**
 * Comment type
 */
export interface Comment {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  postId: string;
  content: string;
  images?: string[];
  parentCommentId?: string;
  likes: number;
  replies: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean; // User has liked this comment
}

interface PostsListResponse {
  success: boolean;
  data: {
    posts: Post[];
    total?: number;
    page?: number;
    limit?: number;
  };
}

interface PostResponse {
  success: boolean;
  data: {
    post: Post;
  };
}

interface CommentsListResponse {
  success: boolean;
  data: {
    comments: Comment[];
    total?: number;
  };
}

interface CommentResponse {
  success: boolean;
  data: {
    comment: Comment;
  };
}

/**
 * Community API Service
 */
export const communityApi = {
  // ==================== POSTS ====================

  /**
   * Get all community posts
   * 
   * GET /api/community/posts
   * 
   * @param params - Query parameters
   * @returns Promise with array of posts
   */
  async getPosts(params?: {
    category?: string;
    tags?: string[];
    search?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    posts: Post[];
    total: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.tags) params.tags.forEach(tag => queryParams.append('tags', tag));
      if (params?.search) queryParams.append('search', params.search);
      if (params?.userId) queryParams.append('userId', params.userId);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await api.get<PostsListResponse>(`/community/posts?${queryParams.toString()}`);
      return {
        posts: response.data.data.posts,
        total: response.data.data.total || 0,
      };
    } catch (error) {
      console.error('Error fetching posts:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get a single post by ID
   * 
   * GET /api/community/posts/:id
   * 
   * @param id - Post ID
   * @returns Promise with post data
   */
  async getPost(id: string): Promise<Post> {
    try {
      const response = await api.get<PostResponse>(`/community/posts/${id}`);
      return response.data.data.post;
    } catch (error) {
      console.error('Error fetching post:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Create a new post
   * 
   * POST /api/community/posts
   * 
   * @param postData - Post data with optional images
   * @returns Promise with created post
   */
  async createPost(postData: {
    title: string;
    content: string;
    plantId?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    images?: File[];
  }): Promise<Post> {
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', postData.title);
      formData.append('content', postData.content);
      if (postData.plantId) formData.append('plantId', postData.plantId);
      if (postData.category) formData.append('category', postData.category);
      if (postData.isPublic !== undefined) formData.append('isPublic', postData.isPublic.toString());
      
      // Add tags
      if (postData.tags) {
        postData.tags.forEach(tag => formData.append('tags[]', tag));
      }
      
      // Add images
      if (postData.images) {
        postData.images.forEach((image, index) => {
          formData.append(`images`, image);
        });
      }

      const response = await api.post<PostResponse>('/community/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data.post;
    } catch (error) {
      console.error('Error creating post:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update an existing post
   * 
   * PUT /api/community/posts/:id
   * 
   * @param id - Post ID
   * @param postData - Updated post data
   * @returns Promise with updated post
   */
  async updatePost(
    id: string,
    postData: Partial<{
      title: string;
      content: string;
      category: string;
      tags: string[];
      isPublic: boolean;
    }>
  ): Promise<Post> {
    try {
      const response = await api.put<PostResponse>(`/community/posts/${id}`, postData);
      return response.data.data.post;
    } catch (error) {
      console.error('Error updating post:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete a post
   * 
   * DELETE /api/community/posts/:id
   * 
   * @param id - Post ID
   * @returns Promise that resolves when post is deleted
   */
  async deletePost(id: string): Promise<void> {
    try {
      await api.delete(`/community/posts/${id}`);
    } catch (error) {
      console.error('Error deleting post:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Like a post
   * 
   * POST /api/community/posts/:id/like
   * 
   * @param id - Post ID
   * @returns Promise with updated post
   */
  async likePost(id: string): Promise<Post> {
    try {
      const response = await api.post<PostResponse>(`/community/posts/${id}/like`);
      return response.data.data.post;
    } catch (error) {
      console.error('Error liking post:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Unlike a post
   * 
   * DELETE /api/community/posts/:id/like
   * 
   * @param id - Post ID
   * @returns Promise with updated post
   */
  async unlikePost(id: string): Promise<Post> {
    try {
      const response = await api.delete<PostResponse>(`/community/posts/${id}/like`);
      return response.data.data.post;
    } catch (error) {
      console.error('Error unliking post:', getErrorMessage(error));
      throw error;
    }
  },

  // ==================== COMMENTS ====================

  /**
   * Get comments for a post
   * 
   * GET /api/community/posts/:postId/comments
   * 
   * @param postId - Post ID
   * @returns Promise with array of comments
   */
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const response = await api.get<CommentsListResponse>(`/community/posts/${postId}/comments`);
      return response.data.data.comments;
    } catch (error) {
      console.error('Error fetching comments:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Add a comment to a post
   * 
   * POST /api/community/posts/:postId/comments
   * 
   * @param postId - Post ID
   * @param commentData - Comment data
   * @returns Promise with created comment
   */
  async createComment(
    postId: string,
    commentData: {
      content: string;
      parentCommentId?: string;
      images?: File[];
    }
  ): Promise<Comment> {
    try {
      const formData = new FormData();
      formData.append('content', commentData.content);
      if (commentData.parentCommentId) {
        formData.append('parentCommentId', commentData.parentCommentId);
      }
      
      // Add images if any
      if (commentData.images) {
        commentData.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await api.post<CommentResponse>(
        `/community/posts/${postId}/comments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.data.comment;
    } catch (error) {
      console.error('Error creating comment:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update a comment
   * 
   * PUT /api/community/comments/:id
   * 
   * @param id - Comment ID
   * @param content - Updated comment content
   * @returns Promise with updated comment
   */
  async updateComment(id: string, content: string): Promise<Comment> {
    try {
      const response = await api.put<CommentResponse>(`/community/comments/${id}`, { content });
      return response.data.data.comment;
    } catch (error) {
      console.error('Error updating comment:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete a comment
   * 
   * DELETE /api/community/comments/:id
   * 
   * @param id - Comment ID
   * @returns Promise that resolves when comment is deleted
   */
  async deleteComment(id: string): Promise<void> {
    try {
      await api.delete(`/community/comments/${id}`);
    } catch (error) {
      console.error('Error deleting comment:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Like a comment
   * 
   * POST /api/community/comments/:id/like
   * 
   * @param id - Comment ID
   * @returns Promise with updated comment
   */
  async likeComment(id: string): Promise<Comment> {
    try {
      const response = await api.post<CommentResponse>(`/community/comments/${id}/like`);
      return response.data.data.comment;
    } catch (error) {
      console.error('Error liking comment:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Unlike a comment
   * 
   * DELETE /api/community/comments/:id/like
   * 
   * @param id - Comment ID
   * @returns Promise with updated comment
   */
  async unlikeComment(id: string): Promise<Comment> {
    try {
      const response = await api.delete<CommentResponse>(`/community/comments/${id}/like`);
      return response.data.data.comment;
    } catch (error) {
      console.error('Error unliking comment:', getErrorMessage(error));
      throw error;
    }
  },
};
