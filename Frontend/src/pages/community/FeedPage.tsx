import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Clock, Filter, MessageSquare, Sparkles, Lock } from 'lucide-react';
import { communityForumApi } from '../../api/communityForum';
import { CommunityPost } from '../../types/community';
import { useAuth } from '../../hooks/useAuth';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import PostCard from '../../components/community/PostCard';
import TrendingTags from '../../components/community/TrendingTags';

export default function FeedPage() {
  const { user, role, isAuthenticated } = useAuth();
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

  // Reset and load on filter change
  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    
    // Load posts immediately
    const loadInitialPosts = async () => {
      try {
        setLoading(true);
        const response = await communityForumApi.getPosts({
          sort,
          tag,
          cursor: undefined,
          limit: 20,
          includeTeaser: !isAuthenticated,
        });

        setPosts(response.data.posts);
        // If the client is not authenticated, don't allow loading more posts beyond the teaser
        if (!isAuthenticated) {
          setHasMore(false);
          setCursor(null);
        } else {
          setHasMore(response.data.hasMore);
          setCursor(response.data.nextCursor);
        }
  setIsGuest(response.data.isGuest);
  setIsTeaser(response.data.isTeaser);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialPosts();
  }, [sort, tag, user, isAuthenticated]);

  // Infinite scroll observer
  useEffect(() => {
  // Do not enable infinite scroll for guests — prevent loading hidden posts when they scroll
  if (!isAuthenticated) return;
  if (!observerTarget.current || loading || !hasMore || !cursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
              if (entries[0].isIntersecting && !loading && hasMore && cursor) {
          // Load more posts
          const loadMorePosts = async () => {
            try {
              setLoading(true);
              const response = await communityForumApi.getPosts({
                sort,
                tag,
                cursor,
                limit: 20,
                includeTeaser: !isAuthenticated,
              });

              setPosts((prev) => [...prev, ...response.data.posts]);
              setHasMore(response.data.hasMore);
              setCursor(response.data.nextCursor);
            } catch (error) {
              console.error('Failed to load more posts:', error);
            } finally {
              setLoading(false);
            }
          };
          
          loadMorePosts();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [loading, hasMore, cursor, sort, tag, user, isAuthenticated]);

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Header />
      
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row justify-center gap-6">
          {/* Main feed (centered) */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-3xl">
            {/* Header with nature-inspired gradient */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_hsl(120_100%_25%_/_0.08)] border border-green-100 p-6 mb-6 relative overflow-hidden">
              {/* Background gradient accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full blur-3xl opacity-30 -z-10" />
              
              <div className="flex items-center justify-between mb-4 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-[0_0_24px_hsl(85_100%_44%_/_0.3)]">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent">
                    Community Forum
                  </h1>
                </div>
                {user && (
                  <button
                    onClick={() => navigate('/community/new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 shadow-[0_4px_16px_hsl(120_100%_25%_/_0.12)] hover:shadow-[0_8px_32px_hsl(120_100%_25%_/_0.16)] hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    New Post
                  </button>
                )}
              </div>

              {/* Filters with AgroTrack styling */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-green-50 rounded-xl p-1.5 border border-green-200">
                  <button
                    onClick={() => handleSortChange('top')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      sort === 'top'
                        ? 'bg-white text-green-800 shadow-[0_2px_8px_hsl(120_100%_25%_/_0.08)] border border-green-200'
                        : 'text-green-700 hover:text-green-900 hover:bg-green-100'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Top
                  </button>
                  <button
                    onClick={() => handleSortChange('latest')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      sort === 'latest'
                        ? 'bg-white text-green-800 shadow-[0_2px_8px_hsl(120_100%_25%_/_0.08)] border border-green-200'
                        : 'text-green-700 hover:text-green-900 hover:bg-green-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Latest
                  </button>
                </div>

                {tag && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 text-green-800 rounded-lg text-sm border border-green-300">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">#{tag}</span>
                    <button
                      onClick={() => handleTagFilter(tag)}
                      className="ml-1 hover:text-green-900 text-lg font-semibold"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {!user && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-800">
                    <button
                        onClick={() => navigate('/login')}
                      className="font-semibold underline hover:no-underline hover:text-green-900 transition-colors"
                    >
                      Sign in
                    </button>
                    {' '}to join the conversation, share your experiences, and vote on posts.
                  </p>
                </div>
              )}

              {user && (
                <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-green-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span><strong>Keyboard shortcuts:</strong> C = new post, J/K = navigate, A/Z = vote, Enter = open</span>
                  </p>
                </div>
              )}
            </div>

            {/* Posts */}
            <div className="space-y-4 relative">
              {posts.length === 0 && !loading ? (
                <div className="bg-white rounded-2xl shadow-[0_2px_8px_hsl(120_100%_25%_/_0.08)] border border-green-100 p-16 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 text-lg">
                    {tag ? `No posts found with tag #${tag}` : 'No posts yet. Be the first to share your gardening experience!'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Top 3 posts (fully visible) */}
                  {posts.slice(0, 3).map((post, index) => (
                    <div key={post._id}>
                      <div
                        ref={(el) => (postRefs.current[index] = el)}
                        className={`transition-all duration-300 ${
                          selectedPostIndex === index ? 'ring-2 ring-green-500 rounded-2xl shadow-[0_0_24px_hsl(85_100%_44%_/_0.3)]' : ''
                        }`}
                      >
                        <PostCard post={post} onVoteChange={handleVoteChange} />
                      </div>
                    </div>
                  ))}

                  {/* Teaser card shown to guests after top 3 */}
                  {!isAuthenticated && (
                    <div className="bg-white rounded-2xl shadow-[0_8px_32px_hsl(120_100%_25%_/_0.16)] border-2 border-green-300 p-8 mb-4 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full blur-3xl opacity-40 -z-10" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-50 to-emerald-50 rounded-full blur-2xl opacity-50 -z-10" />
                      
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-[0_0_24px_hsl(85_100%_44%_/_0.3)] mx-auto mb-4 flex items-center justify-center">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                        
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent mb-3">
                          Want to see more?
                        </h3>
                        
                        <p className="text-gray-700 mb-6 leading-relaxed">
                          Sign in to view all community posts, share your gardening experiences, vote on topics, and join the conversation!
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_4px_16px_hsl(120_100%_25%_/_0.12)] hover:shadow-[0_8px_32px_hsl(120_100%_25%_/_0.16)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Sign In
                          </button>
                          <button
                            onClick={() => navigate('/signup')}
                            className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 rounded-xl font-semibold transition-all duration-300 border border-gray-300 hover:shadow-sm"
                          >
                            Sign Up
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Remaining posts (faded for guests) */}
                  {posts.slice(3).map((post, i) => {
                    const idx = i + 3;
                    return (
                      <div key={post._id}>
                        <div
                          ref={(el) => (postRefs.current[idx] = el)}
                          className={`transition-all duration-300 ${
                            selectedPostIndex === idx ? 'ring-2 ring-green-500 rounded-2xl shadow-[0_0_24px_hsl(85_100%_44%_/_0.3)]' : ''
                          } ${(!isAuthenticated) ? 'opacity-30 blur-sm' : ''}`}
                        >
                          <PostCard post={post} onVoteChange={handleVoteChange} />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Loading indicator with nature theme */}
              {loading && (
                <div className="flex flex-col items-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-green-200 border-t-green-600"></div>
                  <p className="mt-3 text-sm text-green-700">Loading posts...</p>
                </div>
              )}

              {/* Infinite scroll trigger */}
              {hasMore && !loading && <div ref={observerTarget} className="h-4" />}
            </div>
            </div>
          </div>

          {/* Sidebar (fixed width on large screens) */}
          <div className="hidden lg:block w-80">
            <div className="sticky top-24">
              <TrendingTags onTagClick={handleTagFilter} activeTag={tag} />
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
