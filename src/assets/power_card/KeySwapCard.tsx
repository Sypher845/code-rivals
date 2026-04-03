import React from 'react';

interface KeySwapCardProps {
  size?: number;
  label?: string;
  className?: string;
}

export const KeySwapCard: React.FC<KeySwapCardProps> = ({ 
  size = 280, 
  label = "- KEY SWAP -",
  className = "" 
}) => {
  return (
    <div 
      style={{ width: size, height: size }}
      className={`
        relative rounded-2xl bg-[#2b1f3a] overflow-hidden group 
        transition-all duration-300 hover:scale-105 hover:-translate-y-2
        hover:shadow-[0_0_35px_rgba(255,214,10,0.45)] shadow-[0_10px_20px_rgba(0,0,0,0.4)] 
        cursor-pointer flex flex-col items-center justify-center
        border-[3px] border-[#1a1a1a]
        ${className}
      `}
    >
      {/* Texture Layer (Noise) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.25] mix-blend-overlay pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
        <filter id="card-noise-keyswap">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#card-noise-keyswap)" />
      </svg>

      {/* Inner Vignette / Shadow */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.7)] pointer-events-none z-10" />

      {/* Background Decor: Dots & Crosses */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Cross className="absolute top-6 left-1/2 rotate-12 opacity-60 scale-75" />
        <Cross className="absolute bottom-20 left-6 -rotate-12 opacity-80" />
        <Cross className="absolute top-1/4 right-6 rotate-45 opacity-80" />
        
        <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-[#ffd60a] shadow-[0_0_8px_#ffd60a]" />
        <div className="absolute bottom-1/4 right-8 w-3 h-3 rounded-full bg-[#ffd60a] shadow-[0_0_8px_#ffd60a]" />
        <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 rounded-full bg-[#ffd60a]" />
      </div>

      {/* Spark Decor */}
      <Spark className="absolute top-6 right-8 rotate-[15deg] z-0 scale-75 opacity-90 drop-shadow-md" />
      <Spark className="absolute bottom-10 right-4 -rotate-45 z-0 scale-100 opacity-90 drop-shadow-md" />

      {/* Main Graphic Container */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center z-20 group-hover:-translate-y-1.5 transition-transform duration-300">
        
        {/* Yellow Aura / Splash SVG */}
        <svg viewBox="0 0 100 100" className="absolute w-[125%] h-[125%] -z-10 animate-pulse drop-shadow-[0_0_20px_rgba(255,214,10,0.5)]">
          <path d="M 45 5 L 60 15 L 85 10 L 80 25 L 95 40 L 80 55 L 90 75 L 70 70 L 60 90 L 45 80 L 25 90 L 20 70 L 5 60 L 15 45 L 5 25 L 25 20 L 30 5 Z" 
                fill="#ffd60a" stroke="#ffd60a" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
        </svg>

        {/* Broken Keyboard & Flying Keys SVG */}
        <svg viewBox="0 0 100 100" className="w-[95%] h-[95%] drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_16px_16px_rgba(0,0,0,0.7)] transition-all duration-300">
          
          {/* Wires & Sparks popping from the break */}
          <path d="M 45 40 Q 55 25, 48 15" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 48 58 Q 65 55, 62 45" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 60 30 Q 50 15, 55 5" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />

          {/* LEFT HALF OF KEYBOARD */}
          <g>
            {/* Depth/Thickness */}
            <path d="M 10 40 L 45 40 L 40 50 L 48 58 L 42 65 L 50 72 L 10 72 Z" fill="#a89a8a" transform="translate(0, 4)" />
            {/* Top Face */}
            <path d="M 10 40 L 45 40 L 40 50 L 48 58 L 42 65 L 50 72 L 10 72 Z" fill="#e0d8cc" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {/* Texture Line */}
            <path d="M 12 43 L 12 69" fill="none" stroke="#c0b5a6" strokeWidth="2" strokeLinecap="round" />
            
            {/* Left Keys */}
            <rect x="15" y="45" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="24" y="45" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="33" y="45" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />
            
            <rect x="15" y="55" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="24" y="55" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="33" y="55" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />

            {/* Cyan Spacebar Slice */}
            <rect x="15" y="65" width="16" height="5" rx="1.5" fill="#0ae6df" stroke="#1a1a1a" strokeWidth="2" />
          </g>

          {/* RIGHT HALF OF KEYBOARD */}
          <g>
            {/* Depth/Thickness */}
            <path d="M 60 25 L 90 25 L 90 65 L 55 65 L 62 55 L 55 45 L 62 35 Z" fill="#a89a8a" transform="translate(0, 4)" />
            {/* Top Face */}
            <path d="M 60 25 L 90 25 L 90 65 L 55 65 L 62 55 L 55 45 L 62 35 Z" fill="#e0d8cc" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {/* Texture Line */}
            <path d="M 88 28 L 88 62" fill="none" stroke="#c0b5a6" strokeWidth="2" strokeLinecap="round" />
            
            {/* Right Keys */}
            <rect x="65" y="30" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="74" y="30" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="83" y="30" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />

            <rect x="65" y="40" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="74" y="40" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />
            {/* Enter Key Part (Yellow) */}
            <rect x="83" y="40" width="6" height="6" rx="1.5" fill="#ffd60a" stroke="#1a1a1a" strokeWidth="2" /> 

            <rect x="74" y="50" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="83" y="50" width="6" height="6" rx="1.5" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2" />

            <rect x="65" y="60" width="16" height="5" rx="1.5" fill="#0ae6df" stroke="#1a1a1a" strokeWidth="2" />
          </g>

          {/* FLYING KEYCAPS */}
          {/* Key 'S' */}
          <g transform="translate(32, 12) rotate(-20)">
            <rect x="-1" y="2" width="16" height="16" rx="2" fill="#1a1a1a" />
            <rect x="0" y="0" width="14" height="14" rx="2" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2.5" />
            <text x="7" y="10.5" fontSize="9" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#1a1a1a">S</text>
          </g>

          {/* Key 'W' */}
          <g transform="translate(68, 5) rotate(15)">
            <rect x="-1" y="2" width="16" height="16" rx="2" fill="#1a1a1a" />
            <rect x="0" y="0" width="14" height="14" rx="2" fill="#ffd60a" stroke="#1a1a1a" strokeWidth="2.5" />
            <text x="7" y="10.5" fontSize="9" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#1a1a1a">W</text>
          </g>

          {/* Key 'A' */}
          <g transform="translate(14, 25) rotate(-35)">
            <rect x="-1" y="2" width="16" height="16" rx="2" fill="#1a1a1a" />
            <rect x="0" y="0" width="14" height="14" rx="2" fill="#0ae6df" stroke="#1a1a1a" strokeWidth="2.5" />
            <text x="7" y="10.5" fontSize="9" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#1a1a1a">A</text>
          </g>

          {/* Key 'P' */}
          <g transform="translate(75, 75) rotate(40)">
            <rect x="-1" y="2" width="16" height="16" rx="2" fill="#1a1a1a" />
            <rect x="0" y="0" width="14" height="14" rx="2" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2.5" />
            <text x="7" y="10.5" fontSize="9" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#1a1a1a">P</text>
          </g>

          {/* Missing Blank Key */}
          <g transform="translate(26, 80) rotate(-10)">
            <rect x="-1" y="2" width="16" height="16" rx="2" fill="#1a1a1a" />
            <rect x="0" y="0" width="14" height="14" rx="2" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2.5" />
            <path d="M 4 7 L 10 7" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* EXTRA CORNER KEYS */}
          
          {/* Bottom Right Arrow Key */}
          <g transform="translate(85, 88) rotate(20) scale(0.85)">
            <rect x="-1" y="2" width="16" height="16" rx="2" fill="#1a1a1a" />
            <rect x="0" y="0" width="14" height="14" rx="2" fill="#0ae6df" stroke="#1a1a1a" strokeWidth="2.5" />
            <path d="M 7 4 L 10 7 L 4 7 Z" fill="#1a1a1a" />
          </g>

          {/* Top Right Random Key */}
          <g transform="translate(88, 0) rotate(45) scale(0.75)">
            <rect x="-1" y="2" width="16" height="16" rx="2" fill="#1a1a1a" />
            <rect x="0" y="0" width="14" height="14" rx="2" fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="2.5" />
            <text x="7" y="10.5" fontSize="8" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#1a1a1a">?</text>
          </g>

          {/* Bottom Left Alt Key */}
          <g transform="translate(-2, 75) rotate(-45) scale(0.8)">
            <rect x="-1" y="2" width="18" height="16" rx="2" fill="#1a1a1a" />
            <rect x="0" y="0" width="16" height="14" rx="2" fill="#ffd60a" stroke="#1a1a1a" strokeWidth="2.5" />
            <text x="8" y="10" fontSize="5" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#1a1a1a">ALT</text>
          </g>

        </svg>

      </div>

      {/* Label Box */}
      <div className="absolute bottom-4 z-30 group-hover:bottom-5 transition-all duration-300">
        <div className="bg-[#fdfbf7] text-[#1a1a1a] px-4 py-1.5 rounded-lg border-[2.5px] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transform -rotate-2 group-hover:rotate-0 transition-transform">
          <span className="font-black uppercase tracking-[0.15em] text-sm font-sans drop-shadow-sm select-none">
            {label}
          </span>
        </div>
      </div>
      
    </div>
  );
};

// --- Subcomponents for Decorative Assets ---

const Cross = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-6 h-6 ${className}`} fill="none" stroke="#ffd60a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4 L16 16 M16 4 L4 16" />
  </svg>
);

const Spark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-8 h-8 ${className}`}>
    <path d="M10,0 Q10,10 20,10 Q10,10 10,20 Q10,10 0,10 Q10,10 10,0 Z" 
          fill="#fdfbf7" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
