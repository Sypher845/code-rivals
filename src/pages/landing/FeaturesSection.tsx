import { Layers3 } from "lucide-react";
import { SectionEyebrow } from "./SharedComponents";
import { featureList } from "./landing-data";

const MONACO_EDITOR_FONT_FAMILY =
  "'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace";
const MONACO_EDITOR_FOREGROUND = "#f1f3fc";
const MONACO_EDITOR_LINE_NUMBER = "#3b4254";
const MONACO_EDITOR_KEYWORD = "#e08dff";
const MONACO_EDITOR_TYPE = "#00ffff";
const MONACO_EDITOR_STRING = "#7cd87c";

export function FeaturesSection() {
  const codeRows = [
    {
      line: "1",
      tokens: [
        { text: "#include ", color: MONACO_EDITOR_KEYWORD },
        { text: "<bits/stdc++.h>", color: MONACO_EDITOR_STRING },
      ],
    },
    {
      line: "2",
      tokens: [
        { text: "using ", color: MONACO_EDITOR_KEYWORD },
        { text: "namespace ", color: MONACO_EDITOR_KEYWORD },
        { text: "std", color: MONACO_EDITOR_TYPE },
        { text: ";", color: MONACO_EDITOR_FOREGROUND },
      ],
    },
    { line: "3", tokens: [] },
    {
      line: "4",
      tokens: [
        { text: "vector", color: MONACO_EDITOR_TYPE },
        { text: "<", color: MONACO_EDITOR_FOREGROUND },
        { text: "int", color: MONACO_EDITOR_TYPE },
        { text: "> ", color: MONACO_EDITOR_FOREGROUND },
        { text: "twoSum", color: MONACO_EDITOR_KEYWORD },
        { text: "(", color: MONACO_EDITOR_FOREGROUND },
        { text: "vector", color: MONACO_EDITOR_TYPE },
        { text: "<", color: MONACO_EDITOR_FOREGROUND },
        { text: "int", color: MONACO_EDITOR_TYPE },
        { text: ">& ", color: MONACO_EDITOR_FOREGROUND },
        { text: "nums", color: MONACO_EDITOR_FOREGROUND },
        { text: ", ", color: MONACO_EDITOR_FOREGROUND },
        { text: "int", color: MONACO_EDITOR_TYPE },
        { text: " ", color: MONACO_EDITOR_FOREGROUND },
        { text: "target", color: MONACO_EDITOR_FOREGROUND },
        { text: ") {", color: MONACO_EDITOR_FOREGROUND },
      ],
    },
    {
      line: "5",
      tokens: [
        { text: "    ", color: MONACO_EDITOR_FOREGROUND },
        { text: "unordered_map", color: MONACO_EDITOR_TYPE },
        { text: "<", color: MONACO_EDITOR_FOREGROUND },
        { text: "int", color: MONACO_EDITOR_TYPE },
        { text: ", ", color: MONACO_EDITOR_FOREGROUND },
        { text: "int", color: MONACO_EDITOR_TYPE },
        { text: "> ", color: MONACO_EDITOR_FOREGROUND },
        { text: "seen", color: MONACO_EDITOR_FOREGROUND },
        { text: ";", color: MONACO_EDITOR_FOREGROUND },
      ],
    },
    {
      line: "6",
      tokens: [
        { text: "    ", color: MONACO_EDITOR_FOREGROUND },
        { text: "for", color: MONACO_EDITOR_KEYWORD },
        { text: " (", color: MONACO_EDITOR_FOREGROUND },
        { text: "int", color: MONACO_EDITOR_TYPE },
        { text: " ", color: MONACO_EDITOR_FOREGROUND },
        { text: "i", color: MONACO_EDITOR_FOREGROUND },
        { text: " = ", color: MONACO_EDITOR_FOREGROUND },
        { text: "0", color: MONACO_EDITOR_TYPE },
        { text: "; ", color: MONACO_EDITOR_FOREGROUND },
        { text: "i", color: MONACO_EDITOR_FOREGROUND },
        { text: " < ", color: MONACO_EDITOR_FOREGROUND },
        { text: "nums", color: MONACO_EDITOR_FOREGROUND },
        { text: ".", color: MONACO_EDITOR_FOREGROUND },
        { text: "size", color: MONACO_EDITOR_FOREGROUND },
        { text: "(); ", color: MONACO_EDITOR_FOREGROUND },
        { text: "i", color: MONACO_EDITOR_FOREGROUND },
        { text: "++) {", color: MONACO_EDITOR_FOREGROUND },
      ],
    },
    {
      line: "7",
      tokens: [
        { text: "        ", color: MONACO_EDITOR_FOREGROUND },
        { text: "int", color: MONACO_EDITOR_TYPE },
        { text: " ", color: MONACO_EDITOR_FOREGROUND },
        { text: "diff", color: MONACO_EDITOR_FOREGROUND },
        { text: " = ", color: MONACO_EDITOR_FOREGROUND },
        { text: "target", color: MONACO_EDITOR_FOREGROUND },
        { text: " - ", color: MONACO_EDITOR_FOREGROUND },
        { text: "nums", color: MONACO_EDITOR_FOREGROUND },
        { text: "[", color: MONACO_EDITOR_FOREGROUND },
        { text: "i", color: MONACO_EDITOR_FOREGROUND },
        { text: "];", color: MONACO_EDITOR_FOREGROUND },
      ],
    },
    {
      line: "8",
      tokens: [
        { text: "        ", color: MONACO_EDITOR_FOREGROUND },
        { text: "if", color: MONACO_EDITOR_KEYWORD },
        { text: " (", color: MONACO_EDITOR_FOREGROUND },
        { text: "seen", color: MONACO_EDITOR_FOREGROUND },
        { text: ".", color: MONACO_EDITOR_FOREGROUND },
        { text: "count", color: MONACO_EDITOR_FOREGROUND },
        { text: "(", color: MONACO_EDITOR_FOREGROUND },
        { text: "diff", color: MONACO_EDITOR_FOREGROUND },
        { text: "))", color: MONACO_EDITOR_FOREGROUND },
      ],
    },
    {
      line: "9",
      tokens: [
        { text: "            ", color: MONACO_EDITOR_FOREGROUND },
        { text: "return", color: MONACO_EDITOR_KEYWORD },
        { text: " {", color: MONACO_EDITOR_FOREGROUND },
        { text: "seen", color: MONACO_EDITOR_FOREGROUND },
        { text: "[", color: MONACO_EDITOR_FOREGROUND },
        { text: "diff", color: MONACO_EDITOR_FOREGROUND },
        { text: "], ", color: MONACO_EDITOR_FOREGROUND },
        { text: "i", color: MONACO_EDITOR_FOREGROUND },
        { text: "};", color: MONACO_EDITOR_FOREGROUND },
      ],
    },
    {
      line: "10",
      tokens: [
        { text: "        ", color: MONACO_EDITOR_FOREGROUND },
        { text: "seen", color: MONACO_EDITOR_FOREGROUND },
        { text: "[", color: MONACO_EDITOR_FOREGROUND },
        { text: "nums", color: MONACO_EDITOR_FOREGROUND },
        { text: "[", color: MONACO_EDITOR_FOREGROUND },
        { text: "i", color: MONACO_EDITOR_FOREGROUND },
        { text: "]] = ", color: MONACO_EDITOR_FOREGROUND },
        { text: "i", color: MONACO_EDITOR_FOREGROUND },
        { text: ";", color: MONACO_EDITOR_FOREGROUND },
      ],
    },
    {
      line: "11",
      tokens: [
        { text: "    ", color: MONACO_EDITOR_FOREGROUND },
        { text: "}", color: MONACO_EDITOR_FOREGROUND },
      ],
    },
    {
      line: "12",
      tokens: [
        { text: "    ", color: MONACO_EDITOR_FOREGROUND },
        { text: "return", color: MONACO_EDITOR_KEYWORD },
        { text: " {};", color: MONACO_EDITOR_FOREGROUND },
        { text: "", color: MONACO_EDITOR_KEYWORD, cursor: true },
      ],
    },
    {
      line: "13",
      tokens: [{ text: "}", color: MONACO_EDITOR_FOREGROUND }],
    },
  ];

  return (
    <section id="features" className="px-5 py-24 sm:px-8 xl:px-10">
      <div className="mx-auto grid max-w-[84rem] gap-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div data-landing-reveal className="landing-reveal">
          <SectionEyebrow icon={Layers3}>Platform</SectionEyebrow>
          <h2 className="text-[clamp(2.15rem,4vw,3.4rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
            Built for the
            <br />
            competitive coder.
          </h2>
          <p className="mt-4 max-w-md text-[0.98rem] leading-8 text-[var(--text-secondary)]">
            Not another practice platform. An arena designed around pressure,
            speed, and what it actually feels like to race someone in real
            time.
          </p>

          <div className="mt-10">
            {featureList.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  data-landing-reveal
                  className={`landing-reveal grid grid-cols-[2rem_minmax(0,1fr)] gap-4 border-t border-[var(--border-subtle)] py-4 transition hover:border-[var(--border-strong)] ${
                    index === featureList.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] transition group-hover:border-[var(--border-strong)]">
                    <Icon className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium tracking-[-0.01em] text-[var(--on-background)]">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-7 text-[var(--text-secondary)]">
                      {feature.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div
          data-landing-reveal
          className="landing-reveal landing-delay-2 min-h-[39rem] overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[rgba(7,12,20,0.92)] shadow-[0_1px_0_rgba(255,255,255,0.04),0_18px_42px_rgba(0,0,0,0.36)] transition hover:border-[var(--border-strong)]"
        >
          {/* Title bar */}
          <div className="flex h-12 items-center justify-between border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.012)] px-5">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--surface-elevated)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--surface-elevated)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--surface-elevated)]" />
            </div>
            <span
              className="text-[0.7rem] text-[var(--text-tertiary)]"
              style={{ fontFamily: MONACO_EDITOR_FONT_FAMILY }}
            >
              main.cpp
            </span>
            <span />
          </div>

          {/* Tab bar - single file */}
          <div className="flex border-b border-[var(--border-subtle)]">
            <div
              className="border-r border-[var(--border-subtle)] bg-[rgba(224,141,255,0.06)] px-5 py-2.5 text-[0.7rem]"
              style={{
                color: MONACO_EDITOR_KEYWORD,
                fontFamily: MONACO_EDITOR_FONT_FAMILY,
              }}
            >
              main.cpp
            </div>
          </div>

          {/* Code content */}
          <div
            className="px-0 py-6 text-[0.8rem] leading-8"
            style={{ fontFamily: MONACO_EDITOR_FONT_FAMILY }}
          >
            {codeRows.map((row) => (
              <div key={row.line} className="flex whitespace-pre">
                <span
                  className="w-12 shrink-0 border-r border-[rgba(255,255,255,0.05)] pr-3 text-right text-[0.7rem]"
                  style={{ color: MONACO_EDITOR_LINE_NUMBER }}
                >
                  {row.line}
                </span>
                <span className="pl-4">
                  {row.tokens.map((token, index) => (
                    <span key={`${row.line}-${index}`} style={{ color: token.color }}>
                      {token.text}
                      {token.cursor && <span className="landing-caret" />}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
