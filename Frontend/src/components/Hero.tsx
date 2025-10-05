import React from "react";
import { ArrowRight, Sparkles, Users, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import WatchDemo from "./WatchDemo";
import heroPlant from "@/assets/hero-plant.jpg";

export function Hero() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStartGrowing = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleDemoStart = () => {
    handleStartGrowing();
  };
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(120_100%_25%/0.1),transparent_70%)]"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Plant Care</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Smart
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Gardening</span>
                <br />
                Assistant
              </h1>
              
              <p className="text-lg text-gray-600 max-w-lg">
                Transform your gardening journey with AI-powered plant care, personalized reminders, and a thriving community of plant lovers. Never lose a plant again.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Start Growing Today Button */}
              <button
                onClick={handleStartGrowing}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 hover:scale-105 hover:shadow-lg transform transition-all duration-200 ease-out group"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start Growing Today'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {/* Watch Demo Component */}
              <WatchDemo onStart={handleDemoStart} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold text-green-600">10K+</div>
                <div className="text-sm text-gray-500">Plants Tracked</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold text-green-600">5K+</div>
                <div className="text-sm text-gray-500">Happy Gardeners</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-sm text-gray-500">Plant Survival Rate</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={heroPlant}
                alt="Hands gently holding a growing plant"
                className="w-full h-[500px] object-cover"
              />
              
              {/* Floating Cards */}
              <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900">AI Monitoring</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Plant health: Excellent</p>
              </div>

              <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Community</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">12 new tips today</p>
              </div>

              <div className="absolute top-1/2 -left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg transform -translate-y-1/2">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Smart Care</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Water in 2 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}