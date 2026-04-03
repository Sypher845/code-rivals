import React from "react";

interface FlashbangCardProps {
  size?: number;
  label?: string;
  className?: string;
}

export const FlashbangCard: React.FC<FlashbangCardProps> = ({
  size = 280,
  label = "- FLASHBANG -",
  className = "",
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`
        relative rounded-2xl bg-[#2b1f3a] overflow-hidden group 
        transition-all duration-300 hover:scale-105 hover:-translate-y-2
        hover:shadow-[0_0_35px_rgba(57,255,20,0.45)] shadow-[0_10px_20px_rgba(0,0,0,0.4)] 
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
        <filter id="card-noise-flashbang">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#card-noise-flashbang)" />
      </svg>

      {/* Inner Vignette / Shadow */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.7)] pointer-events-none z-10" />

      {/* Background Decor: Particles & Lightning */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Lightning className="absolute top-8 left-8 rotate-12 opacity-80" />
        <Lightning className="absolute bottom-16 right-6 -rotate-12 opacity-80 scale-125" />
        <Lightning className="absolute top-1/3 right-4 rotate-45 opacity-60 scale-75" />

        <Dash className="absolute top-1/4 left-4 rotate-[15deg] opacity-70" />
        <Dash className="absolute bottom-1/4 left-1/4 -rotate-[45deg] opacity-70" />
        <Dash className="absolute top-10 right-1/4 rotate-[60deg] opacity-70" />

        <div className="absolute top-12 left-1/2 w-2 h-2 rounded-full bg-[#39ff14] shadow-[0_0_8px_#39ff14]" />
        <div className="absolute bottom-10 left-12 w-3 h-3 rounded-full bg-[#39ff14] shadow-[0_0_8px_#39ff14]" />
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 rounded-full bg-[#39ff14]" />
      </div>

      {/* Main Graphic Container */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center z-20 group-hover:-translate-y-1.5 transition-transform duration-300">
        {/* Neon Green Aura / Starburst SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute w-[125%] h-[125%] -z-10 animate-pulse drop-shadow-[0_0_20px_rgba(57,255,20,0.5)]"
        >
          <path
            d="M 50 0 L 58 25 L 85 15 L 70 38 L 100 50 L 70 62 L 85 85 L 58 75 L 50 100 L 42 75 L 15 85 L 30 62 L 0 50 L 30 38 L 15 15 L 42 25 Z"
            fill="#39ff14"
            stroke="#39ff14"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>

        {/* Flashbang Eyeball SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-[95%] h-[95%] drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_16px_16px_rgba(0,0,0,0.7)] transition-all duration-300"
        >
          {/* Eyeball Body */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="#fdfbf7"
            stroke="#1a1a1a"
            strokeWidth="4"
          />

          {/* Red Veins */}
          <g
            stroke="#ff4b4b"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M 15 50 Q 22 48, 25 55 T 32 52" />
            <path d="M 20 35 Q 28 38, 30 32 T 38 35" />
            <path d="M 50 85 Q 48 75, 42 70 T 45 62" />
            <path d="M 80 75 Q 75 65, 68 70 T 62 65" />
            <path d="M 75 20 Q 68 25, 70 32 T 65 38" />
          </g>

          {/* Frantic Pupil (Staring in panic through right side) */}
          <g transform="translate(62, 45)">
            <circle
              cx="0"
              cy="0"
              r="10"
              fill="#0ae6df"
              stroke="#1a1a1a"
              strokeWidth="2"
            />
            <circle cx="0" cy="0" r="3.5" fill="#1a1a1a" />
            <circle cx="-3" cy="-3" r="2" fill="#fdfbf7" />
            <circle cx="3" cy="3" r="1" fill="#fdfbf7" />
          </g>

          {/* Action / Panic Lines */}
          <g
            stroke="#1a1a1a"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          >
            <line x1="15" y1="15" x2="10" y2="10" />
            <line x1="85" y1="15" x2="90" y2="10" />
            <line x1="85" y1="85" x2="90" y2="90" />
          </g>
          {/* A tiny sweat drop flying off */}
          <path
            d="M 15 75 Q 12 80, 15 82 Q 18 80, 15 75 Z"
            fill="#0ae6df"
            stroke="#1a1a1a"
            strokeWidth="1.5"
          />

          {/* Sunglasses Left Arm */}
          <path
            d="M 15 35 L 5 30"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Sunglasses Right Arm */}
          <path
            d="M 85 35 L 95 30"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Sunglasses Left Lens & Bridge */}
          <g>
            <path
              d="M 15 35 L 42 35 L 38 52 Q 28 56, 18 52 Z"
              fill="#2b2b2b"
              stroke="#1a1a1a"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M 42 35 L 58 35"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 20 38 L 36 38 L 34 44 L 22 44 Z"
              fill="#fdfbf7"
              opacity="0.6"
            />
          </g>

          {/* Sunglasses Right Lens (Broken Remnants) */}
          <path
            d="M 58 35 L 85 35 L 82 40"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M 58 35 L 56 45"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Shattered Shards (flying right) */}
          <g
            fill="#2b2b2b"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinejoin="round"
          >
            <polygon points="75,38 85,32 82,42" />
            <polygon points="62,45 70,52 60,58" />
            <polygon points="85,48 95,55 82,60" />
            <polygon points="70,65 80,72 75,60" />
          </g>

          {/* Small glass fragments (cyan/white for glass look) */}
          <g
            fill="#e0f2fe"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <polygon points="68,40 72,42 70,45" />
            <polygon points="88,40 92,38 90,44" />
            <polygon points="55,55 60,52 58,60" />
            <polygon points="80,50 84,55 78,58" />
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

const Lightning = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-6 h-6 ${className}`}>
    <path
      d="M 12 2 L 4 12 L 10 12 L 8 18 L 16 8 L 10 8 Z"
      fill="#39ff14"
      stroke="#1a1a1a"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const Dash = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-5 h-5 ${className}`}>
    <line
      x1="2"
      y1="10"
      x2="18"
      y2="10"
      stroke="#39ff14"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);
