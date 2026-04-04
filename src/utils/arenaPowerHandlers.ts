import type { ResolvedPowerupEffect } from "./arenaPowerEffects";

export const DEFAULT_EDITOR_THEME_ID = "neonCommand" as const;
export const FLASHBANG_EDITOR_THEME_ID = "flashbangLowContrast" as const;

export type EditorThemeId =
  | typeof DEFAULT_EDITOR_THEME_ID
  | typeof FLASHBANG_EDITOR_THEME_ID;

export type EditorSabotageEffect = {
  expiresAtMs: number | null;
  flashbangActive: boolean;
  keySwapActive: boolean;
  keySwapMap: Record<string, string> | null;
  lineJumperActive: boolean;
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
  const shuffled = [...alphabet];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  const keySwapMap: Record<string, string> = {};
  for (let index = 0; index < alphabet.length; index += 2) {
    const left = shuffled[index];
    const right = shuffled[index + 1];
    if (!left || !right) {
      continue;
    }

    keySwapMap[left] = right;
    keySwapMap[right] = left;
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
