import type { AdapterExecutionContext, AdapterExecutionResult } from "@sovereign-clip/adapter-utils";
import {
  asString,
  asNumber,
  asBoolean,
  parseObject,
  joinPromptSections,
  buildPaperclipEnv,
  runChildProcess,
} from "@sovereign-clip/adapter-utils/server-utils";

/**
 * Execute a task via Hermes Agent CLI.
 * Hermes is Nous Research's open-source agent with persistent memory,
 * self-evolving skills, and multi-provider model support.
 */
export async function execute(
  ctx: AdapterExecutionContext,
): Promise<AdapterExecutionResult> {
  const config = ctx.config;
  const command = asString(config.command, "hermes");
  const timeoutSec = asNumber(config.timeoutSec, 300);
  const graceSec = asNumber(config.graceSec, 15);
  const modelProvider = asString(config.modelProvider, "openrouter");
  const modelId = asString(config.modelId, "");

  const prompt = joinPromptSections([
    ctx.context.goal as string,
    ctx.context.taskTitle as string,
    ctx.context.taskDescription as string,
    ctx.context.instructions as string,
  ]);

  const args: string[] = ["run", "--non-interactive"];

  if (modelProvider) {
    args.push("--provider", modelProvider);
  }
  if (modelId) {
    args.push("--model", modelId);
  }

  args.push("--prompt", prompt);

  const env: Record<string, string> = {
    ...buildPaperclipEnv(ctx.agent),
    HERMES_PAPERCLIP_RUN_ID: ctx.runId,
  };

  if (ctx.authToken) {
    env.HERMES_API_KEY = ctx.authToken;
  }

  const hermesHome = asString(config.hermesHome, "");
  if (hermesHome) {
    env.HERMES_HOME = hermesHome;
  }

  const result = await runChildProcess(ctx.runId, command, args, {
    cwd: asString(config.cwd, process.cwd()),
    env,
    timeoutSec,
    graceSec,
    onLog: ctx.onLog,
  });

  return {
    exitCode: result.exitCode,
    signal: result.signal,
    timedOut: result.timedOut,
    errorMessage: result.timedOut
      ? `Timed out after ${timeoutSec}s`
      : result.exitCode !== 0
        ? result.stderr || `Hermes exited with code ${result.exitCode}`
        : null,
    errorCode: result.timedOut ? "timeout" : result.exitCode !== 0 ? "hermes_error" : null,
  };
}
