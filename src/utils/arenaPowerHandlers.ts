import type { ResolvedPowerupEffect } from "./arenaPowerEffects";

export const DEFAULT_EDITOR_THEME_ID = "neonCommand" as const;
export const FLASHBANG_EDITOR_THEME_ID = "flashbangLowContrast" as const;
export const ZEN_EDITOR_THEME_ID = "zenMonochrome" as const;

export type EditorThemeId =
  | typeof DEFAULT_EDITOR_THEME_ID
  | typeof FLASHBANG_EDITOR_THEME_ID
  | typeof ZEN_EDITOR_THEME_ID;

export type EditorSabotageEffect = {
  expiresAtMs: number | null;
  flashbangActive: boolean;
  keySwapActive: boolean;
  keySwapMap: Record<string, string> | null;
  lineJumperActive: boolean;
  visuallyImpairedActive: boolean;
  noRetreatActive: boolean;
  powerupId: string;
  themeId: EditorThemeId;
};

type PowerupHandlerInput = {
  effect: ResolvedPowerupEffect;
  emittedAtMs: number;
};

type PowerupHandlerOutput = {
  editorEffect: EditorSabotageEffect | null;
};

function buildKeySwapMap() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const shuffledSources = [...alphabet];

  for (let index = shuffledSources.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffledSources[index];
    shuffledSources[index] = shuffledSources[swapIndex];
    shuffledSources[swapIndex] = current;
  }

  const selectedSources = shuffledSources.slice(0, Math.ceil(alphabet.length / 2));
  const keySwapMap: Record<string, string> = {};
  for (const source of selectedSources) {
    const possibleTargets = alphabet.filter((letter) => letter !== source);
    const target =
      possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
    if (!target) {
      continue;
    }

    keySwapMap[source] = target;
  }

  return keySwapMap;
}

function applyFlashbangEffect({
  effect,
  emittedAtMs,
}: PowerupHandlerInput): PowerupHandlerOutput {
  const expiresAtMs =
    effect.durationMinutes === null
      ? null
      : emittedAtMs + effect.durationMinutes * 60_000;

  return {
    editorEffect: {
      expiresAtMs,
      flashbangActive: true,
      keySwapActive: false,
      keySwapMap: null,
      lineJumperActive: false,
      visuallyImpairedActive: false,
      noRetreatActive: false,
      powerupId: effect.powerupId,
      themeId: FLASHBANG_EDITOR_THEME_ID,
    },
  };
}

function applyKeySwapEffect({
  effect,
  emittedAtMs,
}: PowerupHandlerInput): PowerupHandlerOutput {
  const expiresAtMs =
    effect.durationMinutes === null
      ? null
      : emittedAtMs + effect.durationMinutes * 60_000;

  return {
    editorEffect: {
      expiresAtMs,
      flashbangActive: false,
      keySwapActive: true,
      keySwapMap: buildKeySwapMap(),
      lineJumperActive: false,
      visuallyImpairedActive: false,
      noRetreatActive: false,
      powerupId: effect.powerupId,
      themeId: DEFAULT_EDITOR_THEME_ID,
    },
  };
}

function applyLineJumperEffect({
  effect,
  emittedAtMs,
}: PowerupHandlerInput): PowerupHandlerOutput {
  const expiresAtMs =
    effect.durationMinutes === null
      ? null
      : emittedAtMs + effect.durationMinutes * 60_000;

  return {
    editorEffect: {
      expiresAtMs,
      flashbangActive: false,
      keySwapActive: false,
      keySwapMap: null,
      lineJumperActive: true,
      visuallyImpairedActive: false,
      noRetreatActive: false,
      powerupId: effect.powerupId,
      themeId: DEFAULT_EDITOR_THEME_ID,
    },
  };
}

function applyVisuallyImpairedEffect({
  effect,
  emittedAtMs,
}: PowerupHandlerInput): PowerupHandlerOutput {
  const expiresAtMs =
    effect.durationMinutes === null
      ? null
      : emittedAtMs + effect.durationMinutes * 60_000;

  return {
    editorEffect: {
      expiresAtMs,
      flashbangActive: false,
      keySwapActive: false,
      keySwapMap: null,
      lineJumperActive: false,
      visuallyImpairedActive: true,
      noRetreatActive: false,
      powerupId: effect.powerupId,
      themeId: DEFAULT_EDITOR_THEME_ID,
    },
  };
}

function applyNoRetreatEffect({
  effect,
  emittedAtMs,
}: PowerupHandlerInput): PowerupHandlerOutput {
  const expiresAtMs =
    effect.durationMinutes === null
      ? null
      : emittedAtMs + effect.durationMinutes * 60_000;

  return {
    editorEffect: {
      expiresAtMs,
      flashbangActive: false,
      keySwapActive: false,
      keySwapMap: null,
      lineJumperActive: false,
      visuallyImpairedActive: false,
      noRetreatActive: true,
      powerupId: effect.powerupId,
      themeId: DEFAULT_EDITOR_THEME_ID,
    },
  };
}

const POWERUP_HANDLER_MAP = {
  applyFlashbangEffect,
  applyKeySwapEffect,
  applyLineJumperEffect,
  applyVisuallyImpairedEffect,
  applyNoRetreatEffect,
} as const;

export function executePowerupHandler(
  input: PowerupHandlerInput,
): PowerupHandlerOutput | null {
  const handler = POWERUP_HANDLER_MAP[input.effect.handlerKey];
  if (!handler) {
    return null;
  }

  return handler(input);
}
