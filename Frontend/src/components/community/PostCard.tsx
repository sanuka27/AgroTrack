import { Link } from 'react-router-dom';
import { MessageSquare, CheckCircle, Calendar, User, Leaf } from 'lucide-react';
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
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_hsl(120_100%_25%_/_0.08)] border border-green-100 p-5 hover:shadow-[0_4px_16px_hsl(120_100%_25%_/_0.12)] transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex gap-4">
        {/* Vote buttons */}
        <VoteButton
          postId={post._id}
          initialScore={(post as any).voteScore ?? (post as any).score ?? 0}
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
              <h2 className="text-lg font-semibold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-green-700 group-hover:to-emerald-700 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {post.title}
              </h2>
              {post.isSolved && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" aria-label="Solved" />
                  <span className="text-xs font-medium text-green-700">Solved</span>
                </div>
              )}
            </div>
          </Link>

          {/* Body preview */}
          <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap line-clamp-3 leading-relaxed">
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
                  className="h-24 w-auto rounded-xl object-cover border-2 border-green-100 shadow-sm"
                />
              ))}
              {post.images.length > 3 && (
                <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 flex items-center justify-center text-sm font-medium text-green-700">
                  +{post.images.length - 3} more
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
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {/* Author */}
            <div className="flex items-center gap-2">
              {post.author?.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  className="w-6 h-6 rounded-full border-2 border-green-200"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center border border-green-200">
                  <User className="w-3.5 h-3.5 text-green-700" />
                </div>
              )}
              <span className="font-medium text-gray-800">
                {post.author?.name || 'Unknown'}
              </span>
              {post.author?.role === 'mod' && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200">
                  MOD
                </span>
              )}
              {post.author?.role === 'admin' && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-lg text-xs font-semibold border border-orange-200">
                  ADMIN
                </span>
              )}
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1.5 text-gray-500">
              <Leaf className="w-3.5 h-3.5 text-green-600" />
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>

            {/* Comments */}
            <Link
              to={`/community/${post._id}#comments`}
              className="flex items-center gap-1.5 hover:text-green-700 transition-colors group"
            >
              <div className="p-1 rounded-lg group-hover:bg-green-50 transition-colors">
                <MessageSquare className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium">{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
