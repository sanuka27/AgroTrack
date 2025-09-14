import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Search, AlertCircle, Leaf, MessageSquare, BookOpen } from 'lucide-react';

const NotFoundPage = () => {
  useEffect(() => {
    document.title = '404 - Page Not Found - AgroTrack';
  }, []);

  const popularPages = [
    { name: 'My Plants', href: '/plants', icon: Leaf, description: 'Manage your plant collection' },
    { name: 'AI Assistant', href: '/assistant', icon: MessageSquare, description: 'Get plant care advice' },
    { name: 'Plant Care Guides', href: '/guides', icon: BookOpen, description: 'Learn plant care basics' },
    { name: 'How It Works', href: '/how-it-works', icon: Search, description: 'Discover AgroTrack features' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* 404 Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-foreground">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Oops! The page you're looking for seems to have wandered off like a plant seeking sunlight. 
              Let's get you back to growing! 🌱
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="w-5 h-5 mr-2" />
                Return to Home
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild>
              <Link to="/help">
                <Search className="w-5 h-5 mr-2" />
                Visit Help Center
              </Link>
            </Button>
          </div>
          
          {/* Popular Pages */}
          <div className="pt-8">
            <h3 className="text-xl font-semibold text-foreground mb-6">Popular Pages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularPages.map((page) => (
                <Card key={page.name} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <page.icon className="w-5 h-5 text-green-600" />
                      </div>
                      <CardTitle className="text-base">{page.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="mb-3">{page.description}</CardDescription>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link to={page.href}>Visit Page</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Additional Help */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Still can't find what you're looking for?{" "}
              <Link to="/contact" className="text-primary hover:text-primary-hover font-medium">
                Contact our support team
              </Link>{" "}
              for assistance.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
