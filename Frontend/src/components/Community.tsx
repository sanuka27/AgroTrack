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
  Leaf,
  Bug
} from "lucide-react";

const communityPosts = [
  {
    id: 1,
    author: {
      name: "Sarah Chen",
      avatar: "/placeholder.svg",
      initials: "SC"
    },
    title: "My tomato plant recovery journey 🍅",
    content: "After following the AI's diagnosis for leaf curl disease, my tomatoes are thriving again! Here's what worked...",
    tags: ["tomatoes", "disease-recovery", "success-story"],
    likes: 47,
    comments: 12,
    timeAgo: "2 hours ago",
    trending: true
  },
  {
    id: 2,
    author: {
      name: "Mike Rodriguez",
      avatar: "/placeholder.svg",
      initials: "MR"
    },
    title: "Space-saving herb garden setup for apartments",
    content: "Living in a small apartment doesn't mean you can't have fresh herbs! Check out my vertical garden solution...",
    tags: ["herbs", "apartment-gardening", "space-saving"],
    likes: 89,
    comments: 23,
    timeAgo: "5 hours ago",
    trending: false
  },
  {
    id: 3,
    author: {
      name: "Emma Thompson",
      avatar: "/placeholder.svg",
      initials: "ET"
    },
    title: "Help! White spots on my fiddle leaf fig 😰",
    content: "I noticed these white spots appearing on my fiddle leaf fig's leaves. Has anyone experienced this before?",
    tags: ["fiddle-leaf-fig", "help-needed", "plant-disease"],
    likes: 15,
    comments: 31,
    timeAgo: "1 day ago",
    trending: false
  }
];

const communityStats = [
  { label: "Active Members", value: "12,500+", icon: Users },
  { label: "Posts This Week", value: "1,240", icon: MessageSquare },
  { label: "Problems Solved", value: "8,900+", icon: TrendingUp },
  { label: "Success Stories", value: "450+", icon: Heart }
];

export function Community() {
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {communityPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-medium transition-all duration-300 border-border/50 hover:border-primary/20 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author.avatar} alt={post.author.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {post.author.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground text-sm">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
                      </div>
                    </div>
                    {post.trending && (
                      <Badge variant="secondary" className="bg-vibrant/10 text-vibrant-foreground">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground line-clamp-3">
                      {post.content}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag, tagIndex) => (
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
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-primary transition-colors cursor-pointer transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.98]">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </button>
                    </div>
                    <button className="text-muted-foreground hover:text-primary transition-colors cursor-pointer transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.98]">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
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