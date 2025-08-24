import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { Leaf, X, Sparkles, ArrowRight } from 'lucide-react';

export const GuestCTABanner = () => {
  const { user } = useAuth();
  const { isDemoActive } = useDemo();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSkipMessage, setShowSkipMessage] = useState(false);

  useEffect(() => {
    // Don't show if user is logged in or if demo is active
    if (user || isDemoActive) return;

    // Check if banner was dismissed this session
    const dismissed = sessionStorage.getItem('cta_banner_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show banner after 5 seconds, and check if user might have skipped demo
    const timer = setTimeout(() => {
      setIsVisible(true);
      // If enough time has passed, assume they might have skipped the demo
      const demoSkipCheck = setTimeout(() => {
        setShowSkipMessage(true);
      }, 10000); // Show skip message after 15 seconds total
      
      return () => clearTimeout(demoSkipCheck);
    }, 5000);

    return () => clearTimeout(timer);
  }, [user, isDemoActive]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('cta_banner_dismissed', 'true');
  };

  if (user || isDismissed || !isVisible || isDemoActive) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500">
      {/* Skip message */}
      {showSkipMessage && (
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
          <p className="text-center text-sm text-gray-600">
            Did you skip the demo? You can still start now.
          </p>
        </div>
      )}
      
      <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white shadow-2xl border-t border-green-400">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-2 rounded-full">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">🌱 Ready to transform your garden?</h3>
                <p className="text-green-100 text-sm">Join 2,847+ gardeners using AI to grow healthier plants</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="secondary" 
                size="lg" 
                asChild
                className="bg-white text-green-600 hover:bg-green-50 font-semibold shadow-lg"
              >
                <Link to="/register">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCTABanner;
