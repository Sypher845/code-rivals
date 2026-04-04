import {
  LANGUAGE_CONFIGS,
  type SupportedLanguage,
} from "./constants";
import {
  normalizeExpectedOutput,
  normalizeTestCaseInput,
  type ParsedTestCase,
} from "./problemContent";

const PISTON_API_BASE =
  import.meta.env.VITE_PISTON_API_URL ?? "/api/piston";

const EXECUTE_ENDPOINT = `${PISTON_API_BASE}/api/v2/execute`;
const RUNTIMES_ENDPOINT = `${PISTON_API_BASE}/api/v2/runtimes`;

type PistonRuntime = {
  language: string;
  version: string;
  aliases?: string[];
};

type PistonStage = {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
  message: string | null;
  status: string | null;
  cpu_time?: number;
  wall_time?: number;
  memory?: number;
};

type PistonExecuteResponse = {
  language: string;
  version: string;
  compile?: PistonStage;
  run?: PistonStage;
  message?: string;
};

export type JudgeCaseResult = {
  index: number;
  label: string;
  input: string;
  normalizedInput: string;
  expectedOutput: string;
  normalizedExpectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status: "passed" | "failed" | "error";
  message: string | null;
  stderr: string;
  compileOutput: string;
  runtimeVersion: string;
  executionMs: number | null;
};

export type JudgeRunResult = {
  language: SupportedLanguage;
  runtimeVersion: string;
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  results: JudgeCaseResult[];
};

function normalizeForJudge(value: string) {
  return value.replace(/\r\n/g, "\n").trimEnd();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorJson = (await response.json()) as { message?: string };
      if (typeof errorJson.message === "string" && errorJson.message.trim()) {
        message = errorJson.message;
      }
    } catch {
      // Ignore non-JSON errors and keep the default message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function resolveRuntime(language: SupportedLanguage) {
  const config = LANGUAGE_CONFIGS[language];
  const runtimes = await fetchJson<PistonRuntime[]>(RUNTIMES_ENDPOINT);

  const runtime = runtimes.find((candidate) => {
    const aliases = candidate.aliases ?? [];
    return (
      candidate.language === config.pistonLanguage ||
      aliases.includes(config.pistonLanguage) ||
      aliases.includes(language)
    );
  });

  if (!runtime) {
    throw new Error(
      `${config.label} runtime is not available in Piston. Start the Piston container and install the ${config.label} runtime.`,
    );
  }

  return runtime;
}

function buildCaseResult(
  testCase: ParsedTestCase,
  response: PistonExecuteResponse,
  runtimeVersion: string,
  index: number,
): JudgeCaseResult {
  const compile = response.compile;
  const run = response.run;
  const compileOutput = compile?.output ?? "";
  const actualOutput = run?.stdout ?? "";
  const normalizedInput = normalizeTestCaseInput(testCase.input);
  const normalizedExpectedOutput = normalizeExpectedOutput(
    testCase.expectedOutput,
  );
  const stderr = [compile?.stderr, run?.stderr].filter(Boolean).join("\n");
  const executionMs = run?.wall_time ?? compile?.wall_time ?? null;

  const compileFailed = Boolean(
    compile &&
      (compile.status !== null ||
        (compile.code !== null && compile.code !== 0)),
  );
  const runFailed = Boolean(
    run && (run.status !== null || (run.code !== null && run.code !== 0)),
  );

  if (compileFailed) {
    return {
      index,
      label: testCase.label,
      input: testCase.input,
      normalizedInput,
      expectedOutput: testCase.expectedOutput,
      normalizedExpectedOutput,
      actualOutput,
      passed: false,
      status: "error",
      message: compile?.message ?? "Compilation failed.",
      stderr,
      compileOutput,
      runtimeVersion,
      executionMs,
    };
  }

  if (runFailed || !run) {
    return {
      index,
      label: testCase.label,
      input: testCase.input,
      normalizedInput,
      expectedOutput: testCase.expectedOutput,
      normalizedExpectedOutput,
      actualOutput,
      passed: false,
      status: "error",
      message: run?.message ?? response.message ?? "Execution failed.",
      stderr,
      compileOutput,
      runtimeVersion,
      executionMs,
    };
  }

  const passed =
    normalizeForJudge(actualOutput) ===
    normalizeForJudge(normalizedExpectedOutput);

  return {
    index,
    label: testCase.label,
    input: testCase.input,
    normalizedInput,
    expectedOutput: testCase.expectedOutput,
    normalizedExpectedOutput,
    actualOutput,
    passed,
    status: passed ? "passed" : "failed",
    message: passed ? "Output matched expected output." : "Wrong answer.",
    stderr,
    compileOutput,
    runtimeVersion,
    executionMs,
  };
}

export async function judgeCodeAgainstCases(args: {
  language: SupportedLanguage;
  code: string;
  testCases: ParsedTestCase[];
}): Promise<JudgeRunResult> {
  const { language, code, testCases } = args;
  const config = LANGUAGE_CONFIGS[language];
  const runtime = await resolveRuntime(language);

  const results: JudgeCaseResult[] = [];

  for (const [index, testCase] of testCases.entries()) {
    const stdin = normalizeTestCaseInput(testCase.input);

    const response = await fetchJson<PistonExecuteResponse>(EXECUTE_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [
          {
            name: config.mainFileName,
            content: code,
          },
        ],
        stdin,
        compile_timeout: 3000,
        run_timeout: 3000,
        compile_cpu_time: 3000,
        run_cpu_time: 3000,
      }),
    });

    results.push(buildCaseResult(testCase, response, runtime.version, index));
  }

  const passedCount = results.filter((result) => result.passed).length;

  return {
    language,
    runtimeVersion: runtime.version,
    passedCount,
    totalCount: results.length,
    allPassed: results.length > 0 && passedCount === results.length,
    results,
  };
}
