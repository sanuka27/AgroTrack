export interface CommunityUser {
  uid: string;
  name: string;
  avatarUrl?: string;
  role: 'user' | 'mod' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface PostImage {
  url: string;
  width: number;
  height: number;
}

export interface CommunityPost {
  _id: string;
  authorUid: string;
  title: string;
  bodyMarkdown: string;
  images: PostImage[];
  tags: string[];
  voteScore: number;
  commentCount: number;
  isSolved: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    uid: string;
    name: string;
    avatarUrl?: string;
    role: 'user' | 'mod' | 'admin';
  };
  userVote?: 1 | -1 | null;
}

export interface CommunityComment {
  _id: string;
  postId: string;
  authorUid: string;
  bodyMarkdown: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    uid: string;
    name: string;
    avatarUrl?: string;
    role: 'user' | 'mod' | 'admin';
  };
}

export interface TrendingTag {
  tag: string;
  count: number;
  totalVotes: number;
}

export interface CreatePostData {
  title: string;
  bodyMarkdown: string;
  images?: PostImage[];
}

export interface CreateCommentData {
  bodyMarkdown: string;
}

export interface VoteData {
  value: 1 | -1;
}

export interface ReportData {
  targetType: 'post' | 'comment';
  targetId: string;
  reason: 'spam' | 'harassment' | 'inappropriate-content' | 'misinformation' | 'off-topic' | 'duplicate' | 'other';
  description?: string;
}

export interface PostsResponse {
  success: boolean;
  data: {
    posts: CommunityPost[];
    hasMore: boolean;
    nextCursor: string | null;
    isGuest: boolean;
    isTeaser: boolean;
  };
}

export interface PostResponse {
  success: boolean;
  data: {
    post: CommunityPost;
    userVote: 1 | -1 | null;
  };
}

export interface CommentsResponse {
  success: boolean;
  data: {
    comments: CommunityComment[];
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface VoteResponse {
  success: boolean;
  data: {
    voteScore: number;
    userVote: 1 | -1 | null;
  };
}

export interface TrendingTagsResponse {
  success: boolean;
  data: {
    tags: TrendingTag[];
  };
}
