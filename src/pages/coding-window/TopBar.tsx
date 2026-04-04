import { motion } from "framer-motion";
import {
  Play,
  Send,
  Check,
  Timer,
  Keyboard,
  Moon,
  Sparkles,
} from "lucide-react";
import { POWER_CARD_REGISTRY } from "../powerups/powerupRegistry";
import {
  formatPowerupName,
  powerupRequiresManualActivation,
} from "../../utils/arenaPowerEffects";

/* ═══════════════════════════ MATCH TIMER ═════════════════════════════ */

function MatchTimer({
  secondsRemaining,
  zenMode = false,
}: {
  secondsRemaining: number;
  zenMode?: boolean;
}) {
  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, "0");
  const seconds = String(secondsRemaining % 60).padStart(2, "0");

  const isLow = secondsRemaining < 60;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border px-4 py-2 ${
        zenMode
          ? "border-[#2c2c2c] bg-[#181818]"
          : "border-[rgba(0,255,255,0.18)] bg-[rgba(0,255,255,0.04)]"
      }`}
    >
      <Timer
        className={`h-4.5 w-4.5 ${
          isLow
            ? "text-[var(--signal-danger)]"
            : zenMode
              ? "text-[#cfcfcf]"
              : "text-[var(--secondary)]"
        }`}
      />
      <span
        className={`text-lg font-bold tracking-[0.08em] tabular-nums ${
          isLow
            ? "text-[var(--signal-danger)] animate-pulse"
            : zenMode
              ? "text-[#cfcfcf]"
              : "text-[var(--secondary)]"
        }`}
      >
        {minutes}:{seconds}
      </span>
    </div>
  );
}

function formatDurationLabel(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/* ═══════════════════════════ OPPONENT CARD ═══════════════════════════ */

type OpponentSummary = {
  activeDebuffLabel?: string | null;
  activeDebuffSecondsRemaining?: number | null;
  activeDebuffUsesRoundTimer?: boolean;
  cardUsed?: string | null;
  hasSubmitted: boolean;
  isTyping: boolean;
  username: string;
  zenMode?: boolean;
};

function OpponentCard({
  activeDebuffLabel,
  activeDebuffSecondsRemaining,
  activeDebuffUsesRoundTimer = false,
  cardUsed,
  hasSubmitted,
  isTyping,
  username,
  zenMode = false,
}: OpponentSummary) {
  const debuffCountdown =
    activeDebuffSecondsRemaining === null ||
    activeDebuffSecondsRemaining === undefined
      ? null
      : formatDurationLabel(activeDebuffSecondsRemaining);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] px-4 py-2">
      {/* avatar placeholder */}
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-bold ${
          zenMode
            ? "border-[#3a3a3a] bg-[#1a1a1a] text-[#d0d0d0]"
            : "border-[var(--ghost-border)] bg-[rgba(224,141,255,0.08)] text-[var(--primary)]"
        }`}
      >
        {zenMode ? <Moon className="h-4 w-4" /> : username[0]?.toUpperCase() ?? "R"}
      </div>

      <div className="flex flex-col gap-0.5">
        {!zenMode ? (
          <span className="text-sm font-semibold text-[var(--on-background)]">
            {username}
          </span>
        ) : null}

        {activeDebuffLabel ? (
          <span className="text-xs text-[#ffd27a]">
            {activeDebuffLabel}
            {activeDebuffUsesRoundTimer
              ? " · Until round end"
              : debuffCountdown
                ? ` · ${debuffCountdown}`
                : ""}
          </span>
        ) : null}

        <div className="flex items-center gap-2.5">
            
          {/* typing indicator */}
          {!zenMode && isTyping && (
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
          {!zenMode && cardUsed && (
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
  const actionLabel = isSabotaged || powerupAppliedAtStart
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
  activeDebuffLabel?: string | null;
  activeDebuffSecondsRemaining?: number | null;
  activeDebuffUsesRoundTimer?: boolean;
  canSubmit: boolean;
  canRun?: boolean;
  isRunning?: boolean;
  isSubmitting: boolean;
  myPowerupAppliedAtStart?: boolean;
  mySelectedPowerupId: string | null;
  onRun: () => void;
  onSabotage?: () => void;
  onSubmit: () => void;
  opponentActiveDebuffLabel?: string | null;
  opponentActiveDebuffSecondsRemaining?: number | null;
  opponentActiveDebuffUsesRoundTimer?: boolean;
  opponentCardUsed?: string | null;
  opponentHasSubmitted: boolean;
  opponentIsTyping: boolean;
  opponentName: string;
  roundNumber: number;
  secondsRemaining: number;
  sabotageUsed: boolean;
  statusMessage: string | null;
  submitLabel: string;
  zenMode: boolean;
  onToggleZenMode?: () => void;
  zenSelfSabotageEnabled: boolean;
  onToggleZenSelfSabotage: () => void;
};

export function TopBar({
  activeDebuffLabel = null,
  activeDebuffSecondsRemaining = null,
  activeDebuffUsesRoundTimer = false,
  canSubmit,
  canRun = true,
  isRunning = false,
  isSubmitting,
  myPowerupAppliedAtStart = false,
  mySelectedPowerupId,
  onRun,
  onSabotage,
  onSubmit,
  opponentActiveDebuffLabel = null,
  opponentActiveDebuffSecondsRemaining = null,
  opponentActiveDebuffUsesRoundTimer = false,
  opponentCardUsed,
  opponentHasSubmitted,
  opponentIsTyping,
  opponentName,
  roundNumber,
  secondsRemaining,
  sabotageUsed,
  statusMessage,
  submitLabel,
  zenMode,
  onToggleZenMode,
  zenSelfSabotageEnabled,
  onToggleZenSelfSabotage,
}: TopBarProps) {
  return (
    <nav
      className={`flex min-h-16 shrink-0 items-center justify-between gap-3 border-b px-6 py-3 ${
        zenMode
          ? "border-[#2b2b2b] bg-[#101010]"
          : "flex-wrap border-[var(--ghost-border)] bg-[rgba(10,14,20,0.96)]"
      }`}
    >
      <div
        className={`mx-auto flex w-full items-center justify-between gap-3 ${
          zenMode ? "relative flex-wrap" : "flex-wrap"
        }`}
      >
      {/* LEFT — Opponent status card */}
      <div
        className={`flex min-w-0 flex-1 items-center gap-3 ${
          zenMode ? "overflow-hidden" : "flex-wrap"
        }`}
      >
        {!zenMode ? (
          <OpponentCard
            activeDebuffLabel={opponentActiveDebuffLabel}
            activeDebuffSecondsRemaining={opponentActiveDebuffSecondsRemaining}
            activeDebuffUsesRoundTimer={opponentActiveDebuffUsesRoundTimer}
            cardUsed={opponentCardUsed}
            hasSubmitted={opponentHasSubmitted}
            isTyping={opponentIsTyping}
            username={opponentName}
            zenMode={zenMode}
          />
        ) : null}
        <div
          className={`rounded-lg border px-3 py-2 text-xs uppercase tracking-[0.16em] ${
            zenMode
              ? "border-[#2b2b2b] bg-[#181818] text-[#9a9a9a]"
              : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]"
          }`}
        >
          Round {roundNumber}
        </div>
      </div>

      {/* CENTER — Timer */}
      <div
        className={`flex shrink-0 items-center justify-center px-6 ${
          zenMode ? "absolute left-1/2 -translate-x-1/2" : ""
        }`}
      >
        <MatchTimer secondsRemaining={secondsRemaining} zenMode={zenMode} />
      </div>

      {/* RIGHT — Power card + Run/Submit */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {zenMode && onToggleZenMode ? (
          <button
            type="button"
            role="switch"
            aria-checked={zenMode}
            aria-label={zenMode ? "Disable Zen Mode" : "Enable Zen Mode"}
            onClick={onToggleZenMode}
            className="inline-flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-[rgba(241,243,252,0.72)] transition hover:text-(--on-background)"
          >
            <Moon className="h-4 w-4" />
            <span className="text-xs font-medium">Zen</span>
            <span
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                zenMode
                  ? "bg-[rgba(224,224,224,0.75)]"
                  : "bg-[rgba(255,255,255,0.12)]"
              }`}
            >
              <span
                className={`absolute h-6 w-6 rounded-full bg-[#e6e6e6] transition ${
                  zenMode ? "right-0.5" : "left-0.5"
                }`}
              />
            </span>
          </button>
        ) : null}

        {zenMode ? (
          <button
            type="button"
            onClick={onToggleZenSelfSabotage}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition ${
              zenSelfSabotageEnabled
                ? "border-[#5a5a5a] bg-[#232323] text-[#efefef]"
                : "border-[#2b2b2b] bg-[#181818] text-[#9f9f9f] hover:border-[#4a4a4a] hover:text-[#efefef]"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Self Sabotage {zenSelfSabotageEnabled ? "On" : "Off"}
          </button>
        ) : null}

        {/* Power card sabotage button */}
        {!zenMode && mySelectedPowerupId ? (
          <SabotageButton
            cardName={mySelectedPowerupId}
            isSabotaged={sabotageUsed}
            powerupAppliedAtStart={myPowerupAppliedAtStart}
            onClick={
              powerupRequiresManualActivation(mySelectedPowerupId)
                ? onSabotage
                : undefined
            }
          />
        ) : null}

        {/* Run button */}
        <button
          onClick={onRun}
          disabled={!canRun || isRunning}
          className={`inline-flex items-center gap-2 rounded-lg border px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            zenMode
              ? "border-[#2b2b2b] bg-[#181818] text-[#efefef] hover:border-[#454545] hover:bg-[#1f1f1f]"
              : "border-[var(--ghost-border)] bg-[rgba(255,255,255,0.04)] text-[var(--on-background)] hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.08)]"
          }`}
        >
          <Play className="h-4 w-4" />
          {isRunning ? "Running..." : "Run"}
        </button>

        {/* Submit button */}
        <button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            zenMode
              ? "bg-[#e0e0e0] text-[#111111] shadow-[0_0_18px_rgba(255,255,255,0.08)] hover:-translate-y-px hover:bg-[#f0f0f0]"
              : "bg-[var(--primary)] text-[#0a0e14] shadow-[0_0_18px_rgba(224,141,255,0.2)] hover:-translate-y-px hover:opacity-90"
          }`}
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      </div>

      {statusMessage ? (
        <div
          className={`basis-full text-right text-sm ${
            zenMode ? "text-[#8e8e8e]" : "text-[var(--text-secondary)]"
          }`}
        >
          {statusMessage}
        </div>
      ) : null}
      {activeDebuffLabel ? (
        <div className="basis-full text-right text-sm text-[#ffd27a]">
          {activeDebuffLabel}
          {activeDebuffUsesRoundTimer
            ? " · Until round end"
            : activeDebuffSecondsRemaining !== null
              ? ` · ${formatDurationLabel(activeDebuffSecondsRemaining)}`
              : ""}
        </div>
      ) : null}
      </div>
    </nav>
  );
}
