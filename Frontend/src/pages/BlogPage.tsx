import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  Leaf,
  BookOpen,
  Lightbulb,
  Heart,
  Sprout,
  Camera
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  tag: string;
  slug: string;
  image?: string;
}

const BlogPage = () => {
  useEffect(() => {
    document.title = 'Plant Care Blog - AgroTrack Smart Gardening';
    
    // Focus on main content for accessibility
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.focus();
    }
  }, []);

  // Mock blog posts data
  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: '10 Essential Tips for Indoor Plant Care Success',
      excerpt: 'Master the fundamentals of indoor gardening with these proven techniques that will keep your houseplants thriving year-round.',
      date: '2025-09-08',
      readTime: '8 min read',
      author: 'Sarah Green',
      tag: 'Indoor Plants',
      slug: '10-essential-tips-indoor-plant-care'
    },
    {
      id: '2',
      title: 'The Ultimate Guide to Plant Propagation',
      excerpt: 'Learn how to multiply your plant collection through cuttings, division, and seed starting with step-by-step instructions.',
      date: '2025-09-05',
      readTime: '12 min read',
      author: 'Mike Johnson',
      tag: 'Propagation',
      slug: 'ultimate-guide-plant-propagation'
    },
    {
      id: '3',
      title: 'Common Plant Problems and How to Fix Them',
      excerpt: 'Identify and solve the most frequent issues that plague houseplants, from yellowing leaves to pest infestations.',
      date: '2025-09-02',
      readTime: '6 min read',
      author: 'Emma Davis',
      tag: 'Plant Care',
      slug: 'common-plant-problems-solutions'
    },
    {
      id: '4',
      title: 'Creating a Stunning Plant Instagram Feed',
      excerpt: 'Photography tips and tricks to showcase your green friends in the best light and grow your plant-loving community.',
      date: '2025-08-30',
      readTime: '5 min read',
      author: 'Alex Chen',
      tag: 'Photography',
      slug: 'plant-instagram-photography-tips'
    },
    {
      id: '5',
      title: 'Seasonal Plant Care: Preparing for Winter',
      excerpt: 'Adjust your plant care routine for the colder months to ensure your green companions stay healthy through winter.',
      date: '2025-08-28',
      readTime: '7 min read',
      author: 'Lisa Wilson',
      tag: 'Seasonal Care',
      slug: 'seasonal-plant-care-winter-prep'
    },
    {
      id: '6',
      title: 'The Science Behind Plant Growth and Light',
      excerpt: 'Understand how different types of light affect your plants and optimize your lighting setup for maximum growth.',
      date: '2025-08-25',
      readTime: '10 min read',
      author: 'Dr. Robert Taylor',
      tag: 'Plant Science',
      slug: 'science-plant-growth-light'
    }
  ];

  const getTagColor = (tag: string) => {
    const colors = {
      'Indoor Plants': 'bg-green-100 text-green-800',
      'Propagation': 'bg-blue-100 text-blue-800',
      'Plant Care': 'bg-purple-100 text-purple-800',
      'Photography': 'bg-pink-100 text-pink-800',
      'Seasonal Care': 'bg-orange-100 text-orange-800',
      'Plant Science': 'bg-yellow-100 text-yellow-800'
    };
    return colors[tag as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8" tabIndex={-1}>
        {/* Hero Section */}
        <section className="text-center space-y-6" role="banner">
          <div className="space-y-4">
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm font-medium">
              <BookOpen className="w-4 h-4 mr-2" />
              Latest Insights
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Plant Care Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover expert tips, growing guides, and the latest insights from our community of passionate plant enthusiasts.
            </p>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="flex flex-wrap gap-3 justify-center">
          {['Indoor Plants', 'Propagation', 'Plant Care', 'Photography', 'Seasonal Care', 'Plant Science'].map((category) => (
            <Badge key={category} variant="outline" className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer transition-colors">
              {category}
            </Badge>
          ))}
        </section>

        {/* Blog Posts Grid */}
        <section className="space-y-6" role="main">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Latest Articles
              </h2>
              <p className="text-gray-600 mt-1">
                {blogPosts.length} articles to help you grow
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Card key={post.id} className="rounded-2xl ring-1 ring-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
                <Link to={`/blog/${post.slug}`} className="block h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={`text-xs ${getTagColor(post.tag)}`}>
                        {post.tag}
                      </Badge>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(post.date)}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 leading-tight group-hover:text-green-600 transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <CardDescription className="text-gray-600 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </CardDescription>

                    <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-white space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Heart className="w-6 h-6 text-pink-300" />
              <h2 className="text-3xl font-bold">
                Never Miss a Green Tip
              </h2>
              <Sprout className="w-6 h-6 text-green-300" />
            </div>
            <p className="text-green-100 max-w-2xl mx-auto text-lg">
              Get weekly plant care tips, growing guides, and exclusive content delivered straight to your inbox.
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                disabled
              />
              <Button 
                disabled
                className="bg-white text-green-600 hover:bg-gray-100 font-medium px-6 py-3 rounded-xl cursor-not-allowed opacity-50"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-green-200 text-sm mt-2 text-center">
              Newsletter coming soon! Follow us for updates.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Ready to Start Your Plant Journey?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Put these tips into practice with AgroTrack's smart plant care system.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white font-medium">
              <Link to="/register">
                Start Growing Today
                <Leaf className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link to="/guides">
                Browse Plant Guides
                <Lightbulb className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPage;
