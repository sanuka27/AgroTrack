import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Leaf, 
  Brain, 
  Bell, 
  TrendingUp, 
  Users,
  X,
  Sparkles
} from 'lucide-react';

const STORAGE_KEY = 'agro:welcome-strip:dismissed';

export const WelcomeStrip = () => {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the welcome strip
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Don't show if user is logged in or if dismissed
  if (user || isDismissed) return null;

  const features = [
    { icon: Brain, label: "AI Doctor", color: "text-purple-600 bg-purple-50" },
    { icon: Bell, label: "Reminders", color: "text-orange-600 bg-orange-50" },
    { icon: TrendingUp, label: "Tracking", color: "text-green-600 bg-green-50" },
    { icon: Users, label: "Community", color: "text-blue-600 bg-blue-50" },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-green-50 via-white to-blue-50 py-3 px-4">
      <Card className="max-w-3xl mx-auto rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 md:p-5 relative">
        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pr-8">
          {/* Icon & Message */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-green-100 p-2 rounded-full">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Welcome to AgroTrack! 🌱
              </h3>
              <p className="text-gray-600 text-xs">
                Join thousands growing smarter with AI-powered plant care
              </p>
            </div>
          </div>

          {/* Feature Chips */}
          <div className="flex flex-wrap gap-1.5 flex-1 justify-center md:justify-start">
            {features.map((feature, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className={`${feature.color} text-xs px-2 py-1 font-medium border-0`}
              >
                <feature.icon className="w-3 h-3 mr-1" />
                {feature.label}
              </Badge>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
              <Link to="/register">
                <Sparkles className="w-3 h-3 mr-1" />
                Start Free
              </Link>
            </Button>
            <Link 
              to="/login" 
              className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2"
            >
              Sign in
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WelcomeStrip;
