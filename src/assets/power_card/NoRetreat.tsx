import React from "react";

interface SkullCardProps {
  size?: number;
  label?: string;
  className?: string;
}

export const SkullCard: React.FC<SkullCardProps> = ({
  size = 280,
  label = "- NO RETREAT -",
  className = "",
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`
        relative rounded-2xl bg-[#2b1f3a] overflow-hidden group 
        transition-all duration-300 hover:scale-105 hover:-translate-y-2
        hover:shadow-[0_0_35px_rgba(10,230,223,0.45)] shadow-[0_10px_20px_rgba(0,0,0,0.4)] 
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
        <filter id="card-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#card-noise)" />
      </svg>

      {/* Inner Vignette / Shadow */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.7)] pointer-events-none z-10" />

      {/* Background Decor: Dots & Crosses */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Cross className="absolute top-6 left-6 -rotate-12 opacity-80" />
        <Cross className="absolute bottom-16 right-6 rotate-45 opacity-80" />
        <Cross className="absolute top-1/3 right-4 rotate-12 scale-75 opacity-60" />

        <div className="absolute top-12 right-14 w-2 h-2 rounded-full bg-[#0ae6df] shadow-[0_0_8px_#0ae6df]" />
        <div className="absolute bottom-1/4 left-8 w-3 h-3 rounded-full bg-[#0ae6df] shadow-[0_0_8px_#0ae6df]" />
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 rounded-full bg-[#0ae6df]" />
      </div>

      {/* Bones Decor */}
      <Bone className="absolute top-4 right-4 rotate-[15deg] z-0 scale-75 opacity-90 drop-shadow-md" />
      <Bone className="absolute bottom-10 left-3 rotate-[-45deg] z-0 scale-75 opacity-90 drop-shadow-md" />

      {/* Main Graphic Container */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center z-20 group-hover:-translate-y-1.5 transition-transform duration-300">
        {/* Cyan Aura / Splash SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute w-[125%] h-[125%] -z-10 animate-pulse drop-shadow-[0_0_20px_rgba(10,230,223,0.5)]"
        >
          {/* Using a thicker rounded stroke gives it the rough brush stroke edge feel */}
          <path
            d="M 50 0 
                   L 40 15 L 15 5 L 25 25 L 0 30 
                   L 15 45 L 5 65 L 25 60 L 30 85 
                   L 45 70 L 55 95 L 65 70 L 80 85 
                   L 75 60 L 95 65 L 85 45 L 100 30 
                   L 75 25 L 85 5 L 60 15 Z"
            fill="#0ae6df"
            stroke="#0ae6df"
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* Skull SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-[85%] h-[85%] drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_16px_16px_rgba(0,0,0,0.7)] transition-all duration-300"
        >
          {/* Main Skull Outline & Fill */}
          <path
            d="M 50 15 
                   C 20 15, 15 45, 25 60
                   C 28 65, 30 70, 35 70
                   L 35 85
                   C 35 90, 65 90, 65 85
                   L 65 70
                   C 70 70, 72 65, 75 60
                   C 85 45, 80 15, 50 15 Z"
            fill="#fdfbf7"
            stroke="#1a1a1a"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Grungy Shading / Texture Lines */}
          <path
            d="M 30 25 C 35 20, 45 18, 55 20"
            fill="none"
            stroke="#d4c9b8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 28 32 C 30 30, 35 28, 40 29"
            fill="none"
            stroke="#d4c9b8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 72 32 C 70 30, 65 28, 60 29"
            fill="none"
            stroke="#d4c9b8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Small Top Crack */}
          <path
            d="M 55 15 L 53 23 L 57 28"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Large Black Eye Sockets */}
          <path
            d="M 30 45 C 25 35, 40 30, 45 40 C 50 50, 35 55, 30 45 Z"
            fill="#1a1a1a"
          />
          <path
            d="M 70 45 C 75 35, 60 30, 55 40 C 50 50, 65 55, 70 45 Z"
            fill="#1a1a1a"
          />

          {/* Cute Eye Catchlights (Reflections) */}
          <circle cx="34" cy="40" r="2.5" fill="#fdfbf7" />
          <circle cx="66" cy="40" r="2.5" fill="#fdfbf7" />

          {/* Nose Cavity (Upside-down Heart) */}
          <path
            d="M 50 50 C 46 50, 44 56, 50 60 C 56 56, 54 50, 50 50 Z"
            fill="#1a1a1a"
            stroke="#1a1a1a"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Teeth / Jaw Lines */}
          <line
            x1="42.5"
            y1="70"
            x2="42.5"
            y2="85"
            stroke="#1a1a1a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="70"
            x2="50"
            y2="86"
            stroke="#1a1a1a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="57.5"
            y1="70"
            x2="57.5"
            y2="85"
            stroke="#1a1a1a"
            strokeWidth="3"
            strokeLinecap="round"
          />
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
  <svg
    viewBox="0 0 20 20"
    className={`w-6 h-6 ${className}`}
    fill="none"
    stroke="#0ae6df"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4 L16 16 M16 4 L4 16" />
  </svg>
);

const Bone = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`w-12 h-12 ${className}`}>
    <path
      d="M30,40 C20,30 30,20 40,30 L60,30 C70,20 80,30 70,40 C80,50 70,60 60,50 L40,50 C30,60 20,50 30,40 Z"
      fill="#fdfbf7"
      stroke="#1a1a1a"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <line
      x1="43"
      y1="40"
      x2="57"
      y2="40"
      stroke="#d4c9b8"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);
