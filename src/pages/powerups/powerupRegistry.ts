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
    description:
      "Blasts the opponent's full coding screen white. Description, test cases, and editor all become nearly unreadable.",
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
    description:
      "Activates from round start without revealing itself. Any sabotage the opponent sends gets reflected back onto them.",
  },
  NoMistakesCard: {
    Card: NoMistakesCard,
    description:
      "Activates from round start. The opponent cannot use Run and only gets one submit for the round.",
  },
  SkullCard: {
    Card: SkullCard,
    description:
      "On activation, the opponent loses Backspace and Delete for the rest of the round. Every keystroke becomes permanent.",
  },
  TimeHeistCard: {
    Card: TimeHeistCard,
    description: "Snatch time from opponent and add to yours. Robbing them blind.",
  },
  TimeKumCard: {
    Card: TimeKumCard,
    description:
      "Starts active from the first second of the round. The opponent loses 1 minute in round 1, 2 minutes in round 2, and 3 minutes in round 3.",
  },
  VisuallyImpairedCard: {
    Card: VisuallyImpairedCard,
    description: "Mirror your opponent's editor window. Watch them fight their own reflection.",
  },
};
