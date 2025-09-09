import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Search, 
  HelpCircle, 
  User, 
  Leaf, 
  Bell, 
  Users, 
  Shield, 
  Mail,
  ArrowRight,
  MessageCircle,
  LucideIcon
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  icon: LucideIcon;
}

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>([]);

  useEffect(() => {
    document.title = 'Frequently Asked Questions - AgroTrack Smart Gardening';
    
    // Focus on main content for accessibility
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.focus();
    }
  }, []);

  // Mock FAQ data
  const faqData: FAQItem[] = useMemo(() => [
    {
      id: 'account-1',
      question: 'How do I create an account and get started?',
      answer: 'Getting started with AgroTrack is simple! Click the "Get Started" button in the top right corner and fill out the registration form with your email and password. Once registered, you can immediately start adding plants to your collection. No credit card required - our basic features are completely free forever.',
      category: 'Account',
      tags: ['registration', 'signup', 'getting started', 'free'],
      icon: User
    },
    {
      id: 'plants-1',
      question: 'How do I add plants to my collection?',
      answer: 'Adding plants is easy with our AI-powered identification system. Navigate to "My Plants" and click "Add Plant". You can upload a photo for automatic identification, or manually enter plant details. Include information like plant name, location (indoor/outdoor), and when you acquired it. Our AI will suggest care schedules and tips based on the species.',
      category: 'Plants',
      tags: ['add plants', 'AI identification', 'plant collection', 'photos'],
      icon: Leaf
    },
    {
      id: 'plants-2',
      question: 'What information should I track for each plant?',
      answer: 'Track essential details like watering dates, fertilizing schedule, growth measurements, and health observations. You can upload progress photos to create a visual timeline. Our system also tracks environmental factors like light exposure and humidity when available. The more data you provide, the better our AI can personalize care recommendations.',
      category: 'Plants',
      tags: ['plant care', 'tracking', 'measurements', 'health monitoring'],
      icon: Leaf
    },
    {
      id: 'reminders-1',
      question: 'How do plant care reminders work?',
      answer: 'Our smart reminder system learns from your plant care patterns and species requirements. Set up watering, fertilizing, and pruning schedules for each plant. Reminders are sent via browser notifications and email (if enabled). You can customize reminder frequency, snooze notifications, and mark tasks as complete to keep your care schedule on track.',
      category: 'Reminders',
      tags: ['notifications', 'watering', 'fertilizing', 'schedules', 'care'],
      icon: Bell
    },
    {
      id: 'community-1',
      question: 'Can I connect with other plant enthusiasts?',
      answer: 'Absolutely! Our community features let you share your plant journey, ask questions, and learn from experienced gardeners. Post photos of your plants, share care tips, and get advice on plant problems. You can follow other users, comment on posts, and participate in discussions. Join plant-specific groups to connect with people growing similar species.',
      category: 'Community',
      tags: ['community', 'sharing', 'social', 'advice', 'groups'],
      icon: Users
    },
    {
      id: 'privacy-1',
      question: 'How is my personal data protected?',
      answer: 'Your privacy is our top priority. We use industry-standard encryption to protect your personal information and plant data. We never sell your data to third parties. Photos and plant information are stored securely and only shared in the community when you explicitly choose to post them. You can download or delete your data at any time from your account settings.',
      category: 'Privacy',
      tags: ['privacy', 'data protection', 'security', 'encryption', 'GDPR'],
      icon: Shield
    },
    {
      id: 'contact-1',
      question: 'How can I get help or report a problem?',
      answer: 'We offer multiple ways to get support. For general questions, check this FAQ first. For technical issues, use our bug report form with detailed descriptions and screenshots. For account or billing questions, email our support team directly. Premium users get priority support with faster response times. We typically respond within 24 hours on weekdays.',
      category: 'Contact',
      tags: ['support', 'help', 'bug reports', 'contact', 'customer service'],
      icon: Mail
    }
  ], []);

  // Filter FAQs based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFAQs(faqData);
    } else {
      const filtered = faqData.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFAQs(filtered);
    }
  }, [searchQuery, faqData]);

  // Initialize filtered FAQs
  useEffect(() => {
    setFilteredFAQs(faqData);
  }, [faqData]);

  const categories = [
    { name: 'Account', count: faqData.filter(faq => faq.category === 'Account').length, color: 'bg-blue-100 text-blue-800' },
    { name: 'Plants', count: faqData.filter(faq => faq.category === 'Plants').length, color: 'bg-green-100 text-green-800' },
    { name: 'Reminders', count: faqData.filter(faq => faq.category === 'Reminders').length, color: 'bg-purple-100 text-purple-800' },
    { name: 'Community', count: faqData.filter(faq => faq.category === 'Community').length, color: 'bg-orange-100 text-orange-800' },
    { name: 'Privacy', count: faqData.filter(faq => faq.category === 'Privacy').length, color: 'bg-red-100 text-red-800' },
    { name: 'Contact', count: faqData.filter(faq => faq.category === 'Contact').length, color: 'bg-yellow-100 text-yellow-800' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8" tabIndex={-1}>
        {/* Hero Section */}
        <section className="text-center space-y-6" role="banner">
          <div className="space-y-4">
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help Center
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Find quick answers to common questions about using AgroTrack. 
              Can't find what you're looking for? We're here to help!
            </p>
          </div>
        </section>

        {/* Search Section */}
        <section className="max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search frequently asked questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 text-lg rounded-2xl ring-1 ring-gray-200 focus:ring-green-500 focus:border-green-500"
              aria-label="Search FAQ questions"
            />
          </div>
          
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Badge key={category.name} className={`${category.color} px-3 py-1 text-sm font-medium`}>
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="text-center text-gray-600">
              {filteredFAQs.length > 0 ? (
                <span>Found {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} matching "{searchQuery}"</span>
              ) : (
                <span>No questions found matching "{searchQuery}"</span>
              )}
            </div>
          )}
        </section>

        {/* FAQ Content */}
        <section className="max-w-4xl mx-auto space-y-6" role="main">
          {filteredFAQs.length > 0 ? (
            <Card className="rounded-2xl ring-1 ring-gray-200 shadow-sm p-6">
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border-b border-gray-100 last:border-b-0">
                    <AccordionTrigger className="hover:no-underline hover:text-green-600 transition-colors text-left py-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg flex-shrink-0 mt-1">
                          <faq.icon className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                            {faq.question}
                          </h3>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {faq.category}
                            </Badge>
                            {faq.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-14">
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          ) : (
            /* No Results State */
            <Card className="rounded-2xl ring-1 ring-gray-200 shadow-sm p-12 text-center">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No questions found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find any FAQ items matching your search. Try different keywords or browse all questions.
              </p>
              <Button 
                onClick={() => setSearchQuery('')}
                variant="outline"
                className="rounded-2xl"
              >
                Clear Search
              </Button>
            </Card>
          )}
        </section>

        {/* Help Section */}
        <section className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Support Card */}
            <Card className="rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Still Need Help?
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Get personalized support from our team
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm">
                  Can't find the answer you're looking for? Our support team is ready to help with any questions about your plants or account.
                </p>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl">
                  <Link to="/contact">
                    Contact Support
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Community Card */}
            <Card className="rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Join the Community
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Learn from fellow plant enthusiasts
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm">
                  Connect with thousands of gardeners sharing tips, experiences, and advice. Get help with plant identification and care.
                </p>
                <Button asChild variant="outline" className="w-full rounded-2xl border-green-200 text-green-700 hover:bg-green-50">
                  <Link to="/community">
                    Explore Community
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-white space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">
              Ready to Start Your Plant Journey?
            </h2>
            <p className="text-green-100 max-w-2xl mx-auto text-lg">
              Join thousands of successful gardeners using AgroTrack to grow healthier, happier plants.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              <Link to="/register">
                Get Started Free
                <Leaf className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-green-600">
              <Link to="/how-it-works">
                Learn How It Works
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
