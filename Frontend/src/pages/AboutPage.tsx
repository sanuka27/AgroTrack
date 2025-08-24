import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  useEffect(() => {
    document.title = 'About Us - AgroTrack';
  }, []);

  return (
    <main role="main" className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">About AgroTrack</h1>
      
      <div className="space-y-8">
        {/* Mission Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            AgroTrack empowers gardeners across Sri Lanka and worldwide with AI-powered plant care solutions. 
            We believe that everyone deserves access to intelligent tools that make gardening successful, 
            sustainable, and enjoyable.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our mission is to bridge the gap between traditional gardening wisdom and modern technology, 
            helping both novice and experienced gardeners achieve better results with their plants.
          </p>
        </section>

        {/* What AgroTrack Does */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">What AgroTrack Does</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            AgroTrack is your comprehensive digital gardening assistant that combines artificial intelligence 
            with practical plant care knowledge. Our platform helps you monitor, understand, and care for 
            your plants more effectively than ever before.
          </p>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
            <p className="text-emerald-800 text-sm">
              <strong>💡 Did you know?</strong> Our AI has been trained on thousands of plant species 
              commonly found in Sri Lankan gardens and tropical climates worldwide.
            </p>
          </div>
        </section>

        {/* AI Features */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">AI-Powered Features</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">🔍 Plant Identification</h3>
              <p className="text-gray-600 leading-relaxed">
                Simply take a photo of any plant, and our AI will identify the species, variety, and 
                provide detailed care instructions tailored to Sri Lankan growing conditions.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">🏥 Disease Detection</h3>
              <p className="text-gray-600 leading-relaxed">
                Early detection of plant diseases and pests through image analysis, with specific 
                treatment recommendations using locally available solutions.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">💧 Smart Watering</h3>
              <p className="text-gray-600 leading-relaxed">
                Weather-aware watering schedules that adapt to Sri Lanka's monsoon seasons, 
                temperature changes, and individual plant needs.
              </p>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Who We Serve</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            AgroTrack is designed for home gardeners at every level:
          </p>
          
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Beginners</strong> who want to start their gardening journey with confidence</li>
            <li><strong>Experienced gardeners</strong> looking to optimize their plant care with technology</li>
            <li><strong>Urban gardeners</strong> managing balcony and indoor plants in apartments</li>
            <li><strong>Rural gardeners</strong> maintaining home gardens and small-scale cultivation</li>
            <li><strong>International users</strong> growing tropical and subtropical plants worldwide</li>
          </ul>
          
          <p className="text-gray-600 leading-relaxed">
            While we're based in Sri Lanka and understand local growing conditions, 
            our platform serves gardeners globally with plant care wisdom that travels.
          </p>
        </section>

        {/* Contact Summary */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Get in Touch</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Have questions or want to learn more? We'd love to hear from you.
          </p>
          
          <div className="space-y-2">
            <p className="text-gray-600">
              📧 Email: <a href="mailto:support@agrotrack.lk" className="text-emerald-600 hover:text-emerald-700">support@agrotrack.lk</a>
            </p>
            <p className="text-gray-600">
              📞 Phone: <a href="tel:+94771234567" className="text-emerald-600 hover:text-emerald-700">+94 77 123 4567</a>
            </p>
            <p className="text-gray-600">
              📍 Visit us: <a href="https://maps.google.com/?q=123+Galle+Road+Colombo+03+Sri+Lanka" target="_blank" rel="noopener" className="text-emerald-600 hover:text-emerald-700">123 Galle Road, Colombo 03, Sri Lanka</a>
            </p>
          </div>
          
          <div className="mt-6">
            <Link to="/contact" className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              Contact Us →
            </Link>
          </div>
        </section>
      </div>
      
      <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        Last updated: 2025-08-24
      </footer>
    </main>
  );
};

export default AboutPage;
