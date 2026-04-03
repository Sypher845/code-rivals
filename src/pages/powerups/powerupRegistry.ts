import type { ComponentType } from "react";
import { FlashbangCard } from "../../assets/power_card/FlashbangCard";
import { KeySwapCard } from "../../assets/power_card/KeySwapCard";
import { LineJumperCard } from "../../assets/power_card/LineJumperCard";
import { MirrorShieldCard } from "../../assets/power_card/MirrorShieldCard";
import { NoMistakesCard } from "../../assets/power_card/NoMistakesCard";
import { SkullCard } from "../../assets/power_card/NoRetreat";
import { TimeHeistCard } from "../../assets/power_card/TimeHeistCard";
import { TimeKumCard } from "../../assets/power_card/TimeKumCard";
import { VisuallyImpairedCard } from "../../assets/power_card/VisuallyImpairedCard";

export type PowerCardComponentProps = {
  size?: number;
  label?: string;
  className?: string;
};

export type PowerupDescriptor = {
  id: string;
  Card: ComponentType<PowerCardComponentProps>;
  description: string;
};

export const POWER_CARD_REGISTRY: Record<string, Omit<PowerupDescriptor, "id">> = {
  FlashbangCard: {
    Card: FlashbangCard,
    description: "Editor switches to light theme with low contrast. Good luck reading.",
  },
  KeySwapCard: {
    Card: KeySwapCard,
    description: "Randomly swaps 4 keys. Muscle memory becomes your worst enemy.",
  },
  LineJumperCard: {
    Card: LineJumperCard,
    description: "Cursor jumps to random lines every 30 seconds. Flow state destroyed.",
  },
  MirrorShieldCard: {
    Card: MirrorShieldCard,
    description: "Blocks all incoming sabotage. Their attacks bounce right off you.",
  },
  NoMistakesCard: {
    Card: NoMistakesCard,
    description: "Backspace and delete disabled. Every keystroke is permanent.",
  },
  SkullCard: {
    Card: SkullCard,
    description: "Opponent cannot run test cases. Submit blind or not at all.",
  },
  TimeHeistCard: {
    Card: TimeHeistCard,
    description: "Snatch time from opponent and add to yours. Robbing them blind.",
  },
  TimeKumCard: {
    Card: TimeKumCard,
    description: "Steals time from opponent's clock. Their panic is your advantage.",
  },
  VisuallyImpairedCard: {
    Card: VisuallyImpairedCard,
    description: "Mirror your opponent's editor window. Watch them fight their own reflection.",
  },
};
