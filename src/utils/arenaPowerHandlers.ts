import type { ResolvedPowerupEffect } from "./arenaPowerEffects";

export const DEFAULT_EDITOR_THEME_ID = "neonCommand" as const;
export const FLASHBANG_EDITOR_THEME_ID = "flashbangLowContrast" as const;

export type EditorThemeId =
  | typeof DEFAULT_EDITOR_THEME_ID
  | typeof FLASHBANG_EDITOR_THEME_ID;

export type EditorSabotageEffect = {
  expiresAtMs: number | null;
  flashbangActive: boolean;
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
      powerupId: effect.powerupId,
      themeId: FLASHBANG_EDITOR_THEME_ID,
    },
  };
}

const POWERUP_HANDLER_MAP = {
  applyFlashbangEffect,
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
