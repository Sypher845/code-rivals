import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PROBLEM } from "./constants";
import type { RemoteProblemData } from "../CodingWindowPage";
import { getParsedTestCases } from "./problemContent";
import type { JudgeCaseResult } from "./judge";

type TestCasesPanelProps = {
  errorMessage?: string | null;
  flashbangActive?: boolean;
  isRunning?: boolean;
  problem?: RemoteProblemData | null;
  zenMode?: boolean;
  results?: JudgeCaseResult[];
};

export function TestCasesPanel({
  errorMessage = null,
  flashbangActive = false,
  isRunning = false,
  problem,
  zenMode = false,
  results = [],
}: TestCasesPanelProps) {
  const [activeMainTab, setActiveMainTab] = useState<"testcase" | "result">(
    "testcase",
  );
  const [activeCase, setActiveCase] = useState(0);
  const testCases = getParsedTestCases(problem);
  const hasRun = results.length > 0;
  const currentResult = results[activeCase] ?? null;
  const passedCount = results.filter((result) => result.passed).length;
  const failedCount = results.length - passedCount;
  const visibleActualOutput =
    currentResult && currentResult.actualOutput.trim().length > 0
      ? currentResult.actualOutput
      : "(no stdout)";

  useEffect(() => {
    if (isRunning || hasRun || errorMessage) {
      setActiveMainTab("result");
    }
  }, [errorMessage, hasRun, isRunning]);

  useEffect(() => {
    if (!hasRun) {
      return;
    }

    const firstFailedCaseIndex = results.findIndex((result) => !result.passed);
    setActiveCase(firstFailedCaseIndex >= 0 ? firstFailedCaseIndex : 0);
  }, [hasRun, results]);

  useEffect(() => {
    if (activeCase >= testCases.length) {
      setActiveCase(0);
    }
  }, [activeCase, testCases.length]);

  const currentCase = testCases[activeCase] ?? PROBLEM.testCases[0];

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-xl border ${
        flashbangActive
          ? "border-[#ece7e1] bg-white"
          : zenMode
            ? "border-[#2b2b2b] bg-[#111111]"
          : "border-[var(--ghost-border)] bg-[rgba(10,14,20,0.94)]"
      }`}
    >
      {/* tab header */}
      <div
        className={`relative flex items-center border-b px-4 py-0 ${
          flashbangActive
            ? "border-[#f1ece6]"
            : zenMode
              ? "border-[#2b2b2b]"
              : "border-[var(--ghost-border)]"
        }`}
      >
        <div className="flex items-center gap-1">
          {(["testcase", "result"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab)}
              className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                activeMainTab === tab
                  ? flashbangActive
                    ? "text-[#f2eee9]"
                    : zenMode
                      ? "text-[#d4d4d4]"
                    : "text-[var(--primary)]"
                  : flashbangActive
                    ? "text-[#f4f0eb] hover:text-[#e6e1db]"
                    : zenMode
                      ? "text-[#8e8e8e] hover:text-[#cccccc]"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab === "testcase" ? "Testcases" : "Test Result"}
              {activeMainTab === tab && (
                <motion.div
                  layoutId="testTab-underline"
                  className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full ${
                    flashbangActive
                      ? "bg-[#f8f4ef]"
                      : zenMode
                        ? "bg-[#4b4b4b]"
                      : "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                  }`}
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
                {testCases.map((testCase, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCase(i)}
                    className={`relative rounded-md px-4 py-2 text-sm font-medium transition ${
                      activeCase === i
                        ? flashbangActive
                          ? "text-[#ebe7e2]"
                          : zenMode
                            ? "text-[#efefef]"
                          : "text-[var(--primary)]"
                        : flashbangActive
                          ? "bg-white text-[#f4f0eb] hover:text-[#e6e1db]"
                          : zenMode
                            ? "bg-[#171717] text-[#8e8e8e] hover:text-[#d0d0d0]"
                          : "bg-[rgba(255,255,255,0.03)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    {activeCase === i && (
                      <motion.div
                        layoutId="caseTab-bg"
                        className={`absolute inset-0 rounded-md ${
                          flashbangActive
                            ? "bg-[#fefcf9]"
                            : zenMode
                              ? "bg-[#242424]"
                            : "bg-[rgba(224,141,255,0.1)]"
                        }`}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 28,
                        }}
                      />
                    )}
                    <span className="relative z-10">
                      {testCase.label.replace(":", "")}
                    </span>
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
                    <label
                      className={`mb-1.5 block text-sm font-medium ${
                        flashbangActive
                          ? "text-[#f2eee9]"
                          : zenMode
                            ? "text-[#a5a5a5]"
                          : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      Input
                    </label>
                    <pre
                      className={`rounded-lg border p-4 font-[var(--font-mono)] text-[0.88rem] leading-7 ${
                        flashbangActive
                          ? "border-[#fbf8f4] bg-white text-[#efebe6]"
                          : zenMode
                            ? "border-[#2b2b2b] bg-[#171717] text-[#efefef]"
                          : "border-[var(--ghost-border)] bg-[rgba(0,0,0,0.5)] text-[var(--on-background)]"
                      }`}
                    >
                      {currentCase?.input}
                    </pre>
                  </div>
                  <div>
                    <label
                      className={`mb-1.5 block text-sm font-medium ${
                        flashbangActive
                          ? "text-[#f2eee9]"
                          : zenMode
                            ? "text-[#a5a5a5]"
                          : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      Expected Output
                    </label>
                    <pre
                      className={`rounded-lg border p-4 font-[var(--font-mono)] text-[0.88rem] leading-7 ${
                        flashbangActive
                          ? "border-[#fbf8f4] bg-white text-[#efebe6]"
                          : zenMode
                            ? "border-[#2b2b2b] bg-[#171717] text-[#efefef]"
                          : "border-[var(--ghost-border)] bg-[rgba(0,0,0,0.5)] text-[var(--on-background)]"
                      }`}
                    >
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
              className="flex min-h-full flex-col gap-4 py-2"
            >
              {isRunning ? (
                <p
                  className={`py-12 text-center text-base ${
                    zenMode ? "text-[#8e8e8e]" : "text-[var(--text-tertiary)]"
                  }`}
                >
                  Running each testcase separately...
                </p>
              ) : errorMessage ? (
                <div className="w-full max-w-3xl rounded-xl border border-[rgba(255,120,120,0.22)] bg-[rgba(255,120,120,0.08)] p-4 text-left">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#ffb4b4]">
                    Execution Error
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#ffd0d0]">
                    {errorMessage}
                  </p>
                </div>
              ) : !hasRun ? (
                <p
                  className={`py-12 text-center text-base ${
                    zenMode ? "text-[#8e8e8e]" : "text-[var(--text-tertiary)]"
                  }`}
                >
                  You must run your code first
                </p>
              ) : (
                <div className="flex w-full flex-col gap-4 text-left">
                  <div
                    className={`rounded-xl border p-4 ${
                      failedCount === 0
                        ? "border-[rgba(124,216,124,0.24)] bg-[rgba(124,216,124,0.08)]"
                        : "border-[rgba(255,120,120,0.22)] bg-[rgba(255,120,120,0.08)]"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold uppercase tracking-[0.14em] ${
                        failedCount === 0
                          ? "text-[#7cd87c]"
                          : "text-[#ffb4b4]"
                      }`}
                    >
                      {failedCount === 0 ? "Accepted" : "Partial Result"}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {passedCount} / {results.length} testcases passed
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                        Total
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--on-background)]">
                        {results.length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[rgba(124,216,124,0.24)] bg-[rgba(124,216,124,0.08)] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#9ae99a]">
                        Passed
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[#7cd87c]">
                        {passedCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[rgba(255,120,120,0.22)] bg-[rgba(255,120,120,0.08)] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#ffb4b4]">
                        Failed
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[#ffb4b4]">
                        {failedCount}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {results.map((result, index) => (
                      <button
                        key={`${result.label}-${index}`}
                        onClick={() => setActiveCase(index)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                          activeCase === index
                            ? result.passed
                              ? "border-[rgba(124,216,124,0.4)] bg-[rgba(124,216,124,0.12)] text-[#7cd87c]"
                              : "border-[rgba(255,120,120,0.4)] bg-[rgba(255,120,120,0.12)] text-[#ffb4b4]"
                            : "border-[var(--ghost-border)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {result.label.replace(":", "")} {result.passed ? "Passed" : "Failed"}
                      </button>
                    ))}
                  </div>

                  {currentResult ? (
                    <>
                      <div
                        className={`rounded-xl border p-4 ${
                          currentResult.passed
                            ? "border-[rgba(124,216,124,0.24)] bg-[rgba(124,216,124,0.08)]"
                            : "border-[rgba(255,120,120,0.22)] bg-[rgba(255,120,120,0.08)]"
                        }`}
                      >
                        <p
                          className={`text-sm font-semibold uppercase tracking-[0.14em] ${
                            currentResult.passed
                              ? "text-[#7cd87c]"
                              : "text-[#ffb4b4]"
                          }`}
                        >
                          {currentResult.passed
                            ? "Accepted"
                            : currentResult.status.replace(/_/g, " ")}
                        </p>
                        {currentResult.exitCode !== null ? (
                          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                            Exit code: {currentResult.exitCode}
                            {currentResult.signal
                              ? ` | Signal: ${currentResult.signal}`
                              : ""}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label
                          className={`mb-1.5 block text-sm font-medium ${
                            flashbangActive
                              ? "text-[#f2eee9]"
                              : "text-[var(--text-tertiary)]"
                          }`}
                        >
                          Input
                        </label>
                        <pre
                          className={`overflow-x-auto rounded-lg border p-4 font-[var(--font-mono)] text-[0.88rem] leading-7 whitespace-pre-wrap break-words ${
                            flashbangActive
                              ? "border-[#fbf8f4] bg-white text-[#efebe6]"
                              : "border-[var(--ghost-border)] bg-[rgba(0,0,0,0.5)] text-[var(--on-background)]"
                          }`}
                        >
                          {currentResult.input}
                        </pre>
                      </div>

                      <div>
                        <label
                          className={`mb-1.5 block text-sm font-medium ${
                            flashbangActive
                              ? "text-[#f2eee9]"
                              : "text-[var(--text-tertiary)]"
                          }`}
                        >
                          Your Output
                        </label>
                        <pre
                          className={`overflow-x-auto rounded-lg border p-4 font-[var(--font-mono)] text-[0.88rem] leading-7 whitespace-pre-wrap break-words ${
                            flashbangActive
                              ? "border-[#fbf8f4] bg-white text-[#efebe6]"
                              : "border-[var(--ghost-border)] bg-[rgba(0,0,0,0.5)] text-[var(--on-background)]"
                          }`}
                        >
                          {visibleActualOutput}
                        </pre>
                      </div>

                      {!currentResult.passed ? (
                        <div>
                          <label
                            className={`mb-1.5 block text-sm font-medium ${
                              flashbangActive
                                ? "text-[#f2eee9]"
                                : "text-[var(--text-tertiary)]"
                            }`}
                          >
                            Expected Output
                          </label>
                          <pre
                            className={`overflow-x-auto rounded-lg border p-4 font-[var(--font-mono)] text-[0.88rem] leading-7 whitespace-pre-wrap break-words ${
                              flashbangActive
                                ? "border-[#fbf8f4] bg-white text-[#efebe6]"
                                : "border-[var(--ghost-border)] bg-[rgba(0,0,0,0.5)] text-[var(--on-background)]"
                            }`}
                          >
                            {currentResult.expectedOutput}
                          </pre>
                        </div>
                      ) : null}

                      {currentResult.errorOutput ? (
                        <div>
                          <label
                            className={`mb-1.5 block text-sm font-medium ${
                              flashbangActive
                                ? "text-[#f2eee9]"
                                : "text-[var(--text-tertiary)]"
                            }`}
                          >
                            Runtime Error
                          </label>
                          <pre
                            className={`overflow-x-auto rounded-lg border p-4 font-[var(--font-mono)] text-[0.88rem] leading-7 whitespace-pre-wrap break-words ${
                              flashbangActive
                                ? "border-[#fbf8f4] bg-white text-[#efebe6]"
                                : "border-[rgba(255,120,120,0.18)] bg-[rgba(255,120,120,0.08)] text-[#ffd0d0]"
                            }`}
                          >
                            {currentResult.errorOutput}
                          </pre>
                        </div>
                      ) : null}

                      {currentResult.compileOutput ? (
                        <div>
                          <label
                            className={`mb-1.5 block text-sm font-medium ${
                              flashbangActive
                                ? "text-[#f2eee9]"
                                : "text-[var(--text-tertiary)]"
                            }`}
                          >
                            Compile Error
                          </label>
                          <pre
                            className={`overflow-x-auto rounded-lg border p-4 font-[var(--font-mono)] text-[0.88rem] leading-7 whitespace-pre-wrap break-words ${
                              flashbangActive
                                ? "border-[#fbf8f4] bg-white text-[#efebe6]"
                                : "border-[rgba(255,120,120,0.18)] bg-[rgba(255,120,120,0.08)] text-[#ffd0d0]"
                            }`}
                          >
                            {currentResult.compileOutput}
                          </pre>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
