import { Sparkles } from "lucide-react";
import { SectionEyebrow } from "./SharedComponents";
import { powers } from "./landing-data";

export function PowersSection() {
  return (
    <section
      id="powers"
      className="border-t border-[var(--border-subtle)] px-5 py-24 sm:px-8 xl:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <div data-landing-reveal className="landing-reveal">
            <SectionEyebrow icon={Sparkles}>Superpowers</SectionEyebrow>
            <h2 className="text-[clamp(2.15rem,4vw,3.4rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
              Sabotage is Part
              <br />
              of the game.
            </h2>
          </div>
          <p
            data-landing-reveal
            className="landing-reveal landing-delay-1 max-w-lg text-[0.98rem] leading-8 text-[var(--text-secondary)]"
          >
            Each round starts with a draft. Pick a superpower, deploy it
            mid-match, and know your opponent is doing the same.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--border-subtle)] md:grid-cols-2 xl:grid-cols-3">
          {powers.map((power, index) => {
            const Icon = power.icon;
            return (
              <article
                key={power.name}
                className="bg-[var(--background)] p-5 transition hover:bg-[var(--surface-subtle)]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                    <Icon className={`h-3.5 w-3.5 ${power.iconClassName}`} />
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 text-[0.62rem] font-medium tracking-[0.04em] ${power.tagClassName}`}
                  >
                    {power.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-medium tracking-[-0.01em]">
                  {power.name}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                  {power.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
