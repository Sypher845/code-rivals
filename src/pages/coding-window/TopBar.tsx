import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Keyboard,
  LoaderCircle,
  Play,
  Send,
  Shield,
  Timer,
} from "lucide-react";
import { POWER_CARD_REGISTRY } from "../powerups/powerupRegistry";
import { OPPONENT, POWER_CARD } from "./constants";

function MatchTimer({ secondsRemaining }: { secondsRemaining: number }) {
  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, "0");
  const seconds = String(secondsRemaining % 60).padStart(2, "0");
  const isLow = secondsRemaining < 60;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-[rgba(0,255,255,0.18)] bg-[rgba(0,255,255,0.04)] px-4 py-2">
      <Timer
        className={`h-4.5 w-4.5 ${
          isLow ? "text-[var(--signal-danger)]" : "text-[var(--secondary)]"
        }`}
      />
      <span
        className={`text-lg font-bold tracking-[0.08em] tabular-nums ${
          isLow
            ? "animate-pulse text-[var(--signal-danger)]"
            : "text-[var(--secondary)]"
        }`}
      >
        {minutes}:{seconds}
      </span>
    </div>
  );
}

function OpponentCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] px-4 py-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--ghost-border)] bg-[rgba(224,141,255,0.08)] text-sm font-bold text-[var(--primary)]">
        {OPPONENT.username[0].toUpperCase()}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-[var(--on-background)]">
          {OPPONENT.username}
        </span>

        <div className="flex items-center gap-2.5">
          {OPPONENT.isTyping && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--secondary)]">
              <Keyboard className="h-3 w-3" />
              <span className="flex gap-[2px]">
                <span
                  className="landing-typing-dot"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="landing-typing-dot"
                  style={{ animationDelay: "200ms" }}
                />
                <span
                  className="landing-typing-dot"
                  style={{ animationDelay: "400ms" }}
                />
              </span>
            </span>
          )}

          {OPPONENT.cardUsed && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] px-2 py-0.5 text-[0.7rem] font-medium text-[var(--primary)]">
              <Shield className="h-3 w-3" />
              {OPPONENT.cardUsed}
            </span>
          )}

          {OPPONENT.hasSubmitted && (
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

function formatCardName(key: string) {
  return key.replace(/Card$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function SabotageButton({
  cardName,
  opponentName,
}: {
  cardName: string;
  opponentName: string;
}) {
  const [hovered, setHovered] = useState(false);
  const descriptor = POWER_CARD_REGISTRY[cardName];

  if (!descriptor) {
    return null;
  }

  const CardComponent = descriptor.Card;
  const displayName = formatCardName(cardName);

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="group relative inline-flex items-center gap-2.5 rounded-lg border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.06)] px-4 py-2 text-sm font-medium text-[var(--primary)] transition-colors hover:border-[rgba(224,141,255,0.45)] hover:bg-[rgba(224,141,255,0.12)] hover:shadow-[0_0_24px_rgba(224,141,255,0.18)]"
    >
      <motion.span
        animate={
          hovered
            ? { rotate: [0, -6, 6, 0], scale: 1.1 }
            : { rotate: 0, scale: 1 }
        }
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] transition-colors group-hover:border-[rgba(224,141,255,0.4)] group-hover:shadow-[0_0_10px_rgba(224,141,255,0.15)]"
      >
        <CardComponent size={24} />
      </motion.span>

      <span
        className="relative min-w-[10rem] overflow-hidden text-left"
        style={{ height: "1.25rem" }}
      >
        <AnimatePresence mode="wait">
          {!hovered ? (
            <motion.span
              key="sabotage"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              Sabotage {opponentName}
            </motion.span>
          ) : (
            <motion.span
              key="cardname"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {displayName}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

type TopBarProps = {
  canSubmit: boolean;
  isRunning: boolean;
  isSubmitting: boolean;
  onRun: () => void;
  onSubmit: () => void;
  roundNumber: number;
  secondsRemaining: number;
  statusMessage: string | null;
  submitLabel: string;
};

export function TopBar({
  canSubmit,
  isRunning,
  isSubmitting,
  onRun,
  onSubmit,
  roundNumber,
  secondsRemaining,
  statusMessage,
  submitLabel,
}: TopBarProps) {
  const busy = isRunning || isSubmitting;

  return (
    <nav className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--ghost-border)] bg-[rgba(10,14,20,0.96)] px-6 py-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <OpponentCard />
        <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Round {roundNumber}
        </div>
      </div>

      <div className="flex items-center justify-center px-6">
        <MatchTimer secondsRemaining={secondsRemaining} />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {!POWER_CARD.used && (
          <SabotageButton
            cardName={POWER_CARD.name}
            opponentName={OPPONENT.username}
          />
        )}

        <button
          onClick={onRun}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.04)] px-5 py-2 text-sm font-medium text-[var(--on-background)] transition hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning ? "Running..." : "Run"}
        </button>

        <button
          onClick={onSubmit}
          disabled={!canSubmit || busy}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[#0a0e14] shadow-[0_0_18px_rgba(224,141,255,0.2)] transition hover:-translate-y-px hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
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
