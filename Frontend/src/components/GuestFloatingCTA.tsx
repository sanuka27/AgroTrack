import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Leaf, Plus, Sparkles } from 'lucide-react';

export const GuestFloatingCTA = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isPulse, setIsPulse] = useState(false);

  useEffect(() => {
    // Don't show if user is logged in
    if (user) return;

    // Show after 15 seconds
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 15000);

    // Add pulse animation every 10 seconds
    const pulseInterval = setInterval(() => {
      setIsPulse(true);
      setTimeout(() => setIsPulse(false), 2000);
    }, 10000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(pulseInterval);
    };
  }, [user]);

  if (user || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="relative">
        {/* Pulse rings */}
        {isPulse && (
          <>
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></div>
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
          </>
        )}
        
        {/* Main button */}
        <Button
          asChild
          size="lg"
          className={`
            relative h-16 w-16 rounded-full shadow-2xl
            bg-gradient-to-br from-green-500 to-emerald-600 
            hover:from-green-600 hover:to-emerald-700
            transform transition-all duration-300 hover:scale-110
            ${isPulse ? 'animate-bounce' : ''}
          `}
        >
          <Link to="/register" className="flex flex-col items-center justify-center p-0">
            <Sparkles className="w-6 h-6 text-white mb-1" />
            <span className="text-xs text-white font-semibold">Join</span>
          </Link>
        </Button>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Start your plant journey! 🌱
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
};

export default GuestFloatingCTA;
