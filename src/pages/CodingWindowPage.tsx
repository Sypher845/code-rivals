import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useReducer, useSpacetimeDB, useTable } from "spacetimedb/react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "./coding-window/TopBar";
import { DescriptionPanel } from "./coding-window/DescriptionPanel";
import { EditorPanel } from "./coding-window/EditorPanel";
import { TestCasesPanel } from "./coding-window/TestCasesPanel";
import { P } from "./coding-window/constants";
import { getParsedTestCases } from "./coding-window/problemContent";
import { reducers, tables } from "../module_bindings";
import type { ArenaSabotageEvent } from "../module_bindings/types";
import {
  formatPowerupName,
  resolvePowerupEffect,
  type ResolvedPowerupEffect,
} from "../utils/arenaPowerEffects";
import {
  DEFAULT_EDITOR_THEME_ID,
  executePowerupHandler,
  type EditorSabotageEffect,
} from "../utils/arenaPowerHandlers";

const PROBLEM_API_URL =
  import.meta.env.VITE_PROBLEM_API_URL ?? "http://localhost:8080";

export type RemoteProblemData = {
  task_id?: string;
  title?: string;
  difficulty?: string;
  tags?: string[];
  description?: unknown;
  problem_description?: string;
  input_output?: Array<{
    input?: string;
    output?: string;
  }>;
  [key: string]: unknown;
};

type IncomingSabotage = ResolvedPowerupEffect & {
  emittedAtMs: number;
  roomId: string;
  roundNumber: number;
  sourcePlayerIdentityHex: string;
};

function getRoundDurationSeconds(roundNumber: number) {
  if (roundNumber === 1) {
    return 5 * 60;
  }

  if (roundNumber === 2) {
    return 10 * 60;
  }

  return 15 * 60;
}

/* ══════════════════════════ RESIZABLE DIVIDER ════════════════════════ */

function useDragResize(
  direction: "horizontal" | "vertical",
  initialRatio: number,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [ratio, setRatio] = useState(initialRatio);
  const dragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const totalSize = direction === "horizontal" ? rect.width : rect.height;
        const currentPos =
          direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const startOffset = direction === "horizontal" ? rect.left : rect.top;
        const newRatio = Math.max(
          0.2,
          Math.min(0.8, (currentPos - startOffset) / totalSize),
        );
        setRatio(newRatio);
      };

      const handleMouseUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor =
        direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [direction, ratio, containerRef],
  );

  return { ratio, handleMouseDown };
}

function DragHandle({
  direction,
  onMouseDown,
}: {
  direction: "horizontal" | "vertical";
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  const isH = direction === "horizontal";
  return (
    <div
      onMouseDown={onMouseDown}
      className={`group relative z-10 flex shrink-0 items-center justify-center transition-colors ${
        isH ? "w-[6px] cursor-col-resize" : "h-[6px] cursor-row-resize"
      }`}
    >
      <div
        className={`rounded-full bg-[var(--ghost-border)] transition-all group-hover:bg-[var(--primary)] ${
          isH ? "h-8 w-[2px]" : "h-[2px] w-8"
        }`}
      />
    </div>
  );
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════════ */

export function CodingWindowPage() {
  const navigate = useNavigate();
  const { identity } = useSpacetimeDB();
  const { roomSegment, roundSegment, username } = useParams();
  const normalizedRoomId =
    roomSegment?.replace(/^room=/i, "").trim().toUpperCase() ?? null;
  const parsedRoundNumber = Number.parseInt(
    roundSegment?.replace(/^r/i, "") ?? "1",
    10,
  );
  const fallbackRoundNumber =
    Number.isNaN(parsedRoundNumber) || parsedRoundNumber < 1 ? 1 : parsedRoundNumber;
  const [nowMs, setNowMs] = useState(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const [problem, setProblem] = useState<RemoteProblemData | null>(null);
  const [problemLoading, setProblemLoading] = useState(true);
  const [problemError, setProblemError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeEditorSabotage, setActiveEditorSabotage] =
    useState<EditorSabotageEffect | null>(null);
  const [latestIncomingSabotage, setLatestIncomingSabotage] =
    useState<IncomingSabotage | null>(null);
  const [usedSabotageRoundKey, setUsedSabotageRoundKey] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arenaRoomRows] = useTable(tables.arenaRoom);
  const [arenaRoomMemberRows] = useTable(tables.arenaRoomMember);
  const [arenaPowerupLockRows] = useTable(tables.arenaPowerupLock);
  const [matchSummaryRows] = useTable(tables.arenaMatchSummary);
  const submitRoundResult = useReducer(reducers.submitRoundResult);
  const triggerArenaSabotage = useReducer(reducers.triggerArenaSabotage);

  const activeRoom = useMemo(() => {
    if (!normalizedRoomId) {
      return null;
    }

    return arenaRoomRows.find((room) => room.roomId === normalizedRoomId) ?? null;
  }, [arenaRoomRows, normalizedRoomId]);

  const activeRoundNumber = activeRoom?.currentRound
    ? Number(activeRoom.currentRound)
    : fallbackRoundNumber;
  const playerSummary = useMemo(() => {
    if (!normalizedRoomId || !username) {
      return null;
    }

    return (
      matchSummaryRows.find(
        (row) =>
          row.roomId === normalizedRoomId && row.playerUsername === username,
      ) ?? null
    );
  }, [matchSummaryRows, normalizedRoomId, username]);
  const fallbackSecondsRemaining = getRoundDurationSeconds(activeRoundNumber);
  const roundStartMs = activeRoom?.roundStartTime
    ? Number(activeRoom.roundStartTime.microsSinceUnixEpoch / 1000n)
    : null;
  const roundDeadlineMs = activeRoom?.roundEndTime
    ? Number(activeRoom.roundEndTime.microsSinceUnixEpoch / 1000n)
    : roundStartMs !== null && activeRoom?.matchState === "playing"
      ? roundStartMs + fallbackSecondsRemaining * 1000
      : null;
  const secondsRemaining =
    roundDeadlineMs === null
      ? fallbackSecondsRemaining
      : Math.max(0, Math.ceil((roundDeadlineMs - nowMs) / 1000));
  const roomPhase = activeRoom?.matchState ?? null;
  const roomMembers = useMemo(() => {
    if (!normalizedRoomId) {
      return [];
    }

    return arenaRoomMemberRows.filter((member) => member.roomId === normalizedRoomId);
  }, [arenaRoomMemberRows, normalizedRoomId]);
  const roomLocks = useMemo(() => {
    if (!normalizedRoomId) {
      return [];
    }

    return arenaPowerupLockRows.filter((lock) => lock.roomId === normalizedRoomId);
  }, [arenaPowerupLockRows, normalizedRoomId]);
  const myRoundState = useMemo(() => {
    if (!identity) {
      return null;
    }

    return roomLocks.find((lock) => lock.playerIdentity.isEqual(identity)) ?? null;
  }, [identity, roomLocks]);
  const opponentRoundState = useMemo(() => {
    if (!identity) {
      return null;
    }

    return roomLocks.find((lock) => !lock.playerIdentity.isEqual(identity)) ?? null;
  }, [identity, roomLocks]);
  const opponentMember = useMemo(() => {
    if (!identity) {
      return null;
    }

    return (
      roomMembers.find((member) => !member.memberIdentity.isEqual(identity)) ?? null
    );
  }, [identity, roomMembers]);
  const mySelectedPowerupId =
    myRoundState?.hasLockedPower && myRoundState.powerupId
      ? myRoundState.powerupId
      : null;
  const currentRoundKey =
    normalizedRoomId === null ? null : `${normalizedRoomId}:${activeRoundNumber}`;
  const sabotageUsed =
    currentRoundKey !== null && usedSabotageRoundKey === currentRoundKey;
  const editorThemeId =
    activeEditorSabotage?.themeId ?? DEFAULT_EDITOR_THEME_ID;
  const testCases = useMemo(() => getParsedTestCases(problem), [problem]);
  const totalTestcases = BigInt(Math.max(testCases.length, 1));
  const submitDisabled =
    !normalizedRoomId ||
    roomPhase !== "playing" ||
    isSubmitting ||
    Boolean(myRoundState?.hasSubmitted);

  const { ratio: hRatio, handleMouseDown: hMouseDown } = useDragResize(
    "horizontal",
    0.42,
    containerRef,
  );

  const rightContainerRef = useRef<HTMLDivElement>(null);
  const { ratio: vRatio, handleMouseDown: vMouseDown } = useDragResize(
    "vertical",
    0.6,
    rightContainerRef,
  );

  const handleIncomingSabotageEvent = useCallback(
    (eventRow: ArenaSabotageEvent) => {
      if (!identity || !normalizedRoomId) {
        return;
      }

      if (eventRow.roomId !== normalizedRoomId) {
        return;
      }

      if (!eventRow.targetPlayerIdentity.isEqual(identity)) {
        return;
      }

      const resolvedEffect = resolvePowerupEffect(
        eventRow.powerupId,
        Number(eventRow.roundNumber),
      );
      if (!resolvedEffect) {
        return;
      }

      setLatestIncomingSabotage({
        ...resolvedEffect,
        emittedAtMs: Number(eventRow.createdAt.microsSinceUnixEpoch / 1000n),
        roomId: eventRow.roomId,
        roundNumber: Number(eventRow.roundNumber),
        sourcePlayerIdentityHex: eventRow.sourcePlayerIdentity.toHexString(),
      });
    },
    [identity, normalizedRoomId],
  );

  const sabotageEventCallbacks = useMemo(
    () => ({ onInsert: handleIncomingSabotageEvent }),
    [handleIncomingSabotageEvent],
  );

  useTable(tables.arenaSabotageEvent, sabotageEventCallbacks);

  useEffect(() => {
    if (roundDeadlineMs === null) {
      return;
    }

    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => window.clearInterval(timerId);
  }, [roundDeadlineMs]);

  useEffect(() => {
    if (!normalizedRoomId || !username) {
      return;
    }

    if (!activeRoom && playerSummary) {
      navigate(
        `/${encodeURIComponent(username)}/room=${normalizedRoomId}/results`,
        { replace: true },
      );
      return;
    }

    if (!activeRoom) {
      return;
    }

    const currentRoundPath = `/${encodeURIComponent(username)}/room=${normalizedRoomId}/r${activeRoundNumber}`;

    if (activeRoom.matchState === "drafting") {
      navigate(`${currentRoundPath}/power-cards`, { replace: true });
      return;
    }

    if (activeRoom.matchState === "round_intro") {
      navigate(`${currentRoundPath}/power-cards-locked`, { replace: true });
      return;
    }

    if (activeRoom.matchState === "finished") {
      navigate(
        `/${encodeURIComponent(username)}/room=${normalizedRoomId}/results`,
        { replace: true },
      );
      return;
    }

    if (
      activeRoom.matchState === "playing" &&
      activeRoundNumber.toString() !== fallbackRoundNumber.toString()
    ) {
      navigate(currentRoundPath, { replace: true });
    }
  }, [
    activeRoom,
    activeRoundNumber,
    fallbackRoundNumber,
    playerSummary,
    navigate,
    normalizedRoomId,
    username,
  ]);

  useEffect(() => {
    if (!currentRoundKey) {
      return;
    }

    setUsedSabotageRoundKey((current) =>
      current === currentRoundKey ? current : null,
    );
    setLatestIncomingSabotage(null);
    setActiveEditorSabotage(null);
  }, [currentRoundKey]);

  useEffect(() => {
    if (!latestIncomingSabotage) {
      return;
    }

    const handlerOutput = executePowerupHandler({
      effect: latestIncomingSabotage,
      emittedAtMs: latestIncomingSabotage.emittedAtMs,
    });
    if (!handlerOutput?.editorEffect) {
      return;
    }

    setActiveEditorSabotage(handlerOutput.editorEffect);
    setStatusMessage(
      `${formatPowerupName(latestIncomingSabotage.powerupId)} is affecting your editor.`,
    );
  }, [latestIncomingSabotage]);

  useEffect(() => {
    if (!activeEditorSabotage?.expiresAtMs) {
      return;
    }

    const activeStatusMessage = `${formatPowerupName(activeEditorSabotage.powerupId)} is affecting your editor.`;
    const remainingMs = activeEditorSabotage.expiresAtMs - Date.now();
    if (remainingMs <= 0) {
      setActiveEditorSabotage(null);
      setStatusMessage((current) =>
        current === activeStatusMessage ? null : current,
      );
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveEditorSabotage((current) => {
        if (
          current?.powerupId !== activeEditorSabotage.powerupId ||
          current.expiresAtMs !== activeEditorSabotage.expiresAtMs
        ) {
          return current;
        }

        return null;
      });
      setStatusMessage((current) =>
        current === activeStatusMessage ? null : current,
      );
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [activeEditorSabotage]);

  useEffect(() => {
    if (secondsRemaining !== 0 || submitDisabled || !normalizedRoomId) {
      return;
    }

    void (async () => {
      try {
        setIsSubmitting(true);
        setStatusMessage("Timer expired. Submitting your round result...");
        await submitRoundResult({
          roomId: normalizedRoomId,
          timeTakenSeconds: BigInt(fallbackSecondsRemaining),
          testcasesPassed: 0n,
          totalTestcases,
          pointsEarned: 0n,
        });
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "Unable to auto-submit this round.",
        );
      } finally {
        setIsSubmitting(false);
      }
    })();
  }, [
    fallbackSecondsRemaining,
    normalizedRoomId,
    secondsRemaining,
    submitDisabled,
    submitRoundResult,
    totalTestcases,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProblem() {
      try {
        setProblemLoading(true);
        setProblemError(null);

        const response = await fetch(PROBLEM_API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as RemoteProblemData;
        setProblem(data);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setProblemError(
          `Unable to load description from ${PROBLEM_API_URL}. Showing fallback content.`,
        );
      } finally {
        setProblemLoading(false);
      }
    }

    void loadProblem();

    return () => controller.abort();
  }, []);

  const handleRun = useCallback(() => {
    setHasRun(true);
    setStatusMessage(`Run completed. ${testCases.length || 1} sample testcases checked.`);
  }, [testCases.length]);

  const handleSabotage = useCallback(async () => {
    if (!normalizedRoomId) {
      setStatusMessage("Open this page from an arena room.");
      return;
    }

    if (roomPhase !== "playing") {
      setStatusMessage("Sabotage becomes available when the round is live.");
      return;
    }

    if (!mySelectedPowerupId) {
      setStatusMessage("Lock a power before triggering sabotage.");
      return;
    }

    if (sabotageUsed) {
      return;
    }

    try {
      await triggerArenaSabotage({ roomId: normalizedRoomId });
      if (currentRoundKey) {
        setUsedSabotageRoundKey(currentRoundKey);
      }
      setStatusMessage(
        `Sent ${formatPowerupName(mySelectedPowerupId)} to your rival.`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to trigger sabotage.",
      );
    }
  }, [
    currentRoundKey,
    mySelectedPowerupId,
    normalizedRoomId,
    roomPhase,
    sabotageUsed,
    triggerArenaSabotage,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!normalizedRoomId || submitDisabled) {
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      await submitRoundResult({
        roomId: normalizedRoomId,
        timeTakenSeconds: BigInt(
          Math.max(0, fallbackSecondsRemaining - secondsRemaining),
        ),
        testcasesPassed: totalTestcases,
        totalTestcases,
        pointsEarned: 0n,
      });
      setStatusMessage("Round submitted. Waiting for the rival to finish...");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to submit this round.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    fallbackSecondsRemaining,
    normalizedRoomId,
    secondsRemaining,
    submitDisabled,
    submitRoundResult,
    totalTestcases,
  ]);

  const topBarStatusMessage = !normalizedRoomId
    ? "Open this page from an arena room."
    : !activeRoom && playerSummary
      ? "Match complete. Redirecting to results..."
    : roomPhase !== "playing"
      ? "Waiting for the live round state to sync."
      : myRoundState?.hasSubmitted
        ? "Submission synced. Redirecting when the room advances."
        : statusMessage ??
          (latestIncomingSabotage
            ? `Incoming sabotage queued: ${formatPowerupName(latestIncomingSabotage.powerupId)}.`
            : null);

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: P.bg }}
    >
      {/* ambient glow background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,255,0.06),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(224,141,255,0.07),transparent_24%)]" />

      {/* ═══════════════ TOP NAV BAR ═══════════════ */}
      <TopBar
        canSubmit={!submitDisabled}
        isSubmitting={isSubmitting}
        mySelectedPowerupId={mySelectedPowerupId}
        onRun={handleRun}
        onSabotage={handleSabotage}
        opponentCardUsed={null}
        opponentHasSubmitted={Boolean(opponentRoundState?.hasSubmitted)}
        opponentIsTyping={Boolean(opponentRoundState?.isTyping)}
        opponentName={opponentMember?.memberName ?? "Rival"}
        onSubmit={handleSubmit}
        roundNumber={activeRoundNumber}
        secondsRemaining={secondsRemaining}
        sabotageUsed={sabotageUsed}
        statusMessage={topBarStatusMessage}
        submitLabel={myRoundState?.hasSubmitted ? "Submitted" : "Submit"}
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div ref={containerRef} className="flex min-h-0 flex-1 gap-0 p-2">
        {/* LEFT: description */}
        <div style={{ width: `${hRatio * 100}%` }} className="min-w-0">
          <DescriptionPanel
            problem={problem}
            isLoading={problemLoading}
            error={problemError}
          />
        </div>

        <DragHandle direction="horizontal" onMouseDown={hMouseDown} />

        {/* RIGHT: editor + test cases */}
        <div
          ref={rightContainerRef}
          className="flex min-w-0 flex-1 flex-col gap-0"
        >
          {/* editor */}
          <div style={{ height: `${vRatio * 100}%` }} className="min-h-0">
            <EditorPanel editorThemeId={editorThemeId} />
          </div>

          <DragHandle direction="vertical" onMouseDown={vMouseDown} />

          {/* test cases */}
          <div className="min-h-0 flex-1">
            <TestCasesPanel problem={problem} />
          </div>
        </div>
      </div>
    </div>
  );
}
