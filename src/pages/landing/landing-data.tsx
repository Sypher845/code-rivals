import type { ComponentType, SVGProps } from "react";
import type { LucideProps } from "lucide-react";
import {
  Activity,
  BarChart3,
  Ban,
  Clock3,
  Crosshair,
  Eye,
  EyeOff,
  GitBranch,
  Keyboard,
  Layers3,
  Lock,
  Move,
  Shield,
  Timer,
  Trophy,
  UserPlus,
  Zap,
} from "lucide-react";

export type IconType = ComponentType<SVGProps<SVGSVGElement> & LucideProps>;

export type NavLink = {
  href: string;
  label: string;
};

export type Feature = {
  title: string;
  description: string;
  icon: IconType;
};

export type FlowStep = {
  step: string;
  title: string;
  description: string;
  icon: IconType;
};

export type Power = {
  name: string;
  description: string;
  tag: string;
  tagClassName: string;
  icon: IconType;
  iconClassName: string;
};

export type Stat = {
  label: string;
  value: string;
  valueClassName: string;
};

export const navLinks: NavLink[] = [
  { href: "#features", label: "Features" },
  { href: "#flow", label: "How it works" },
  { href: "#powers", label: "Superpowers" },
  { href: "#stats", label: "Leaderboard" },
];

export const featureList: Feature[] = [
  {
    title: "Realtime sync via SpacetimeDB",
    description:
      "Both players stay perfectly in sync. State updates push the instant anything changes, with no polling drift or refresh roulette.",
    icon: Zap,
  },
  {
    title: "Live opponent indicators",
    description:
      "Have live updates of what your opponent is doing.",
    icon: Activity,
  },
  {
    title: "Draft-phase sabotage",
    description:
      "Pick one superpower before every round and deploy it mid-match. Disruption is intentional, tactical, and part of winning.",
    icon: Shield,
  },
  {
    title: "ELO ratings and leagues",
    description:
      "Every duel rolls into league progression, rating swings, and a round-by-round breakdown that actually feels earned.",
    icon: BarChart3,
  },
];

export const flowSteps: FlowStep[] = [
  {
    step: "01",
    title: "Create your arena",
    description:
      "Sign up, get a permanent ELO identity, and open a room with one shareable invite link.",
    icon: UserPlus,
  },
  {
    step: "02",
    title: "Draft superpowers",
    description:
      "Before each round, both players lock one sabotage mechanic. No redraws, no do-overs.",
    icon: Crosshair,
  },
  {
    step: "03",
    title: "Race three rounds",
    description:
      "The timer escalates from 5 to 10 to 15 minutes while the problem set and pressure keep climbing.",
    icon: Trophy,
  },
];

export const powers: Power[] = [
  {
    name: "Key Stroke Swap",
    description:
      "Randomly swaps 4 keys. Muscle memory becomes your worst enemy.",
    tag: "Input",
    tagClassName:
      "border-[rgba(77,143,255,0.18)] bg-[rgba(77,143,255,0.1)] text-[var(--tertiary)]",
    icon: Keyboard,
    iconClassName: "text-[var(--tertiary)]",
  },
  {
    name: "No Retreat",
    description:
      "Backspace and delete disabled. Every keystroke is permanent, no second chances.",
    tag: "Restrict",
    tagClassName:
      "border-[rgba(255,112,112,0.18)] bg-[rgba(255,112,112,0.1)] text-[var(--signal-danger)]",
    icon: Ban,
    iconClassName: "text-[var(--signal-danger)]",
  },
  {
    name: "Flashbang",
    description:
      "Editor switches to light theme with low contrast. Good luck reading.",
    tag: "Visual",
    tagClassName:
      "border-[rgba(0,255,255,0.18)] bg-[rgba(0,255,255,0.08)] text-[var(--secondary)]",
    icon: EyeOff,
    iconClassName: "text-[var(--secondary)]",
  },
  {
    name: "Time Kum",
    description:
      "Steals time from opponent's clock. Their panic is your advantage.",
    tag: "Time",
    tagClassName:
      "border-[rgba(255,168,77,0.18)] bg-[rgba(255,168,77,0.1)] text-[var(--signal-warning)]",
    icon: Timer,
    iconClassName: "text-[var(--signal-warning)]",
  },
  {
    name: "Time Heist",
    description:
      "Snatch time from opponent and add to yours. Robbing them blind.",
    tag: "Time",
    tagClassName:
      "border-[rgba(255,168,77,0.18)] bg-[rgba(255,168,77,0.1)] text-[var(--signal-warning)]",
    icon: Clock3,
    iconClassName: "text-[var(--signal-warning)]",
  },
  {
    name: "Visually Impaired",
    description:
      "Mirror your opponent's editor window. Watch them fight their own reflection.",
    tag: "Visual",
    tagClassName:
      "border-[rgba(224,141,255,0.18)] bg-[rgba(224,141,255,0.1)] text-[var(--primary)]",
    icon: Eye,
    iconClassName: "text-[var(--primary)]",
  },
  {
    name: "Line Jumper",
    description:
      "Cursor jumps to random lines every 30 seconds. Flow state destroyed.",
    tag: "Disrupt",
    tagClassName:
      "border-[rgba(124,216,124,0.18)] bg-[rgba(124,216,124,0.1)] text-[var(--signal-success)]",
    icon: Move,
    iconClassName: "text-[var(--signal-success)]",
  },
  {
    name: "Mirror Shield",
    description:
      "Blocks all incoming sabotage. Their attacks bounce right off you.",
    tag: "Defense",
    tagClassName:
      "border-[rgba(77,143,255,0.18)] bg-[rgba(77,143,255,0.1)] text-[var(--tertiary)]",
    icon: Shield,
    iconClassName: "text-[var(--tertiary)]",
  },
  {
    name: "Full Confidence",
    description:
      "Opponent can't run test cases. Submit blind or not at all.",
    tag: "Restrict",
    tagClassName:
      "border-[rgba(255,112,112,0.18)] bg-[rgba(255,112,112,0.1)] text-[var(--signal-danger)]",
    icon: Lock,
    iconClassName: "text-[var(--signal-danger)]",
  },
];

export const stats: Stat[] = [
  {
    label: "Duels completed",
    value: "14k+",
    valueClassName: "text-[var(--primary)]",
  },
  {
    label: "Active players",
    value: "2,400",
    valueClassName: "text-[var(--secondary)]",
  },
  {
    label: "Avg. sync latency",
    value: "<80ms",
    valueClassName: "text-[var(--tertiary)]",
  },
  {
    label: "Active leagues",
    value: "3",
    valueClassName: "text-[var(--on-background)]",
  },
];

export const logoStrip = [
  "HackByte 4.0",
  "Codeforces",
  "LeetCode",
  "ICPC",
  "CodeChef"
];

export const topPowers = ["Key Swap", "Screen Glitch", "Time Freeze"];
