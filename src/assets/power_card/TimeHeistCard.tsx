import React from "react";

interface TimeHeistCardProps {
  size?: number;
  label?: string;
  className?: string;
}

export const TimeHeistCard: React.FC<TimeHeistCardProps> = ({
  size = 280,
  label = "- TIME HEIST -",
  className = "",
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`
        relative rounded-2xl bg-[#2b1f3a] overflow-hidden group 
        transition-all duration-300 hover:scale-105 hover:-translate-y-2
        hover:shadow-[0_0_35px_rgba(255,140,0,0.45)] shadow-[0_10px_20px_rgba(0,0,0,0.4)] 
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
        <filter id="card-noise-heist">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#card-noise-heist)" />
      </svg>

      {/* Inner Vignette / Shadow */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.7)] pointer-events-none z-10" />

      {/* Background Decor: Plus signs & Gold Coins */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Plus className="absolute top-8 left-8 rotate-12 opacity-80 scale-125" />
        <Plus className="absolute bottom-20 left-6 -rotate-12 opacity-70" />
        <Plus className="absolute top-1/4 right-6 rotate-45 opacity-60 scale-75" />

        {/* Speed / Motion lines */}
        <SpeedLine className="absolute top-12 left-1/3 rotate-[15deg] opacity-70" />
        <SpeedLine className="absolute bottom-1/4 right-1/4 -rotate-[45deg] opacity-50 scale-110" />
        <SpeedLine className="absolute top-1/3 left-1/4 rotate-[60deg] opacity-60 scale-75" />
        <SpeedLine className="absolute bottom-10 right-10 -rotate-[15deg] opacity-80" />

        {/* Little Gold Coins */}
        <Coin className="absolute top-16 right-12 scale-50 opacity-90 drop-shadow-sm rotate-[10deg]" />
        <Coin className="absolute bottom-16 left-1/3 scale-75 opacity-80 drop-shadow-md -rotate-[25deg]" />
        <Coin className="absolute top-2/3 right-8 scale-50 opacity-90 drop-shadow-sm rotate-[45deg]" />
      </div>

      {/* Main Graphic Container */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center z-20 group-hover:-translate-y-1.5 transition-transform duration-300">
        {/* Warning Orange Aura / Vault Diamond Hexagon SVG */}
        <svg
          viewBox="0 0 100 100"
          className="absolute w-[125%] h-[125%] -z-10 animate-pulse drop-shadow-[0_0_20px_rgba(255,140,0,0.5)]"
        >
          {/* Vault Door Hexagon / Diamond background shape */}
          <polygon
            points="50,0 85,25 85,75 50,100 15,75 15,25"
            fill="#ff8c00"
            stroke="#ff8c00"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Vault inner ring detail */}
          <polygon
            points="50,10 75,30 75,70 50,90 25,70 25,30"
            fill="none"
            stroke="#2b1f3a"
            strokeWidth="2"
            strokeLinejoin="round"
            opacity="0.3"
          />
        </svg>

        {/* Burglar Pocket Watch SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-[95%] h-[95%] drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_16px_16px_rgba(0,0,0,0.7)] transition-all duration-300"
        >
          {/* Stem connecting crown to the watch boundary */}
          <path
            d="M 46 10 L 46 20 L 54 20 L 54 10 Z"
            fill="#ffd60a"
            stroke="#1a1a1a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Top Pocket Watch Crown / Winding Knob */}
          <path
            d="M 42 12 L 42 6 C 42 4, 44 2, 50 2 C 56 2, 58 4, 58 6 L 58 12 Z"
            fill="#d4c9b8"
            stroke="#1a1a1a"
            strokeWidth="2.5"
          />
          <path
            d="M 44 6 L 56 6"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          <path
            d="M 44 9 L 56 9"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
          />

          {/* Pocket Watch Ring/Chain Hoop */}
          <circle
            cx="50"
            cy="2"
            r="5"
            fill="none"
            stroke="#d4c9b8"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="2"
            r="6"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="1.5"
          />
          <circle
            cx="50"
            cy="2"
            r="4"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="1.5"
          />

          {/* Main Watch Body */}
          {/* Outer Gold/Brass Case */}
          <circle
            cx="50"
            cy="55"
            r="38"
            fill="#ffd60a"
            stroke="#1a1a1a"
            strokeWidth="3"
          />
          {/* Inner Case Bezel */}
          <circle
            cx="50"
            cy="55"
            r="34"
            fill="#ffaa00"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          {/* White Clock Face */}
          <circle
            cx="50"
            cy="55"
            r="30"
            fill="#fdfbf7"
            stroke="#1a1a1a"
            strokeWidth="2"
          />

          {/* Clock Tick Marks / Numerals */}
          <g stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
            <line x1="50" y1="28" x2="50" y2="33" /> {/* 12 */}
            <line x1="50" y1="82" x2="50" y2="77" /> {/* 6 */}
            <line x1="23" y1="55" x2="28" y2="55" /> {/* 9 */}
            <line x1="77" y1="55" x2="72" y2="55" /> {/* 3 */}
            <line x1="36" y1="31" x2="38" y2="35" strokeWidth="1.5" />{" "}
            {/* 10/11 */}
            <line x1="64" y1="31" x2="62" y2="35" strokeWidth="1.5" />{" "}
            {/* 1/2 */}
            <line x1="36" y1="79" x2="38" y2="75" strokeWidth="1.5" />{" "}
            {/* 7/8 */}
            <line x1="64" y1="79" x2="62" y2="75" strokeWidth="1.5" />{" "}
            {/* 4/5 */}
          </g>

          {/* The Burglar Mask (Black Band over the upper half of the face) */}
          <g transform="translate(0, 0)">
            <path
              d="M 22 45 C 30 35, 70 35, 78 45 C 80 50, 78 58, 70 60 C 65 61, 55 56, 50 56 C 45 56, 35 61, 30 60 C 22 58, 20 50, 22 45 Z"
              fill="#2b2b2b"
              stroke="#1a1a1a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Mask ties/knots blowing in the wind on the left side */}
            <path
              d="M 22 48 Q 12 40, 5 45"
              fill="none"
              stroke="#2b2b2b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 20 52 Q 10 50, 2 58"
              fill="none"
              stroke="#2b2b2b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Black stroke outlines for the ties */}
            <path
              d="M 22 48 Q 12 40, 5 45"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M 20 52 Q 10 50, 2 58"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>

          {/* Clock Hands acting as Eyes peeking through the mask */}
          {/* Eye Cutouts in the mask */}
          <ellipse
            cx="38"
            cy="50"
            rx="8"
            ry="5"
            fill="#fdfbf7"
            stroke="#1a1a1a"
            strokeWidth="1.5"
          />
          <ellipse
            cx="62"
            cy="50"
            rx="8"
            ry="5"
            fill="#fdfbf7"
            stroke="#1a1a1a"
            strokeWidth="1.5"
          />

          {/* The Hands / Pupils (Looking shiftily to the left) */}
          {/* Minute Hand (Left Eye) */}
          <g transform="translate(38, 50) rotate(-45)">
            <path
              d="M 0 3 L 0 -12 L -2 -14 L 2 -14 L 0 -12"
              fill="#ff8c00"
              stroke="#1a1a1a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="0" cy="0" r="2" fill="#1a1a1a" />
          </g>

          {/* Hour Hand (Right Eye) */}
          <g transform="translate(62, 50) rotate(-60)">
            <path
              d="M 0 3 L 0 -8 L -2 -10 L 2 -10 L 0 -8"
              fill="#1a1a1a"
              stroke="#1a1a1a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="0" cy="0" r="2" fill="#ff8c00" />
          </g>

          {/* Tiny sweat drop / worry line for the shifty eyes */}
          <path
            d="M 72 40 Q 70 45, 74 48"
            fill="none"
            stroke="#0ae6df"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Lower Clock Face details (below the mask) */}
          {/* Little Second Hand Dial */}
          <circle
            cx="50"
            cy="70"
            r="6"
            fill="none"
            stroke="#d4c9b8"
            strokeWidth="1"
          />
          <line
            x1="50"
            y1="70"
            x2="52"
            y2="66"
            stroke="#ff8c00"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="50" cy="70" r="1" fill="#1a1a1a" />

          {/* Glass Reflection/Shine over the whole watch face */}
          <path
            d="M 28 35 C 35 25, 65 25, 72 35 C 60 28, 40 28, 28 35 Z"
            fill="#ffffff"
            opacity="0.6"
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

const Plus = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    className={`w-6 h-6 ${className}`}
    fill="none"
    stroke="#ff8c00"
    strokeWidth="3.5"
    strokeLinecap="round"
  >
    <path d="M10 2 L10 18 M2 10 L18 10" />
  </svg>
);

const SpeedLine = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-8 h-8 ${className}`}>
    <line
      x1="2"
      y1="10"
      x2="14"
      y2="10"
      stroke="#fdfbf7"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.8"
    />
    <line
      x1="8"
      y1="14"
      x2="18"
      y2="14"
      stroke="#ff8c00"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
    <line
      x1="5"
      y1="6"
      x2="12"
      y2="6"
      stroke="#ffaa00"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const Coin = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={`w-6 h-6 ${className}`}>
    <circle
      cx="10"
      cy="10"
      r="8"
      fill="#ffd60a"
      stroke="#1a1a1a"
      strokeWidth="1.5"
    />
    <circle
      cx="10"
      cy="10"
      r="5"
      fill="none"
      stroke="#ffaa00"
      strokeWidth="1.5"
    />
    <line
      x1="10"
      y1="6"
      x2="10"
      y2="14"
      stroke="#1a1a1a"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <line
      x1="8"
      y1="8"
      x2="12"
      y2="8"
      stroke="#1a1a1a"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <line
      x1="8"
      y1="12"
      x2="12"
      y2="12"
      stroke="#1a1a1a"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);
