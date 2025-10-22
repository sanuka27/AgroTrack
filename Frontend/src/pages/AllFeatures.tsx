import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  ArrowLeft, 
  Brain, 
  Camera, 
  Users, 
  BarChart3, 
  Bell, 
  Leaf,
  Droplets,
  Sun,
  Bug,
  Calendar,
  MessageSquare,
  Share2,
  Smartphone,
  Cloud,
  Shield,
  Zap,
  Heart,
  Search,
  BookOpen
} from "lucide-react";

const featureCategories = [
  {
    title: "Plant Management",
    description: "Comprehensive tools to organize and track your plant collection",
    features: [
      {
        icon: Leaf,
        title: "Plant Library",
        description: "Create and manage your personal plant collection with detailed information for each plant.",
        example: "Add your Monstera with custom care instructions, location, photos, and track its growth over time with organized notes.",
        benefits: ["Unlimited plants", "Custom care plans", "Photo galleries"]
      },

      {
        icon: Bell,
        title: "Smart Reminders",
        description: "Never forget to care for your plants with customizable reminders and notifications.",
        example: "Get reminded to water your succulents every 2 weeks or fertilize your tomatoes monthly during growing season.",
        benefits: ["Customizable schedules", "Push notifications", "Plant-specific alerts"]
      }
    ]
  },
  {
    title: "AI-Powered Features",
    description: "Leverage artificial intelligence for expert plant care assistance",
    features: [
      {
        icon: Brain,
        title: "AI Chat Assistant",
        description: "Get instant answers to plant care questions powered by Google Gemini AI.",
        example: "Ask 'Why are my tomato leaves turning yellow?' and receive detailed diagnosis with treatment recommendations.",
        benefits: ["24/7 availability", "Expert knowledge", "Personalized advice"]
      },
      {
        icon: Camera,
        title: "Disease Detection",
        description: "Upload plant photos to detect diseases, pests, and nutrient deficiencies with AI analysis.",
        example: "Take a photo of brown spots on your rose leaves to identify fungal infection and get organic treatment options.",
        benefits: ["Early detection", "Treatment plans", "Prevention tips"]
      }
    ]
  },
  {
    title: "Analytics & Insights",
    description: "Data-driven insights to optimize your gardening success",
    features: [
      {
        icon: BarChart3,
        title: "Plant Health Analytics",
        description: "Visualize plant health trends, care patterns, and collection statistics over time.",
        example: "View dashboard showing 85% of your plants are healthy, with charts tracking watering frequency and growth milestones.",
        benefits: ["Visual dashboards", "Health tracking", "Care optimization"]
      },

    ]
  },
  {
    title: "Community & Sharing",
    description: "Connect with fellow gardeners and share your plant journey",
    features: [
      {
        icon: Users,
        title: "Community Forum",
        description: "Post questions, share experiences, and learn from a community of plant enthusiasts.",
        example: "Share photos of your blooming orchids, ask for propagation tips, and vote on helpful community posts.",
        benefits: ["Q&A support", "Photo sharing", "Expert members"]
      },
      {
        icon: MessageSquare,
        title: "Comments & Discussions",
        description: "Engage in conversations with threaded comments and community interactions.",
        example: "Join discussions about indoor gardening techniques and get feedback on your plant setup from experienced growers.",
        benefits: ["Active discussions", "Knowledge sharing", "Helpful community"]
      },
      {
        icon: Share2,
        title: "Social Features",
        description: "Vote on helpful posts, report issues, and contribute to community knowledge.",
        example: "Upvote helpful advice about pest control and help build a knowledge base for other gardeners.",
        benefits: ["Voting system", "Quality content", "Community moderation"]
      }
    ]
  },
  {
    title: "Data & Privacy",
    description: "Full control over your data with powerful export and privacy tools",
    features: [
      {
        icon: Shield,
        title: "Data Export & Import",
        description: "Export your entire plant collection and data in JSON or CSV format for backup or migration.",
        example: "Download all your plant data including photos, care logs, and notes as a backup or to share with others.",
        benefits: ["JSON & CSV formats", "Complete backups", "Easy migration"]
      },
      {
        icon: Search,
        title: "Advanced Search",
        description: "Quickly find plants, posts, and care logs with powerful search and filtering.",
        example: "Search for 'succulents needing water' or filter community posts by category to find exactly what you need.",
        benefits: ["Fast results", "Smart filters", "Cross-collection search"]
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
            <div className="text-sm text-muted-foreground">Powered Assistant</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground">Plant Tracking</div>
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
