import { Link } from 'react-router-dom';
import { MessageSquare, CheckCircle, Calendar, User } from 'lucide-react';
import { CommunityPost } from '../../types/community';
import VoteButton from './VoteButton';
import HashtagChips from './HashtagChips.tsx';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: CommunityPost;
  truncateBody?: boolean;
  onVoteChange?: (postId: string, newScore: number, newVote: 1 | -1 | null) => void;
}

export default function PostCard({ post, truncateBody = true, onVoteChange }: PostCardProps) {
  const displayBody = truncateBody && post.bodyMarkdown.length > 300
    ? post.bodyMarkdown.slice(0, 300) + '...'
    : post.bodyMarkdown;

  const handleVoteChange = (newScore: number, newVote: 1 | -1 | null) => {
    onVoteChange?.(post._id, newScore, newVote);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Vote buttons */}
        <VoteButton
          postId={post._id}
          initialScore={post.voteScore}
          initialUserVote={post.userVote}
          onVoteChange={handleVoteChange}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <Link
            to={`/community/${post._id}`}
            className="block group"
          >
            <div className="flex items-start gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                {post.title}
              </h2>
              {post.isSolved && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" aria-label="Solved" />
              )}
            </div>
          </Link>

          {/* Body preview */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap line-clamp-3">
            {displayBody}
          </p>

          {/* Images preview */}
          {post.images && post.images.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {post.images.slice(0, 3).map((img, idx) => (
                <img
                  key={idx}
                  src={img.url}
                  alt=""
                  className="h-20 w-auto rounded object-cover"
                />
              ))}
              {post.images.length > 3 && (
                <div className="h-20 w-20 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm text-gray-500">
                  +{post.images.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-3">
              <HashtagChips tags={post.tags} maxDisplay={5} />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {/* Author */}
            <div className="flex items-center gap-1">
              {post.author?.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="font-medium">
                {post.author?.name || 'Unknown'}
              </span>
              {post.author?.role === 'mod' && (
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                  MOD
                </span>
              )}
              {post.author?.role === 'admin' && (
                <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                  ADMIN
                </span>
              )}
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>

            {/* Comments */}
            <Link
              to={`/community/${post._id}#comments`}
              className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentCount}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
