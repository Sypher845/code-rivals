import { GitBranch } from "lucide-react";
import { SectionEyebrow } from "./SharedComponents";
import { flowSteps } from "./landing-data";

export function FlowSection() {
  return (
    <section
      id="flow"
      className="border-t border-[var(--border-subtle)] px-5 py-24 sm:px-8 xl:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div data-landing-reveal className="landing-reveal">
          <SectionEyebrow icon={GitBranch}>How it works</SectionEyebrow>
          <h2 className="text-[clamp(2.15rem,4vw,3.4rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
            From zero to duel
            <br />
            in three steps.
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--border-subtle)] lg:grid-cols-3">
          {flowSteps.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.step}
                className="bg-[var(--background)] p-6 transition hover:bg-[var(--surface-subtle)]"
              >
                <p className="font-[var(--font-mono)] text-[0.62rem] font-medium tracking-[0.22em] text-[var(--text-tertiary)] uppercase">
                  Step {item.step}
                </p>
                <div className="mt-4 grid h-8 w-8 place-items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                  <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
                </div>
                <h3 className="mt-4 text-[1.02rem] font-medium tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
