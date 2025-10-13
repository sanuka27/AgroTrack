import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, User, MessageSquare, CheckCircle, Flag, ArrowLeft, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { communityForumApi } from '../../api/communityForum';
import { CommunityPost, CommunityComment } from '../../types/community';
import { useAuth } from '../../hooks/useAuth';
import VoteButton from '../../components/community/VoteButton';
import HashtagChips from '../../components/community/HashtagChips';
import CommentThread from '../../components/community/CommentThread.tsx';
import ReportModal from '../../components/community/ReportModal.tsx';

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!postId) return;

    const loadPost = async () => {
      try {
        setLoading(true);
        const response = await communityForumApi.getPostById(postId);
        setPost(response.data.post);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  useEffect(() => {
    if (!postId) return;

    const loadComments = async () => {
      try {
        setCommentsLoading(true);
        const response = await communityForumApi.getComments(postId, {
          limit: 20,
        });
        setComments(response.data.comments);
        setHasMoreComments(response.data.hasMore);
        setCommentsCursor(response.data.nextCursor);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    };

    loadComments();
  }, [postId]);

  const handleVoteChange = (newScore: number, newVote: 1 | -1 | null) => {
    if (!post) return;
    setPost({ ...post, voteScore: newScore, userVote: newVote });
  };

  const handleToggleSolved = async () => {
    if (!post || !postId) return;

    const canToggle = user?.id === post.authorUid || 
                      post.author?.role === 'mod' || 
                      post.author?.role === 'admin';

    if (!canToggle) return;

    try {
      await communityForumApi.toggleSolved(postId, !post.isSolved);
      setPost({ ...post, isSolved: !post.isSolved });
    } catch (err) {
      console.error('Failed to toggle solved status:', err);
    }
  };

  const handleCommentAdded = (newComment: CommunityComment) => {
    setComments((prev) => [newComment, ...prev]);
    if (post) {
      setPost({ ...post, commentCount: post.commentCount + 1 });
    }
  };

  const loadMoreComments = () => {
    if (!commentsLoading && hasMoreComments && postId) {
      const loadMore = async () => {
        try {
          setCommentsLoading(true);
          const response = await communityForumApi.getComments(postId, {
            cursor: commentsCursor || undefined,
            limit: 20,
          });
          setComments((prev) => [...prev, ...response.data.comments]);
          setHasMoreComments(response.data.hasMore);
          setCommentsCursor(response.data.nextCursor);
        } catch (err) {
          console.error('Failed to load more comments:', err);
        } finally {
          setCommentsLoading(false);
        }
      };
      loadMore();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background text-foreground py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Post Not Found
            </h2>
            <p className="text-red-600 mb-4">
              {error || 'The post you are looking for does not exist or has been deleted.'}
            </p>
            <button
              onClick={() => navigate('/community')}
              className="flex items-center gap-2 text-red-700 hover:text-red-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canToggleSolved = user?.id === post.authorUid || 
                          post.author?.role === 'mod' || 
                          post.author?.role === 'admin';

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community
        </button>

        {/* Post */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
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
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {post.title}
                    </h1>
                    {post.isSolved && (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" aria-label="Solved" />
                    )}
                  </div>

                  {/* Author & meta */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {post.author?.avatarUrl ? (
                        <img
                          src={post.author.avatarUrl}
                          alt={post.author.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                      <span className="font-medium text-foreground">
                        {post.author?.name || 'Unknown'}
                      </span>
                      {post.author?.role === 'mod' && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          MOD
                        </span>
                      )}
                      {post.author?.role === 'admin' && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                          ADMIN
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentCount} comments</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {canToggleSolved && (
                    <button
                      onClick={handleToggleSolved}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        post.isSolved
                          ? 'bg-muted text-foreground hover:bg-muted/90'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {post.isSolved ? 'Mark Unsolved' : 'Mark Solved'}
                    </button>
                  )}
                  {user && (
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="p-2 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-card-foreground/5 transition-colors"
                      aria-label="Report post"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mb-4">
                  <HashtagChips tags={post.tags} />
                </div>
              )}

              {/* Body */}
              <div className="prose max-w-none mb-4 text-card-foreground">
                <ReactMarkdown>{post.bodyMarkdown}</ReactMarkdown>
              </div>

              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {post.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={`Post image ${idx + 1}`}
                      className="rounded-lg object-cover w-full h-48 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(img.url, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div id="comments" className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">
              Comments ({post.commentCount})
            </h2>
          </div>

          <CommentThread
            postId={post._id}
            comments={comments}
            onCommentAdded={handleCommentAdded}
            hasMore={hasMoreComments}
            loading={commentsLoading}
            onLoadMore={loadMoreComments}
          />
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          targetType="post"
          targetId={post._id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
