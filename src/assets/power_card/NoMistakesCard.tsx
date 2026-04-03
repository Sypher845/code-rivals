import React from "react";

interface NoMistakesCardProps {
  size?: number;
  label?: string;
  className?: string;
}

export const NoMistakesCard: React.FC<NoMistakesCardProps> = ({
  size = 280,
  label = "- NO MISTAKES -",
  className = "",
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`
        relative rounded-2xl bg-[#261f10] overflow-hidden group 
        transition-all duration-300 hover:scale-105 hover:-translate-y-2
        hover:shadow-[0_0_35px_rgba(251,191,36,0.45)] shadow-[0_10px_20px_rgba(0,0,0,0.4)] 
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
        <filter id="card-noise-nomistakes">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#card-noise-nomistakes)" />
      </svg>

      {/* Inner Vignette / Shadow */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.7)] pointer-events-none z-10" />

      {/* Background Decor: Padlocks, X marks, Sweat Drops */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Padlock className="absolute top-8 left-8 rotate-12 opacity-80 scale-110" />
        <Padlock className="absolute bottom-16 right-8 -rotate-12 opacity-70 scale-90" />
        <Padlock className="absolute top-1/2 left-4 rotate-[45deg] opacity-50 scale-75" />

        <CrossMark className="absolute top-10 right-1/4 rotate-12 opacity-90 scale-125" />
        <CrossMark className="absolute bottom-20 left-10 -rotate-[25deg] opacity-80" />
        <CrossMark className="absolute top-1/4 right-10 rotate-[45deg] opacity-60 scale-75" />

        <SweatDrop className="absolute top-16 right-8 rotate-12 opacity-70 scale-90" />
        <SweatDrop className="absolute bottom-12 left-1/3 -rotate-[15deg] opacity-60 scale-75" />
        <SweatDrop className="absolute top-1/3 left-1/4 rotate-[30deg] opacity-50 scale-50" />

        {/* Subtle motion blurs for the golden theme */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-[#fbbf24] rounded-full opacity-[0.1] blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-[#f59e0b] rounded-full opacity-[0.15] blur-xl" />
      </div>

      {/* Main Graphic Container */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center z-20 group-hover:-translate-y-1.5 transition-transform duration-300">
        {/* Spinning Starburst Background Shape SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute w-[160%] h-[160%] -z-10 group-hover:rotate-[15deg] transition-transform duration-[2000ms] drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
        >
          {/* Animated Starburst Base */}
          <path
            d="M 50 5 L 56 34 L 82 18 L 68 44 L 95 50 L 68 56 L 82 82 L 56 66 L 50 95 L 44 66 L 18 82 L 32 56 L 5 50 L 32 44 L 18 18 L 44 34 Z"
            fill="#f59e0b"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner ring detail */}
          <path
            d="M 50 15 L 54 38 L 75 25 L 64 46 L 85 50 L 64 54 L 75 75 L 54 62 L 50 85 L 46 62 L 25 75 L 36 54 L 15 50 L 36 46 L 25 25 L 46 38 Z"
            fill="none"
            stroke="#261f10"
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity="0.3"
          />
        </svg>

        {/* 😎 Face SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-[90%] h-[90%] drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_16px_16px_rgba(0,0,0,0.7)] transition-all duration-300"
        >
          {/* Main Face Circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="#ffd60a"
            stroke="#1a1a1a"
            strokeWidth="4"
          />

          {/* Inner Shading / Dimension */}
          <path
            d="M 12 50 A 38 38 0 0 0 88 50 A 38 45 0 0 1 12 50 Z"
            fill="#ffaa00"
            opacity="0.5"
          />
          {/* Top highlight */}
          <path
            d="M 20 30 A 38 38 0 0 1 80 30 A 35 25 0 0 0 20 30 Z"
            fill="#ffffff"
            opacity="0.4"
          />

          {/* Confident Smile */}
          <g transform="translate(0, 5)">
            <path
              d="M 30 65 Q 50 78, 70 65"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>

          {/* The Cool Sunglasses (Aviator style) */}
          <g transform="translate(0, -2)">
            {/* Bridge / Frame connecting the lenses */}
            <path
              d="M 38 29 L 62 29"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 44 33 Q 50 30, 56 33"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Left Lens */}
            <path
              d="M 18 32 C 25 28, 40 28, 45 33 C 48 42, 42 54, 32 56 C 20 58, 14 45, 18 32 Z"
              fill="#1a1a1a"
              stroke="#1a1a1a"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* Right Lens */}
            <path
              d="M 82 32 C 75 28, 60 28, 55 33 C 52 42, 58 54, 68 56 C 80 58, 86 45, 82 32 Z"
              fill="#1a1a1a"
              stroke="#1a1a1a"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* Lens Gloss / Reflection highlights */}
            <path
              d="M 22 34 C 28 31, 38 31, 42 34 L 38 42 C 30 38, 24 40, 22 34 Z"
              fill="#ffffff"
              opacity="0.25"
            />
            <path
              d="M 78 34 C 72 31, 62 31, 58 34 L 62 42 C 70 38, 76 40, 78 34 Z"
              fill="#ffffff"
              opacity="0.25"
            />

            <path
              d="M 22 46 L 28 36 M 26 49 L 32 39"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M 62 46 L 68 36 M 66 49 L 72 39"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* Sunglasses Arms going to the sides of the head */}
            <path
              d="M 18 32 L 6 30"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 82 32 L 94 30"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          {/* Large Ironic Sweat Drop on the Forehead */}
          <g className="sweat-drop" transform="translate(65, 10)">
            <path
              d="M 10 5 C 10 5, 5 15, 5 20 C 5 25, 15 25, 15 20 C 15 15, 10 5, 10 5 Z"
              fill="#00a8ff"
              stroke="#1a1a1a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M 8 18 Q 8 22, 12 22"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Stress lines radiating from sweat drop */}
            <path
              d="M 2 10 L -2 6 M 18 10 L 22 6 M 10 -2 L 10 -6"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {/* Label Box */}
      <div className="absolute bottom-4 z-30 group-hover:bottom-5 transition-all duration-300">
        <div className="bg-[#fdfbf7] text-[#1a1a1a] px-4 py-1.5 rounded-lg border-[2.5px] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transform rotate-2 group-hover:rotate-0 transition-transform">
          <span className="font-black uppercase tracking-[0.1em] text-[13px] font-sans drop-shadow-sm select-none">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents for Decorative Assets ---

const Padlock = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`w-8 h-8 ${className}`}>
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      fill="#f59e0b"
      stroke="#fbbf24"
      strokeWidth="2"
      rx="2"
      strokeLinejoin="round"
    />
    <path
      d="M 8 11 V 7 C 8 4, 16 4, 16 7 V 11"
      fill="none"
      stroke="#fbbf24"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="12" cy="15" r="1.5" fill="#261f10" />
    <path
      d="M 12 16.5 L 12 18"
      stroke="#261f10"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CrossMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-6 h-6 ${className}`}
    fill="none"
    stroke="#ff003c"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <path d="M 6 6 L 18 18" />
    <path d="M 18 6 L 6 18" />
  </svg>
);

const SweatDrop = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-5 h-5 ${className}`}>
    <path
      d="M 10 2 C 10 2, 4 10, 4 14 C 4 17, 16 17, 16 14 C 16 10, 10 2, 10 2 Z"
      fill="#00a8ff"
      stroke="#007bff"
      strokeWidth="1.5"
      strokeLinejoin="round"
      opacity="0.8"
    />
    <path
      d="M 7 12 Q 7 15, 10 16"
      fill="none"
      stroke="#ffffff"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);
