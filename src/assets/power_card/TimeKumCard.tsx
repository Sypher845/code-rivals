import React from "react";

interface TimeKumCardProps {
  size?: number;
  label?: string;
  className?: string;
}

export const TimeKumCard: React.FC<TimeKumCardProps> = ({
  size = 280,
  label = "- TIME KUM -",
  className = "",
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`
        relative rounded-2xl bg-[#2b1f3a] overflow-hidden group 
        transition-all duration-300 hover:scale-105 hover:-translate-y-2
        hover:shadow-[0_0_35px_rgba(255,85,0,0.45)] shadow-[0_10px_20px_rgba(0,0,0,0.4)] 
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
        <filter id="card-noise-time">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#card-noise-time)" />
      </svg>

      {/* Inner Vignette / Shadow */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.7)] pointer-events-none z-10" />

      {/* Background Decor: Minus signs & Falling Sand Grains */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Minus className="absolute top-8 left-8 rotate-[20deg] opacity-70" />
        <Minus className="absolute bottom-16 right-6 -rotate-[15deg] opacity-80 scale-125" />
        <Minus className="absolute top-1/3 right-4 rotate-[60deg] opacity-60 scale-75" />

        <Minus className="absolute top-1/4 left-4 rotate-[15deg] opacity-70 scale-75" />
        <Minus className="absolute bottom-1/4 left-1/4 -rotate-[45deg] opacity-50" />
        <Minus className="absolute top-10 right-1/3 rotate-[75deg] opacity-80" />

        {/* Sand grains */}
        <div className="absolute top-12 left-1/2 w-1.5 h-1.5 rounded-full bg-[#ffaa00]" />
        <div className="absolute bottom-10 left-12 w-2 h-2 rounded-full bg-[#ffaa00]" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-[#ffaa00]" />
        <div className="absolute top-2/3 left-8 w-1 h-1 rounded-full bg-[#ffaa00]" />
        <div className="absolute bottom-1/3 right-12 w-2.5 h-2.5 rounded-full bg-[#ffaa00]" />
      </div>

      {/* Main Graphic Container */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center z-20 group-hover:-translate-y-1.5 transition-transform duration-300">
        {/* Vibrant Orange Aura / Splash SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute w-[125%] h-[125%] -z-10 animate-pulse drop-shadow-[0_0_20px_rgba(255,85,0,0.5)]"
        >
          <path
            d="M 50 0 L 65 15 L 85 5 L 80 25 L 95 35 L 80 50 L 95 70 L 75 75 L 80 95 L 60 85 L 50 100 L 35 85 L 15 95 L 20 75 L 5 70 L 20 50 L 5 35 L 20 25 L 15 5 L 35 15 Z"
            fill="#ff5500"
            stroke="#ff5500"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>

        {/* Shattered Hourglass SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-[95%] h-[95%] drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_16px_16px_rgba(0,0,0,0.7)] transition-all duration-300"
        >
          {/* Black Void / Portal at the bottom */}
          <ellipse cx="50" cy="90" rx="35" ry="8" fill="#1a1a1a" />
          <ellipse
            cx="50"
            cy="90"
            rx="42"
            ry="12"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />

          {/* BOTTOM HALF of Hourglass (Tilted and Broken) */}
          <g transform="translate(8, 2) rotate(12, 50, 80)">
            {/* Sand inside bottom half */}
            <path
              d="M 38 80 C 38 68, 43 62, 50 62 C 57 62, 62 68, 62 80 Z"
              fill="#ffaa00"
            />
            <path
              d="M 38 80 C 38 72, 45 66, 50 66 C 55 66, 62 72, 62 80 Z"
              fill="#ffd60a"
              opacity="0.6"
            />

            {/* Sand detail dots inside the glass */}
            <circle cx="45" cy="75" r="1" fill="#cc4400" opacity="0.5" />
            <circle cx="55" cy="73" r="0.8" fill="#cc4400" opacity="0.5" />
            <circle cx="50" cy="70" r="1.2" fill="#cc4400" opacity="0.5" />
            <circle cx="42" cy="78" r="1.5" fill="#cc4400" opacity="0.5" />
            <circle cx="58" cy="77" r="1" fill="#cc4400" opacity="0.5" />
            <circle cx="50" cy="77" r="1.5" fill="#cc4400" opacity="0.5" />

            {/* Glass bottom half */}
            <path
              d="M 35 80 C 35 60, 42 55, 44 50 L 50 56 L 56 48 L 58 58 C 65 62, 65 80, 65 80 Z"
              fill="#e0f2fe"
              opacity="0.85"
              stroke="#1a1a1a"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* Base Wood */}
            <rect
              x="25"
              y="80"
              width="50"
              height="6"
              rx="2"
              fill="#d4c9b8"
              stroke="#1a1a1a"
              strokeWidth="3"
            />
            {/* Base details */}
            <line
              x1="30"
              y1="83"
              x2="70"
              y2="83"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>

          {/* SAND GRAINS (Scattered, pouring into the void) */}
          <g fill="#ffaa00" stroke="#1a1a1a" strokeWidth="0.5">
            {/* Upper scatter */}
            <circle cx="50" cy="42" r="1.5" />
            <circle cx="47" cy="45" r="1" />
            <circle cx="53" cy="46" r="2" />
            <circle cx="50" cy="49" r="1" />
            <circle cx="45" cy="51" r="1.5" />
            <circle cx="55" cy="52" r="1.5" />

            {/* Mid scatter */}
            <circle cx="48" cy="55" r="2" />
            <circle cx="52" cy="58" r="1" />
            <circle cx="44" cy="60" r="1.5" />
            <circle cx="56" cy="62" r="2" />
            <circle cx="50" cy="64" r="1" />
            <circle cx="46" cy="66" r="1.5" />
            <circle cx="53" cy="68" r="1.5" />

            {/* Lower scatter */}
            <circle cx="49" cy="72" r="2" />
            <circle cx="55" cy="74" r="1" />
            <circle cx="45" cy="77" r="1.5" />
            <circle cx="51" cy="79" r="2" />
            <circle cx="47" cy="82" r="1" />
            <circle cx="53" cy="84" r="1.5" />

            {/* Near void scatter */}
            <circle cx="50" cy="87" r="2" />
            <circle cx="45" cy="89" r="1.5" />
            <circle cx="55" cy="90" r="1" />
            <circle cx="48" cy="92" r="1.5" />
            <circle cx="52" cy="93" r="2" />
          </g>

          {/* TOP HALF of Hourglass (Tilted the opposite way) */}
          <g transform="translate(-4, -4) rotate(-15, 50, 20)">
            {/* Sand inside top half */}
            <path
              d="M 38 16 L 62 16 C 62 25, 55 30, 50 35 C 45 30, 38 25, 38 16 Z"
              fill="#ffaa00"
            />
            <path
              d="M 42 16 L 58 16 C 58 20, 52 24, 50 26 C 48 24, 42 20, 42 16 Z"
              fill="#ffd60a"
              opacity="0.6"
            />

            {/* Glass top half */}
            <path
              d="M 35 16 C 35 35, 42 40, 44 44 L 50 38 L 54 42 L 58 35 C 65 30, 65 16, 65 16 Z"
              fill="#e0f2fe"
              opacity="0.85"
              stroke="#1a1a1a"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* Shine/Reflection line on top glass */}
            <path
              d="M 39 20 C 39 25, 42 30, 44 33"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Top Wood Base */}
            <rect
              x="25"
              y="10"
              width="50"
              height="6"
              rx="2"
              fill="#d4c9b8"
              stroke="#1a1a1a"
              strokeWidth="3"
            />
            <line
              x1="30"
              y1="13"
              x2="70"
              y2="13"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>

          {/* SHATTERED GLASS PIECES */}
          <g
            fill="#e0f2fe"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <polygon points="35,45 42,42 40,50" />
            <polygon points="65,38 72,40 68,48" />
            <polygon points="25,55 32,52 28,60" />
            <polygon points="75,55 80,62 70,60" />
            <polygon points="58,35 62,32 64,38" />
          </g>

          {/* Action lines for the shattering explosion */}
          <g stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
            <line x1="28" y1="45" x2="20" y2="42" />
            <line x1="72" y1="45" x2="80" y2="42" />
            <line x1="25" y1="58" x2="18" y2="60" />
            <line x1="75" y1="55" x2="85" y2="52" />
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

const Minus = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-6 h-6 ${className}`}>
    <line
      x1="3"
      y1="10"
      x2="17"
      y2="10"
      stroke="#ff5500"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </svg>
);
