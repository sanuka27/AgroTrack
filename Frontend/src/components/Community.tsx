import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  TrendingUp,
  Users,
  ArrowRight,
  ArrowLeft,
  Leaf,
  Bug
} from "lucide-react";
import { communityForumApi } from '../api/communityForum';
import { CommunityPost } from '../types/community';
import { formatDistanceToNow } from 'date-fns';

// We'll fetch recent posts from the API; limit to 3 for this block
 
const POSTS_LIMIT = 3;

const communityStats = [
  { label: "Active Members", value: "12,500+", icon: Users },
  { label: "Posts This Week", value: "1,240", icon: MessageSquare },
  { label: "Problems Solved", value: "8,900+", icon: TrendingUp },
  { label: "Success Stories", value: "450+", icon: Heart }
];

export function Community() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Scroll helpers — scroll by one card width (+ gap) in the given direction
  const scrollByCard = (direction: 'next' | 'prev') => {
    const container = containerRef.current;
    if (!container) return;
    const firstChild = container.children[0] as HTMLElement | undefined;
    if (!firstChild) return;
    const style = window.getComputedStyle(container);
    // gap may be in columnGap or gap depending on browser
    const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
    const cardWidth = Math.ceil(firstChild.getBoundingClientRect().width);
    const delta = (cardWidth + gap) * (direction === 'next' ? 1 : -1);
    container.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handlePrev = () => scrollByCard('prev');
  const handleNext = () => scrollByCard('next');

  // Track whether we can scroll prev/next to toggle button disabled state
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const check = () => {
      setCanScrollPrev(container.scrollLeft > 0);
      setCanScrollNext(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
    };
    check();
    container.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      container.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [posts, loading]);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await communityForumApi.getPosts({ limit: POSTS_LIMIT, sort: 'top' });
        if (!mounted) return;
        // communityForumApi returns the posts under response.data.posts (PostsResponse)
        setPosts(response.data?.posts || []);
      } catch (err: any) {
        console.error('Failed to load community posts', err);
        if (mounted) setError(err?.message || 'Failed to load posts');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => { mounted = false; };
  }, []);

  return (
    <section className="py-16 lg:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full text-sm font-medium">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-semibold">Community Powered</span>
          </div>
          
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
            Join Our Growing
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Community</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with thousands of passionate gardeners. Share your successes, 
            get help with challenges, and learn from experienced plant parents.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {communityStats.map((stat, index) => (
            <Card key={index} className="text-center border-border/50 hover:shadow-medium transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Posts */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-foreground">Recent Community Posts</h3>
            <Button variant="outline" size="sm">
              View All Posts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="relative">
            {/* Navigation arrows (desktop) */}
            <button
              aria-label="Previous posts"
              className={`hidden lg:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-card border border-border rounded-full shadow-sm hover:shadow-md z-20 ml-2 ${!canScrollPrev ? 'opacity-40 pointer-events-none' : ''}`}
              onClick={handlePrev}
              aria-disabled={!canScrollPrev}
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>

            <div ref={containerRef} id="recent-posts-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-6 overflow-x-auto scroll-smooth">
              {loading ? (
                // show skeletons when loading
                Array.from({ length: POSTS_LIMIT }).map((_, i) => (
                  <Card key={`loading-${i}`} className="animate-pulse bg-card rounded-lg p-6" />
                ))
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : (
                posts.map((post) => {
                  const authorName = post.author?.name || 'Unknown';
                  const avatar = post.author?.avatarUrl || '/placeholder.svg';
                  const initials = (post.author?.name || authorName).split(' ').map(n=>n[0]).slice(0,2).join('');
                  const title = post.title || '';
                  const content = (post.bodyMarkdown || '').replace(/\n/g, ' ');
                  const shortContent = content.length > 120 ? content.slice(0, 120).trimEnd() + '…' : content;
                  const tags = post.tags || [];
                  const likes = post.voteScore ?? 0;
                  const comments = post.commentCount ?? 0;
                  const timeAgo = post.createdAt ? `${formatDistanceToNow(new Date(post.createdAt))} ago` : '';

                  return (
                    <Card key={post._id} className="group hover:shadow-medium transition-all duration-300 border-border/50 hover:border-primary/20 cursor-pointer lg:min-w-[320px] flex-shrink-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={avatar} alt={authorName} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground text-sm">{authorName}</p>
                              <p className="text-xs text-muted-foreground">{timeAgo}</p>
                            </div>
                          </div>
                          {post.isSolved && (
                            <Badge variant="secondary" className="bg-vibrant/10 text-vibrant-foreground">
                              Solved
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div>
                          <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                            {title}
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            {shortContent}
                          </CardDescription>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag: string, tagIndex: number) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag.includes('disease') && <Bug className="w-3 h-3 mr-1" />}
                              {tag.includes('herb') && <Leaf className="w-3 h-3 mr-1" />}
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <button className="flex items-center space-x-1 hover:text-primary transition-colors cursor-pointer transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.98]">
                              <Heart className="w-4 h-4" />
                              <span>{likes}</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-primary transition-colors cursor-pointer transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.98]">
                              <MessageSquare className="w-4 h-4" />
                              <span>{comments}</span>
                            </button>
                          </div>
                          <button className="text-muted-foreground hover:text-primary transition-colors cursor-pointer transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.98]">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            <button
              aria-label="Next posts"
              className={`hidden lg:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-card border border-border rounded-full shadow-sm hover:shadow-md z-20 mr-2 ${!canScrollNext ? 'opacity-40 pointer-events-none' : ''}`}
              onClick={handleNext}
              aria-disabled={!canScrollNext}
            >
              <ArrowRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-background rounded-2xl p-8 border border-border/50 shadow-soft">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to Connect with Fellow Gardeners?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Join our vibrant community today and get instant access to thousands of 
            gardening tips, plant care advice, and success stories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="group">
              Join Community
              <Users className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
            </Button>
            <Button variant="outline" size="lg">
              Browse Posts
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}