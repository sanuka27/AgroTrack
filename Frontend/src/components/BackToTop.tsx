import { useState, useEffect, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

interface BackToTopProps {
  showAfter?: number;
  className?: string;
}

const BackToTop: React.FC<BackToTopProps> = memo(({ 
  showAfter = 400,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const throttleRef = useRef(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (throttleRef.current) return;
      throttleRef.current = true;

      setTimeout(() => {
        throttleRef.current = false;
      }, 16); // ~60fps

      const scrolled = window.pageYOffset;
      const maxHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / maxHeight) * 100;
      
      setScrollProgress(progress);
      
      if (scrolled > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="relative">
        {/* Progress Ring */}
        <svg
          className="absolute inset-0 w-12 h-12 transform -rotate-90"
          viewBox="0 0 36 36"
        >
          <path
            className="text-muted"
            strokeWidth="2"
            fill="none"
            stroke="currentColor"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-primary transition-all duration-300 ease-out"
            strokeWidth="2"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeDasharray={`${scrollProgress}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        
        {/* Button */}
        <Button
          onClick={scrollToTop}
          className={`
            relative h-12 w-12 rounded-full shadow-lg
            bg-primary hover:bg-primary-hover
            text-primary-foreground
            border border-transparent hover:border-primary/30
            transform transition-all duration-300 hover:scale-110
            animate-in slide-in-from-bottom-5 duration-300
            ${className}
          `}
          size="sm"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          Back to top
        </div>
      </div>
    </div>
  );
});

export default BackToTop;
