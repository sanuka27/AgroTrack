import React from "react";

export const GeminiLogo = ({ className = "h-5" }: { className?: string }) => (
  <div className={`inline-flex items-center relative ${className}`}>
    {/* Gemini Text with exact Google gradient: Blue → Purple → Pink/Red */}
    <span 
      className="font-semibold text-base tracking-normal"
      style={{
        background: 'linear-gradient(90deg, #4285F4 0%, #5A67D8 25%, #9855F7 50%, #C084FC 75%, #EC4899 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      Gemini
    </span>
    
    {/* Official Gemini Sparkle Star positioned above the 'i' */}
    <svg
      viewBox="0 0 24 24"
      className="absolute w-3 h-3"
      style={{ 
        top: '-8px',
        right: '18px',
        transform: 'translateX(50%)'
      }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Exact Google Gemini sparkle gradient */}
        <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      
      {/* Four-pointed sparkle star */}
      <path
        d="M12 0 L13 11 L12 12 L11 11 Z M24 12 L13 13 L12 12 L13 11 Z M12 24 L11 13 L12 12 L13 13 Z M0 12 L11 11 L12 12 L11 13 Z"
        fill="url(#sparkle-gradient)"
      />
    </svg>
  </div>
);

export default GeminiLogo;
