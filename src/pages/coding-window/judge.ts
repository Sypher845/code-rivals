import {
  EXECUTION_LANGUAGE_CONFIG,
  type SupportedEditorLanguage,
} from "./constants";
import type { ParsedTestCase } from "./problemContent";

const EXECUTE_API_URL =
  import.meta.env.VITE_EXECUTE_API_URL ?? "/api/v2/execute";

type PistonStageResult = {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number;
  signal?: string;
  message?: string;
};

type PistonExecuteResponse = {
  language?: string;
  version?: string;
  run?: PistonStageResult;
  compile?: PistonStageResult;
  message?: string;
};

type ErrorResponseBody = {
  message?: string;
  error?: string;
};

export type JudgeStatus =
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "compile_error"
  | "system_error";

export type JudgeCaseResult = {
  index: number;
  label: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  normalizedExpectedOutput: string;
  normalizedActualOutput: string;
  compileOutput: string;
  errorOutput: string;
  status: JudgeStatus;
  passed: boolean;
  exitCode: number | null;
  signal: string | null;
};

export type JudgeRunResult = {
  results: JudgeCaseResult[];
  passedCount: number;
  totalCount: number;
};

function normalizeOutput(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function unwrapQuotedString(value: string) {
  const normalized = normalizeOutput(value);
  if (normalized.length >= 2 && normalized.startsWith('"') && normalized.endsWith('"')) {
    return normalized.slice(1, -1);
  }

  return normalized;
}

function outputsMatch(actualOutput: string, expectedOutput: string) {
  const normalizedActualOutput = normalizeOutput(actualOutput);
  const normalizedExpectedOutput = normalizeOutput(expectedOutput);

  if (normalizedActualOutput === normalizedExpectedOutput) {
    return {
      matches: true,
      normalizedActualOutput,
      normalizedExpectedOutput,
    };
  }

  const unwrappedActualOutput = unwrapQuotedString(actualOutput);
  const unwrappedExpectedOutput = unwrapQuotedString(expectedOutput);

  return {
    matches: unwrappedActualOutput === unwrappedExpectedOutput,
    normalizedActualOutput,
    normalizedExpectedOutput,
  };
}

function buildErrorText(stage?: PistonStageResult) {
  return (
    stage?.stderr?.trim() ||
    stage?.message?.trim() ||
    ""
  );
}

async function executeSingleTestCase(
  language: SupportedEditorLanguage,
  sourceCode: string,
  testCase: ParsedTestCase,
  index: number,
): Promise<JudgeCaseResult> {
  const config = EXECUTION_LANGUAGE_CONFIG[language];
  let response: Response;
  try {
    response = await fetch(EXECUTE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: config.pistonLanguage,
        version: config.version,
        stdin: testCase.input,
        files: [
          {
            name: config.fileName,
            content: sourceCode,
          },
        ],
      }),
    });
  } catch (error) {
    throw new Error(
      "Unable to reach the compiler service. Check the executor URL or Vite proxy and try again.",
    );
  }

  if (!response.ok) {
    let details = "";

    try {
      const responseText = await response.text();
      if (responseText) {
        try {
          const parsedBody = JSON.parse(responseText) as ErrorResponseBody;
          details = parsedBody.message ?? parsedBody.error ?? responseText;
        } catch {
          details = responseText;
        }
      }
    } catch {
      details = "";
    }

    const suffix = details ? ` ${details}` : "";
    throw new Error(
      `Execution request failed with status ${response.status}.${suffix}`.trim(),
    );
  }

  const data = (await response.json()) as PistonExecuteResponse;
  const compileOutput = buildErrorText(data.compile);
  const runtimeError = buildErrorText(data.run);
  const actualOutput = data.run?.stdout ?? data.run?.output ?? "";
  const {
    matches,
    normalizedActualOutput,
    normalizedExpectedOutput,
  } = outputsMatch(actualOutput, testCase.expectedOutput);

  let status: JudgeStatus = "accepted";
  if (compileOutput) {
    status = "compile_error";
  } else if (runtimeError || (data.run?.code ?? 0) !== 0 || data.run?.signal) {
    status = "runtime_error";
  } else if (!matches) {
    status = "wrong_answer";
  }

  return {
    index,
    label: testCase.label,
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput,
    normalizedExpectedOutput,
    normalizedActualOutput,
    compileOutput,
    errorOutput: runtimeError,
    status,
    passed: status === "accepted",
    exitCode: typeof data.run?.code === "number" ? data.run.code : null,
    signal: data.run?.signal ?? null,
  };
}

export async function judgeCodeAgainstTestCases(
  language: SupportedEditorLanguage,
  sourceCode: string,
  testCases: ParsedTestCase[],
): Promise<JudgeRunResult> {
  const casesToRun =
    testCases.length > 0
      ? testCases
      : [
          {
            label: "Case 1:",
            input: "",
            expectedOutput: "",
          },
        ];

  const results = await Promise.all(
    casesToRun.map((testCase, index) =>
      executeSingleTestCase(language, sourceCode, testCase, index),
    ),
  );

  return {
    results,
    passedCount: results.filter((result) => result.passed).length,
    totalCount: results.length,
  };
}
