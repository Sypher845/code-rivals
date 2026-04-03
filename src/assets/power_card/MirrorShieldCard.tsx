import React from "react";

interface MirrorShieldCardProps {
  size?: number;
  label?: string;
  className?: string;
}

export const MirrorShieldCard: React.FC<MirrorShieldCardProps> = ({
  size = 280,
  label = "- MIRROR SHIELD -",
  className = "",
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`
        relative rounded-2xl bg-[#0d1726] overflow-hidden group 
        transition-all duration-300 hover:scale-105 hover:-translate-y-2
        hover:shadow-[0_0_35px_rgba(0,123,255,0.45)] shadow-[0_10px_20px_rgba(0,0,0,0.4)] 
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
        <filter id="card-noise-shield">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#card-noise-shield)" />
      </svg>

      {/* Inner Vignette / Shadow */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.7)] pointer-events-none z-10" />

      {/* Background Decor: Sparkles & Metallic Rivets */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Sparkle className="absolute top-10 left-10 opacity-80 scale-125 rotate-12" />
        <Sparkle className="absolute bottom-20 right-8 opacity-60 scale-75 -rotate-12" />
        <Sparkle className="absolute top-1/3 right-12 opacity-90 scale-90 rotate-45" />
        <Sparkle className="absolute bottom-1/3 left-6 opacity-50 scale-50" />

        <Rivet className="absolute top-8 right-8 opacity-90" />
        <Rivet className="absolute bottom-8 left-10 opacity-80" />
        <Rivet className="absolute top-1/2 right-6 opacity-70 scale-75" />
        <Rivet className="absolute top-1/4 left-1/4 opacity-60 scale-90" />

        {/* Subtle motion blurs for the blue theme */}
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-[#007bff] rounded-full opacity-[0.1] blur-xl" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-[#00a8ff] rounded-full opacity-[0.15] blur-lg" />
      </div>

      {/* Main Graphic Container */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center z-20 group-hover:-translate-y-1.5 transition-transform duration-300">
        {/* Thick Solid Circle Background Shape SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute w-[120%] h-[120%] -z-10 animate-pulse drop-shadow-[0_0_20px_rgba(0,123,255,0.4)]"
        >
          {/* Outer thick ring */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="#152b40"
            stroke="#007bff"
            strokeWidth="8"
          />
          {/* Inner concentric ring */}
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="#00a8ff"
            strokeWidth="3"
            opacity="0.5"
          />
          <circle
            cx="50"
            cy="50"
            r="24"
            fill="none"
            stroke="#00a8ff"
            strokeWidth="1"
            opacity="0.3"
          />
        </svg>

        {/* Knight's Shield & Bouncing Arrow SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-[95%] h-[95%] drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_16px_16px_rgba(0,0,0,0.7)] transition-all duration-300"
        >
          {/* Knight's Shield Base (Silver/Grey Border) */}
          <path
            d="M 50 12 Q 75 12, 80 28 Q 80 65, 50 92 Q 20 65, 20 28 Q 25 12, 50 12 Z"
            fill="#e2dcd0"
            stroke="#1a1a1a"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Shield Inner Core (Glossy Blue) */}
          <path
            d="M 50 19 Q 69 19, 73 31 Q 73 60, 50 83 Q 27 60, 27 31 Q 31 19, 50 19 Z"
            fill="#007bff"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Inner Core Highlight/Gradient illusion */}
          <path
            d="M 50 22 Q 66 22, 69 32 Q 69 58, 50 78 Q 31 58, 31 32 Q 34 22, 50 22 Z"
            fill="#00a8ff"
            opacity="0.5"
          />

          {/* Engraved < > Brackets */}
          <g strokeLinecap="round" strokeLinejoin="round">
            {/* Deep engraving shadow */}
            <path
              d="M 44 38 L 34 50 L 44 62 M 56 38 L 66 50 L 56 62"
              fill="none"
              stroke="#002b5e"
              strokeWidth="4.5"
            />
            {/* Bright highlight to create 3D bevel */}
            <path
              d="M 44 40 L 34 50 L 44 60 M 56 40 L 66 50 L 56 60"
              fill="none"
              stroke="#99ccff"
              strokeWidth="2"
            />
          </g>

          {/* Super Glossy White Overlay on the Shield */}
          <path
            d="M 50 19 Q 31 19, 27 31 Q 27 55, 38 68 Q 45 40, 70 25 Q 60 19, 50 19 Z"
            fill="#ffffff"
            opacity="0.35"
          />

          {/* Aggressive Red Arrow (Bouncing / Bending Backwards) */}
          <g className="bouncing-arrow">
            {/* Impact Sparks at Center */}
            <path
              d="M 50 50 L 40 40 M 50 50 L 42 60 M 50 50 L 52 38 M 50 50 L 58 60"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle cx="50" cy="50" r="4" fill="#ffffff" />

            {/* Arrow Outlines (Drawn underneath for clean borders) */}
            <path
              d="M 95 75 L 50 50 L 65 20"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polygon
              points="58,15 75,5 72,25"
              fill="#1a1a1a"
              stroke="#1a1a1a"
              strokeWidth="5"
              strokeLinejoin="round"
            />

            {/* Arrow Shaft Fill (Crimson Red) */}
            <path
              d="M 95 75 L 50 50 L 65 20"
              fill="none"
              stroke="#ff003c"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Arrowhead Fill (Crimson Red) */}
            <polygon points="58,15 75,5 72,25" fill="#ff003c" />

            {/* Inner Highlight for the Arrow (Adds aggression & speed) */}
            <path
              d="M 93 73 L 50 50 L 63 22"
              fill="none"
              stroke="#ff809f"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polygon points="62,16 72,8 69,23" fill="#ff809f" />

            {/* Fracture / Crack in the arrow at the bend point */}
            <path
              d="M 45 45 L 51 49 L 48 51 L 55 55"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Broken shards flying off */}
            <polygon
              points="58,40 61,38 60,42"
              fill="#ff003c"
              stroke="#1a1a1a"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <polygon
              points="40,55 38,58 42,59"
              fill="#ff003c"
              stroke="#1a1a1a"
              strokeWidth="1"
              strokeLinejoin="round"
            />
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

const Sparkle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-6 h-6 ${className}`}>
    <path
      d="M 10 0 Q 10 10 20 10 Q 10 10 10 20 Q 10 10 0 10 Q 10 10 10 0 Z"
      fill="#66b3ff"
    />
    <circle cx="10" cy="10" r="2" fill="#ffffff" />
  </svg>
);

const Rivet = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-5 h-5 ${className}`}>
    <circle
      cx="10"
      cy="10"
      r="8"
      fill="#8c99a6"
      stroke="#1a1a1a"
      strokeWidth="2"
    />
    {/* Inner shadow/highlight for metallic feel */}
    <circle
      cx="10"
      cy="10"
      r="5"
      fill="none"
      stroke="#e2dcd0"
      strokeWidth="1"
      opacity="0.6"
    />
    <circle cx="8" cy="8" r="2" fill="#ffffff" opacity="0.8" />
  </svg>
);
