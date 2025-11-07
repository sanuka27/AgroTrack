import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Droplets, 
  Bug, 
  Home, 
  Trees, 
  Clock,
  User,
  ArrowRight
} from 'lucide-react';

interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  readTime: string;
  author: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const GuidesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    document.title = 'Plant Care Guides - AgroTrack Smart Gardening';
    
    // Focus on main content for accessibility
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.focus();
    }
  }, []);

  const categories = [
    { id: 'All', label: 'All Guides', icon: BookOpen },
    { id: 'Indoor', label: 'Indoor Plants', icon: Home },
    { id: 'Outdoor', label: 'Outdoor Plants', icon: Trees },
    { id: 'Watering', label: 'Watering', icon: Droplets },
    { id: 'Pests', label: 'Pest Control', icon: Bug },
  ];

  // Mock guide data
  const mockGuides: Guide[] = [
    {
      id: '1',
      title: 'Complete Guide to Indoor Plant Care',
      description: 'Master the art of growing healthy indoor plants with proper lighting, watering schedules, and humidity control techniques.',
      category: 'Indoor',
      tags: ['lighting', 'humidity', 'fertilizing'],
      readTime: '8 min read',
      author: 'Sarah Green',
      difficulty: 'Beginner'
    },
    {
      id: '2',
      title: 'Watering Techniques for Different Plant Types',
      description: 'Learn when and how to water succulents, tropical plants, and herbs to prevent overwatering and root rot.',
      category: 'Watering',
      tags: ['succulents', 'tropical', 'scheduling'],
      readTime: '5 min read',
      author: 'Mike Johnson',
      difficulty: 'Beginner'
    },
    {
      id: '3',
      title: 'Natural Pest Control Solutions',
      description: 'Discover organic methods to protect your plants from common pests using neem oil, companion planting, and beneficial insects.',
      category: 'Pests',
      tags: ['organic', 'neem oil', 'prevention'],
      readTime: '12 min read',
      author: 'Emma Davis',
      difficulty: 'Intermediate'
    },
    {
      id: '4',
      title: 'Outdoor Garden Planning for Beginners',
      description: 'Start your outdoor garden with confidence by learning about soil preparation, plant spacing, and seasonal planting guides.',
      category: 'Outdoor',
      tags: ['soil', 'spacing', 'seasons'],
      readTime: '15 min read',
      author: 'David Wilson',
      difficulty: 'Beginner'
    },
    {
      id: '5',
      title: 'Advanced Hydroponic Systems Setup',
      description: 'Build and maintain efficient hydroponic systems for year-round indoor growing with optimal nutrient solutions.',
      category: 'Indoor',
      tags: ['hydroponics', 'nutrients', 'systems'],
      readTime: '20 min read',
      author: 'Lisa Chen',
      difficulty: 'Advanced'
    },
    {
      id: '6',
      title: 'Identifying and Treating Plant Diseases',
      description: 'Recognize common plant diseases early and apply effective treatment strategies to save your garden.',
      category: 'Pests',
      tags: ['diseases', 'treatment', 'diagnosis'],
      readTime: '10 min read',
      author: 'Robert Taylor',
      difficulty: 'Intermediate'
    },
    {
      id: '7',
      title: 'Creating a Water-Efficient Garden',
      description: 'Design and maintain a drought-resistant outdoor garden using native plants and smart irrigation techniques.',
      category: 'Outdoor',
      tags: ['drought', 'native plants', 'irrigation'],
      readTime: '14 min read',
      author: 'Anna Martinez',
      difficulty: 'Intermediate'
    },
    {
      id: '8',
      title: 'The Art of Plant Propagation',
      description: 'Multiply your plant collection through cuttings, division, and seed starting with proven propagation methods.',
      category: 'Indoor',
      tags: ['propagation', 'cuttings', 'seeds'],
      readTime: '18 min read',
      author: 'Tom Anderson',
      difficulty: 'Advanced'
    }
  ];

  const filteredGuides = selectedCategory === 'All' 
    ? mockGuides 
    : mockGuides.filter(guide => guide.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8" tabIndex={-1}>
        {/* Hero Section */}
        <section className="text-center space-y-6 mb-12" role="banner">
          <div className="space-y-4">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-4 py-2 text-sm font-medium">
              Expert Knowledge
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Plant Care Guides
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Comprehensive guides to help you grow healthy, thriving plants. 
              From beginner tips to advanced techniques, we've got you covered.
            </p>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Category Filters */}
          <aside className="lg:col-span-1" role="complementary">
            <Card className="rounded-2xl ring-1 ring-border bg-card shadow-sm p-6 sticky top-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Categories
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Filter guides by topic
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-left ${
                      selectedCategory === category.id
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 ring-1 ring-green-200'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <category.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{category.label}</span>
                    <span className="ml-auto text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded-full">
                      {category.id === 'All' 
                        ? mockGuides.length 
                        : mockGuides.filter(g => g.category === category.id).length
                      }
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Right Content - Guide Cards */}
          <section className="lg:col-span-3" role="main">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {selectedCategory === 'All' ? 'All Guides' : `${selectedCategory} Guides`}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {filteredGuides.length} guide{filteredGuides.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>

            {/* Guide Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredGuides.map((guide) => (
                <Card key={guide.id} className="rounded-2xl ring-1 ring-border bg-card shadow-sm hover:shadow-md transition-shadow p-6 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground leading-tight mb-2 group-hover:text-green-600 transition-colors">
                          {guide.title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground leading-relaxed">
                          {guide.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {guide.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{guide.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{guide.readTime}</span>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getDifficultyColor(guide.difficulty)}`}>
                        {guide.difficulty}
                      </Badge>
                    </div>

                    {/* Read More Button */}
                    <Button 
                      disabled 
                      className="w-full bg-muted/50 text-muted-foreground cursor-not-allowed hover:bg-muted/50"
                      size="sm"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredGuides.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No guides found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try selecting a different category to see more guides.
                </p>
                <Button onClick={() => setSelectedCategory('All')} variant="outline" className="border-border text-foreground">
                  View All Guides
                </Button>
              </div>
            )}
          </section>
        </div>

        {/* CTA Section */}
  <section className="mt-16 text-center bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-white space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">
              Ready to Apply What You've Learned?
            </h2>
            <p className="text-green-100 max-w-2xl mx-auto text-lg">
              Start tracking your plants with AgroTrack and put these guides into practice.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-card text-green-600 hover:bg-muted/50">
              <Link to="/register">
                Start Your Garden
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border text-white bg-white/10 hover:bg-white/20 hover:text-green-600">
              <Link to="/how-it-works">
                How It Works
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GuidesPage;
