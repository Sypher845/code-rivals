import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducer, useSpacetimeDB, useTable } from "spacetimedb/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TopBar } from "./coding-window/TopBar";
import { DescriptionPanel } from "./coding-window/DescriptionPanel";
import { EditorPanel } from "./coding-window/EditorPanel";
import { TestCasesPanel } from "./coding-window/TestCasesPanel";
import {
  DEFAULT_CODE,
  DEFAULT_LANGUAGE,
  EXECUTION_LANGUAGE_CONFIG,
  P,
  type SupportedEditorLanguage,
} from "./coding-window/constants";
import {
  judgeCodeAgainstTestCases,
  type JudgeRunResult,
} from "./coding-window/judge";
import { getParsedTestCases } from "./coding-window/problemContent";
import { reducers, tables } from "../module_bindings";
import type { ArenaSabotageEvent } from "../module_bindings/types";
import {
  formatPowerupName,
  getPassiveTimePenaltySeconds,
  powerupRequiresManualActivation,
  resolvePowerupEffect,
  type ResolvedPowerupEffect,
} from "../utils/arenaPowerEffects";
import {
  DEFAULT_EDITOR_THEME_ID,
  executePowerupHandler,
  type EditorSabotageEffect,
  ZEN_EDITOR_THEME_ID,
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

type OutgoingSabotage = ResolvedPowerupEffect & {
  expiresAtMs: number | null;
  roomId: string;
  roundNumber: number;
  targetPlayerIdentityHex: string;
};

type ZenRoundStage = "intro" | "playing" | "submitted" | "finished";
type ZenTransitionDirection = "ltr" | "rtl";
type ZenTransitionState = {
  zenTransition?: boolean;
  zenTransitionDirection?: ZenTransitionDirection;
};

const ZEN_SABOTAGE_OPTIONS = [
  "SkullCard",
  "TimeKumCard",
  "LineJumperCard",
] as const;

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

function hasLockedMirrorShield(
  powerupId: string | null | undefined,
  hasLockedPower: boolean | null | undefined,
) {
  return hasLockedPower === true && powerupId === "MirrorShieldCard";
}

function getRoundLongDebuffLabel(params: {
  activeDebuffs?: string[] | null;
  affectedByOpponentPowerupId?: string | null;
  roomPhase: string | null;
}) {
  const { activeDebuffs, affectedByOpponentPowerupId, roomPhase } = params;

  if (roomPhase !== "playing") {
    return null;
  }

  if (activeDebuffs?.includes("NoMistakesCard")) {
    return formatPowerupName("NoMistakesCard");
  }

  if (
    affectedByOpponentPowerupId === "TimeKumCard" ||
    affectedByOpponentPowerupId === "TimeHeistCard"
  ) {
    return formatPowerupName(affectedByOpponentPowerupId);
  }

  return null;
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

function ZenRoundCard({
  roundNumber,
  selfSabotageEnabled,
  stage,
  onExit,
  onStart,
}: {
  roundNumber: number;
  selfSabotageEnabled: boolean;
  stage: ZenRoundStage;
  onExit: () => void;
  onStart: () => void;
}) {
  const isFinished = stage === "finished";

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-[28px] border border-[#2b2b2b] bg-[#121212] p-8 text-center shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7d7d7d]">
          Zen Mode
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#f2f2f2]">
          {isFinished ? "Practice session complete" : `Start Round ${roundNumber}`}
        </h2>
        <p className="mt-4 text-sm leading-7 text-[#9d9d9d]">
          {isFinished
            ? "You finished all three solo rounds. Restart Zen Mode whenever you want another quiet practice run."
            : "Solo practice keeps the regular round pacing, but strips the interface back to a sober black-and-gray layout."}
        </p>
        {!isFinished ? (
          <div className="mt-6 rounded-2xl border border-[#262626] bg-[#171717] px-5 py-4 text-left">
            <p className="text-sm font-medium text-[#e0e0e0]">
              Self sabotage
            </p>
            <p className="mt-2 text-sm leading-6 text-[#9b9b9b]">
              {selfSabotageEnabled
                ? "Enabled. One random sabotage will be applied this round from No Retreat, Time Kum, and Line Jumper."
                : "Disabled. This round will run clean with the standard timer."}
            </p>
          </div>
        ) : null}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="rounded-xl border border-[#2f2f2f] bg-[#181818] px-5 py-3 text-sm font-medium text-[#d0d0d0] transition hover:border-[#474747] hover:bg-[#1f1f1f]"
          >
            Exit Zen Mode
          </button>
          <button
            type="button"
            onClick={onStart}
            className="rounded-xl bg-[#e2e2e2] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:bg-[#f0f0f0]"
          >
            {isFinished ? "Restart Practice" : `Start Round ${roundNumber}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════════ */

export function CodingWindowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const transitionState = location.state as ZenTransitionState | null;
  const { identity } = useSpacetimeDB();
  const { roomSegment, roundSegment, username } = useParams();
  const zenRouteRoundNumber = useMemo(() => {
    const match = location.pathname.match(/^\/[^/]+\/zen\/R([123])$/i);
    if (!match) {
      return null;
    }

    return Number.parseInt(match[1] ?? "1", 10);
  }, [location.pathname]);
  const normalizedRoomId =
    roomSegment?.replace(/^room=/i, "").trim().toUpperCase() ?? null;
  const isStandaloneTestingMode = normalizedRoomId === null;
  const parsedRoundNumber = Number.parseInt(
    roundSegment?.replace(/^r/i, "") ?? "1",
    10,
  );
  const zenRequested = zenRouteRoundNumber !== null;
  const fallbackRoundNumber =
    zenRouteRoundNumber ??
    (Number.isNaN(parsedRoundNumber) || parsedRoundNumber < 1 ? 1 : parsedRoundNumber);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const [problemRequestInFlight, setProblemRequestInFlight] = useState(false);
  const [problemRequestError, setProblemRequestError] = useState<string | null>(null);
  const [zenProblemJson, setZenProblemJson] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [zenToastMessage, setZenToastMessage] = useState<string | null>(null);
  const [isZenMode, setIsZenMode] = useState(zenRequested);
  const [isZenTransitioning, setIsZenTransitioning] = useState(false);
  const [coverDirection, setCoverDirection] = useState<ZenTransitionDirection>("rtl");
  const [revealDirection, setRevealDirection] = useState<ZenTransitionDirection | null>(
    transitionState?.zenTransition === true
      ? transitionState.zenTransitionDirection ?? null
      : null,
  );
  const [zenSelfSabotageEnabled, setZenSelfSabotageEnabled] = useState(false);
  const [zenRoundNumber, setZenRoundNumber] = useState(fallbackRoundNumber);
  const [zenRoundStage, setZenRoundStage] = useState<ZenRoundStage>("intro");
  const [zenRoundStartMs, setZenRoundStartMs] = useState<number | null>(null);
  const [zenRoundDurationSeconds, setZenRoundDurationSeconds] = useState(() =>
    getRoundDurationSeconds(1),
  );
  const [zenAssignedSabotageId, setZenAssignedSabotageId] = useState<string | null>(
    null,
  );
  const [activeEditorSabotage, setActiveEditorSabotage] =
    useState<EditorSabotageEffect | null>(null);
  const [latestIncomingSabotage, setLatestIncomingSabotage] =
    useState<IncomingSabotage | null>(null);
  const [activeOutgoingSabotage, setActiveOutgoingSabotage] =
    useState<OutgoingSabotage | null>(null);
  const [usedSabotageRoundKey, setUsedSabotageRoundKey] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedEditorLanguage>(DEFAULT_LANGUAGE);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [judgeResult, setJudgeResult] = useState<JudgeRunResult | null>(null);
  const [judgeError, setJudgeError] = useState<string | null>(null);
  const [arenaRoomRows] = useTable(tables.arenaRoom);
  const [arenaRoomMemberRows] = useTable(tables.arenaRoomMember);
  const [arenaPowerupLockRows] = useTable(tables.arenaPowerupLock);
  const [arenaRoundProblemRows] = useTable(tables.arenaRoundProblem);
  const [matchSummaryRows] = useTable(tables.arenaMatchSummary);
  const cacheRoundProblem = useReducer(reducers.cacheRoundProblem);
  const [sessionRows] = useTable(tables.authSession);
  const submitRoundResult = useReducer(reducers.submitRoundResult);
  const triggerArenaSabotage = useReducer(reducers.triggerArenaSabotage);

  const activeRoom = useMemo(() => {
    if (!normalizedRoomId) {
      return null;
    }

    return arenaRoomRows.find((room) => room.roomId === normalizedRoomId) ?? null;
  }, [arenaRoomRows, normalizedRoomId]);
  const sessionUsername = useMemo(() => {
    if (!identity) {
      return null;
    }

    return (
      sessionRows.find((row) => row.sessionIdentity.isEqual(identity))?.username ?? null
    );
  }, [identity, sessionRows]);

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
  const parsedZenProblem = useMemo(
    () => parseStoredProblem(zenProblemJson),
    [zenProblemJson],
  );
  const problem = isZenMode ? parsedZenProblem.problem : parsedProblem.problem;
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
  const myMirrorShieldActive = hasLockedMirrorShield(
    myRoundState?.powerupId,
    myRoundState?.hasLockedPower,
  );
  const opponentMirrorShieldActive = hasLockedMirrorShield(
    opponentRoundState?.powerupId,
    opponentRoundState?.hasLockedPower,
  );
  const roundStartSelfDebuffLabel = getRoundLongDebuffLabel({
    activeDebuffs: myRoundState?.activeDebuffs,
    affectedByOpponentPowerupId:
      opponentRoundState?.hasLockedPower && !myMirrorShieldActive
        ? opponentRoundState.powerupId
        : null,
    roomPhase,
  });
  const roundStartOpponentDebuffLabel = getRoundLongDebuffLabel({
    activeDebuffs: opponentRoundState?.activeDebuffs,
    affectedByOpponentPowerupId:
      myRoundState?.hasLockedPower && !opponentMirrorShieldActive
        ? myRoundState.powerupId
        : null,
    roomPhase,
  });
  const activeDebuffSecondsRemaining =
    activeEditorSabotage?.expiresAtMs === null ||
    activeEditorSabotage?.expiresAtMs === undefined
      ? null
      : Math.max(0, Math.ceil((activeEditorSabotage.expiresAtMs - nowMs) / 1000));
  const opponentDebuffSecondsRemaining =
    activeOutgoingSabotage?.expiresAtMs === null ||
    activeOutgoingSabotage?.expiresAtMs === undefined
      ? null
      : Math.max(
          0,
          Math.ceil((activeOutgoingSabotage.expiresAtMs - nowMs) / 1000),
        );
  const testCases = useMemo(() => getParsedTestCases(problem), [problem]);
  const totalTestcases = BigInt(Math.max(testCases.length, 1));
  const problemError =
    (isZenMode ? parsedZenProblem.error : parsedProblem.error) ??
    problemRequestError;
  const problemLoading =
    (((isZenMode && !zenProblemJson) ||
      (roomPhase === "playing" && !storedRoundProblem)) ||
      problemRequestInFlight) &&
    !problemError;
  const activeRoundProblemApiUrl = getRoundProblemApiUrl(activeRoundNumber);
  const zenRoundProblemApiUrl = getRoundProblemApiUrl(zenRoundNumber);
  const arenaSubmitDisabled =
    !normalizedRoomId ||
    roomPhase !== "playing" ||
    isSubmitting ||
    Boolean(myRoundState?.hasSubmitted);

  const zenSecondsRemaining =
    zenRoundStage === "submitted"
      ? 0
      : zenRoundStage !== "playing" || zenRoundStartMs === null
        ? zenRoundDurationSeconds
      : Math.max(
          0,
          Math.ceil(
            (zenRoundStartMs + zenRoundDurationSeconds * 1000 - nowMs) / 1000,
          ),
        );
  const submitDisabled = isZenMode
    ? (zenRoundStage !== "playing" && zenRoundStage !== "submitted") || isSubmitting
    : isStandaloneTestingMode
      ? isSubmitting
      : arenaSubmitDisabled;

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
      if (!identity || !normalizedRoomId || isZenMode) {
        return;
      }

      if (eventRow.roomId !== normalizedRoomId) {
        return;
      }

      const resolvedEffect = resolvePowerupEffect(
        eventRow.powerupId,
        Number(eventRow.roundNumber),
      );
      if (!resolvedEffect) {
        return;
      }

      const emittedAtMs = Number(eventRow.createdAt.microsSinceUnixEpoch / 1000n);

      if (eventRow.targetPlayerIdentity.isEqual(identity)) {
        setLatestIncomingSabotage({
          ...resolvedEffect,
          emittedAtMs,
          roomId: eventRow.roomId,
          roundNumber: Number(eventRow.roundNumber),
          sourcePlayerIdentityHex: eventRow.sourcePlayerIdentity.toHexString(),
        });
      }

      if (
        eventRow.sourcePlayerIdentity.isEqual(identity) &&
        !eventRow.targetPlayerIdentity.isEqual(identity)
      ) {
        setActiveOutgoingSabotage({
          ...resolvedEffect,
          expiresAtMs:
            resolvedEffect.durationMinutes === null
              ? roundDeadlineMs
              : emittedAtMs + resolvedEffect.durationMinutes * 60_000,
          roomId: eventRow.roomId,
          roundNumber: Number(eventRow.roundNumber),
          targetPlayerIdentityHex: eventRow.targetPlayerIdentity.toHexString(),
        });
      }
    },
    [identity, isZenMode, normalizedRoomId, roundDeadlineMs],
  );

  const sabotageEventCallbacks = useMemo(
    () => ({ onInsert: handleIncomingSabotageEvent }),
    [handleIncomingSabotageEvent],
  );

  useTable(tables.arenaSabotageEvent, sabotageEventCallbacks);

  useEffect(() => {
    const shouldTick =
      (isZenMode && zenRoundStage === "playing") ||
      (!isZenMode && roundDeadlineMs !== null);

    if (!shouldTick) {
      return;
    }

    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => window.clearInterval(timerId);
  }, [isZenMode, roundDeadlineMs, zenRoundStage]);

  useEffect(() => {
    if (isZenMode || !normalizedRoomId || !username) {
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
    isZenMode,
    username,
  ]);

  useEffect(() => {
    if (isZenMode || !currentRoundKey) {
      return;
    }

    setUsedSabotageRoundKey((current) =>
      current === currentRoundKey ? current : null,
    );
    setLatestIncomingSabotage(null);
    setActiveOutgoingSabotage(null);
    setActiveEditorSabotage(null);
    setProblemRequestError(null);
  }, [currentRoundKey, isZenMode]);

  useEffect(() => {
    if (!isZenMode) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        setProblemRequestInFlight(true);
        setProblemRequestError(null);

        const response = await fetch(zenRoundProblemApiUrl, {
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

        JSON.parse(problemJson);

        if (!cancelled) {
          setZenProblemJson(problemJson);
        }
      } catch (error) {
        if ((error as Error).name === "AbortError" || cancelled) {
          return;
        }

        setProblemRequestError(
          error instanceof Error
            ? error.message
            : "Unable to load the Zen round problem.",
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
  }, [isZenMode, zenRoundProblemApiUrl]);

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
    if (!activeOutgoingSabotage?.expiresAtMs) {
      return;
    }

    if (activeOutgoingSabotage.expiresAtMs <= nowMs) {
      setActiveOutgoingSabotage(null);
    }
  }, [activeOutgoingSabotage, nowMs]);

  useEffect(() => {
    if (isZenMode || secondsRemaining !== 0 || submitDisabled || !normalizedRoomId) {
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
    isZenMode,
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

  const handleLanguageChange = useCallback((language: SupportedEditorLanguage) => {
    setSelectedLanguage(language);
    setCode(EXECUTION_LANGUAGE_CONFIG[language].boilerplate);
    setJudgeResult(null);
    setJudgeError(null);
    setStatusMessage(null);
  }, []);

  const handleResetCode = useCallback(() => {
    setCode(EXECUTION_LANGUAGE_CONFIG[selectedLanguage].boilerplate);
    setJudgeResult(null);
    setJudgeError(null);
    setStatusMessage("Editor reset to the default boilerplate.");
  }, [selectedLanguage]);

  const runJudge = useCallback(async () => {
    setJudgeError(null);
    const executionResult = await judgeCodeAgainstTestCases(
      selectedLanguage,
      code,
      testCases,
    );
    setJudgeResult(executionResult);
    return executionResult;
  }, [code, selectedLanguage, testCases]);

  const handleRun = useCallback(async () => {
    if (isZenMode && zenRoundStage !== "playing") {
      setStatusMessage("Start the Zen round before running code.");
      return;
    }
    if (noMistakesActive) {
      setStatusMessage(
        "No Mistakes is active. Run is disabled, so this round is submit-only.",
      );
      return;
    }

    try {
      setIsRunning(true);
      setJudgeError(null);
      setStatusMessage("Running your code against all visible testcases...");
      const result = await runJudge();
      setStatusMessage(
        `Run completed. ${result.passedCount}/${result.totalCount} testcases passed.`,
      );
    } catch (error) {
      setJudgeResult(null);
      setJudgeError(
        error instanceof Error
          ? error.message
          : "Unable to execute your code right now.",
      );
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to execute your code right now.",
      );
    } finally {
      setIsRunning(false);
    }
  }, [isZenMode, noMistakesActive, runJudge, zenRoundStage]);

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
    if (isZenMode) {
      if (submitDisabled) {
        return;
      }

      if (zenRoundStage === "submitted") {
        if (zenRoundNumber >= 3) {
          setZenRoundStage("finished");
          setStatusMessage("Zen practice complete. You can restart whenever you want.");
          return;
        }

        const nextRound = zenRoundNumber + 1;
        setZenRoundNumber(nextRound);
        setZenRoundStage("intro");
        setZenRoundDurationSeconds(getRoundDurationSeconds(nextRound));
        setZenAssignedSabotageId(null);
        setZenProblemJson(null);
        setActiveEditorSabotage(null);
        setJudgeResult(null);
        setJudgeError(null);
        setStatusMessage(`Round ${nextRound} is ready. Start whenever you want.`);
        return;
      }

      try {
        setIsSubmitting(true);
        setJudgeError(null);
        setStatusMessage("Judging your latest code against all testcases...");
        const result = await runJudge();
        const submittedRound = zenRoundNumber;

        setActiveEditorSabotage(null);
        setZenAssignedSabotageId(null);
        setZenRoundStartMs(null);
        setZenRoundStage("submitted");
        setStatusMessage(
          submittedRound >= 3
            ? `Round ${submittedRound} submitted. ${result.passedCount}/${result.totalCount} testcases passed. Finish practice when you're ready.`
            : `Round ${submittedRound} submitted. ${result.passedCount}/${result.totalCount} testcases passed. Move to the next question when you're ready.`,
        );
      } catch (error) {
        setJudgeResult(null);
        setJudgeError(
          error instanceof Error ? error.message : "Unable to submit this round.",
        );
        setStatusMessage(
          error instanceof Error ? error.message : "Unable to submit this round.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (submitDisabled) {
      return;
    }

    try {
      setIsSubmitting(true);
      setJudgeError(null);
      setStatusMessage("Judging your latest code against all testcases...");
      const result = await runJudge();

      if (isStandaloneTestingMode) {
        setStatusMessage(
          `Submitted in testing mode. ${result.passedCount}/${result.totalCount} testcases passed.`,
        );
        return;
      }

      if (!normalizedRoomId) {
        throw new Error("Open this page from an arena room to submit the round.");
      }

      await submitRoundResult({
        roomId: normalizedRoomId,
        timeTakenSeconds: BigInt(
          Math.max(0, myRoundDurationSeconds - secondsRemaining),
        ),
        testcasesPassed: BigInt(result.passedCount),
        totalTestcases,
        pointsEarned: 0n,
      });
      setStatusMessage(
        `Round submitted. ${result.passedCount}/${result.totalCount} testcases passed.`,
      );
    } catch (error) {
      setJudgeError(
        error instanceof Error ? error.message : "Unable to submit this round.",
      );
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to submit this round.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isStandaloneTestingMode,
    isZenMode,
    myRoundDurationSeconds,
    normalizedRoomId,
    runJudge,
    secondsRemaining,
    submitDisabled,
    submitRoundResult,
    totalTestcases,
    zenRoundNumber,
    zenRoundStage,
  ]);

  const handleZenRoundStart = useCallback(() => {
    const roundNumber = zenRoundStage === "finished" ? 1 : zenRoundNumber;
    const baseDurationSeconds = getRoundDurationSeconds(roundNumber);
    const selectedSabotageId = zenSelfSabotageEnabled
      ? ZEN_SABOTAGE_OPTIONS[
          Math.floor(Math.random() * ZEN_SABOTAGE_OPTIONS.length)
        ] ?? null
      : null;
    const nextDurationSeconds = selectedSabotageId
      ? Math.max(
          0,
          baseDurationSeconds -
            getPassiveTimePenaltySeconds(selectedSabotageId, roundNumber),
        )
      : baseDurationSeconds;
    const emittedAtMs = Date.now();

    if (zenRoundStage === "finished") {
      setZenRoundNumber(1);
    }

    if (selectedSabotageId) {
      const effect = resolvePowerupEffect(selectedSabotageId, roundNumber);
      const handlerOutput = effect
        ? executePowerupHandler({ effect, emittedAtMs })
        : null;

      if (handlerOutput?.editorEffect) {
        setActiveEditorSabotage({
          ...handlerOutput.editorEffect,
          expiresAtMs: emittedAtMs + nextDurationSeconds * 1000,
          themeId: ZEN_EDITOR_THEME_ID,
        });
      } else {
        setActiveEditorSabotage(null);
      }
    } else {
      setActiveEditorSabotage(null);
    }

    setJudgeResult(null);
    setJudgeError(null);
    setZenAssignedSabotageId(selectedSabotageId);
    setZenRoundDurationSeconds(nextDurationSeconds);
    setZenRoundStartMs(emittedAtMs);
    setZenRoundStage("playing");
    setStatusMessage(
      selectedSabotageId
        ? `${formatPowerupName(selectedSabotageId)} is active for this Zen round.`
        : `Zen round ${roundNumber} started.`,
    );
  }, [zenRoundNumber, zenRoundStage, zenSelfSabotageEnabled]);

  useEffect(() => {
    setIsZenMode(zenRequested);
  }, [zenRequested]);

  useEffect(() => {
    if (!isZenMode || zenRouteRoundNumber === null) {
      return;
    }

    setZenRoundNumber(zenRouteRoundNumber);
    setZenRoundDurationSeconds(getRoundDurationSeconds(zenRouteRoundNumber));
  }, [isZenMode, zenRouteRoundNumber]);

  useEffect(() => {
    if (!isZenMode) {
      setZenRoundNumber(1);
      setZenRoundStage("intro");
      setZenRoundStartMs(null);
      setZenRoundDurationSeconds(getRoundDurationSeconds(1));
      setZenAssignedSabotageId(null);
      setZenProblemJson(null);
      setActiveEditorSabotage(null);
      return;
    }

    setZenRoundNumber(zenRouteRoundNumber ?? 1);
    setZenRoundStage("intro");
    setZenRoundStartMs(null);
    setZenRoundDurationSeconds(getRoundDurationSeconds(zenRouteRoundNumber ?? 1));
    setZenAssignedSabotageId(null);
    setZenProblemJson(null);
    setLatestIncomingSabotage(null);
    setActiveEditorSabotage(null);
    setSelectedLanguage(DEFAULT_LANGUAGE);
    setCode(DEFAULT_CODE);
    setJudgeResult(null);
    setJudgeError(null);
    setStatusMessage(
      `Zen Mode is on. Start Round ${zenRouteRoundNumber ?? 1} whenever you want.`,
    );
  }, [isZenMode, zenRouteRoundNumber]);

  useEffect(() => {
    if (!isZenMode || !username) {
      return;
    }

    const targetPath = `/${encodeURIComponent(username)}/zen/R${zenRoundNumber}`;
    if (location.pathname === targetPath) {
      return;
    }

    navigate(targetPath, { replace: true });
  }, [isZenMode, location.pathname, navigate, username, zenRoundNumber]);

  useEffect(() => {
    if (!isZenMode || zenRoundStage !== "playing" || zenSecondsRemaining !== 0) {
      return;
    }

    void handleSubmit();
  }, [handleSubmit, isZenMode, zenRoundStage, zenSecondsRemaining]);

  useEffect(() => {
    if (!isZenMode || !statusMessage) {
      return;
    }

    setZenToastMessage(statusMessage);
    const timeoutId = window.setTimeout(() => {
      setZenToastMessage(null);
    }, 2800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isZenMode, statusMessage]);

  const topBarStatusMessage = isZenMode
    ? zenRoundStage === "finished"
      ? null
      : zenRoundStage === "intro"
        ? null
        : zenRoundStage === "submitted"
          ? null
        : zenAssignedSabotageId
          ? null
          : null
    : !normalizedRoomId
      ? statusMessage ??
        "Testing mode: run or submit code against the current problem at /coding-window."
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

  const displayedRoundNumber = isZenMode ? zenRoundNumber : activeRoundNumber;
  const displayedSecondsRemaining = isZenMode ? zenSecondsRemaining : secondsRemaining;
  const displayedEditorThemeId = isZenMode
    ? activeEditorSabotage?.themeId ?? ZEN_EDITOR_THEME_ID
    : activeEditorSabotage?.themeId ?? DEFAULT_EDITOR_THEME_ID;
  const handleExitZenMode = useCallback(() => {
    if (isZenTransitioning) {
      return;
    }

    const arenaPath = sessionUsername
      ? `/${encodeURIComponent(sessionUsername)}`
      : username
        ? `/${encodeURIComponent(username)}`
        : "/";

    const transitionDirection: ZenTransitionDirection = "rtl";
    setCoverDirection(transitionDirection);
    setIsZenTransitioning(true);
    window.setTimeout(() => {
      navigate(arenaPath, {
        replace: true,
        state: {
          zenTransition: true,
          zenTransitionDirection: transitionDirection,
        } satisfies ZenTransitionState,
      });
    }, 420);
  }, [isZenTransitioning, navigate, sessionUsername, username]);
  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: isZenMode ? "#0d0d0d" : P.bg }}
    >
      <AnimatePresence>
        {isZenTransitioning ? (
          <motion.div
            key={`zen-cover-${coverDirection}`}
            className="pointer-events-none fixed inset-0 z-140 bg-black"
            initial={{
              scaleX: 0,
              originX: coverDirection === "ltr" ? 0 : 1,
            }}
            animate={{
              scaleX: 1,
              originX: coverDirection === "ltr" ? 0 : 1,
            }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {revealDirection ? (
          <motion.div
            key={`zen-reveal-${revealDirection}`}
            className="pointer-events-none fixed inset-0 z-140 bg-black"
            initial={{
              scaleX: 1,
              originX: revealDirection === "ltr" ? 1 : 0,
            }}
            animate={{
              scaleX: 0,
              originX: revealDirection === "ltr" ? 1 : 0,
            }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => {
              setRevealDirection(null);
            }}
          />
        ) : null}
      </AnimatePresence>
      {isZenMode && zenToastMessage ? (
        <div className="pointer-events-none fixed top-22 right-6 z-120">
          <div className="rounded-xl border border-[#353535] bg-[#121212] px-4 py-2.5 text-sm text-[#e0e0e0] shadow-[0_18px_48px_rgba(0,0,0,0.55)]">
            {zenToastMessage}
          </div>
        </div>
      ) : null}

      {/* ambient glow background */}
      {!isZenMode ? (
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,255,0.06),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(224,141,255,0.07),transparent_24%)]" />
      ) : null}

      {/* ═══════════════ TOP NAV BAR ═══════════════ */}
      <TopBar
        activeDebuffLabel={
          activeEditorSabotage
            ? formatPowerupName(activeEditorSabotage.powerupId)
            : roundStartSelfDebuffLabel
        }
        activeDebuffSecondsRemaining={activeDebuffSecondsRemaining}
        activeDebuffUsesRoundTimer={
          Boolean(latestIncomingSabotage?.fullRound && activeEditorSabotage) ||
          Boolean(roundStartSelfDebuffLabel)
        }
        canSubmit={!submitDisabled}
        canRun={!noMistakesActive}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        myPowerupAppliedAtStart={hasRealTimestamp(myRoundState?.appliedAtRoundStartAt)}
        mySelectedPowerupId={mySelectedPowerupId}
        onRun={handleRun}
        onSabotage={
          hasRealTimestamp(myRoundState?.appliedAtRoundStartAt)
            ? undefined
            : handleSabotage
        }
        opponentActiveDebuffLabel={
          activeOutgoingSabotage
            ? formatPowerupName(activeOutgoingSabotage.powerupId)
            : roundStartOpponentDebuffLabel
        }
        opponentActiveDebuffSecondsRemaining={opponentDebuffSecondsRemaining}
        opponentActiveDebuffUsesRoundTimer={
          Boolean(activeOutgoingSabotage?.fullRound) ||
          Boolean(roundStartOpponentDebuffLabel)
        }
        opponentCardUsed={null}
        opponentHasSubmitted={
          isZenMode ? false : Boolean(opponentRoundState?.hasSubmitted)
        }
        opponentIsTyping={isZenMode ? false : Boolean(opponentRoundState?.isTyping)}
        opponentName={isZenMode ? "Zen" : opponentMember?.memberName ?? "Rival"}
        onSubmit={handleSubmit}
        roundNumber={displayedRoundNumber}
        secondsRemaining={displayedSecondsRemaining}
        sabotageUsed={
          isZenMode
            ? Boolean(zenAssignedSabotageId)
            : selectedPowerupRequiresManualActivation
              ? sabotageUsed
              : true
        }
        statusMessage={topBarStatusMessage}
        submitLabel={
          isZenMode
            ? zenRoundStage === "finished"
              ? "Complete"
              : zenRoundStage === "submitted"
                ? zenRoundNumber >= 3
                  ? "Finish Practice"
                  : "Next Question"
              : "Submit"
            : myRoundState?.hasSubmitted
              ? "Submitted"
              : "Submit"
        }
        zenMode={isZenMode}
        zenSelfSabotageEnabled={zenSelfSabotageEnabled}
        onToggleZenMode={handleExitZenMode}
        onToggleZenSelfSabotage={() =>
          setZenSelfSabotageEnabled((current) => !current)
        }
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      {isZenMode &&
      (zenRoundStage === "intro" || zenRoundStage === "finished") ? (
        <ZenRoundCard
          roundNumber={zenRoundNumber}
          selfSabotageEnabled={zenSelfSabotageEnabled}
          stage={zenRoundStage}
          onExit={handleExitZenMode}
          onStart={handleZenRoundStart}
        />
      ) : (
      <div ref={containerRef} className="flex min-h-0 flex-1 gap-0 p-2">
        {/* LEFT: description */}
        <div style={{ width: `${hRatio * 100}%` }} className="min-w-0">
          <DescriptionPanel
            flashbangActive={flashbangActive}
            problem={problem}
            isLoading={problemLoading}
            error={problemError}
            zenMode={isZenMode}
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
              code={code}
              editorThemeId={displayedEditorThemeId}
              keySwapActive={keySwapActive}
              keySwapMap={keySwapMap}
              language={selectedLanguage}
              lineJumperActive={lineJumperActive}
              visuallyImpairedActive={visuallyImpairedActive}
              noRetreatActive={noRetreatActive}
              zenMode={isZenMode}
              onCodeChange={setCode}
              onLanguageChange={handleLanguageChange}
              onReset={handleResetCode}
            />
          </div>

          <DragHandle direction="vertical" onMouseDown={vMouseDown} />

          {/* test cases */}
          <div className="min-h-0 flex-1">
            <TestCasesPanel
              flashbangActive={flashbangActive}
              errorMessage={judgeError}
              isRunning={isRunning}
              problem={problem}
              zenMode={isZenMode}
              results={judgeResult?.results ?? []}
            />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
