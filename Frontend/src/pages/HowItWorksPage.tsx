import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Leaf, 
  Camera, 
  Bell, 
  BarChart3, 
  ArrowRight, 
  CheckCircle,
  Brain,
  Users
} from 'lucide-react';

const HowItWorksPage = () => {
  useEffect(() => {
    document.title = 'How It Works - AgroTrack Smart Gardening';
    
    // Focus on main content for accessibility
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.focus();
    }
  }, []);

  const steps = [
    {
      step: 1,
      icon: Leaf,
      title: "Add Your Plants",
      description: "Upload photos and details of your plants. Our AI instantly identifies species and provides personalized care recommendations.",
      features: ["AI plant identification", "Custom care profiles", "Photo gallery tracking"],
      color: "from-green-500 to-emerald-600"
    },
    {
      step: 2,
      icon: Bell,
      title: "Track Care Activities",
      description: "Get smart reminders for watering, fertilizing, and pruning. Log your care activities and monitor plant health over time.",
      features: ["Smart care reminders", "Activity logging", "Health monitoring"],
      color: "from-blue-500 to-cyan-600"
    },
    {
      step: 3,
      icon: BarChart3,
      title: "Get Insights & Grow",
      description: "Analyze growth patterns, receive AI-powered advice, and connect with a community of fellow plant enthusiasts.",
      features: ["Growth analytics", "AI recommendations", "Community support"],
      color: "from-purple-500 to-pink-600"
    }
  ];

  const benefits = [
    { icon: Brain, text: "AI-powered plant identification and care advice" },
    { icon: Bell, text: "Never miss watering or fertilizing again" },
    { icon: Camera, text: "Track growth with photo timelines" },
    { icon: Users, text: "Learn from experienced gardeners" },
    { icon: BarChart3, text: "Data-driven insights for better results" },
    { icon: CheckCircle, text: "95% plant survival rate for our users" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-12" tabIndex={-1}>
        {/* Hero Section */}
        <section className="text-center space-y-6" role="banner">
          <div className="space-y-4">
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm font-medium">
              Simple • Smart • Effective
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              How AgroTrack Works
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Transform your gardening journey with our AI-powered plant care system. 
              From identification to harvest, we guide you every step of the way.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
              <Link to="/register">
                Start Your Garden Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/features">
                View All Features
              </Link>
            </Button>
          </div>
        </section>

        {/* Steps Section */}
        <section className="space-y-8" role="main">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Three Simple Steps to Plant Success
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our streamlined process makes plant care accessible to everyone, 
              from beginners to experienced gardeners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={step.step} className="rounded-2xl ring-1 ring-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 relative">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mb-4`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="text-xs font-bold">
                      Step {step.step}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {step.description}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    {step.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center justify-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                
                {/* Connection Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-green-50 rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Choose AgroTrack?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of successful gardeners who've transformed their plant care with our proven system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3 bg-white rounded-lg p-4 shadow-sm">
                <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-700 text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-white space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">
              Ready to Start Your Plant Journey?
            </h2>
            <p className="text-green-100 max-w-2xl mx-auto text-lg">
              Join over 10,000 plant enthusiasts who trust AgroTrack for healthier, happier plants.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              <Link to="/register">
                Get Started Free
                <Leaf className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/80 text-white bg-white/10 hover:bg-white hover:text-green-600 backdrop-blur-sm">
              <Link to="/contact">
                Contact Support
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-6 text-green-100 text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;
