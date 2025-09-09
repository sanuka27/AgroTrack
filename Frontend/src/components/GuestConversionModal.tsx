import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Leaf, 
  Brain, 
  Users, 
  Bell, 
  TrendingUp, 
  Shield,
  Sparkles,
  X,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface GuestConversionModalProps {
  delayMs?: number;
  showOnce?: boolean;
}

export const GuestConversionModal: React.FC<GuestConversionModalProps> = ({ 
  delayMs = 10000, // Show after 10 seconds
  showOnce = true 
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Don't show if user is logged in
    if (user) return;

    // Don't show if already shown and showOnce is true
    if (showOnce && hasShown) return;

    // Check if user has dismissed this session
    const dismissed = sessionStorage.getItem('guest_modal_dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasShown(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [user, delayMs, showOnce, hasShown]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('guest_modal_dismissed', 'true');
  };

  const features = [
    {
      icon: Brain,
      title: "AI Plant Doctor",
      description: "Get instant diagnosis and treatment suggestions for your plants",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Never forget to water, fertilize, or care for your plants again",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      icon: TrendingUp,
      title: "Growth Tracking",
      description: "Monitor your plants' progress with detailed analytics and insights",
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Connect with fellow gardeners, share tips, and get expert advice",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
  ];

  if (user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-hidden rounded-2xl shadow-lg border-0 p-0 w-[95vw] sm:w-full">
        <div className="overflow-y-auto max-h-[80vh]">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-3 top-3 z-10 h-7 w-7 p-0 hover:bg-white/20 rounded-full"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header Section */}
          <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 text-white p-5 relative overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-white/20 p-2.5 rounded-full">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white mb-1">
                  Unlock Your Plant's Potential! 🌱
                </DialogTitle>
                <DialogDescription className="text-green-100 text-sm">
                  Join thousands of successful gardeners
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-green-100">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Free forever</span>
              </div>
              <div className="flex items-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">AI-powered</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Privacy protected</span>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -right-6 -top-6 w-16 h-16 bg-white/10 rounded-full"></div>
          <div className="absolute -left-3 -bottom-3 w-12 h-12 bg-white/10 rounded-full"></div>
        </div>

        {/* Features Section */}
        <div className="p-5">
          <div className="text-center mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              What you're missing as a guest:
            </h3>
            <p className="text-sm text-gray-600">
              Unlock these powerful features in just 30 seconds
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow h-full">
                <div className={`${feature.bgColor} p-2 rounded-lg flex-shrink-0`}>
                  <feature.icon className={`w-4 h-4 ${feature.color}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h4>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Join our growing community</h4>
                <p className="text-gray-600 text-xs">See what our users are saying</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">2,847+</div>
                <div className="text-xs text-gray-500">Happy gardeners</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="bg-white p-2 rounded border border-gray-200 flex-1">
                <p className="text-xs text-gray-700 mb-1">"The AI suggestions saved my dying tomato plants!"</p>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-green-600">MJ</span>
                  </div>
                  <span className="text-xs text-gray-500">Maria J.</span>
                </div>
              </div>
              
              <div className="bg-white p-2 rounded border border-gray-200 flex-1">
                <p className="text-xs text-gray-700 mb-1">"Smart reminders keep my garden thriving!"</p>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">DK</span>
                  </div>
                  <span className="text-xs text-gray-500">David K.</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2">
            <Button 
              asChild 
              size="default" 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
            >
              <Link to="/register" onClick={handleClose}>
                <Sparkles className="w-4 h-4 mr-2" />
                Start Growing Smarter - It's Free!
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="default" 
              asChild 
              className="w-full border-gray-300 hover:bg-gray-50 text-sm"
            >
              <Link to="/login" onClick={handleClose}>
                Already have an account? Sign In
              </Link>
            </Button>
          </div>

          {/* Guarantee */}
          <div className="text-center mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center space-x-2 text-green-700">
              <Shield className="w-3 h-3" />
              <span className="text-xs font-medium">100% Free • No Credit Card Required • Privacy Protected</span>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestConversionModal;
