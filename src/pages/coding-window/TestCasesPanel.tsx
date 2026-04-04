import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { PROBLEM } from "./constants";
import type { JudgeRunResult } from "./piston";
import type { ParsedTestCase } from "./problemContent";
import type { RemoteProblemData } from "../CodingWindowPage";

type TestCasesPanelProps = {
  problem?: RemoteProblemData | null;
  visibleTestCases?: ParsedTestCase[];
  runResult?: JudgeRunResult | null;
  isRunning?: boolean;
  mode?: "run" | "submit" | null;
  executionError?: string | null;
};

function ResultBadge({
  status,
}: {
  status: "passed" | "failed" | "error";
}) {
  if (status === "passed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(124,216,124,0.25)] bg-[rgba(124,216,124,0.12)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7cd87c]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Pass
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,194,90,0.25)] bg-[rgba(255,194,90,0.12)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#ffc25a]">
        <XCircle className="h-3.5 w-3.5" />
        Wrong
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,120,120,0.25)] bg-[rgba(255,120,120,0.12)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#ff9d9d]">
      <AlertTriangle className="h-3.5 w-3.5" />
      Error
    </span>
  );
}

function OutputBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--text-tertiary)]">
        {label}
      </label>
      <pre className="whitespace-pre-wrap rounded-lg border border-[var(--ghost-border)] bg-[rgba(0,0,0,0.5)] p-4 font-[var(--font-mono)] text-[0.88rem] leading-7 text-[var(--on-background)]">
        {value || "(empty)"}
      </pre>
    </div>
  );
}

export function TestCasesPanel({
  problem,
  visibleTestCases = [],
  runResult = null,
  isRunning = false,
  mode = null,
  executionError = null,
}: TestCasesPanelProps) {
  const [activeMainTab, setActiveMainTab] = useState<"testcase" | "result">(
    "testcase",
  );
  const [activeCase, setActiveCase] = useState(0);
  const testCases =
    visibleTestCases.length > 0
      ? visibleTestCases
      : PROBLEM.testCases.map((testCase, index) => ({
          label: `Example ${index + 1}:`,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
        }));
  const showVisibleCaseResults = mode !== "submit";

  const currentCase = testCases[activeCase] ?? PROBLEM.testCases[0];
  const currentResult =
    showVisibleCaseResults ? runResult?.results[activeCase] ?? null : null;
  const hasRun = Boolean(runResult || executionError);

  const summaryText = useMemo(() => {
    if (executionError) {
      return executionError;
    }

    if (!runResult) {
      return null;
    }

    const action = mode === "submit" ? "Submission" : "Run";
    return `${action}: ${runResult.passedCount}/${runResult.totalCount} test cases passed on ${runResult.language.toUpperCase()} (${runResult.runtimeVersion}).`;
  }, [executionError, mode, runResult]);

  const hiddenSummary = useMemo(() => {
    if (mode !== "submit" || !runResult) {
      return null;
    }

    const wrongAnswers = runResult.results.filter(
      (result) => result.status === "failed",
    ).length;
    const executionErrors = runResult.results.filter(
      (result) => result.status === "error",
    ).length;

    return { wrongAnswers, executionErrors };
  }, [mode, runResult]);

  useEffect(() => {
    if (activeCase >= testCases.length) {
      setActiveCase(0);
    }
  }, [activeCase, testCases.length]);

  useEffect(() => {
    if (isRunning || hasRun) {
      setActiveMainTab("result");
    }
  }, [hasRun, isRunning]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--ghost-border)] bg-[rgba(10,14,20,0.94)]">
      <div className="relative flex items-center border-b border-[var(--ghost-border)] px-4 py-0">
        <div className="flex items-center gap-1">
          {(["testcase", "result"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab)}
              className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                activeMainTab === tab
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
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {testCases.map((testCase, index) => {
                  const caseResult = showVisibleCaseResults
                    ? runResult?.results[index]
                    : null;

                  return (
                    <button
                      key={testCase.label}
                      onClick={() => setActiveCase(index)}
                      className={`relative rounded-md px-4 py-2 text-sm font-medium transition ${
                        activeCase === index
                          ? "text-[var(--primary)]"
                          : "bg-[rgba(255,255,255,0.03)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      {activeCase === index && (
                        <motion.div
                          layoutId="caseTab-bg"
                          className="absolute inset-0 rounded-md bg-[rgba(224,141,255,0.1)]"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 28,
                          }}
                        />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-2">
                        {testCase.label.replace(":", "")}
                        {caseResult && (
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              caseResult.status === "passed"
                                ? "bg-[#7cd87c]"
                                : caseResult.status === "failed"
                                  ? "bg-[#ffc25a]"
                                  : "bg-[#ff9d9d]"
                            }`}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCase}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {currentResult && (
                    <div className="flex items-center justify-between rounded-lg border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--on-background)]">
                          {currentResult.label}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {currentResult.message}
                        </p>
                      </div>
                      <ResultBadge status={currentResult.status} />
                    </div>
                  )}

                  <OutputBlock label="Input" value={currentCase?.input ?? ""} />
                  {currentResult &&
                    currentResult.normalizedInput !== currentResult.input && (
                      <OutputBlock
                        label="Normalized Stdin"
                        value={currentResult.normalizedInput}
                      />
                    )}
                  <OutputBlock
                    label="Expected Output"
                    value={currentCase?.expectedOutput ?? ""}
                  />
                  {currentResult &&
                    currentResult.normalizedExpectedOutput !==
                      currentResult.expectedOutput && (
                      <OutputBlock
                        label="Normalized Expected Output"
                        value={currentResult.normalizedExpectedOutput}
                      />
                    )}

                  {currentResult && (
                    <>
                      {!!currentResult.compileOutput && (
                        <OutputBlock
                          label="Compiler Output"
                          value={currentResult.compileOutput}
                        />
                      )}
                      <OutputBlock
                        label="Your Output"
                        value={currentResult.actualOutput}
                      />
                      {!!currentResult.stderr && (
                        <OutputBlock
                          label="Error Output"
                          value={currentResult.stderr}
                        />
                      )}
                    </>
                  )}
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
              className="space-y-4 py-1"
            >
              {isRunning ? (
                <div className="flex h-full min-h-[14rem] flex-col items-center justify-center gap-3 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(224,141,255,0.18)] border-t-[var(--primary)]" />
                  <p className="text-base text-[var(--on-background)]">
                    Executing each test case separately...
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    This compiles and runs your current code against every test
                    case one by one.
                  </p>
                </div>
              ) : !hasRun ? (
                <div className="flex h-full min-h-[14rem] flex-col items-center justify-center gap-2 text-center">
                  <p className="text-base text-[var(--text-tertiary)]">
                    Run your code to see per-testcase results here.
                  </p>
                </div>
              ) : (
                <>
                  {summaryText && (
                    <div
                      className={`rounded-xl border px-4 py-4 ${
                        executionError
                          ? "border-[rgba(255,120,120,0.2)] bg-[rgba(255,120,120,0.08)]"
                          : runResult?.allPassed
                            ? "border-[rgba(124,216,124,0.22)] bg-[rgba(124,216,124,0.08)]"
                            : "border-[rgba(255,194,90,0.2)] bg-[rgba(255,194,90,0.08)]"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          executionError
                            ? "text-[#ffb4b4]"
                            : runResult?.allPassed
                              ? "text-[#7cd87c]"
                              : "text-[#ffc25a]"
                        }`}
                      >
                        {summaryText}
                      </p>
                    </div>
                  )}

                  {mode === "run" &&
                    runResult?.results.map((result) => (
                      <button
                        key={result.label}
                        onClick={() => {
                          setActiveCase(result.index);
                          setActiveMainTab("testcase");
                        }}
                        className="w-full rounded-xl border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-left transition hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.05)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[var(--on-background)]">
                              {result.label}
                            </p>
                            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                              {result.executionMs !== null
                                ? `${result.executionMs} ms`
                                : "Timing unavailable"}
                            </p>
                          </div>
                          <ResultBadge status={result.status} />
                        </div>
                        <p className="mt-3 text-sm text-[var(--text-secondary)]">
                          {result.message}
                        </p>
                      </button>
                    ))}

                  {mode === "submit" && runResult && !executionError && (
                    <div className="rounded-xl border border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <p className="text-sm font-semibold text-[var(--on-background)]">
                        Hidden testcases were evaluated during submission.
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Only the total passed count is shown here. Visible
                        example cases remain available in the Testcases tab.
                      </p>
                      {hiddenSummary && (
                        <p className="mt-3 text-sm text-[var(--text-tertiary)]">
                          Wrong answers: {hiddenSummary.wrongAnswers} | Execution
                          errors: {hiddenSummary.executionErrors}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
