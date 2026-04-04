import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducer, useSpacetimeDB, useTable } from "spacetimedb/react";
import { useNavigate, useParams } from "react-router-dom";
import { reducers, tables } from "../module_bindings";
import { DescriptionPanel } from "./coding-window/DescriptionPanel";
import { EditorPanel } from "./coding-window/EditorPanel";
import { TestCasesPanel } from "./coding-window/TestCasesPanel";
import { TopBar } from "./coding-window/TopBar";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CONFIGS,
  P,
  type SupportedLanguage,
} from "./coding-window/constants";
import {
  judgeCodeAgainstCases,
  type JudgeRunResult,
} from "./coding-window/piston";
import {
  getSubmissionTestCases,
  getVisibleTestCases,
} from "./coding-window/problemContent";

const PROBLEM_API_URL =
  import.meta.env.VITE_PROBLEM_API_URL ?? "/api/problemset";

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

function getRoundDurationSeconds(roundNumber: number) {
  if (roundNumber === 1) {
    return 5 * 60;
  }

  if (roundNumber === 2) {
    return 10 * 60;
  }

  return 15 * 60;
}

function useDragResize(
  direction: "horizontal" | "vertical",
  initialRatio: number,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [ratio, setRatio] = useState(initialRatio);
  const dragging = useRef(false);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      dragging.current = true;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const totalSize = direction === "horizontal" ? rect.width : rect.height;
        const currentPos =
          direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const startOffset = direction === "horizontal" ? rect.left : rect.top;
        const nextRatio = Math.max(
          0.2,
          Math.min(0.8, (currentPos - startOffset) / totalSize),
        );

        setRatio(nextRatio);
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
    [containerRef, direction],
  );

  return { ratio, handleMouseDown };
}

function DragHandle({
  direction,
  onMouseDown,
}: {
  direction: "horizontal" | "vertical";
  onMouseDown: (event: React.MouseEvent) => void;
}) {
  const isHorizontal = direction === "horizontal";

  return (
    <div
      onMouseDown={onMouseDown}
      className={`group relative z-10 flex shrink-0 items-center justify-center transition-colors ${
        isHorizontal ? "w-[6px] cursor-col-resize" : "h-[6px] cursor-row-resize"
      }`}
    >
      <div
        className={`rounded-full bg-[var(--ghost-border)] transition-all group-hover:bg-[var(--primary)] ${
          isHorizontal ? "h-8 w-[2px]" : "h-[2px] w-8"
        }`}
      />
    </div>
  );
}

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

  const containerRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [problem, setProblem] = useState<RemoteProblemData | null>(null);
  const [problemLoading, setProblemLoading] = useState(true);
  const [problemError, setProblemError] = useState<string | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [drafts, setDrafts] = useState<Record<SupportedLanguage, string>>({
    cpp: LANGUAGE_CONFIGS.cpp.starterCode,
    java: LANGUAGE_CONFIGS.java.starterCode,
  });
  const [activeAction, setActiveAction] = useState<"run" | "submit" | null>(
    null,
  );
  const [runResult, setRunResult] = useState<JudgeRunResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"run" | "submit" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasRunVisibleCases, setHasRunVisibleCases] = useState(false);
  const [isSyncingSubmission, setIsSyncingSubmission] = useState(false);

  const [arenaRoomRows] = useTable(tables.arenaRoom);
  const [arenaPowerupLockRows] = useTable(tables.arenaPowerupLock);
  const submitRoundResult = useReducer(reducers.submitRoundResult);

  const activeRoom = useMemo(() => {
    if (!normalizedRoomId) {
      return null;
    }

    return arenaRoomRows.find((room) => room.roomId === normalizedRoomId) ?? null;
  }, [arenaRoomRows, normalizedRoomId]);

  const activeRoundNumber = activeRoom?.currentRound
    ? Number(activeRoom.currentRound)
    : fallbackRoundNumber;
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
  const myRoundState = useMemo(() => {
    if (!identity || !normalizedRoomId) {
      return null;
    }

    return (
      arenaPowerupLockRows.find(
        (lock) =>
          lock.roomId === normalizedRoomId && lock.playerIdentity.isEqual(identity),
      ) ?? null
    );
  }, [arenaPowerupLockRows, identity, normalizedRoomId]);

  const { ratio: hRatio, handleMouseDown: hMouseDown } = useDragResize(
    "horizontal",
    0.42,
    containerRef,
  );
  const { ratio: vRatio, handleMouseDown: vMouseDown } = useDragResize(
    "vertical",
    0.6,
    rightContainerRef,
  );

  const code = drafts[language];
  const visibleTestCases = useMemo(() => getVisibleTestCases(problem), [problem]);
  const submissionTestCases = useMemo(
    () => getSubmissionTestCases(problem),
    [problem],
  );
  const totalTestcases = BigInt(Math.max(submissionTestCases.length, 1));
  const submitDisabled =
    !normalizedRoomId ||
    roomPhase !== "playing" ||
    activeAction === "submit" ||
    isSyncingSubmission ||
    Boolean(myRoundState?.hasSubmitted);

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
    if (!normalizedRoomId || !username || !activeRoom) {
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
    navigate,
    normalizedRoomId,
    username,
  ]);

  useEffect(() => {
    if (secondsRemaining !== 0 || submitDisabled || !normalizedRoomId) {
      return;
    }

    void (async () => {
      try {
        setIsSyncingSubmission(true);
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
        setIsSyncingSubmission(false);
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

  const handleCodeChange = useCallback(
    (nextCode: string) => {
      setDrafts((current) => ({
        ...current,
        [language]: nextCode,
      }));
    },
    [language],
  );

  const handleLanguageChange = useCallback((nextLanguage: SupportedLanguage) => {
    setLanguage(nextLanguage);
  }, []);

  const handleReset = useCallback(() => {
    setDrafts((current) => ({
      ...current,
      [language]: LANGUAGE_CONFIGS[language].starterCode,
    }));
  }, [language]);

  const executeJudge = useCallback(
    async (action: "run" | "submit") => {
      const selectedTestCases =
        action === "submit" ? submissionTestCases : visibleTestCases;

      if (action === "submit" && submitDisabled) {
        return;
      }

      if (selectedTestCases.length === 0) {
        setExecutionError("No test cases were found for this problem.");
        setRunResult(null);
        setLastAction(action);
        return;
      }

      setActiveAction(action);
      setExecutionError(null);
      setRunResult(null);
      setStatusMessage(null);

      try {
        const result = await judgeCodeAgainstCases({
          language,
          code,
          testCases: selectedTestCases,
        });

        setRunResult(result);
        setLastAction(action);

        if (action === "run") {
          setHasRunVisibleCases(true);
          setStatusMessage(
            `Run completed. ${result.passedCount}/${result.totalCount} visible test cases passed.`,
          );
          return;
        }

        if (!normalizedRoomId) {
          return;
        }

        setIsSyncingSubmission(true);
        await submitRoundResult({
          roomId: normalizedRoomId,
          timeTakenSeconds: BigInt(
            Math.max(0, fallbackSecondsRemaining - secondsRemaining),
          ),
          testcasesPassed: BigInt(result.passedCount),
          totalTestcases: BigInt(result.totalCount),
          pointsEarned: hasRunVisibleCases ? 100n : 75n,
        });
        setStatusMessage("Round submitted. Waiting for the rival to finish...");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Execution failed.";
        setExecutionError(message);

        if (action === "submit") {
          setStatusMessage(message);
        }
      } finally {
        setActiveAction(null);
        setIsSyncingSubmission(false);
      }
    },
    [
      code,
      fallbackSecondsRemaining,
      hasRunVisibleCases,
      language,
      normalizedRoomId,
      secondsRemaining,
      submissionTestCases,
      submitDisabled,
      submitRoundResult,
      visibleTestCases,
    ],
  );

  const topBarStatusMessage = useMemo(() => {
    if (!normalizedRoomId) {
      return "Open this page from an arena room.";
    }

    if (roomPhase !== "playing") {
      return "Waiting for the live round state to sync.";
    }

    if (myRoundState?.hasSubmitted) {
      return "Submission synced. Redirecting when the room advances.";
    }

    if (activeAction === "run") {
      return `Running ${visibleTestCases.length} visible test cases in ${LANGUAGE_CONFIGS[language].label}...`;
    }

    if (activeAction === "submit") {
      return `Submitting ${submissionTestCases.length} total test cases in ${LANGUAGE_CONFIGS[language].label}...`;
    }

    if (executionError) {
      return executionError;
    }

    return (
      statusMessage ??
      `${LANGUAGE_CONFIGS[language].label} ready. Run checks the visible examples, and submit checks the full testcase set.`
    );
  }, [
    activeAction,
    executionError,
    language,
    myRoundState?.hasSubmitted,
    normalizedRoomId,
    roomPhase,
    statusMessage,
    submissionTestCases.length,
    visibleTestCases.length,
  ]);

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: P.bg }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,255,0.06),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(224,141,255,0.07),transparent_24%)]" />

      <TopBar
        canSubmit={!submitDisabled}
        isRunning={activeAction === "run"}
        isSubmitting={activeAction === "submit" || isSyncingSubmission}
        onRun={() => void executeJudge("run")}
        onSubmit={() => void executeJudge("submit")}
        roundNumber={activeRoundNumber}
        secondsRemaining={secondsRemaining}
        statusMessage={topBarStatusMessage}
        submitLabel={myRoundState?.hasSubmitted ? "Submitted" : "Submit"}
      />

      <div ref={containerRef} className="flex min-h-0 flex-1 gap-0 p-2">
        <div style={{ width: `${hRatio * 100}%` }} className="min-w-0">
          <DescriptionPanel
            problem={problem}
            isLoading={problemLoading}
            error={problemError}
          />
        </div>

        <DragHandle direction="horizontal" onMouseDown={hMouseDown} />

        <div
          ref={rightContainerRef}
          className="flex min-w-0 flex-1 flex-col gap-0"
        >
          <div style={{ height: `${vRatio * 100}%` }} className="min-h-0">
            <EditorPanel
              language={language}
              code={code}
              onLanguageChange={handleLanguageChange}
              onCodeChange={handleCodeChange}
              onReset={handleReset}
            />
          </div>

          <DragHandle direction="vertical" onMouseDown={vMouseDown} />

          <div className="min-h-0 flex-1">
            <TestCasesPanel
              problem={problem}
              visibleTestCases={visibleTestCases}
              runResult={runResult}
              isRunning={activeAction !== null || isSyncingSubmission}
              mode={lastAction}
              executionError={executionError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
