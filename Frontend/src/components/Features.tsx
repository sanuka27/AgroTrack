import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Brain, 
  Camera, 
  Bell, 
  Users, 
  BarChart3, 
  Shield,
  Smartphone,
  Zap,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Plant Diagnosis",
    description: "Upload photos for instant disease detection and personalized treatment recommendations powered by advanced AI.",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    icon: Camera,
    title: "Smart Photo Recognition",
    description: "Identify plant species, track growth progress, and get care insights through intelligent image analysis.",
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    icon: Bell,
    title: "Adaptive Reminders",
    description: "Receive personalized watering, fertilizing, and care notifications that adapt to your plant's needs.",
    color: "text-vibrant",
    bgColor: "bg-vibrant/10"
  },
  {
    icon: Users,
    title: "Community Forum",
    description: "Connect with fellow gardeners, share experiences, ask questions, and discover new growing techniques.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: BarChart3,
    title: "Growth Analytics",
    description: "Track your plants' progress with detailed analytics, growth charts, and care history insights.",
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    icon: Shield,
    title: "Expert-Backed Advice",
    description: "Access curated plant care knowledge from horticultural experts and experienced gardeners.",
    color: "text-accent",
    bgColor: "bg-accent/10"
  }
];

const highlights = [
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Optimized for on-the-go plant care"
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "Instant notifications and live community feeds"
  },
  {
    icon: Brain,
    title: "Learning AI",
    description: "Gets smarter with every interaction"
  }
];

export function Features() {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-semibold">Powerful Features</span>
          </div>
          
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
            Everything You Need to
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Succeed</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From AI-powered diagnostics to community wisdom, AgroTrack provides all the tools 
            you need to become a confident and successful gardener.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-medium transition-all duration-300 border-border/50 hover:border-primary/20">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Highlights Bar */}
        <div className="bg-gradient-subtle rounded-2xl p-8 border border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <highlight.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{highlight.title}</h4>
                  <p className="text-sm text-muted-foreground">{highlight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="hero" size="lg" className="group" asChild>
            <Link to="/features">
              Explore All Features
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}