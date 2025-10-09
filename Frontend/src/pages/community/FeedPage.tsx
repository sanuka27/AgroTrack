import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Clock, Filter } from 'lucide-react';
import { communityForumApi } from '../../api/communityForum';
import { CommunityPost } from '../../types/community';
import { useAuth } from '../../hooks/useAuth';
import PostCard from '../../components/community/PostCard';
import TeaserOverlay from '../../components/community/TeaserOverlay';
import TrendingTags from '../../components/community/TrendingTags';

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isTeaser, setIsTeaser] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(-1);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const postRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Get filters from URL
  const sort = (searchParams.get('sort') || 'top') as 'top' | 'latest';
  const tag = searchParams.get('tag') || undefined;

  // Load posts
  const loadPosts = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const response = await communityForumApi.getPosts({
        sort,
        tag,
        cursor: reset ? undefined : cursor || undefined,
        limit: 20,
        includeTeaser: !user,
      });

      const newPosts = response.data.posts;
      
      setPosts((prev) => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(response.data.hasMore);
      setCursor(response.data.nextCursor);
      setIsGuest(response.data.isGuest);
      setIsTeaser(response.data.isTeaser);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }, [sort, tag, cursor, user]);

  // Reset and load on filter change
  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, tag, user]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadPosts(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [loading, hasMore, loadPosts]);

  // Keyboard shortcuts (j/k navigation, a/z voting, c for new post)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'c':
          if (user) {
            navigate('/community/new');
          }
          break;
        case 'j': // Next post
          e.preventDefault();
          setSelectedPostIndex((prev) => Math.min(prev + 1, posts.length - 1));
          break;
        case 'k': // Previous post
          e.preventDefault();
          setSelectedPostIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'a': // Upvote
          if (user && selectedPostIndex >= 0) {
            e.preventDefault();
            const post = posts[selectedPostIndex];
            // Trigger upvote (will be handled by VoteButton component)
          }
          break;
        case 'z': // Downvote
          if (user && selectedPostIndex >= 0) {
            e.preventDefault();
            const post = posts[selectedPostIndex];
            // Trigger downvote (will be handled by VoteButton component)
          }
          break;
        case 'Enter': // Open post
          if (selectedPostIndex >= 0) {
            e.preventDefault();
            navigate(`/community/${posts[selectedPostIndex]._id}`);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, user, posts, selectedPostIndex]);

  // Scroll selected post into view
  useEffect(() => {
    if (selectedPostIndex >= 0 && postRefs.current[selectedPostIndex]) {
      postRefs.current[selectedPostIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedPostIndex]);

  const handleVoteChange = (postId: string, newScore: number, newVote: 1 | -1 | null) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, voteScore: newScore, userVote: newVote }
          : post
      )
    );
  };

  const handleSortChange = (newSort: 'top' | 'latest') => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('sort', newSort);
      return params;
    });
  };

  const handleTagFilter = (selectedTag: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (selectedTag === tag) {
        params.delete('tag');
      } else {
        params.set('tag', selectedTag);
      }
      return params;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main feed */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Community Forum
                </h1>
                {user && (
                  <button
                    onClick={() => navigate('/community/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Post
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => handleSortChange('top')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      sort === 'top'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Top
                  </button>
                  <button
                    onClick={() => handleSortChange('latest')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      sort === 'latest'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Latest
                  </button>
                </div>

                {tag && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                    <Filter className="w-4 h-4" />
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleTagFilter(tag)}
                      className="ml-1 hover:text-green-900 dark:hover:text-green-100"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {!user && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <button
                      onClick={() => navigate('/signin')}
                      className="font-medium underline hover:no-underline"
                    >
                      Sign in
                    </button>
                    {' '}to create posts, vote, and comment.
                  </p>
                </div>
              )}

              {user && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Keyboard shortcuts:</strong> C = new post, J/K = navigate, A/Z = vote, Enter = open
                  </p>
                </div>
              )}
            </div>

            {/* Posts */}
            <div className="space-y-4 relative">
              {posts.length === 0 && !loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {tag ? `No posts found with tag #${tag}` : 'No posts yet. Be the first to post!'}
                  </p>
                </div>
              ) : (
                posts.map((post, index) => (
                  <div
                    key={post._id}
                    ref={(el) => (postRefs.current[index] = el)}
                    className={`transition-all ${
                      selectedPostIndex === index ? 'ring-2 ring-green-500 rounded-lg' : ''
                    }`}
                  >
                    <PostCard
                      post={post}
                      onVoteChange={handleVoteChange}
                    />
                  </div>
                ))
              )}

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              )}

              {/* Infinite scroll trigger */}
              {hasMore && !loading && <div ref={observerTarget} className="h-4" />}

              {/* Guest teaser overlay */}
              {isGuest && isTeaser && <TeaserOverlay />}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <TrendingTags onTagClick={handleTagFilter} activeTag={tag} />
          </div>
        </div>
      </div>
    </div>
  );
}
