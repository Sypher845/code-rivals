export type PowerupRoundTime = readonly [
  round1Minutes: number,
  round2Minutes: number,
  round3Minutes: number,
];

export type PowerupEffectTarget = "editor";

export type PowerupEffectHandlerKey =
  | "applyFlashbangEffect"
  | "applyLineJumperEffect"
  | "applyNoRetreatEffect";

export type PowerupEffectConfig = {
  fullRound: boolean;
  handlerKey: PowerupEffectHandlerKey;
  roundTime: PowerupRoundTime;
  target: PowerupEffectTarget;
};

export type PowerupEffectMap = Record<string, PowerupEffectConfig>;

export const TIME_KUM_ROUND_PENALTY_SECONDS = [60, 120, 180] as const;

export const POWERUP_EFFECTS_MAP = {
  FlashbangCard: {
    fullRound: false,
    handlerKey: "applyFlashbangEffect",
    roundTime: [2, 4, 7],
    target: "editor",
  },
  LineJumperCard: {
    fullRound: true,
    handlerKey: "applyLineJumperEffect",
    roundTime: [0, 0, 0],
    target: "editor",
  },
  SkullCard: {
    fullRound: false,
    handlerKey: "applyNoRetreatEffect",
    roundTime: [2, 4, 7],
    target: "editor",
  },
} as const satisfies PowerupEffectMap;

const POWERUP_DISPLAY_NAMES: Record<string, string> = {
  FlashbangCard: "Flashbang",
  KeySwapCard: "Key Swap",
  LineJumperCard: "Line Jumper",
  MirrorShieldCard: "Mirror Shield",
  NoMistakesCard: "No Mistakes",
  SkullCard: "No Retreat",
  TimeHeistCard: "Time Heist",
  TimeKumCard: "Time Kum",
  VisuallyImpairedCard: "Visually Impaired",
};

export function getPowerupEffectConfig(powerupId: string) {
  if (!(powerupId in POWERUP_EFFECTS_MAP)) {
    return null;
  }

  return POWERUP_EFFECTS_MAP[powerupId as keyof typeof POWERUP_EFFECTS_MAP];
}

export function formatPowerupName(powerupId: string) {
  if (powerupId in POWERUP_DISPLAY_NAMES) {
    return POWERUP_DISPLAY_NAMES[powerupId];
  }

  return powerupId.replace(/Card$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function getPassiveTimePenaltySeconds(
  powerupId: string,
  roundNumber: number,
) {
  if (powerupId !== "TimeKumCard") {
    return 0;
  }

  const roundIndex = Math.min(Math.max(roundNumber, 1), 3) - 1;
  return TIME_KUM_ROUND_PENALTY_SECONDS[roundIndex] ?? 0;
}

export function powerupRequiresManualActivation(powerupId: string) {
  return powerupId !== "TimeKumCard" && powerupId !== "TimeHeistCard";
}

export function getPowerupDurationMinutes(
  powerupId: string,
  roundNumber: number,
) {
  const config = getPowerupEffectConfig(powerupId);
  if (!config) {
    return null;
  }

  if (config.fullRound) {
    return null;
  }

  const roundIndex = Math.min(Math.max(roundNumber, 1), 3) - 1;
  return config.roundTime[roundIndex] ?? null;
}

export type ResolvedPowerupEffect = PowerupEffectConfig & {
  durationMinutes: number | null;
  powerupId: string;
};

export function resolvePowerupEffect(
  powerupId: string,
  roundNumber: number,
): ResolvedPowerupEffect | null {
  const config = getPowerupEffectConfig(powerupId);
  if (!config) {
    return null;
  }

  return {
    ...config,
    durationMinutes: getPowerupDurationMinutes(powerupId, roundNumber),
    powerupId,
  };
}
