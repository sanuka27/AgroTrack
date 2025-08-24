import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, X, ChevronLeft, ChevronRight, Pause, SkipForward, Leaf, Camera, Search, AlertTriangle, Droplets, BarChart3, Users, Database, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';

interface WatchDemoProps {
  onStart?: () => void;
}

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  example?: {
    title: string;
    content: string;
  };
}

const slides: Slide[] = [
  {
    id: 'intro',
    title: 'Welcome to AgroTrack',
    description: 'Discover how AI-powered plant care can transform your gardening journey. Watch how our smart tools help you grow healthier plants.',
    icon: Leaf,
    example: {
      title: 'What you\'ll learn',
      content: 'Complete walkthrough from signup to advanced features in under 2 minutes'
    }
  },
  {
    id: 'account',
    title: 'Create Your Account',
    description: 'Sign up with email and password using our secure Firebase authentication. Start your plant care journey in seconds.',
    icon: CheckCircle,
    example: {
      title: 'Quick Setup',
      content: 'Join 5,000+ gardeners already using AgroTrack to keep their plants thriving'
    }
  },
  {
    id: 'upload',
    title: 'Upload Plant Images',
    description: 'Take photos of your plants directly from your device. Our AI works with any camera quality to analyze your plants.',
    icon: Camera,
    example: {
      title: 'Smart Recognition',
      content: 'Upload from gallery or take live photos - works with any lighting condition'
    }
  },
  {
    id: 'identification',
    title: 'Smart Plant Identification',
    description: 'Our AI instantly identifies plant species, varieties, and provides detailed care instructions tailored to your specific plants.',
    icon: Search,
    example: {
      title: 'Example in Action',
      content: 'Identified: Monstera Deliciosa - Needs bright indirect light, water weekly'
    }
  },
  {
    id: 'disease',
    title: 'Disease Detection',
    description: 'Catch plant diseases early with AI-powered analysis. Get treatment recommendations before problems spread.',
    icon: AlertTriangle,
    example: {
      title: 'Early Detection',
      content: 'Detected: Early blight on tomato leaves - Apply copper fungicide, improve air circulation'
    }
  },
  {
    id: 'watering',
    title: 'Watering Intelligence',
    description: 'Get weather-aware watering schedules that adapt to seasons, humidity, and your local climate conditions.',
    icon: Droplets,
    example: {
      title: 'Smart Reminders',
      content: 'Rain expected tomorrow - Skip watering your outdoor herbs, indoor plants need water in 2 days'
    }
  },
  {
    id: 'monitoring',
    title: 'Smart Monitoring & Analytics',
    description: 'Track plant health over time with detailed analytics, growth calendars, and personalized care notifications.',
    icon: BarChart3,
    example: {
      title: 'Health Insights',
      content: 'Your snake plant is thriving! Growth increased 15% this month, next repotting due in spring'
    }
  },
  {
    id: 'community',
    title: 'Community & Learning',
    description: 'Connect with expert gardeners, share your plant journey, and access our comprehensive learning hub.',
    icon: Users,
    example: {
      title: 'Growing Together',
      content: '12 new tips today: "Use coffee grounds for acid-loving plants" - Sarah K.'
    }
  },
  {
    id: 'advanced',
    title: 'Advanced Tools',
    description: 'Access our plant database, environmental tracking, and seamless mobile integration for comprehensive plant care.',
    icon: Database,
    example: {
      title: 'Pro Features',
      content: 'Environmental sensors connected - Temperature 72°F, Humidity 65%, Light optimal'
    }
  },
  {
    id: 'cta',
    title: 'You\'re ready to grow smarter 🌱',
    description: 'Join 2,847+ gardeners already using AgroTrack to transform their plant care with AI-powered insights.',
    icon: Smartphone,
    example: {
      title: 'What happens next?',
      content: 'Create your free account → Upload your first plant → Get instant AI recommendations'
    }
  }
];

export default function WatchDemo({ onStart }: WatchDemoProps) {
  const { setDemoActive } = useDemo();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const openModal = () => {
    setIsOpen(true);
    setCurrentSlide(0);
    setHasInteracted(false);
    setIsAutoPlaying(false);
    setDemoCompleted(false);
    setDemoActive(true);
  };

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setIsAutoPlaying(false);
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
    }
    // Only notify demo state change if demo wasn't completed
    if (!demoCompleted) {
      setDemoActive(false);
    }
  }, [demoCompleted, setDemoActive]);

  const nextSlide = useCallback(() => {
    setHasInteracted(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setHasInteracted(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setHasInteracted(true);
    setCurrentSlide(index);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
    setHasInteracted(true);
  }, []);

  const handleStart = useCallback(() => {
    setDemoCompleted(true);
    closeModal();
    onStart?.();
    // Delay the banner state change to ensure modal closes first
    setTimeout(() => {
      setDemoActive(false);
    }, 100);
  }, [closeModal, onStart, setDemoActive]);

  const restartDemo = useCallback(() => {
    setCurrentSlide(0);
    setHasInteracted(false);
    setIsAutoPlaying(false);
    setDemoCompleted(false);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && !hasInteracted) {
      autoPlayIntervalRef.current = setInterval(nextSlide, 5000);
    } else if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlaying, hasInteracted, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal, nextSlide, prevSlide]);

  // Focus management
  useEffect(() => {
    if (isOpen && headingRef.current) {
      headingRef.current.focus();
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen, currentSlide]);

  const currentSlideData = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <>
      {/* Watch Demo Button */}
      <button
        data-testid="watch-demo-button"
        onClick={openModal}
        className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-emerald-600 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-600 hover:text-white hover:scale-105 hover:shadow-lg transform transition-all duration-200 ease-out group"
      >
        <Play className="w-4 h-4" />
        Watch Demo
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeModal}
          aria-modal="true"
          role="dialog"
          aria-labelledby="demo-modal-title"
        >
          <div
            ref={modalRef}
            data-testid="demo-modal"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Step {currentSlide + 1} of {slides.length}
                  </span>
                </div>
                <button
                  data-testid="autoplay-btn"
                  onClick={toggleAutoPlay}
                  aria-label={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
              
              <button
                onClick={closeModal}
                aria-label="Close demo"
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slide Content */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                  <currentSlideData.icon className="w-8 h-8 text-emerald-600" />
                </div>
                
                <div>
                  <h2
                    ref={headingRef}
                    id="demo-modal-title"
                    data-testid="slide-title"
                    className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
                    tabIndex={-1}
                  >
                    {currentSlideData.title}
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    {currentSlideData.description}
                  </p>
                </div>

                {/* Example Box */}
                {currentSlideData.example && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 max-w-lg mx-auto">
                    <h3 className="font-semibold text-emerald-800 mb-2">
                      {currentSlideData.example.title}
                    </h3>
                    <p className="text-sm text-emerald-700">
                      {currentSlideData.example.content}
                    </p>
                  </div>
                )}

                {/* CTA for last slide */}
                {isLastSlide && (
                  <div className="pt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        data-testid="start-now-btn"
                        onClick={handleStart}
                        className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        Get Started Free
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={restartDemo}
                        className="px-6 py-3 border-2 border-emerald-600 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        Explore Again
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      30-second signup • Forever free • No credit card required
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Controls */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <button
                  data-testid="skip-btn"
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip tour
                </button>

                {/* Slide Indicators */}
                <div className="flex items-center gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      data-testid={`dot-${index}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                      aria-current={index === currentSlide ? 'true' : 'false'}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSlide ? 'bg-emerald-600' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    data-testid="prev-btn"
                    onClick={prevSlide}
                    aria-label="Previous slide"
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    data-testid="next-btn"
                    onClick={nextSlide}
                    aria-label="Next slide"
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Screen reader announcements */}
            <div
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              Slide {currentSlide + 1} of {slides.length}: {currentSlideData.title}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
