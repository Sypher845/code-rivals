import { Sparkles } from "lucide-react";
import { SectionEyebrow } from "./SharedComponents";
import { powers } from "./landing-data";

const powerCardAccents = [
  "from-[rgba(255,112,112,0.2)] via-[rgba(255,112,112,0.06)] to-transparent",
  "from-[rgba(77,143,255,0.22)] via-[rgba(77,143,255,0.06)] to-transparent",
  "from-[rgba(255,112,112,0.18)] via-[rgba(255,112,112,0.05)] to-transparent",
  "from-[rgba(0,255,255,0.18)] via-[rgba(0,255,255,0.05)] to-transparent",
  "from-[rgba(255,168,77,0.18)] via-[rgba(255,168,77,0.05)] to-transparent",
  "from-[rgba(255,168,77,0.18)] via-[rgba(255,168,77,0.05)] to-transparent",
  "from-[rgba(224,141,255,0.22)] via-[rgba(224,141,255,0.06)] to-transparent",
  "from-[rgba(124,216,124,0.2)] via-[rgba(124,216,124,0.05)] to-transparent",
  "from-[rgba(77,143,255,0.2)] via-[rgba(77,143,255,0.05)] to-transparent",
  "from-[rgba(255,112,112,0.22)] via-[rgba(255,112,112,0.06)] to-transparent",
];

export function PowersSection() {
  return (
    <section
      id="powers"
      className="border-t border-[var(--border-subtle)] px-5 py-24 sm:px-8 xl:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div>
          <div data-landing-reveal className="landing-reveal">
            <SectionEyebrow icon={Sparkles}>Superpowers</SectionEyebrow>
            <h2 className="text-[clamp(2.15rem,4vw,3.4rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
              Sabotage is Part
              <br />
              of the game.
            </h2>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[rgba(224,141,255,0.2)] bg-[rgba(224,141,255,0.08)] px-3 py-1.5 font-[var(--font-mono)] text-[0.68rem] tracking-[0.18em] text-[var(--primary)] uppercase">
                {powers.length} sabotage cards
              </span>
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 font-[var(--font-mono)] text-[0.68rem] tracking-[0.18em] text-[var(--text-tertiary)] uppercase">
                Draft first, deploy mid-match
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {powers.map((power, index) => {
            const Icon = power.icon;

            return (
              <article
                key={power.name}
                className="group relative overflow-hidden rounded-[1.7rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(13,15,20,0.96),rgba(10,12,17,0.98))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(255,255,255,0.16)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.34)]"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] ${powerCardAccents[index] ?? powerCardAccents[0]} opacity-90`}
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />

                <div className="relative z-[1] flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-10 w-10 place-items-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition group-hover:border-[rgba(255,255,255,0.16)]">
                        <Icon className={`h-4 w-4 ${power.iconClassName}`} />
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.08em] uppercase ${power.tagClassName}`}
                      >
                        {power.tag}
                      </span>
                    </div>

                    <span className="font-[var(--font-mono)] text-[0.62rem] tracking-[0.18em] text-[var(--text-tertiary)] uppercase">
                      Card {(index + 1).toString().padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-[1.1rem] font-medium tracking-[-0.02em] text-[var(--on-background)]">
                      {power.name}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                      {power.description}
                    </p>
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
