import { useEffect, useMemo, useState } from "react";
import type { Identity } from "spacetimedb";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useReducer, useTable } from "spacetimedb/react";
import { panelFrameClass, panelNoiseClass } from "../components/uiClasses";
import { reducers, tables } from "../module_bindings";

type MatchLaunchPageProps = {
  identity: Identity | undefined;
  username: string;
};

export function MatchLaunchPage({
  identity,
  username,
}: MatchLaunchPageProps) {
  const navigate = useNavigate();
  const { roomSegment, roundSegment } = useParams();
  const normalizedRoomId = roomSegment?.replace(/^room=/i, "").trim().toUpperCase() ?? null;
  const normalizedRoundNumber = roundSegment?.replace(/^r/i, "") ?? "1";
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [arenaRoomRows] = useTable(tables.arenaRoom);
  const [arenaPowerupLockRows] = useTable(tables.arenaPowerupLock);
  const [arenaRoundResultRows] = useTable(tables.arenaRoundResult);
  const submitRoundResult = useReducer(reducers.submitRoundResult);

  const activeRoom = useMemo(() => {
    if (!normalizedRoomId) return null;
    return arenaRoomRows.find((room) => room.roomId === normalizedRoomId) ?? null;
  }, [arenaRoomRows, normalizedRoomId]);

  const myLock = useMemo(() => {
    if (!normalizedRoomId || !identity) return null;
    return (
      arenaPowerupLockRows.find(
        (lock) =>
          lock.roomId === normalizedRoomId && lock.playerIdentity.isEqual(identity),
      ) ?? null
    );
  }, [arenaPowerupLockRows, identity, normalizedRoomId]);

  const myRoundResults = useMemo(() => {
    if (!normalizedRoomId || !identity) return [];
    return arenaRoundResultRows.filter(
      (row) => row.roomId === normalizedRoomId && row.playerIdentity.isEqual(identity),
    );
  }, [arenaRoundResultRows, identity, normalizedRoomId]);

  useEffect(() => {
    if (!normalizedRoomId || !activeRoom) {
      return;
    }

    if (activeRoom.matchState === "drafting") {
      const round = activeRoom.currentRound?.toString() ?? normalizedRoundNumber;
      navigate(
        `/${encodeURIComponent(username)}/room=${normalizedRoomId}/r${round}/power-cards`,
        { replace: true },
      );
      return;
    }

    if (activeRoom.matchState === "round_intro") {
      const round = activeRoom.currentRound?.toString() ?? normalizedRoundNumber;
      navigate(
        `/${encodeURIComponent(username)}/room=${normalizedRoomId}/r${round}/power-cards-locked`,
        { replace: true },
      );
      return;
    }

    if (activeRoom.matchState === "finished") {
      setSubmitMessage("All three rounds are complete.");
    }
  }, [activeRoom, navigate, normalizedRoomId, username]);

  const handleSubmitRound = async () => {
    if (!normalizedRoomId || !activeRoom) {
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    try {
      await submitRoundResult({
        roomId: normalizedRoomId,
        timeTakenSeconds: 42n,
        testcasesPassed: 8n,
        totalTestcases: 10n,
        pointsEarned: 80n,
      });
      setSubmitMessage(
        activeRoom.currentRound >= 3n
          ? "Round submitted. Match finishing up."
          : `Round ${activeRoom.currentRound.toString()} submitted. Waiting for the next draft.`,
      );
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : "Unable to submit this round.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--arena-page-bg) px-4 py-8 text-(--on-background) sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_16%,rgba(0,255,255,0.14),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(224,141,255,0.16),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(0,153,255,0.1),transparent_34%)]" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center">
        <section className={`${panelFrameClass} relative w-full rounded-[2rem] border-[rgba(0,255,255,0.22)] p-6 sm:p-8`}>
          <div className={panelNoiseClass} />
          <div className="relative z-1">
            <p className="font-(--font-mono) text-[0.68rem] tracking-[0.24em] text-(--secondary) uppercase">
              Match Transition
            </p>
            <h1 className="mt-3 font-(--font-heading) text-4xl leading-none tracking-[0.08em] uppercase sm:text-6xl">
              Battle Interface Primed
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[rgba(241,243,252,0.68)] sm:text-base">
              Countdown is complete. This route is ready to hand off into the actual coding match screen when that surface is built.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(7,12,19,0.84)] p-4">
                <p className="font-(--font-mono) text-[0.6rem] tracking-[0.16em] text-[rgba(241,243,252,0.5)] uppercase">
                  Player
                </p>
                <p className="mt-2 text-lg font-semibold">{username}</p>
              </article>
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(7,12,19,0.84)] p-4">
                <p className="font-(--font-mono) text-[0.6rem] tracking-[0.16em] text-[rgba(241,243,252,0.5)] uppercase">
                  Room
                </p>
                <p className="mt-2 text-lg font-semibold">{normalizedRoomId ?? "Unavailable"}</p>
              </article>
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(7,12,19,0.84)] p-4">
                <p className="font-(--font-mono) text-[0.6rem] tracking-[0.16em] text-[rgba(241,243,252,0.5)] uppercase">
                  Locked Power
                </p>
                <p className="mt-2 text-lg font-semibold">{myLock?.powerupId ?? "Syncing"}</p>
              </article>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-[rgba(0,255,255,0.16)] bg-[linear-gradient(135deg,rgba(7,18,27,0.94),rgba(16,9,30,0.94))] p-5">
              <p className="font-(--font-mono) text-[0.62rem] tracking-[0.18em] text-[rgba(241,243,252,0.54)] uppercase">
                Current Match State
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                {activeRoom?.matchState?.toUpperCase() ?? "UNKNOWN"}
              </p>
              <p className="mt-2 text-sm text-[rgba(241,243,252,0.62)]">
                Round {activeRoom?.currentRound?.toString() ?? "-"} of 3
                {activeRoom?.currentQuestionId ? ` • ${activeRoom.currentQuestionId}` : ""}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(7,12,19,0.84)] p-4">
                <p className="font-(--font-mono) text-[0.6rem] tracking-[0.16em] text-[rgba(241,243,252,0.5)] uppercase">
                  Round Log
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {myRoundResults.length} / 3 submitted
                </p>
              </article>
              <article className="rounded-2xl border border-[rgba(241,243,252,0.12)] bg-[rgba(7,12,19,0.84)] p-4">
                <p className="font-(--font-mono) text-[0.6rem] tracking-[0.16em] text-[rgba(241,243,252,0.5)] uppercase">
                  Typing State
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {myLock?.hasSubmitted ? "Submitted" : "In Progress"}
                </p>
              </article>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  void handleSubmitRound();
                }}
                disabled={submitting || activeRoom?.matchState !== "playing" || Boolean(myLock?.hasSubmitted)}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[rgba(224,141,255,0.34)] bg-[rgba(24,14,33,0.82)] px-6 font-(--font-mono) text-xs tracking-[0.16em] uppercase transition hover:border-[rgba(224,141,255,0.54)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {myLock?.hasSubmitted ? "Round Submitted" : submitting ? "Submitting..." : "Submit Round Result"}
              </button>
              <Link
                to={`/${encodeURIComponent(username)}`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[rgba(0,255,255,0.28)] px-6 font-(--font-mono) text-xs tracking-[0.16em] text-(--secondary) uppercase transition hover:bg-[rgba(0,255,255,0.08)]"
              >
                Return to Arena
              </Link>
              <Link
                to={`/${encodeURIComponent(username)}/room=${normalizedRoomId}/r${normalizedRoundNumber}/power-cards`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[rgba(241,243,252,0.14)] bg-[rgba(10,16,25,0.82)] px-6 font-(--font-mono) text-xs tracking-[0.16em] uppercase transition hover:border-[rgba(241,243,252,0.28)]"
              >
                Review Lock Screen
              </Link>
            </div>
            {submitMessage ? (
              <p className="mt-4 text-sm text-[rgba(241,243,252,0.68)]">{submitMessage}</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
