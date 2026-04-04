import { PROBLEM } from "./constants";
import type { RemoteProblemData } from "../CodingWindowPage";

type DescriptionPanelProps = {
  problem?: RemoteProblemData | null;
  isLoading?: boolean;
  error?: string | null;
};

type ExampleField = {
  label: string;
  value: string;
};

type ExampleBlock = {
  heading: string;
  fields: ExampleField[];
};

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

function getDescriptionText(problem?: RemoteProblemData | null) {
  if (
    typeof problem?.problem_description === "string" &&
    problem.problem_description.trim()
  ) {
    return problem.problem_description;
  }

  if (typeof problem?.description === "string" && problem.description.trim()) {
    return problem.description;
  }

  if (
    problem &&
    typeof problem.description !== "undefined" &&
    problem.description !== null
  ) {
    return JSON.stringify(problem.description, null, 2);
  }

  return PROBLEM.description;
}

function formatTaskId(taskId?: string) {
  if (!taskId?.trim()) return null;
  return taskId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTitle(problem?: RemoteProblemData | null) {
  if (typeof problem?.title === "string" && problem.title.trim()) {
    return problem.title;
  }

  return formatTaskId(problem?.task_id) ?? PROBLEM.title;
}

function parseDescriptionSections(descriptionText: string) {
  const constraintsMarker = "\nConstraints:\n";
  const followUpMarker = "\nFollow up:";
  const constraintsIndex = descriptionText.indexOf(constraintsMarker);
  const followUpIndex = descriptionText.indexOf(followUpMarker);

  const descriptionBody =
    constraintsIndex >= 0
      ? descriptionText.slice(0, constraintsIndex).trim()
      : followUpIndex >= 0
        ? descriptionText.slice(0, followUpIndex).trim()
        : descriptionText.trim();

  let constraints: string[] = [];
  if (constraintsIndex >= 0) {
    const rawConstraints = descriptionText
      .slice(
        constraintsIndex + constraintsMarker.length,
        followUpIndex >= 0 ? followUpIndex : undefined,
      )
      .trim();

    constraints = rawConstraints
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const followUp =
    followUpIndex >= 0
      ? descriptionText.slice(followUpIndex + 1).trim()
      : null;

  return { descriptionBody, constraints, followUp };
}

function parseBodyContent(descriptionBody: string) {
  const intro: string[] = [];
  const examples: ExampleBlock[] = [];

  const normalizedBody = descriptionBody.replace(/\n{3,}/g, "\n\n");
  const exampleStart = normalizedBody.search(/(?:^|\n\s*)Example\s+\d+:/i);

  if (exampleStart === -1) {
    intro.push(
      ...normalizedBody
        .split(/\n\s*\n/)
        .map((section) => section.trim())
        .filter(Boolean),
    );
    return { intro, examples };
  }

  const introText = normalizedBody.slice(0, exampleStart).trim();
  if (introText) {
    intro.push(
      ...introText
        .split(/\n\s*\n/)
        .map((section) => section.trim())
        .filter(Boolean),
    );
  }

  const examplesText = normalizedBody.slice(exampleStart).trim();
  const blocks = examplesText
    .split(/(?=(?:^|\n)\s*Example\s+\d+:)/i)
    .map((block) => block.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const headingMatch = block.match(/^Example\s+\d+:/i);
    if (!headingMatch) {
      continue;
    }

    const heading = headingMatch[0];
    const body = block.slice(heading.length).trim();
    const fields: ExampleField[] = [];
    const fieldRegex = /(Input|Output|Explanation):\s*/gi;
    const matches = [...body.matchAll(fieldRegex)];

    if (matches.length === 0) {
      continue;
    }

    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[index];
      const label = match[1];
      const valueStart = (match.index ?? 0) + match[0].length;
      const valueEnd =
        index + 1 < matches.length
          ? matches[index + 1].index ?? body.length
          : body.length;
      const value = body.slice(valueStart, valueEnd).trim();

      fields.push({ label, value });
    }

    if (fields.length > 0) {
      examples.push({ heading, fields });
    }
  }

  return { intro, examples };
}

export function DescriptionPanel({
  problem,
  isLoading = false,
  error = null,
}: DescriptionPanelProps) {
  const title = getTitle(problem);
  const descriptionText = getDescriptionText(problem);
  const { descriptionBody, constraints, followUp } =
    parseDescriptionSections(descriptionText);
  const { intro, examples } = parseBodyContent(descriptionBody);
  const difficulty =
    typeof problem?.difficulty === "string" ? problem.difficulty : null;
  const displayConstraints =
    constraints.length > 0 ? constraints : PROBLEM.constraints;

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
          {title}
        </h1>

        {difficulty && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--ghost-border)] bg-[rgba(224,141,255,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
              {difficulty}
            </span>
          </div>
        )}

        {/* description text */}
        <div className="mt-5 text-[0.95rem] leading-8 text-[var(--text-secondary)]">
          {isLoading && (
            <p className="mb-4 text-sm text-[var(--text-tertiary)]">
              Loading problem description...
            </p>
          )}

          {error && (
            <p className="mb-4 rounded-lg border border-[rgba(255,120,120,0.2)] bg-[rgba(255,120,120,0.08)] px-4 py-3 text-sm leading-6 text-[#ffb4b4]">
              {error}
            </p>
          )}

          {intro.map((paragraph, i) => (
            <p key={i} className="mt-3 first:mt-0">
              {renderInlineCode(paragraph)}
            </p>
          ))}
        </div>

        {examples.length > 0 && (
          <div className="mt-8 space-y-8">
            {examples.map((example, index) => (
              <div key={`${example.heading}-${index}`}>
                <h3 className="text-[1.35rem] font-bold tracking-tight text-[var(--on-background)]">
                  {example.heading}
                </h3>
                <div className="mt-3 rounded-2xl border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.03)] px-7 py-6 shadow-[inset_1px_0_0_rgba(255,255,255,0.12)]">
                  <div className="space-y-4 text-[1rem] leading-8 text-[var(--text-secondary)]">
                    {example.fields.map((field) => (
                      <p key={`${example.heading}-${field.label}`}>
                        <span className="font-bold text-[1.03rem] text-[var(--on-background)]">
                          {field.label}:
                        </span>{" "}
                        {renderInlineCode(field.value)}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* constraints */}
        <div className="mt-8">
          <h3 className="text-base font-semibold text-[var(--on-background)]">
            Constraints:
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-[0.9rem] leading-7 text-[var(--text-secondary)]">
            {displayConstraints.map((c, i) => (
              <li key={i}>
                <code className="rounded bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 font-[var(--font-mono)] text-[0.86rem] text-[var(--on-background)]">
                  {c}
                </code>
              </li>
            ))}
          </ul>
        </div>

        {followUp && (
          <div className="mt-8">
            <h3 className="text-base font-semibold text-[var(--on-background)]">
              Follow Up:
            </h3>
            <div className="mt-3 text-[0.95rem] leading-8 text-[var(--text-secondary)]">
              {followUp.split("\n").map((paragraph, i) => (
                <p key={i} className="mt-3 first:mt-0">
                  {renderInlineCode(paragraph)}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
