import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RoleGuard, PermissionCheck, GuestPrompt } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { mockApi } from "@/lib/mockApi";
import type { CommunityPost, CommunityStats, TrendingTopic } from "@/types/api";
import { Users, MessageCircle, Heart, TrendingUp, Shield, Flag, Trash2, Edit, Sparkles, ArrowUp, ArrowDown, Minus, MessageSquare } from "lucide-react";

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCommunityData = async () => {
      try {
        setLoading(true);
        const [postsResponse, statsData, topicsData] = await Promise.all([
          mockApi.community.getPosts({ limit: 10 }),
          mockApi.community.getStats(),
          mockApi.community.getTrendingTopics(),
        ]);

        setPosts(postsResponse.posts);
        setStats(statsData);
        setTrendingTopics(topicsData);
      } catch (error) {
        console.error('Error loading community data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCommunityData();
  }, []);

  const handleLikePost = async (postId: string) => {
    try {
      await mockApi.community.likePost(postId);
      // Update local state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? { ...post, likes: post.likes + 1 } : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-3 h-3 text-green-500" />;
      case 'down': return <ArrowDown className="w-3 h-3 text-red-500" />;
      case 'stable': return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Community</h1>
            <p className="text-muted-foreground">Connect with fellow plant enthusiasts</p>
          </div>
          <div className="mt-3 md:mt-0 flex space-x-2">
            <RoleGuard roles={['user', 'admin']}>
              <Button variant="default">
                <MessageCircle className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </RoleGuard>
            <Button variant="outline" asChild>
              <Link to="/plant-analysis">Plant Analysis</Link>
            </Button>
          </div>
        </div>

        {/* Guest User Compelling Showcase */}
        <PermissionCheck permission="post_content" fallback={
          <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🌱 Join Our Thriving Plant Community!</h2>
              <p className="text-gray-600 text-lg">Connect with 2,847+ passionate gardeners sharing tips, success stories, and growing together</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Ask & Get Answers</h3>
                  <p className="text-sm text-gray-600">Post your plant questions and get expert advice from experienced gardeners within hours</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Share Success Stories</h3>
                  <p className="text-sm text-gray-600">Showcase your plant transformations and inspire others with your growing journey</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Find Local Gardeners</h3>
                  <p className="text-sm text-gray-600">Connect with gardeners in your area for plant swaps, local tips, and friendship</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                <Link to="/register">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Join Community - Free Forever!
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/login">Already a member? Sign In</Link>
              </Button>
            </div>
          </div>
        }>
          <div></div>
        </PermissionCheck>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="text-xl font-bold text-green-800">{stats?.totalMembers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Posts Today</p>
                  <p className="text-xl font-bold text-blue-600">{stats?.postsToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Likes</p>
                  <p className="text-xl font-bold text-red-600">{stats?.totalLikes || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                  <p className="text-xl font-bold text-purple-600">{stats?.activeUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Community Feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-green-800">Community Feed</CardTitle>
                    <CardDescription>Latest posts from the community</CardDescription>
                  </div>
                  <RoleGuard roles={['admin']}>
                    <Button variant="outline" size="sm">
                      <Shield className="w-4 h-4 mr-2" />
                      Moderate
                    </Button>
                  </RoleGuard>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading community posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <Card key={post._id} className={`${post.isPinned ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {post.author.role === 'admin' && <Shield className="w-3 h-3 text-orange-500" />}
                              <span className="font-medium text-sm">{post.author.name}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              post.author.role === 'admin' 
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {post.author.role === 'admin' ? 'Moderator' : 'Member'}
                            </span>
                            {post.isPinned && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                Pinned
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <RoleGuard roles={['admin']}>
                              <Button variant="ghost" size="sm">
                                <Flag className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </RoleGuard>
                            <span className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</span>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{post.content}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleLikePost(post._id)}
                            >
                              <Heart className="w-4 h-4 mr-1" />
                              {post.likes}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              {post.comments}
                            </Button>
                          </div>
                          
                          <RoleGuard roles={['user', 'admin']}>
                            <Button variant="ghost" size="sm">
                              Reply
                            </Button>
                          </RoleGuard>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800">Trending Topics</CardTitle>
                <CardDescription>Popular discussions this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  {trendingTopics.map((topic, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span>#{topic.tag}</span>
                        {getTrendIcon(topic.trend)}
                      </div>
                      <span className="text-muted-foreground">{topic.postCount} posts</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-green-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <RoleGuard roles={['user', 'admin']}>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Discussion
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="w-4 h-4 mr-2" />
                    Share Plant Photo
                  </Button>
                </RoleGuard>
                
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Find Local Gardeners
                </Button>
                
                <RoleGuard roles={['admin']}>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                </RoleGuard>
              </CardContent>
            </Card>

            {/* User Status */}
            {user && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-green-800">Your Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Role:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        user.role === 'admin' 
                          ? 'bg-orange-100 text-orange-700'
                          : user.role === 'user'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Posts:</span>
                      <span className="text-muted-foreground">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reputation:</span>
                      <span className="text-muted-foreground">847</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Community;
