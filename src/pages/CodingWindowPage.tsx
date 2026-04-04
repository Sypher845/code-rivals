import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor, { type OnMount } from "@monaco-editor/react";
import {
  RotateCcw,
  Play,
  Send,
  Check,
  Timer,
  Keyboard,
  Shield,
} from "lucide-react";
import { POWER_CARD_REGISTRY } from "./powerups/powerupRegistry";

/* ───────────────────────────── palette (from user spec) ─────────────── */
const P = {
  bg: "#0a0e14",
  onBg: "#f1f3fc",
  surfaceLowest: "#000000",
  primary: "#e08dff",
  primaryContainer: "#d978ff",
  secondary: "#00ffff",
  tertiary: "#0070ff",
  glass: "rgba(224, 141, 255, 0.6)",
  ghostBorder: "rgba(241, 243, 252, 0.15)",
  ambientPrimary: "rgba(224, 141, 255, 0.10)",
  ambientSecondary: "rgba(0, 255, 255, 0.10)",
};

/* ────────────────────── sample problem data (Two Sum) ───────────────── */
const PROBLEM = {
  title: "Two Sum",
  description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to* \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the *same* element twice.

You can return the answer in **any order**.`,
  examples: [
    {
      id: 1,
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation:
        "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      id: 2,
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
    },
    {
      id: 3,
      input: "nums = [3,3], target = 6",
      output: "[0,1]",
    },
  ],
  constraints: [
    "2 <= nums.length <= 10⁴",
    "-10⁹ <= nums[i] <= 10⁹",
    "-10⁹ <= target <= 10⁹",
    "Only one valid answer exists.",
  ],
  testCases: [
    { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
    { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
    { input: "[3,3]\n6", expectedOutput: "[0,1]" },
  ],
};

const DEFAULT_CODE = `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {

    }
};`;

const LANGUAGES = [
  { label: "C++", value: "cpp" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
];

/* ──── sample power card & opponent data (placeholders for SpacetimeDB) ── */
const POWER_CARD = {
  name: "FlashbangCard",
  used: false,
};

const OPPONENT = {
  username: "r4ndom_pikachu",
  isTyping: true,
  cardUsed: null as string | null, // e.g. "Code Freeze" if used
  hasSubmitted: false,
};

/* ──────────────────────── register custom Monaco theme ──────────────── */
function defineNeonTheme(monaco: Parameters<OnMount>[1]) {
  monaco.editor.defineTheme("neonCommand", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "e08dff", fontStyle: "bold" },
      { token: "type", foreground: "00ffff" },
      { token: "string", foreground: "7cd87c" },
      { token: "number", foreground: "00ffff" },
      { token: "comment", foreground: "636c83", fontStyle: "italic" },
      { token: "function", foreground: "e08dff" },
      { token: "variable", foreground: "f1f3fc" },
      { token: "operator", foreground: "f1f3fc" },
      { token: "delimiter", foreground: "f1f3fc" },
      { token: "identifier", foreground: "f1f3fc" },
    ],
    colors: {
      "editor.background": "#0a0e14",
      "editor.foreground": "#f1f3fc",
      "editor.lineHighlightBackground": "#0f1319",
      "editor.selectionBackground": "#e08dff30",
      "editorCursor.foreground": "#e08dff",
      "editorLineNumber.foreground": "#3b4254",
      "editorLineNumber.activeForeground": "#636c83",
      "editor.selectionHighlightBackground": "#e08dff18",
      "editorIndentGuide.background": "#1a1e28",
      "editorIndentGuide.activeBackground": "#2a2e38",
      "editorWidget.background": "#0d1017",
      "editorWidget.border": "#1a1e28",
      "editorSuggestWidget.background": "#0d1017",
      "editorSuggestWidget.border": "#1a1e28",
      "editorSuggestWidget.selectedBackground": "#e08dff20",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff12",
      "scrollbarSlider.hoverBackground": "#ffffff1a",
      "scrollbarSlider.activeBackground": "#ffffff22",
    },
  });
}

/* ═══════════════════════════ MATCH TIMER ═════════════════════════════ */

function MatchTimer() {
  const [secondsRemaining, setSecondsRemaining] = useState(7 * 60 + 43);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setSecondsRemaining((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

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

function OpponentCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] px-4 py-2">
      {/* avatar placeholder */}
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--ghost-border)] bg-[rgba(224,141,255,0.08)] text-sm font-bold text-[var(--primary)]">
        {OPPONENT.username[0].toUpperCase()}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-[var(--on-background)]">
          {OPPONENT.username}
        </span>

        <div className="flex items-center gap-2.5">
          {/* typing indicator */}
          {OPPONENT.isTyping && (
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
          {OPPONENT.cardUsed && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] px-2 py-0.5 text-[0.7rem] font-medium text-[var(--primary)]">
              <Shield className="h-3 w-3" />
              {OPPONENT.cardUsed}
            </span>
          )}

          {/* submitted status */}
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

/* ═══════════════════════════ DESCRIPTION PANEL ═══════════════════════ */

function DescriptionPanel() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--ghost-border)] bg-[rgba(10,14,20,0.94)]">
      {/* header */}
      <div className="relative flex items-center border-b border-[var(--ghost-border)] px-4 py-0">
        <span className="relative inline-flex items-center px-4 py-3 text-sm font-semibold text-[var(--primary)]">
          Description
          <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" />
        </span>
      </div>

      {/* scrollable body */}
      <div className="hide-scrollbar flex-1 overflow-y-auto px-6 py-6">
        {/* title — name only, no number */}
        <h1 className="text-2xl font-bold tracking-tight text-[var(--on-background)]">
          {PROBLEM.title}
        </h1>

        {/* description text */}
        <div className="mt-5 text-[0.95rem] leading-8 text-[var(--text-secondary)]">
          {PROBLEM.description.split("\n").map((paragraph, i) => (
            <p key={i} className="mt-3 first:mt-0">
              {renderInlineCode(paragraph)}
            </p>
          ))}
        </div>

        {/* examples */}
        <div className="mt-8 space-y-6">
          {PROBLEM.examples.map((ex) => (
            <div key={ex.id}>
              <h3 className="text-base font-semibold text-[var(--on-background)]">
                Example {ex.id}:
              </h3>
              <div className="mt-2.5 rounded-lg border-l-[3px] border-[var(--ghost-border)] bg-[rgba(255,255,255,0.02)] py-3.5 pl-5 pr-4 font-[var(--font-mono)] text-[0.88rem] leading-8 text-[var(--text-secondary)]">
                <p>
                  <span className="font-semibold text-[var(--on-background)]">
                    Input:
                  </span>{" "}
                  {ex.input}
                </p>
                <p>
                  <span className="font-semibold text-[var(--on-background)]">
                    Output:
                  </span>{" "}
                  {ex.output}
                </p>
                {ex.explanation && (
                  <p>
                    <span className="font-semibold text-[var(--on-background)]">
                      Explanation:
                    </span>{" "}
                    {ex.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* constraints */}
        <div className="mt-8">
          <h3 className="text-base font-semibold text-[var(--on-background)]">
            Constraints:
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-[0.9rem] leading-7 text-[var(--text-secondary)]">
            {PROBLEM.constraints.map((c, i) => (
              <li key={i}>
                <code className="rounded bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 font-[var(--font-mono)] text-[0.86rem] text-[var(--on-background)]">
                  {c}
                </code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** render backtick-wrapped text as <code> */
function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 font-[var(--font-mono)] text-[0.9rem] text-[var(--on-background)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith("**") && bp.endsWith("**")) {
        return (
          <strong key={`${i}-${j}`} className="font-semibold text-[var(--on-background)]">
            {bp.slice(2, -2)}
          </strong>
        );
      }
      const italicParts = bp.split(/(\*[^*]+\*)/g);
      return italicParts.map((ip, k) => {
        if (ip.startsWith("*") && ip.endsWith("*")) {
          return (
            <em key={`${i}-${j}-${k}`} className="italic">
              {ip.slice(1, -1)}
            </em>
          );
        }
        return <span key={`${i}-${j}-${k}`}>{ip}</span>;
      });
    });
  });
}

/* ═══════════════════════════ EDITOR PANEL ════════════════════════════ */

function EditorPanel() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    defineNeonTheme(monaco);
    monaco.editor.setTheme("neonCommand");
    editorRef.current = editor;
    editor.focus();
  };

  const handleReset = () => setCode(DEFAULT_CODE);

  const currentLang = LANGUAGES.find((l) => l.value === language);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--ghost-border)] bg-[rgba(10,14,20,0.94)]">
      {/* header bar */}
      <div className="flex items-center justify-between border-b border-[var(--ghost-border)] px-4 py-2">
        {/* left: language selector */}
        <div className="relative flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-wide text-[var(--primary)]">
            <span className="opacity-60">{"</>"}</span>
            Code
          </span>

          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.06)]"
            >
              {currentLang?.label ?? "C++"}
              <svg className="h-3.5 w-3.5 opacity-50" viewBox="0 0 12 12">
                <path d="M3 5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {showLangMenu && (
              <div className="absolute left-0 top-full z-50 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-[var(--ghost-border)] bg-[#0d1017] shadow-xl">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      setLanguage(lang.value);
                      setShowLangMenu(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm transition ${lang.value === language
                      ? "bg-[rgba(224,141,255,0.1)] text-[var(--primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]"
                      }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* right: reset only */}
        <div className="flex items-center">
          <button
            onClick={handleReset}
            title="Reset"
            className="grid h-9 w-9 place-items-center rounded-md text-[var(--text-tertiary)] transition hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-secondary)]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="relative min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(val) => setCode(val ?? "")}
          onMount={handleMount}
          theme="neonCommand"
          options={{
            fontSize: 15,
            fontFamily: "'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true,
            renderLineHighlight: "line",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            automaticLayout: true,
            tabSize: 4,
            wordWrap: "off",
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            overviewRulerLanes: 0,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════ TEST CASES PANEL ════════════════════════ */

function TestCasesPanel() {
  const [activeMainTab, setActiveMainTab] = useState<"testcase" | "result">(
    "testcase",
  );
  const [activeCase, setActiveCase] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  const currentCase = PROBLEM.testCases[activeCase];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--ghost-border)] bg-[rgba(10,14,20,0.94)]">
      {/* tab header */}
      <div className="relative flex items-center border-b border-[var(--ghost-border)] px-4 py-0">
        <div className="flex items-center gap-1">
          {(["testcase", "result"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab)}
              className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium capitalize transition-colors ${activeMainTab === tab
                ? "text-[var(--primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
            >
              {tab === "testcase" ? "Testcases" : "Test Result"}
              {activeMainTab === tab && (
                <motion.div
                  layoutId="testTab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="hide-scrollbar relative flex-1 overflow-y-auto px-5 py-4">
        <AnimatePresence mode="wait">
          {activeMainTab === "testcase" ? (
            <motion.div
              key="testcase"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {/* case tabs */}
              <div className="mb-4 flex items-center gap-2">
                {PROBLEM.testCases.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCase(i)}
                    className={`relative rounded-md px-4 py-2 text-sm font-medium transition ${activeCase === i
                      ? "text-[var(--primary)]"
                      : "bg-[rgba(255,255,255,0.03)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      }`}
                  >
                    {activeCase === i && (
                      <motion.div
                        layoutId="caseTab-bg"
                        className="absolute inset-0 rounded-md bg-[rgba(224,141,255,0.1)]"
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      />
                    )}
                    <span className="relative z-10">Case {i + 1}</span>
                  </button>
                ))}
              </div>

              {/* input / expected */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCase}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-tertiary)]">
                      Input
                    </label>
                    <pre className="rounded-lg border border-[var(--ghost-border)] bg-[rgba(0,0,0,0.5)] p-4 font-[var(--font-mono)] text-[0.88rem] leading-7 text-[var(--on-background)]">
                      {currentCase?.input}
                    </pre>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--text-tertiary)]">
                      Expected Output
                    </label>
                    <pre className="rounded-lg border border-[var(--ghost-border)] bg-[rgba(0,0,0,0.5)] p-4 font-[var(--font-mono)] text-[0.88rem] leading-7 text-[var(--on-background)]">
                      {currentCase?.expectedOutput}
                    </pre>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center"
            >
              {!hasRun ? (
                <p className="text-base text-[var(--text-tertiary)]">
                  You must run your code first
                </p>
              ) : (
                <p className="text-base text-[#7cd87c]">All test cases passed!</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
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

/* ═══════════════════════════ SABOTAGE BUTTON ═════════════════════════ */

function formatCardName(key: string): string {
  return key.replace(/Card$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function SabotageButton({ cardName, opponentName }: { cardName: string; opponentName: string }) {
  const [hovered, setHovered] = useState(false);
  const descriptor = POWER_CARD_REGISTRY[cardName];
  if (!descriptor) return null;

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
      {/* small power card */}
      <motion.span
        animate={hovered ? { rotate: [0, -6, 6, 0], scale: 1.1 } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] transition-colors group-hover:border-[rgba(224,141,255,0.4)] group-hover:shadow-[0_0_10px_rgba(224,141,255,0.15)]"
      >
        <CardComponent size={24} />
      </motion.span>

      {/* text with crossfade */}
      <span className="relative min-w-[10rem] overflow-hidden text-left" style={{ height: "1.25rem" }}>
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

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════════ */

export function CodingWindowPage() {
  const containerRef = useRef<HTMLDivElement>(null);

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



  return (
    <div
      className="flex h-screen flex-col overflow-hidden"
      style={{ background: P.bg }}
    >
      {/* ambient glow background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,255,0.06),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(224,141,255,0.07),transparent_24%)]" />

      {/* ═══════════════ TOP NAV BAR ═══════════════ */}
      <nav className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--ghost-border)] bg-[rgba(10,14,20,0.96)] px-6">
        {/* LEFT — Opponent status card */}
        <div className="flex min-w-0 flex-1 items-center">
          <OpponentCard />
        </div>

        {/* CENTER — Timer */}
        <div className="flex items-center justify-center px-6">
          <MatchTimer />
        </div>

        {/* RIGHT — Power card + Run/Submit */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          {/* Power card sabotage button */}
          {!POWER_CARD.used && (
            <SabotageButton cardName={POWER_CARD.name} opponentName={OPPONENT.username} />
          )}

          {/* Run button */}
          <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.04)] px-5 py-2 text-sm font-medium text-[var(--on-background)] transition hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.08)]">
            <Play className="h-4 w-4" />
            Run
          </button>

          {/* Submit button */}
          <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[#0a0e14] shadow-[0_0_18px_rgba(224,141,255,0.2)] transition hover:-translate-y-px hover:opacity-90">
            <Send className="h-4 w-4" />
            Submit
          </button>
        </div>
      </nav>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div ref={containerRef} className="flex min-h-0 flex-1 gap-0 p-2">
        {/* LEFT: description */}
        <div style={{ width: `${hRatio * 100}%` }} className="min-w-0">
          <DescriptionPanel />
        </div>

        <DragHandle direction="horizontal" onMouseDown={hMouseDown} />

        {/* RIGHT: editor + test cases */}
        <div
          ref={rightContainerRef}
          className="flex min-w-0 flex-1 flex-col gap-0"
        >
          {/* editor with power card overlay */}
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
