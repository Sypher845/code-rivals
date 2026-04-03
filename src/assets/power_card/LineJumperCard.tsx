import React from "react";

interface LineJumperCardProps {
  size?: number;
  label?: string;
  className?: string;
}

export const LineJumperCard: React.FC<LineJumperCardProps> = ({
  size = 280,
  label = "- LINE JUMPER -",
  className = "",
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`
        relative rounded-2xl bg-[#18261d] overflow-hidden group 
        transition-all duration-300 hover:scale-105 hover:-translate-y-2
        hover:shadow-[0_0_35px_rgba(0,255,102,0.45)] shadow-[0_10px_20px_rgba(0,0,0,0.4)] 
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
        <filter id="card-noise-jumper">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#card-noise-jumper)" />
      </svg>

      {/* Inner Vignette / Shadow */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.7)] pointer-events-none z-10" />

      {/* Background Decor: Dashed jumps & Up/Down arrows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <DashedPath1 className="absolute top-4 left-4 rotate-12 opacity-80" />
        <DashedPath2 className="absolute bottom-16 right-4 -rotate-12 opacity-70" />
        <DashedPath1 className="absolute top-1/3 right-12 rotate-[80deg] opacity-50 scale-75" />

        <UpDownArrow className="absolute top-12 right-1/4 rotate-12 opacity-80 scale-125" />
        <UpDownArrow className="absolute bottom-24 left-8 -rotate-12 opacity-70" />
        <UpDownArrow className="absolute top-1/2 left-6 rotate-45 opacity-60 scale-75" />

        {/* Subtle motion lines or blurs */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-[#00ff66] rounded-full opacity-[0.08] blur-xl" />
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-[#10b981] rounded-full opacity-[0.1] blur-lg" />
      </div>

      {/* Main Graphic Container */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center z-20 group-hover:-translate-y-1.5 transition-transform duration-300">
        {/* Bouncing Wave Aura SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute w-[140%] h-[140%] -z-10 animate-pulse drop-shadow-[0_0_20px_rgba(0,255,102,0.3)] -rotate-12"
        >
          {/* Squiggly sine-wave ribbon */}
          <path
            d="M -10 40 Q 5 10, 20 40 T 50 40 T 80 40 T 110 40
                   L 110 60 
                   Q 95 90, 80 60 T 50 60 T 20 60 T -10 60 Z"
            fill="#10b981"
            stroke="#00ff66"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner detail line */}
          <path
            d="M -10 50 Q 5 20, 20 50 T 50 50 T 80 50 T 110 50"
            stroke="#00ff66"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
          />
        </svg>

        {/* Pogo Stick & Text Cursor SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-[95%] h-[95%] drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_16px_16px_rgba(0,0,0,0.7)] transition-all duration-300"
        >
          {/* Top Handles */}
          <rect
            x="30"
            y="23"
            width="40"
            height="6"
            fill="#00ff66"
            rx="3"
            stroke="#1a1a1a"
            strokeWidth="2.5"
          />
          {/* Grips */}
          <rect
            x="28"
            y="21"
            width="10"
            height="10"
            fill="#2b2b2b"
            rx="2"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          <rect
            x="62"
            y="21"
            width="10"
            height="10"
            fill="#2b2b2b"
            rx="2"
            stroke="#1a1a1a"
            strokeWidth="2"
          />

          {/* Main Shaft */}
          <rect
            x="46"
            y="26"
            width="8"
            height="34"
            fill="#e2dcd0"
            stroke="#1a1a1a"
            strokeWidth="2.5"
          />
          {/* Shaft Highlight */}
          <line
            x1="48"
            y1="28"
            x2="48"
            y2="58"
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.8"
            strokeLinecap="round"
          />

          {/* Foot Rests */}
          <rect
            x="32"
            y="58"
            width="36"
            height="8"
            fill="#10b981"
            rx="4"
            stroke="#1a1a1a"
            strokeWidth="2.5"
          />
          {/* Foot rest tread details */}
          <line
            x1="36"
            y1="62"
            x2="42"
            y2="62"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="58"
            y1="62"
            x2="64"
            y2="62"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Lower Plunger (inside Spring) */}
          <rect
            x="47"
            y="66"
            width="6"
            height="14"
            fill="#8c8c8c"
            stroke="#1a1a1a"
            strokeWidth="2"
          />

          {/* Spring Coil (Tightly Compressed, ready to snap!) */}
          <g>
            {/* Thick outline stroke */}
            <path
              d="M 50 66 L 36 68.5 L 64 71 L 36 73.5 L 64 76 L 50 79"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner fill stroke */}
            <path
              d="M 50 66 L 36 68.5 L 64 71 L 36 73.5 L 64 76 L 50 79"
              fill="none"
              stroke="#d4c9b8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Spring highlight for 3D effect */}
            <path
              d="M 46 67 L 36 68.5 L 50 70 M 36 73.5 L 50 75"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.7"
            />
          </g>

          {/* Stress lines radiating from the squished spring */}
          <path
            d="M 28 66 L 24 64 M 28 72 L 22 72 M 30 78 L 26 82"
            stroke="#fdfbf7"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 72 66 L 76 64 M 72 72 L 78 72 M 70 78 L 74 82"
            stroke="#fdfbf7"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Text Cursor (I-Beam) Tip */}
          <g className="cursor-tip">
            {/* Outline */}
            <path
              d="M 42 79 L 58 79 M 50 79 L 50 95 M 42 95 L 58 95"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner White */}
            <path
              d="M 42 79 L 58 79 M 50 79 L 50 95 M 42 95 L 58 95"
              fill="none"
              stroke="#fdfbf7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Motion / Bounce Impact Curves under the cursor */}
          <path
            d="M 38 98 Q 50 102, 62 98"
            fill="none"
            stroke="#00ff66"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M 44 102 Q 50 105, 56 102"
            fill="none"
            stroke="#00ff66"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Label Box */}
      <div className="absolute bottom-4 z-30 group-hover:bottom-5 transition-all duration-300">
        <div className="bg-[#fdfbf7] text-[#1a1a1a] px-4 py-1.5 rounded-lg border-[2.5px] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transform -rotate-1 group-hover:rotate-0 transition-transform">
          <span className="font-black uppercase tracking-[0.15em] text-sm font-sans drop-shadow-sm select-none">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents for Decorative Assets ---

const DashedPath1 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`w-24 h-24 ${className}`}>
    <path
      d="M 10 80 C 20 20, 60 80, 90 20"
      fill="none"
      stroke="#00ff66"
      strokeWidth="2.5"
      strokeDasharray="6 6"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

const DashedPath2 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={`w-32 h-32 ${className}`}>
    <path
      d="M 10 50 C 30 10, 70 90, 90 50"
      fill="none"
      stroke="#10b981"
      strokeWidth="2"
      strokeDasharray="4 6"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);

const UpDownArrow = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-6 h-6 ${className}`}
    fill="none"
    stroke="#00ff66"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 4 L12 20" />
    <path d="M8 8 L12 4 L16 8" />
    <path d="M8 16 L12 20 L16 16" />
  </svg>
);
