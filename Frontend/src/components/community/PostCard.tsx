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
    <div className="bg-card rounded-2xl shadow-[0_2px_8px_hsl(120_100%_25%_/_0.08)] border border-border p-5 hover:shadow-[0_4px_16px_hsl(120_100%_25%_/_0.16)] transition-all duration-300 hover:-translate-y-0.5">
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
              <h2 className="text-lg font-semibold text-foreground group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {post.title}
              </h2>
              {post.isSolved && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg flex-shrink-0 border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" aria-label="Solved" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Solved</span>
                </div>
              )}
            </div>
          </Link>

          {/* Body preview */}
          <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap line-clamp-3 leading-relaxed">
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
                  className="h-24 w-auto rounded-xl object-cover border-2 border-border shadow-sm"
                />
              ))}
              {post.images.length > 3 && (
                <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-border flex items-center justify-center text-sm font-medium text-green-700 dark:text-green-300">
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
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {/* Author */}
            <div className="flex items-center gap-2">
              {/* Always show a neutral avatar (initial or icon) instead of user-uploaded image */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 flex items-center justify-center border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-semibold">
                {post.author?.name ? post.author.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5 text-green-700" />}
              </div>
              <span className="font-medium text-foreground">
                {post.author?.name || 'Unknown'}
              </span>
              {post.author?.role === 'mod' && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800">
                  MOD
                </span>
              )}
              {post.author?.role === 'admin' && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-semibold border border-orange-200 dark:border-orange-800">
                  ADMIN
                </span>
              )}
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Leaf className="w-3.5 h-3.5 text-green-600" />
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>

            {/* Comments */}
            <Link
              to={`/community/${post._id}#comments`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
            >
              <div className="p-1 rounded-lg group-hover:bg-muted/50 transition-colors">
                <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-medium text-foreground">{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
