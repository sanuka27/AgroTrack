import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Users, Brain } from "lucide-react";
import heroPlant from "@/assets/hero-plant.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-subtle">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(120_100%_25%/0.1),transparent_70%)]"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-vibrant/10 text-vibrant-foreground px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Plant Care</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Your Smart
                <span className="bg-gradient-hero bg-clip-text text-transparent"> Gardening</span>
                <br />
                Assistant
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Transform your gardening journey with AI-powered plant care, personalized reminders, and a thriving community of plant lovers. Never lose a plant again.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="group">
                Start Growing Today
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button variant="outline" size="lg" className="group">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Plants Tracked</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold text-primary">5K+</div>
                <div className="text-sm text-muted-foreground">Happy Gardeners</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">Plant Survival Rate</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <img
                src={heroPlant}
                alt="Hands gently holding a growing plant"
                className="w-full h-[500px] object-cover"
              />
              
              {/* Floating Cards */}
              <div className="absolute top-6 left-6 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-medium">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-foreground">AI Monitoring</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Plant health: Excellent</p>
              </div>

              <div className="absolute bottom-6 right-6 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-medium">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Community</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">12 new tips today</p>
              </div>

              <div className="absolute top-1/2 -left-4 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-medium transform -translate-y-1/2">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">Smart Care</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Water in 2 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}