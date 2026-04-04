import { motion } from "framer-motion";
import {
  Play,
  Send,
  Check,
  Timer,
  Keyboard,
} from "lucide-react";
import { POWER_CARD_REGISTRY } from "../powerups/powerupRegistry";
import {
  formatPowerupName,
  powerupRequiresManualActivation,
} from "../../utils/arenaPowerEffects";

/* ═══════════════════════════ MATCH TIMER ═════════════════════════════ */

function MatchTimer({ secondsRemaining }: { secondsRemaining: number }) {
  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, "0");
  const seconds = String(secondsRemaining % 60).padStart(2, "0");

  const isLow = secondsRemaining < 60;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-[rgba(0,255,255,0.18)] bg-[rgba(0,255,255,0.04)] px-4 py-2">
      <Timer className={`h-4.5 w-4.5 ${isLow ? "text-[var(--signal-danger)]" : "text-[var(--secondary)]"}`} />
      <span
        className={`text-lg font-bold tracking-[0.08em] tabular-nums ${isLow ? "text-[var(--signal-danger)] animate-pulse" : "text-[var(--secondary)]"
          }`}
      >
        {minutes}:{seconds}
      </span>
    </div>
  );
}

/* ═══════════════════════════ OPPONENT CARD ═══════════════════════════ */

type OpponentSummary = {
  cardUsed?: string | null;
  hasSubmitted: boolean;
  isTyping: boolean;
  username: string;
};

function OpponentCard({
  cardUsed,
  hasSubmitted,
  isTyping,
  username,
}: OpponentSummary) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] px-4 py-2">
      {/* avatar placeholder */}
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--ghost-border)] bg-[rgba(224,141,255,0.08)] text-sm font-bold text-[var(--primary)]">
        {username[0]?.toUpperCase() ?? "R"}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-[var(--on-background)]">
          {username}
        </span>

        <div className="flex items-center gap-2.5">
          {/* typing indicator */}
          {isTyping && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--secondary)]">
              <Keyboard className="h-3 w-3" />
              <span className="flex gap-[2px]">
                <span className="landing-typing-dot" style={{ animationDelay: "0ms" }} />
                <span className="landing-typing-dot" style={{ animationDelay: "200ms" }} />
                <span className="landing-typing-dot" style={{ animationDelay: "400ms" }} />
              </span>
            </span>
          )}

          {/* card used */}
          {cardUsed && (
            <span className="inline-flex items-center rounded-full border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] px-2 py-0.5 text-[0.7rem] font-medium text-[var(--primary)]">
              {cardUsed}
            </span>
          )}

          {/* submitted status */}
          {hasSubmitted && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7cd87c]">
              <Check className="h-3 w-3" />
              Submitted
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ SABOTAGE BUTTON ═════════════════════════ */

type SabotageButtonProps = {
  cardName: string;
  isSabotaged: boolean;
  powerupAppliedAtStart?: boolean;
  onClick?: () => void;
};

function SabotageButton({
  cardName,
  isSabotaged,
  powerupAppliedAtStart = false,
  onClick,
}: SabotageButtonProps) {
  const descriptor = POWER_CARD_REGISTRY[cardName];
  if (!descriptor) return null;

  const CardComponent = descriptor.Card;
  const displayName = formatPowerupName(cardName);
  const actionLabel = powerupAppliedAtStart
    ? "Applied"
    : isSabotaged
      ? "Sabotaged"
      : "Sabotage";
  const handleClick = () => {
    if (isSabotaged || !onClick) {
      return;
    }

    onClick();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={isSabotaged ? undefined : { scale: 1.02 }}
      whileTap={isSabotaged ? undefined : { scale: 0.98 }}
      className={`group relative inline-flex min-w-[22rem] items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
        isSabotaged
          ? "cursor-default border-[rgba(124,216,124,0.24)] bg-[rgba(124,216,124,0.08)] text-[#9ae99a]"
          : "border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.06)] text-[var(--primary)] hover:border-[rgba(224,141,255,0.45)] hover:bg-[rgba(224,141,255,0.12)] hover:shadow-[0_0_24px_rgba(224,141,255,0.18)]"
      }`}
    >
      <div
        className={`flex h-[6rem] w-[6rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border p-1.5 ${
          isSabotaged
            ? "border-[rgba(124,216,124,0.28)] bg-[rgba(124,216,124,0.08)]"
            : "border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)]"
        }`}
      >
        <div className="pointer-events-none scale-[0.34]">
          <CardComponent size={280} className="cursor-default" />
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-[rgba(241,243,252,0.52)] uppercase">
          Selected Power
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-tight">
          {actionLabel} with {displayName}
        </p>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════ TOP BAR ═════════════════════════════════ */

type TopBarProps = {
  canSubmit: boolean;
  isSubmitting: boolean;
  myPowerupAppliedAtStart?: boolean;
  mySelectedPowerupId: string | null;
  onRun: () => void;
  onSabotage?: () => void;
  onSubmit: () => void;
  opponentCardUsed?: string | null;
  opponentHasSubmitted: boolean;
  opponentIsTyping: boolean;
  opponentName: string;
  roundNumber: number;
  secondsRemaining: number;
  sabotageUsed: boolean;
  statusMessage: string | null;
  submitLabel: string;
};

export function TopBar({
  canSubmit,
  isSubmitting,
  myPowerupAppliedAtStart = false,
  mySelectedPowerupId,
  onRun,
  onSabotage,
  onSubmit,
  opponentCardUsed,
  opponentHasSubmitted,
  opponentIsTyping,
  opponentName,
  roundNumber,
  secondsRemaining,
  sabotageUsed,
  statusMessage,
  submitLabel,
}: TopBarProps) {
  return (
    <nav className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--ghost-border)] bg-[rgba(10,14,20,0.96)] px-6 py-3">
      {/* LEFT — Opponent status card */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <OpponentCard
          cardUsed={opponentCardUsed}
          hasSubmitted={opponentHasSubmitted}
          isTyping={opponentIsTyping}
          username={opponentName}
        />
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Round {roundNumber}
        </div>
      </div>

      {/* CENTER — Timer */}
      <div className="flex items-center justify-center px-6">
        <MatchTimer secondsRemaining={secondsRemaining} />
      </div>

      {/* RIGHT — Power card + Run/Submit */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {/* Power card sabotage button */}
        {mySelectedPowerupId && powerupRequiresManualActivation(mySelectedPowerupId) ? (
          <SabotageButton
            cardName={mySelectedPowerupId}
            isSabotaged={sabotageUsed}
            powerupAppliedAtStart={myPowerupAppliedAtStart}
            onClick={onSabotage}
          />
        ) : null}

        {/* Run button */}
        <button
          onClick={onRun}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.04)] px-5 py-2 text-sm font-medium text-[var(--on-background)] transition hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.08)]"
        >
          <Play className="h-4 w-4" />
          Run
        </button>

        {/* Submit button */}
        <button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[#0a0e14] shadow-[0_0_18px_rgba(224,141,255,0.2)] transition hover:-translate-y-px hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      </div>

      {statusMessage ? (
        <div className="basis-full text-right text-sm text-[var(--text-secondary)]">
          {statusMessage}
        </div>
      ) : null}
    </nav>
  );
}
