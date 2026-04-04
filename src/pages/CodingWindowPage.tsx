import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);

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

      if (selectedTestCases.length === 0) {
        setExecutionError("No test cases were found for this problem.");
        setRunResult(null);
        setLastAction(action);
        return;
      }

      setActiveAction(action);
      setExecutionError(null);
      setRunResult(null);

      try {
        const result = await judgeCodeAgainstCases({
          language,
          code,
          testCases: selectedTestCases,
        });

        setRunResult(result);
        setLastAction(action);
      } catch (error) {
        setExecutionError(
          error instanceof Error ? error.message : "Execution failed.",
        );
        setLastAction(action);
      } finally {
        setActiveAction(null);
      }
    },
    [code, language, submissionTestCases, visibleTestCases],
  );

  const statusText = useMemo(() => {
    if (activeAction === "run") {
      return `Running ${visibleTestCases.length} visible test cases in ${LANGUAGE_CONFIGS[language].label}...`;
    }

    if (activeAction === "submit") {
      return `Submitting ${submissionTestCases.length} total test cases in ${LANGUAGE_CONFIGS[language].label}...`;
    }

    if (executionError) {
      return executionError;
    }

    if (!runResult) {
      return `${LANGUAGE_CONFIGS[language].label} ready. Run checks the visible examples, and submit checks the full testcase set.`;
    }

    return `${runResult.passedCount}/${runResult.totalCount} test cases passed on ${LANGUAGE_CONFIGS[language].label} ${runResult.runtimeVersion}.`;
  }, [
    activeAction,
    executionError,
    language,
    runResult,
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
        onRun={() => void executeJudge("run")}
        onSubmit={() => void executeJudge("submit")}
        isRunning={activeAction === "run"}
        isSubmitting={activeAction === "submit"}
        statusText={statusText}
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
              visibleTestCases={visibleTestCases}
              runResult={runResult}
              isRunning={activeAction !== null}
              mode={lastAction}
              executionError={executionError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
