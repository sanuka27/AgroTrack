import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GeminiLogo } from "@/components/ui/gemini-logo";
import {
  ArrowLeft,
  Brain,
  Camera,
  Users,
  BarChart3,
  Bell,
  Leaf,
  MessageSquare,
  Shield,
  Zap,
  Heart,
  Search,
  Settings,
  Upload,
  TrendingUp,
  Award,
  BookOpen,
  Smartphone
} from "lucide-react";const featureCategories = [
  {
    title: "AI-Powered Plant Care",
    description: "Leverage artificial intelligence for expert plant care assistance",
    features: [
      {
        icon: Camera,
        title: "Disease Detection",
        description: (
          <span className="flex items-center flex-wrap gap-1.5">
            Upload plant photos for instant AI diagnosis
            <span className="inline-flex items-center gap-1 text-xs">
              powered by <GeminiLogo className="h-3.5" />
            </span>
          </span>
        ),
        example: "Take a photo of yellowing leaves to get immediate identification of nutrient deficiencies or pest problems.",
        benefits: ["Instant diagnosis", "Treatment recommendations", "Prevention tips"]
      },
      {
        icon: Brain,
        title: "Smart Recommendations",
        description: (
          <span className="flex items-center flex-wrap gap-1.5">
            Get personalized care tips and treatment suggestions
            <span className="inline-flex items-center gap-1 text-xs">
              powered by <GeminiLogo className="h-3.5" />
            </span>
          </span>
        ),
        example: "Receive tailored watering schedules and fertilization plans based on your plant's specific needs and environment.",
        benefits: ["Personalized advice", "Optimal care plans", "Expert knowledge"]
      },
      {
        icon: Search,
        title: "Plant Identification",
        description: (
          <span className="flex items-center flex-wrap gap-1.5">
            AI-powered plant species recognition and detailed care guides
            <span className="inline-flex items-center gap-1 text-xs">
              powered by <GeminiLogo className="h-3.5" />
            </span>
          </span>
        ),
        example: "Upload a photo of an unknown plant to instantly identify the species and get comprehensive care instructions.",
        benefits: ["Species recognition", "Care guides", "Plant database access"]
      }
    ]
  },
  {
    title: "Plant Management",
    description: "Comprehensive tools to organize and track your plant collection",
    features: [
      {
        icon: Leaf,
        title: "Plant Database",
        description: "Extensive collection of plant species with detailed care information",
        example: "Browse through thousands of plants with complete care guides, growing conditions, and maintenance tips.",
        benefits: ["Extensive database", "Detailed care info", "Search & filter"]
      },
      {
        icon: BarChart3,
        title: "Care Tracking",
        description: "Log watering, fertilizing, and maintenance activities with timestamps",
        example: "Record every watering session, fertilization, and pruning activity to maintain perfect care history.",
        benefits: ["Activity logging", "Care history", "Maintenance tracking"]
      },
      {
        icon: TrendingUp,
        title: "Growth Monitoring",
        description: "Track plant health and growth progress over time with visual indicators",
        example: "Monitor height changes, leaf count, and overall health improvements with photo comparisons and notes.",
        benefits: ["Visual tracking", "Health monitoring", "Growth analytics"]
      },
      {
        icon: Bell,
        title: "Custom Reminders",
        description: "Intelligent notifications for plant care tasks and maintenance schedules",
        example: "Set personalized reminders for watering, fertilizing, repotting, and seasonal care tasks.",
        benefits: ["Smart scheduling", "Custom notifications", "Care automation"]
      }
    ]
  },
  {
    title: "Community & Social",
    description: "Connect with fellow gardeners and share your plant journey",
    features: [
      {
        icon: MessageSquare,
        title: "Discussion Forums",
        description: "Reddit-style community with upvoting and threaded discussions",
        example: "Post questions about plant care, share growing tips, and engage in meaningful discussions with gardeners worldwide.",
        benefits: ["Expert advice", "Knowledge sharing", "Community support"]
      },
      {
        icon: Users,
        title: "Expert Advice",
        description: "Connect with fellow gardeners and plant care specialists",
        example: "Get advice from experienced gardeners, share your successes, and learn from the community's collective knowledge.",
        benefits: ["Expert connections", "Peer learning", "Support network"]
      },
      {
        icon: Upload,
        title: "Plant Sharing",
        description: "Share your garden successes and get feedback from the community",
        example: "Post photos of your blooming plants, share propagation successes, and receive constructive feedback.",
        benefits: ["Photo sharing", "Feedback system", "Inspiration gallery"]
      },
      {
        icon: Award,
        title: "Hashtag System",
        description: "Discover content with trending plant topics and categories",
        example: "Use #SucculentCare or #IndoorGardening to find relevant posts and connect with niche communities.",
        benefits: ["Topic discovery", "Trending content", "Specialized communities"]
      }
    ]
  },
  {
    title: "Analytics & Insights",
    description: "Data-driven insights to optimize your gardening success",
    features: [
      {
        icon: BarChart3,
        title: "Plant Health Dashboard",
        description: "Visual analytics of your garden's performance and health metrics",
        example: "View comprehensive dashboards showing plant health scores, care consistency, and garden performance trends.",
        benefits: ["Visual analytics", "Health metrics", "Performance tracking"]
      },
      {
        icon: BookOpen,
        title: "Care History",
        description: "Detailed logs and trends of plant maintenance and care activities",
        example: "Review chronological care logs, identify patterns, and optimize your plant care routines based on data.",
        benefits: ["Detailed logs", "Trend analysis", "Care optimization"]
      },
      {
        icon: TrendingUp,
        title: "Growth Analytics",
        description: "Monitor plant development and health metrics over time",
        example: "Track growth rates, health improvements, and care effectiveness with detailed analytics and visualizations.",
        benefits: ["Growth tracking", "Health metrics", "Data visualization"]
      },
      {
        icon: Upload,
        title: "Custom Reports",
        description: "Export data for gardening journals and detailed analysis",
        example: "Generate comprehensive reports of your garden's performance, care activities, and plant health for documentation.",
        benefits: ["Data export", "Custom reports", "Gardening journals"]
      }
    ]
  },
  {
    title: "Admin & Moderation",
    description: "Complete platform management and community moderation tools",
    features: [
      {
        icon: Settings,
        title: "Admin Dashboard",
        description: "Complete user and content management system with full oversight",
        example: "Monitor platform usage, manage users, moderate content, and access comprehensive analytics from a centralized dashboard.",
        benefits: ["User management", "Content oversight", "Platform analytics"]
      },
      {
        icon: Shield,
        title: "Moderation Tools",
        description: "Community content moderation and reporting system",
        example: "Review reported posts, moderate discussions, and maintain community standards with powerful moderation tools.",
        benefits: ["Content moderation", "Reporting system", "Community safety"]
      },
      {
        icon: Users,
        title: "User Management",
        description: "Role-based access control and comprehensive user administration",
        example: "Manage user roles, permissions, and access levels while maintaining platform security and user experience.",
        benefits: ["Role management", "Access control", "User administration"]
      },
      {
        icon: BarChart3,
        title: "Analytics Overview",
        description: "Platform-wide usage statistics and performance metrics",
        example: "Access detailed analytics about user engagement, content performance, and platform usage patterns.",
        benefits: ["Usage statistics", "Performance metrics", "Engagement tracking"]
      }
    ]
  }
];

const AllFeatures = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Link>
            </Button>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Complete Feature Overview
            </Badge>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            All <span className="bg-gradient-hero bg-clip-text text-transparent">AgroTrack</span> Features
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover every tool and feature designed to make you a better gardener. 
            From AI-powered plant care to community learning, explore what makes AgroTrack special.
          </p>
        </div>

        {/* Feature Categories */}
        <div className="space-y-20">
          {featureCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-8">
              {/* Category Header */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-3">{category.title}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{category.description}</p>
              </div>

              {/* Features Grid: use 2 columns for categories with exactly 2 features, otherwise 3 */}
              <div className={`grid grid-cols-1 ${category.features.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-8 items-stretch`}>
                {category.features.map((feature, featureIndex) => (
                  <Card key={featureIndex} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                            {feature.title}
                          </CardTitle>
                        </div>
                      </div>
                      <CardDescription className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Example Usage */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2 flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          Example in Action
                        </h4>
                        <p className="text-sm text-green-700 leading-relaxed">
                          {feature.example}
                        </p>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-foreground flex items-center">
                          <Heart className="w-4 h-4 mr-2 text-red-500" />
                          Key Benefits
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {feature.benefits.map((benefit, benefitIndex) => (
                            <Badge key={benefitIndex} variant="secondary" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Getting Started Section */}
        <div className="mt-20 text-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-hero rounded-full">
                <Leaf className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Plant Care?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of gardeners who've already discovered the power of AI-assisted plant care. 
              Start your journey with AgroTrack today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild className="group">
                <Link to="/register">
                  Get Started Free
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/plant-analysis">
                  Try Plant Analysis
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">15+</div>
            <div className="text-sm text-muted-foreground">Core Features</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">AI</div>
            <div className="text-sm text-muted-foreground">Plant Analysis</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">MongoDB</div>
            <div className="text-sm text-muted-foreground">Database</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">Free</div>
            <div className="text-sm text-muted-foreground">Always & Forever</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AllFeatures;
