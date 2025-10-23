import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Users, Brain, Heart } from 'lucide-react';

const AboutPage = () => {
  useEffect(() => {
    document.title = 'About Us - AgroTrack';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(120_100%_25%/0.05),transparent_70%)] pointer-events-none"></div>

      <main role="main" className="relative container mx-auto max-w-4xl px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>About AgroTrack</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Empowering Gardeners with
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> AI Technology</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're on a mission to make plant care accessible, intelligent, and enjoyable for everyone, everywhere.
          </p>
        </div>

        <div className="space-y-12">
          {/* Mission Section */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4 text-lg">
              AgroTrack empowers gardeners across Sri Lanka and worldwide with AI-powered plant care solutions.
              We believe that everyone deserves access to intelligent tools that make gardening successful,
              sustainable, and enjoyable.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              Our mission is to bridge the gap between traditional gardening wisdom and modern technology,
              helping both novice and experienced gardeners achieve better results with their plants.
            </p>
          </section>

          {/* What AgroTrack Does */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What AgroTrack Does</h2>
            <p className="text-gray-600 leading-relaxed mb-6 text-lg">
              AgroTrack is your comprehensive digital gardening assistant that combines artificial intelligence
              with practical plant care knowledge. Our platform helps you monitor, understand, and care for
              your plants more effectively than ever before.
            </p>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
              <p className="text-green-800 text-sm font-medium">
                <strong>💡 Did you know?</strong> Our AI has been trained on thousands of plant species
                commonly found in Sri Lankan gardens and tropical climates worldwide.
              </p>
            </div>
          </section>

          {/* AI Features Grid */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">AI-Powered Features</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🔍 Plant Identification</h3>
                <p className="text-gray-600 leading-relaxed">
                  Simply take a photo of any plant, and our AI will identify the species, variety, and
                  provide detailed care instructions tailored to Sri Lankan growing conditions.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-white text-xl">🏥</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🏥 Disease Detection</h3>
                <p className="text-gray-600 leading-relaxed">
                  Early detection of plant diseases and pests through image analysis, with specific
                  treatment recommendations using locally available solutions.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-white text-xl">💧</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">💧 Smart Watering</h3>
                <p className="text-gray-600 leading-relaxed">
                  Weather-aware watering schedules that adapt to Sri Lanka's monsoon seasons,
                  temperature changes, and individual plant needs.
                </p>
              </div>
            </div>
          </section>

          {/* Who We Serve */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Who We Serve</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6 text-lg">
              AgroTrack is designed for home gardeners at every level:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Beginners</strong>
                  <p className="text-gray-600 text-sm">who want to start their gardening journey with confidence</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Experienced gardeners</strong>
                  <p className="text-gray-600 text-sm">looking to optimize their plant care with technology</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Urban gardeners</strong>
                  <p className="text-gray-600 text-sm">managing balcony and indoor plants in apartments</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900">Rural gardeners</strong>
                  <p className="text-gray-600 text-sm">maintaining home gardens and small-scale cultivation</p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed text-lg">
              While we're based in Sri Lanka and understand local growing conditions,
              our platform serves gardeners globally with plant care wisdom that travels.
            </p>
          </section>

          {/* Contact Section */}
          <section className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            <p className="text-green-100 leading-relaxed mb-6 text-lg">
              Have questions or want to learn more? We'd love to hear from you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-green-100 text-sm mb-1">📧 Email</p>
                <a href="mailto:support@agrotrack.lk" className="text-white hover:text-green-200 font-medium transition-colors">
                  support@agrotrack.lk
                </a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-green-100 text-sm mb-1">📞 Phone</p>
                <a href="tel:+94771234567" className="text-white hover:text-green-200 font-medium transition-colors">
                  +94 77 123 4567
                </a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-green-100 text-sm mb-1">📍 Visit us</p>
                <a href="https://maps.google.com/?q=123+Galle+Road+Colombo+03+Sri+Lanka" target="_blank" rel="noopener" className="text-white hover:text-green-200 font-medium transition-colors">
                  123 Galle Road, Colombo 03
                </a>
              </div>
            </div>

            <Link to="/contact" className="inline-flex items-center px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors">
              Contact Us →
            </Link>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">Last updated: 2025-08-24</p>
        </footer>
      </main>
    </div>
  );
};

export default AboutPage;