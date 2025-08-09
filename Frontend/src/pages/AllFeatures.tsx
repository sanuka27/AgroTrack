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
    title: "AI-Powered Plant Care",
    description: "Advanced artificial intelligence to help you care for your plants",
    features: [
      {
        icon: Brain,
        title: "Smart Plant Identification",
        description: "Instantly identify any plant species using advanced AI image recognition technology.",
        example: "Take a photo of an unknown plant in your garden, and our AI will identify it as 'Monstera Deliciosa' with 98% confidence, providing immediate care instructions.",
        benefits: ["99% accuracy rate", "Supports 10,000+ species", "Works offline"]
      },
      {
        icon: Camera,
        title: "Disease Detection",
        description: "Early detection of plant diseases and pests through image analysis.",
        example: "Upload a photo of yellowing leaves, and the AI detects 'Early Blight' in tomatoes, suggesting organic treatment options and prevention methods.",
        benefits: ["Early intervention", "Reduce plant loss", "Organic solutions"]
      },
      {
        icon: Droplets,
        title: "Watering Intelligence",
        description: "AI-driven watering recommendations based on plant type, season, and environment.",
        example: "Your fiddle leaf fig gets a notification: 'Water in 2 days based on humidity levels and recent rainfall in your area.'",
        benefits: ["Prevent overwatering", "Seasonal adjustments", "Location-aware"]
      }
    ]
  },
  {
    title: "Smart Monitoring & Analytics",
    description: "Comprehensive tracking and insights for optimal plant health",
    features: [
      {
        icon: BarChart3,
        title: "Plant Health Analytics",
        description: "Track growth patterns, health metrics, and care history with detailed analytics.",
        example: "View a 6-month growth chart showing your snake plant grew 15% faster after adjusting light exposure based on our recommendations.",
        benefits: ["Growth tracking", "Health trends", "Care optimization"]
      },
      {
        icon: Calendar,
        title: "Smart Care Calendar",
        description: "Personalized care schedules that adapt to your plants' specific needs.",
        example: "Your calendar shows: 'Fertilize roses (due today)', 'Repot monstera (next week)', 'Check for aphids on herbs (tomorrow)'.",
        benefits: ["Never miss care tasks", "Seasonal reminders", "Custom schedules"]
      },
      {
        icon: Bell,
        title: "Intelligent Notifications",
        description: "Timely alerts for watering, fertilizing, repotting, and seasonal care.",
        example: "Get a push notification: 'Your orchid needs watering - soil moisture is at 20%. Ideal time is now based on humidity forecast.'",
        benefits: ["Perfect timing", "Weather-aware", "Customizable alerts"]
      }
    ]
  },
  {
    title: "Community & Learning",
    description: "Connect with fellow gardeners and expand your plant knowledge",
    features: [
      {
        icon: Users,
        title: "Expert Community",
        description: "Connect with master gardeners, botanists, and plant enthusiasts worldwide.",
        example: "Post a question about your struggling orchid and receive advice from a certified orchid specialist within 30 minutes.",
        benefits: ["Expert advice", "Global community", "Fast responses"]
      },
      {
        icon: Share2,
        title: "Plant Journey Sharing",
        description: "Document and share your plant's growth journey with beautiful timelines.",
        example: "Share a time-lapse of your avocado growing from seed to 3-foot plant over 8 months, inspiring 200+ fellow gardeners.",
        benefits: ["Visual progress", "Inspire others", "Build community"]
      },
      {
        icon: BookOpen,
        title: "Learning Hub",
        description: "Access comprehensive plant care guides, tutorials, and expert articles.",
        example: "Learn advanced propagation techniques through our step-by-step video series, with 50+ plant-specific guides.",
        benefits: ["Expert knowledge", "Video tutorials", "Regular updates"]
      }
    ]
  },
  {
    title: "Advanced Tools",
    description: "Professional-grade tools for serious plant enthusiasts",
    features: [
      {
        icon: Search,
        title: "Plant Database",
        description: "Access detailed information on 50,000+ plant species with care requirements.",
        example: "Search 'low light houseplants' and discover 200+ species with difficulty ratings, care guides, and user reviews.",
        benefits: ["Comprehensive database", "Detailed care info", "User reviews"]
      },
      {
        icon: Sun,
        title: "Environmental Tracking",
        description: "Monitor light, humidity, temperature, and other environmental factors.",
        example: "Track that your snake plant gets 6 hours of indirect sunlight daily, with humidity averaging 45% - perfect conditions.",
        benefits: ["Optimal placement", "Environmental insights", "Health correlation"]
      },
      {
        icon: Smartphone,
        title: "Mobile Integration",
        description: "Full-featured mobile app with offline capabilities and camera integration.",
        example: "Use your phone to scan a QR code on plant pots for instant care reminders, even without internet connection.",
        benefits: ["Works anywhere", "Instant access", "Camera features"]
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

              {/* Features Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {category.features.map((feature, featureIndex) => (
                  <Card key={featureIndex} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
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
            <div className="text-3xl font-bold text-primary">50K+</div>
            <div className="text-sm text-muted-foreground">Plant Species</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">99%</div>
            <div className="text-sm text-muted-foreground">AI Accuracy</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground">Smart Monitoring</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">100K+</div>
            <div className="text-sm text-muted-foreground">Happy Gardeners</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AllFeatures;
