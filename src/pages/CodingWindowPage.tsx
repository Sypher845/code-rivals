import { useState, useRef, useCallback, useEffect } from "react";
import { TopBar } from "./coding-window/TopBar";
import { DescriptionPanel } from "./coding-window/DescriptionPanel";
import { EditorPanel } from "./coding-window/EditorPanel";
import { TestCasesPanel } from "./coding-window/TestCasesPanel";
import { P } from "./coding-window/constants";

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
        const totalSize =
          direction === "horizontal" ? rect.width : rect.height;
        const currentPos =
          direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const startOffset =
          direction === "horizontal" ? rect.left : rect.top;
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
      className={`group relative z-10 flex shrink-0 items-center justify-center transition-colors ${isH
        ? "w-[6px] cursor-col-resize"
        : "h-[6px] cursor-row-resize"
        }`}
    >
      <div
        className={`rounded-full bg-[var(--ghost-border)] transition-all group-hover:bg-[var(--primary)] ${isH ? "h-8 w-[2px]" : "h-[2px] w-8"
          }`}
      />
    </div>
  );
}

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════════ */

export function CodingWindowPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [problem, setProblem] = useState<RemoteProblemData | null>(null);
  const [problemLoading, setProblemLoading] = useState(true);
  const [problemError, setProblemError] = useState<string | null>(null);

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

  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: P.bg }}
    >
      {/* ambient glow background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,255,0.06),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(224,141,255,0.07),transparent_24%)]" />

      {/* ═══════════════ TOP NAV BAR ═══════════════ */}
      <TopBar />

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
            <EditorPanel />
          </div>

          <DragHandle direction="vertical" onMouseDown={vMouseDown} />

          {/* test cases */}
          <div className="min-h-0 flex-1">
            <TestCasesPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
