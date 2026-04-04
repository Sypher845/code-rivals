import { PROBLEM } from "./constants";

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

export function DescriptionPanel() {
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
