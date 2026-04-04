import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PROBLEM } from "./constants";

export function TestCasesPanel() {
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
