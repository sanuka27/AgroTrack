import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  Lightbulb,
  Users,
  Bell,
  Heart,
  Sparkles
} from 'lucide-react';

const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    document.title = 'Blog Article Coming Soon - AgroTrack Smart Gardening';
    
    // Focus on main content for accessibility
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.focus();
    }
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: 'In-Depth Articles',
      description: 'Comprehensive guides covering every aspect of plant care'
    },
    {
      icon: Lightbulb,
      title: 'Expert Tips',
      description: 'Professional advice from experienced horticulturists'
    },
    {
      icon: Users,
      title: 'Community Stories',
      description: 'Real experiences shared by fellow plant enthusiasts'
    },
    {
      icon: Clock,
      title: 'Regular Updates',
      description: 'Fresh content published weekly to keep you growing'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8" tabIndex={-1}>
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600" aria-label="Breadcrumb">
          <Link to="/blog" className="hover:text-green-600 transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-gray-900">{slug?.replace(/-/g, ' ')}</span>
        </nav>

        {/* Coming Soon Hero */}
        <section className="text-center space-y-6 py-12" role="banner">
          <div className="space-y-4">
            <Badge className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Coming Soon
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Our Blog is Growing!
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're working hard to bring you amazing plant care content. 
              Our blog articles will be available soon with expert tips, guides, and community stories.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white font-medium">
              <Link to="/blog">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Blog
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link to="/guides">
                Browse Plant Guides
              </Link>
            </Button>
          </div>
        </section>

        {/* What to Expect */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What to Expect from Our Blog
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our upcoming blog will be your go-to resource for all things plant care, 
              featuring content designed to help you grow as a gardener.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <feature.icon className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Current Article Placeholder */}
        {slug && (
          <section className="space-y-6">
            <Card className="rounded-2xl ring-1 ring-gray-200 shadow-sm p-8">
              <div className="text-center space-y-4">
                <div className="bg-gray-100 rounded-lg p-6 max-w-2xl mx-auto">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    "{slug.replace(/-/g, ' ')}"
                  </h3>
                  <p className="text-gray-600">
                    This article is currently being written by our expert team. 
                    Check back soon for detailed insights on this topic!
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Newsletter Signup */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Bell className="w-6 h-6 text-blue-300" />
              <h2 className="text-3xl font-bold">
                Get Notified When We Launch
              </h2>
            </div>
            <p className="text-blue-100 max-w-2xl mx-auto text-lg">
              Be the first to know when our blog goes live. We'll send you a notification 
              with our best plant care tips and exclusive launch content.
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email for updates"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                disabled
              />
              <Button 
                disabled
                className="bg-white text-blue-600 hover:bg-gray-100 font-medium px-6 py-3 rounded-xl cursor-not-allowed opacity-50"
              >
                Notify Me
              </Button>
            </div>
            <p className="text-blue-200 text-sm mt-2 text-center">
              Email notifications coming soon!
            </p>
          </div>
        </section>

        {/* Explore Other Features */}
        <section className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Explore AgroTrack While You Wait
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Discover our existing features and start your plant care journey today.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link to="/guides">
                Plant Guides
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link to="/how-it-works">
                How It Works
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link to="/community">
                Community
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetailPage;
