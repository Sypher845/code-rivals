import { PROBLEM } from "./constants";
import type { RemoteProblemData } from "../CodingWindowPage";

export type ExampleField = {
  label: string;
  value: string;
};

export type ExampleBlock = {
  heading: string;
  fields: ExampleField[];
};

export type ParsedTestCase = {
  label: string;
  input: string;
  expectedOutput: string;
};

function splitTopLevel(value: string, delimiter: string) {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let quoteChar = "";

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previous = index > 0 ? value[index - 1] : "";

    if ((char === '"' || char === "'") && previous !== "\\") {
      if (!inString) {
        inString = true;
        quoteChar = char;
      } else if (quoteChar === char) {
        inString = false;
        quoteChar = "";
      }
    }

    if (!inString) {
      if (char === "(" || char === "[" || char === "{") {
        depth += 1;
      } else if (char === ")" || char === "]" || char === "}") {
        depth = Math.max(0, depth - 1);
      } else if (char === delimiter && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function stripOuterQuotes(value: string) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function normalizeAssignmentSegment(segment: string) {
  const equalsIndex = segment.indexOf("=");
  const rawValue =
    equalsIndex >= 0 ? segment.slice(equalsIndex + 1).trim() : segment.trim();

  return stripOuterQuotes(rawValue);
}

export function normalizeTestCaseInput(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  const normalizedLines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      if (!line.includes("=")) {
        return [stripOuterQuotes(line)];
      }

      const segments = splitTopLevel(line, ",");
      return segments.map(normalizeAssignmentSegment);
    });

  return normalizedLines.join("\n");
}

export function normalizeExpectedOutput(output: string) {
  return stripOuterQuotes(output.trim());
}

export function getDescriptionText(problem?: RemoteProblemData | null) {
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

export function formatTaskId(taskId?: string) {
  if (!taskId?.trim()) return null;
  return taskId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getTitle(problem?: RemoteProblemData | null) {
  if (typeof problem?.title === "string" && problem.title.trim()) {
    return problem.title;
  }

  return formatTaskId(problem?.task_id) ?? PROBLEM.title;
}

export function parseDescriptionSections(descriptionText: string) {
  const constraintsMatch = /(?:^|\n)\s*Constraints:\s*/i.exec(descriptionText);
  const followUpMatch = /(?:^|\n)\s*Follow[\s-]*up:\s*/i.exec(descriptionText);
  const constraintsIndex = constraintsMatch?.index ?? -1;
  const followUpIndex = followUpMatch?.index ?? -1;

  const descriptionBody =
    constraintsIndex >= 0
      ? descriptionText.slice(0, constraintsIndex).trim()
      : followUpIndex >= 0
        ? descriptionText.slice(0, followUpIndex).trim()
        : descriptionText.trim();

  let constraints: string[] = [];
  if (constraintsIndex >= 0 && constraintsMatch) {
    const constraintsStart = constraintsIndex + constraintsMatch[0].length;
    const rawConstraints = descriptionText
      .slice(
        constraintsStart,
        followUpIndex >= 0 && followUpIndex > constraintsStart
          ? followUpIndex
          : undefined,
      )
      .trim();

    constraints = rawConstraints
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const followUp =
    followUpIndex >= 0 && followUpMatch
      ? descriptionText.slice(followUpIndex + followUpMatch[0].length).trim()
      : null;

  return { descriptionBody, constraints, followUp };
}

export function parseBodyContent(descriptionBody: string) {
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
          ? (matches[index + 1].index ?? body.length)
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

export function getExampleBlocks(problem?: RemoteProblemData | null) {
  const descriptionText = getDescriptionText(problem);
  const { descriptionBody } = parseDescriptionSections(descriptionText);
  return parseBodyContent(descriptionBody).examples;
}

function getExampleTestCases(problem?: RemoteProblemData | null) {
  const examples = getExampleBlocks(problem);

  if (examples.length > 0) {
    return examples
      .map((example, index) => {
        const inputField = example.fields.find(
          (field) => field.label.toLowerCase() === "input",
        );
        const outputField = example.fields.find(
          (field) => field.label.toLowerCase() === "output",
        );

        if (!inputField?.value || !outputField?.value) {
          return null;
        }

        return {
          label: example.heading || `Example ${index + 1}:`,
          input: inputField.value,
          expectedOutput: outputField.value,
        };
      })
      .filter((testCase): testCase is ParsedTestCase => testCase !== null);
  }

  return [];
}

function getApiTestCases(problem?: RemoteProblemData | null) {
  if (Array.isArray(problem?.input_output) && problem.input_output.length > 0) {
    return problem.input_output
      .map((testCase, index) => {
        const input =
          typeof testCase.input === "string" ? testCase.input.trim() : "";
        const output =
          typeof testCase.output === "string" ? testCase.output.trim() : "";

        if (!input || !output) {
          return null;
        }

        return {
          label: `Case ${index + 1}:`,
          input,
          expectedOutput: output,
        };
      })
      .filter((testCase): testCase is ParsedTestCase => testCase !== null);
  }

  return [];
}

function getFallbackTestCases() {
  return PROBLEM.testCases.map((testCase, index) => ({
    label: `Example ${index + 1}:`,
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
  }));
}

export function getVisibleTestCases(problem?: RemoteProblemData | null) {
  const exampleCases = getExampleTestCases(problem);
  if (exampleCases.length > 0) {
    return exampleCases;
  }

  const apiCases = getApiTestCases(problem);
  if (apiCases.length > 0) {
    return apiCases.slice(0, Math.min(3, apiCases.length));
  }

  return getFallbackTestCases();
}

export function getSubmissionTestCases(problem?: RemoteProblemData | null) {
  const apiCases = getApiTestCases(problem);
  if (apiCases.length > 0) {
    return apiCases;
  }

  const exampleCases = getExampleTestCases(problem);
  if (exampleCases.length > 0) {
    return exampleCases;
  }

  return getFallbackTestCases();
}

export function getParsedTestCases(problem?: RemoteProblemData | null) {
  return getVisibleTestCases(problem);
}
