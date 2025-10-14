import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Lock, Sparkles, X } from 'lucide-react';

interface TeaserOverlayProps {
  onClose?: () => void;
}

export default function TeaserOverlay({ onClose }: TeaserOverlayProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  // Block scrolling when overlay is visible
  useEffect(() => {
    if (!isVisible) return;
    
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-white rounded-2xl shadow-[0_8px_32px_hsl(120_100%_25%_/_0.16)] border-2 border-green-300 p-8 max-w-md mx-4 text-center relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
        </button>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full blur-3xl opacity-40 -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-50 to-emerald-50 rounded-full blur-2xl opacity-50 -z-10" />
        
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-[0_0_24px_hsl(85_100%_44%_/_0.3)] mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent mb-3">
            Want to see more?
          </h3>
          
          <p className="text-gray-700 mb-6 leading-relaxed">
            Sign in to view all community posts, share your gardening experiences, vote on topics, and join the conversation!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-[0_4px_16px_hsl(120_100%_25%_/_0.12)] hover:shadow-[0_8px_32px_hsl(120_100%_25%_/_0.16)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 rounded-xl font-semibold transition-all duration-300 border border-gray-300 hover:shadow-sm"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
