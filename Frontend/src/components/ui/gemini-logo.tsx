import React from "react";

export const GeminiLogo = ({ className = "h-5" }: { className?: string }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    {/* Gemini Star Icon */}
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gemini-star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#9C40FF" />
          <stop offset="100%" stopColor="#FF4081" />
        </linearGradient>
      </defs>
      
      {/* Four-pointed star */}
      <path
        d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z"
        fill="url(#gemini-star-gradient)"
      />
    </svg>
    
    {/* Gemini Text */}
    <span 
      className="font-medium text-sm"
      style={{
        background: 'linear-gradient(90deg, #4285F4 0%, #9C40FF 50%, #FF4081 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}
    >
      Gemini
    </span>
  </div>
);

export default GeminiLogo;
