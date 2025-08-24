import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, AlertCircle } from 'lucide-react';

const NotFoundPage = () => {
  useEffect(() => {
    document.title = '404 - Page Not Found - AgroTrack';
  }, []);

  return (
    <main role="main" className="container mx-auto max-w-3xl px-4 py-12">
      <div className="text-center space-y-8">
        {/* 404 Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-emerald-600" />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
            Oops! The page you're looking for seems to have wandered off like a plant seeking sunlight. 
            Let's get you back to growing!
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Home
          </Link>
          
          <Link 
            to="/help" 
            className="inline-flex items-center px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
          >
            <Search className="w-5 h-5 mr-2" />
            Visit Help Center
          </Link>
        </div>
        
        {/* Helpful Links */}
        <div className="pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Pages</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Link to="/assistant" className="text-emerald-600 hover:text-emerald-700">
              AI Assistant
            </Link>
            <Link to="/community" className="text-emerald-600 hover:text-emerald-700">
              Community
            </Link>
            <Link to="/guides" className="text-emerald-600 hover:text-emerald-700">
              Plant Care Guide
            </Link>
            <Link to="/contact" className="text-emerald-600 hover:text-emerald-700">
              Contact Us
            </Link>
          </div>
        </div>
        
        {/* Fun Plant Fact */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 max-w-md mx-auto">
          <h4 className="font-semibold text-emerald-800 mb-2">🌱 Did You Know?</h4>
          <p className="text-emerald-700 text-sm">
            Some plants can live for thousands of years! The oldest known plant is a Great Basin bristlecone pine 
            that's over 5,000 years old. That's a lot of growing seasons!
          </p>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
