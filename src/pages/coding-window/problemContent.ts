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

export function getParsedTestCases(problem?: RemoteProblemData | null) {
  const examples = getExampleBlocks(problem);

  if (examples.length > 0) {
    const parsedCases = examples
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

    if (parsedCases.length > 0) {
      return parsedCases;
    }
  }

  if (Array.isArray(problem?.input_output) && problem.input_output.length > 0) {
    const apiCases = problem.input_output
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

    if (apiCases.length > 0) {
      return apiCases;
    }
  }

  return PROBLEM.testCases.map((testCase, index) => ({
    label: `Example ${index + 1}:`,
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
  }));
}
