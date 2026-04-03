import React from "react";

interface VisuallyImpairedCardProps {
  size?: number;
  label?: string;
  className?: string;
}

export const VisuallyImpairedCard: React.FC<VisuallyImpairedCardProps> = ({
  size = 280,
  label = "- VISUALLY IMPAIRED -",
  className = "",
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`
        relative rounded-2xl bg-[#1e1526] overflow-hidden group 
        transition-all duration-300 hover:scale-105 hover:-translate-y-2
        hover:shadow-[0_0_35px_rgba(155,89,182,0.45)] shadow-[0_10px_20px_rgba(0,0,0,0.4)] 
        cursor-pointer flex flex-col items-center justify-center
        border-[3px] border-[#1a1a1a]
        ${className}
      `}
    >
      {/* Texture Layer (Noise) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.25] mix-blend-overlay pointer-events-none z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="card-noise-visually">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#card-noise-visually)" />
      </svg>

      {/* Inner Vignette / Shadow */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.7)] pointer-events-none z-10" />

      {/* Background Decor: Arrows & Not Equal signs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <DoubleArrow className="absolute top-10 left-8 rotate-45 opacity-70 scale-110" />
        <DoubleArrow className="absolute bottom-24 right-6 -rotate-12 opacity-60 scale-90" />
        <DoubleArrow className="absolute top-1/3 right-10 rotate-[70deg] opacity-50 scale-75" />

        <NotEqual className="absolute top-16 right-1/4 rotate-12 opacity-80 scale-125" />
        <NotEqual className="absolute bottom-20 left-10 -rotate-12 opacity-70" />
        <NotEqual className="absolute top-1/2 left-6 rotate-45 opacity-60 scale-75" />

        {/* Subtle motion lines or blurs complementing the split */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-[#9b59b6] rounded-full opacity-[0.1] blur-xl" />
        <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-[#8e44ad] rounded-full opacity-[0.15] blur-xl" />
      </div>

      {/* Main Graphic Container */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center z-20 group-hover:-translate-y-1.5 transition-transform duration-300">
        {/* Split Purple Circle Aura SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute w-[125%] h-[125%] -z-10 animate-pulse drop-shadow-[0_0_20px_rgba(155,89,182,0.4)]"
        >
          {/* Half Light Purple */}
          <path
            d="M 50 10 A 40 40 0 0 1 50 90 Z"
            fill="#b37ee6"
            stroke="#9b59b6"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Half Dark Purple */}
          <path
            d="M 50 10 A 40 40 0 0 0 50 90 Z"
            fill="#6d2b91"
            stroke="#521f6e"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Center splitting line / stroke for definition */}
          <line
            x1="50"
            y1="10"
            x2="50"
            y2="90"
            stroke="#1a1a1a"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>

        {/* Cracked Compass SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-[90%] h-[90%] drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_16px_16px_rgba(0,0,0,0.7)] transition-all duration-300"
        >
          {/* Compass Case Outer */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="#d4c9b8"
            stroke="#1a1a1a"
            strokeWidth="3"
          />
          {/* Compass Case Inner Lip */}
          <circle cx="50" cy="50" r="36" fill="#1a1a1a" />

          {/* Compass Face (Dark so white text shows) */}
          <circle cx="50" cy="50" r="34" fill="#2b2b2b" />

          {/* Tick marks */}
          <path
            d="M 50 16 L 50 20 M 50 84 L 50 80 M 16 50 L 20 50 M 84 50 L 80 50"
            stroke="#fdfbf7"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Swapped Directions (White Text) */}
          <text
            x="50"
            y="25"
            dy="4"
            fill="#fdfbf7"
            fontSize="12"
            fontWeight="900"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            S
          </text>
          <text
            x="50"
            y="74"
            dy="4"
            fill="#fdfbf7"
            fontSize="12"
            fontWeight="900"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            N
          </text>
          <text
            x="26"
            y="49"
            dy="4"
            fill="#fdfbf7"
            fontSize="12"
            fontWeight="900"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            E
          </text>
          <text
            x="74"
            y="49"
            dy="4"
            fill="#fdfbf7"
            fontSize="12"
            fontWeight="900"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            W
          </text>

          {/* Compass Needle */}
          <g transform="rotate(135, 50, 50)">
            {/* North pointer */}
            <path
              d="M 50 50 L 45 50 L 50 18 L 55 50 Z"
              fill="#e74c3c"
              stroke="#1a1a1a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* South pointer */}
            <path
              d="M 50 50 L 45 50 L 50 82 L 55 50 Z"
              fill="#fdfbf7"
              stroke="#1a1a1a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Center Pin */}
            <circle
              cx="50"
              cy="50"
              r="4"
              fill="#d4c9b8"
              stroke="#1a1a1a"
              strokeWidth="2"
            />
          </g>

          {/* Cracked Glass Overlay */}
          <g
            fill="none"
            stroke="#fdfbf7"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          >
            <path d="M 50 50 L 35 30 L 25 22" strokeWidth="1.5" />
            <path d="M 50 50 L 60 30 L 68 18" strokeWidth="1.5" />
            <path d="M 50 50 L 70 55 L 82 58" strokeWidth="1.5" />
            <path d="M 50 50 L 45 70 L 42 82" strokeWidth="1.5" />
            <path d="M 50 50 L 30 55 L 18 62" strokeWidth="1.5" />

            {/* Secondary cracks */}
            <path d="M 38 36 L 46 24" strokeWidth="1" />
            <path d="M 59 34 L 72 44" strokeWidth="1" />
            <path d="M 66 68 L 54 74" strokeWidth="1" />
            <path d="M 28 58 L 40 68" strokeWidth="1" />
          </g>

          {/* Glass shards/glare */}
          <polygon points="50,50 60,30 75,45" fill="#fdfbf7" opacity="0.1" />
          <polygon points="50,50 35,65 20,50" fill="#fdfbf7" opacity="0.1" />
        </svg>
      </div>

      {/* Label Box */}
      <div className="absolute bottom-4 z-30 group-hover:bottom-5 transition-all duration-300">
        <div className="bg-[#fdfbf7] text-[#1a1a1a] px-4 py-1.5 rounded-lg border-[2.5px] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transform -rotate-1 group-hover:rotate-0 transition-transform">
          <span className="font-black uppercase tracking-[0.1em] text-[13px] font-sans drop-shadow-sm select-none">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents for Decorative Assets ---

const DoubleArrow = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-8 h-8 ${className}`}
    fill="none"
    stroke="#b37ee6"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Up Arrow */}
    <path d="M12 4 L12 20" />
    <path d="M8 8 L12 4 L16 8" />
    {/* Down Arrow */}
    <path d="M8 16 L12 20 L16 16" />
  </svg>
);

const NotEqual = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-6 h-6 ${className}`}
    fill="none"
    stroke="#6d2b91"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <path d="M5 9 L19 9" />
    <path d="M5 15 L19 15" />
    {/* The slash */}
    <path d="M16 5 L8 19" strokeWidth="2.5" />
  </svg>
);
