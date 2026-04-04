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
  powerupRequiresManualActivation,
  resolvePowerupEffect,
  type ResolvedPowerupEffect,
} from "../utils/arenaPowerEffects";
import {
  DEFAULT_EDITOR_THEME_ID,
  executePowerupHandler,
  type EditorSabotageEffect,
} from "../utils/arenaPowerHandlers";

const PROBLEM_API_EASY_URL =
  import.meta.env.VITE_PROBLEM_API_EASY_URL ??
  import.meta.env.VITE_PROBLEM_API_URL ??
  "http://localhost:8080/easy";
const PROBLEM_API_MEDIUM_URL =
  import.meta.env.VITE_PROBLEM_API_MEDIUM_URL ?? "http://localhost:8080/medium";

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

function buildRoundProblemKey(roomId: string, roundNumber: number) {
  return `${roomId}:${roundNumber}`;
}

function getRoundProblemApiUrl(roundNumber: number) {
  return roundNumber <= 1 ? PROBLEM_API_EASY_URL : PROBLEM_API_MEDIUM_URL;
}

function parseStoredProblem(problemJson: string | null | undefined) {
  if (!problemJson?.trim()) {
    return { problem: null, error: null as string | null };
  }

  try {
    return {
      problem: JSON.parse(problemJson) as RemoteProblemData,
      error: null as string | null,
    };
  } catch {
    return {
      problem: null,
      error: "Shared round problem could not be parsed.",
    };
  }
}

function microsTimestampToMs(
  timestamp?: { microsSinceUnixEpoch: bigint } | null,
) {
  if (!timestamp || timestamp.microsSinceUnixEpoch <= 0n) {
    return null;
  }

  return Number(timestamp.microsSinceUnixEpoch / 1000n);
}

function hasRealTimestamp(
  timestamp?: { microsSinceUnixEpoch: bigint } | null,
) {
  return microsTimestampToMs(timestamp) !== null;
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
  const [problemRequestInFlight, setProblemRequestInFlight] = useState(false);
  const [problemRequestError, setProblemRequestError] = useState<string | null>(null);
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
  const [arenaRoundProblemRows] = useTable(tables.arenaRoundProblem);
  const [matchSummaryRows] = useTable(tables.arenaMatchSummary);
  const cacheRoundProblem = useReducer(reducers.cacheRoundProblem);
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
  const activeRoundProblemKey = useMemo(() => {
    if (!normalizedRoomId || activeRoundNumber < 1) {
      return null;
    }

    return buildRoundProblemKey(normalizedRoomId, activeRoundNumber);
  }, [activeRoundNumber, normalizedRoomId]);
  const storedRoundProblem = useMemo(() => {
    if (!activeRoundProblemKey) {
      return null;
    }

    return (
      arenaRoundProblemRows.find(
        (row) => row.roundProblemKey === activeRoundProblemKey,
      ) ?? null
    );
  }, [activeRoundProblemKey, arenaRoundProblemRows]);
  const parsedProblem = useMemo(
    () => parseStoredProblem(storedRoundProblem?.problemJson),
    [storedRoundProblem?.problemJson],
  );
  const problem = parsedProblem.problem;
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
  const baseRoundDurationSeconds = getRoundDurationSeconds(activeRoundNumber);
  const roundStartMs = activeRoom?.roundStartTime
    ? Number(activeRoom.roundStartTime.microsSinceUnixEpoch / 1000n)
    : null;
  const sharedRoundDeadlineMs = activeRoom?.roundEndTime
    ? Number(activeRoom.roundEndTime.microsSinceUnixEpoch / 1000n)
    : roundStartMs !== null && activeRoom?.matchState === "playing"
      ? roundStartMs + baseRoundDurationSeconds * 1000
      : null;
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
  const selectedPowerupRequiresManualActivation = mySelectedPowerupId
    ? powerupRequiresManualActivation(mySelectedPowerupId)
    : false;
  const noMistakesActive =
    roomPhase === "playing" &&
    Boolean(myRoundState?.activeDebuffs.includes("NoMistakesCard"));
  const myRoundStartMs = microsTimestampToMs(myRoundState?.playerRoundStartTime);
  const myBaseRoundDeadlineMs = microsTimestampToMs(myRoundState?.playerRoundEndTime);
  const myBaseRoundDurationSeconds =
    myRoundStartMs !== null && myBaseRoundDeadlineMs !== null
      ? Math.max(0, Math.floor((myBaseRoundDeadlineMs - myRoundStartMs) / 1000))
      : baseRoundDurationSeconds;
  const effectiveRoundDurationSeconds = myBaseRoundDurationSeconds;
  const personalRoundDeadlineMs =
    myBaseRoundDeadlineMs !== null && activeRoom?.matchState === "playing"
      ? myBaseRoundDeadlineMs
      : myRoundStartMs !== null && activeRoom?.matchState === "playing"
        ? myRoundStartMs + effectiveRoundDurationSeconds * 1000
        : roundStartMs !== null && activeRoom?.matchState === "playing"
          ? roundStartMs + effectiveRoundDurationSeconds * 1000
          : null;
  const roundDeadlineMs =
    sharedRoundDeadlineMs === null
      ? personalRoundDeadlineMs
      : personalRoundDeadlineMs === null
        ? sharedRoundDeadlineMs
        : Math.min(sharedRoundDeadlineMs, personalRoundDeadlineMs);
  const secondsRemaining =
    roundDeadlineMs === null
      ? effectiveRoundDurationSeconds
      : Math.max(0, Math.ceil((roundDeadlineMs - nowMs) / 1000));
  const myRoundDurationSeconds = effectiveRoundDurationSeconds;
  const currentRoundKey =
    normalizedRoomId === null ? null : `${normalizedRoomId}:${activeRoundNumber}`;
  const sabotageUsed =
    currentRoundKey !== null &&
    (usedSabotageRoundKey === currentRoundKey ||
      hasRealTimestamp(myRoundState?.appliedAtRoundStartAt));
  const editorThemeId =
    activeEditorSabotage?.themeId ?? DEFAULT_EDITOR_THEME_ID;
  const flashbangActive = activeEditorSabotage?.flashbangActive ?? false;
  const keySwapActive = activeEditorSabotage?.keySwapActive ?? false;
  const keySwapMap = activeEditorSabotage?.keySwapMap ?? null;
  const lineJumperActive = activeEditorSabotage?.lineJumperActive ?? false;
  const visuallyImpairedActive =
    activeEditorSabotage?.visuallyImpairedActive ?? false;
  const noRetreatActive = activeEditorSabotage?.noRetreatActive ?? false;
  const testCases = useMemo(() => getParsedTestCases(problem), [problem]);
  const totalTestcases = BigInt(Math.max(testCases.length, 1));
  const problemError = parsedProblem.error ?? problemRequestError;
  const problemLoading =
    ((roomPhase === "playing" && !storedRoundProblem) || problemRequestInFlight) &&
    !problemError;
  const activeRoundProblemApiUrl = getRoundProblemApiUrl(activeRoundNumber);
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
    setProblemRequestError(null);
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

    const normalizedEditorEffect =
      handlerOutput.editorEffect.expiresAtMs === null &&
      latestIncomingSabotage.fullRound &&
      roundDeadlineMs !== null
        ? {
            ...handlerOutput.editorEffect,
            expiresAtMs: roundDeadlineMs,
          }
        : handlerOutput.editorEffect;

    setActiveEditorSabotage(normalizedEditorEffect);
    setStatusMessage(
      `${formatPowerupName(latestIncomingSabotage.powerupId)} is affecting your editor.`,
    );
  }, [latestIncomingSabotage, roundDeadlineMs]);

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
          timeTakenSeconds: BigInt(myRoundDurationSeconds),
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
    myRoundDurationSeconds,
    normalizedRoomId,
    secondsRemaining,
    submitDisabled,
    submitRoundResult,
    totalTestcases,
  ]);

  useEffect(() => {
    if (!normalizedRoomId || !activeRoom || roomPhase !== "playing") {
      setProblemRequestInFlight(false);
      return;
    }

    if (storedRoundProblem) {
      setProblemRequestInFlight(false);
      setProblemRequestError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        setProblemRequestInFlight(true);
        setProblemRequestError(null);

        const response = await fetch(activeRoundProblemApiUrl, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            `Problem API request failed with status ${response.status}.`,
          );
        }

        const problemJson = (await response.text()).trim();
        if (!problemJson) {
          throw new Error("Problem API returned an empty response.");
        }

        try {
          JSON.parse(problemJson);
        } catch {
          throw new Error("Problem API returned invalid JSON.");
        }

        if (cancelled) {
          return;
        }

        await cacheRoundProblem({
          roomId: normalizedRoomId,
          roundNumber: BigInt(activeRoundNumber),
          problemApiUrl: activeRoundProblemApiUrl,
          problemJson,
        });
      } catch (error) {
        if ((error as Error).name === "AbortError" || cancelled) {
          return;
        }

        setProblemRequestError(
          error instanceof Error
            ? error.message
            : "Unable to load the shared round problem.",
        );
      } finally {
        if (!cancelled) {
          setProblemRequestInFlight(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    activeRoundProblemApiUrl,
    activeRoundNumber,
    activeRoom,
    cacheRoundProblem,
    normalizedRoomId,
    roomPhase,
    storedRoundProblem,
  ]);

  const handleRun = useCallback(() => {
    if (noMistakesActive) {
      setStatusMessage(
        "No Mistakes is active. Run is disabled, so this round is submit-only.",
      );
      return;
    }

    setHasRun(true);
    setStatusMessage(`Run completed. ${testCases.length || 1} sample testcases checked.`);
  }, [noMistakesActive, testCases.length]);

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

    if (!selectedPowerupRequiresManualActivation) {
      setStatusMessage(
        `${formatPowerupName(mySelectedPowerupId)} activates automatically from round start.`,
      );
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
    selectedPowerupRequiresManualActivation,
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
          Math.max(0, myRoundDurationSeconds - secondsRemaining),
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
    myRoundDurationSeconds,
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
          (noMistakesActive
            ? "No Mistakes is active. You cannot run code and only get one submit."
            : null) ??
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
        canRun={!noMistakesActive}
        isSubmitting={isSubmitting}
        myPowerupAppliedAtStart={hasRealTimestamp(myRoundState?.appliedAtRoundStartAt)}
        mySelectedPowerupId={mySelectedPowerupId}
        onRun={handleRun}
        onSabotage={
          hasRealTimestamp(myRoundState?.appliedAtRoundStartAt)
            ? undefined
            : handleSabotage
        }
        opponentCardUsed={null}
        opponentHasSubmitted={Boolean(opponentRoundState?.hasSubmitted)}
        opponentIsTyping={Boolean(opponentRoundState?.isTyping)}
        opponentName={opponentMember?.memberName ?? "Rival"}
        onSubmit={handleSubmit}
        roundNumber={activeRoundNumber}
        secondsRemaining={secondsRemaining}
        sabotageUsed={
          selectedPowerupRequiresManualActivation ? sabotageUsed : true
        }
        statusMessage={topBarStatusMessage}
        submitLabel={myRoundState?.hasSubmitted ? "Submitted" : "Submit"}
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div ref={containerRef} className="flex min-h-0 flex-1 gap-0 p-2">
        {/* LEFT: description */}
        <div style={{ width: `${hRatio * 100}%` }} className="min-w-0">
          <DescriptionPanel
            flashbangActive={flashbangActive}
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
            <EditorPanel
              editorThemeId={editorThemeId}
              keySwapActive={keySwapActive}
              keySwapMap={keySwapMap}
              lineJumperActive={lineJumperActive}
              visuallyImpairedActive={visuallyImpairedActive}
              noRetreatActive={noRetreatActive}
            />
          </div>

          <DragHandle direction="vertical" onMouseDown={vMouseDown} />

          {/* test cases */}
          <div className="min-h-0 flex-1">
            <TestCasesPanel
              flashbangActive={flashbangActive}
              problem={problem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
