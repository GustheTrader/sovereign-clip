import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import {
  asString,
  asNumber,
  asBoolean,
  buildPaperclipEnv,
  joinPromptSections,
  runChildProcess,
} from "@paperclipai/adapter-utils/server-utils";

interface HermesExecutionInput {
  runId: string;
  agent: AdapterExecutionContext["agent"];
  config: Record<string, unknown>;
  context: Record<string, unknown>;
  authToken?: string;
}

/**
 * Execute a task via Hermes Agent CLI.
 * Hermes is Nous Research's open-source agent with persistent memory,
 * self-evolving skills, and multi-provider model support.
 */
export async function execute(
  input: HermesExecutionInput,
): Promise<AdapterExecutionResult> {
  const config = input.config;
  const command = asString(config.command) || "hermes";
  const timeoutSec = asNumber(config.timeoutSec) || 300;
  const modelProvider = asString(config.modelProvider) || "openrouter";
  const modelId = asString(config.modelId) || "";
  const memoryMode = asString(config.memoryMode) || "persistent";

  const paperclipEnv = buildPaperclipEnv(input.context, input.runId);

  const prompt = joinPromptSections([
    input.context.goal as string,
    input.context.taskTitle as string,
    input.context.taskDescription as string,
    input.context.instructions as string,
  ]);

  const args: string[] = ["run", "--non-interactive"];

  if (modelProvider) {
    args.push("--provider", modelProvider);
  }
  if (modelId) {
    args.push("--model", modelId);
  }
  if (memoryMode === "none") {
    args.push("--no-memory");
  }

  args.push("--prompt", prompt);

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    ...paperclipEnv,
    HERMES_PAPERCLIP_RUN_ID: input.runId,
  };

  if (input.authToken) {
    env.HERMES_API_KEY = input.authToken;
  }

  try {
    const result = await runChildProcess(command, args, {
      cwd: config.cwd as string || process.cwd(),
      env,
      timeoutMs: timeoutSec * 1000,
    });

    if (result.exitCode !== 0) {
      return {
        status: "error",
        output: result.stdout,
        error: result.stderr || `Hermes exited with code ${result.exitCode}`,
      };
    }

    return {
      status: "done",
      output: result.stdout,
      meta: {
        modelProvider,
        memoryMode,
        stderr: result.stderr,
      },
    };
  } catch (error: any) {
    return {
      status: "error",
      error: `Hermes Agent execution failed: ${error.message}`,
    };
  }
}

/**
 * Test that the Hermes CLI is available and configured.
 */
export async function test(
  config: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  const command = asString(config.command) || "hermes";

  try {
    const result = await runChildProcess(command, ["--version"], {
      timeoutMs: 5000,
    });

    if (result.exitCode === 0) {
      return { ok: true, message: `Hermes Agent available: ${result.stdout.trim()}` };
    }
    return { ok: false, message: `Hermes --version returned exit code ${result.exitCode}` };
  } catch (error: any) {
    return { ok: false, message: `Cannot run hermes CLI: ${error.message}` };
  }
}
