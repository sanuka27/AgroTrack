import { useState } from 'react';
import { User, Calendar, Flag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { CommunityComment } from '../../types/community';
import { communityForumApi } from '../../api/communityForum';
import { useAuth } from '../../hooks/useAuth';
import ReportModal from './ReportModal';

interface CommentThreadProps {
  postId: string;
  comments: CommunityComment[];
  onCommentAdded: (comment: CommunityComment) => void;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export default function CommentThread({
  postId,
  comments,
  onCommentAdded,
  hasMore,
  loading,
  onLoadMore,
}: CommentThreadProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reportTarget, setReportTarget] = useState<{ id: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to comment');
      return;
    }

    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const response = await communityForumApi.createComment(postId, {
        bodyMarkdown: newComment.trim(),
      });
      
      onCommentAdded(response.data.comment);
      setNewComment('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* New Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-card-foreground resize-none"
            placeholder="Add a comment... (Markdown supported)"
            rows={3}
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-muted text-primary-foreground rounded-lg transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-card border border-border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            <a href="/signin" className="font-medium underline hover:no-underline">
              Sign in
            </a>
            {' '}to join the discussion
          </p>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="bg-card rounded-lg p-4 border border-border"
            >
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-sm">
                  {comment.author?.avatarUrl ? (
                    <img
                      src={comment.author.avatarUrl}
                      alt={comment.author.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="font-medium text-foreground">
                    {comment.author?.name || 'Unknown'}
                  </span>
                  {comment.author?.role === 'mod' && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      MOD
                    </span>
                  )}
                  {comment.author?.role === 'admin' && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                      ADMIN
                    </span>
                  )}
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Report button */}
                  {user && (
                    <button
                      onClick={() => setReportTarget({ id: comment._id })}
                      className="p-1 text-muted-foreground hover:text-red-600 rounded transition-colors"
                      aria-label="Report comment"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
              </div>

              {/* Comment Body */}
              {comment.isDeleted ? (
                <p className="text-sm text-muted-foreground italic">
                  [Comment deleted]
                </p>
              ) : (
                <div className="prose prose-sm max-w-none text-card-foreground">
                  <ReactMarkdown>{comment.bodyMarkdown}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-primary hover:text-primary-hover hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Comments'}
          </button>
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          targetType="comment"
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
