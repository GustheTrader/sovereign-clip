import type { AdapterExecutionContext, AdapterExecutionResult } from "@sovereign-clip/adapter-utils";
import {
  asString,
  asNumber,
  parseObject,
  joinPromptSections,
  buildPaperclipEnv,
  runChildProcess,
} from "@sovereign-clip/adapter-utils/server-utils";

/**
 * Execute a task via NullClaw binary.
 * NullClaw is an ultra-lightweight Zig agent runtime: 678 KB binary,
 * ~1 MB RAM, sub-8ms cold start. Designed for edge/IoT deployment.
 */
export async function execute(
  ctx: AdapterExecutionContext,
): Promise<AdapterExecutionResult> {
  const config = ctx.config;
  const binaryPath = asString(config.binaryPath, "nullclaw");
  const timeoutSec = asNumber(config.timeoutSec, 60);
  const graceSec = asNumber(config.graceSec, 5);
  const provider = asString(config.provider, "");
  const sandboxMode = asString(config.sandboxMode, "landlock");

  const prompt = joinPromptSections([
    ctx.context.goal as string,
    ctx.context.taskTitle as string,
    ctx.context.taskDescription as string,
    ctx.context.instructions as string,
  ]);

  const args: string[] = ["run"];

  if (provider) {
    args.push("--provider", provider);
  }

  if (sandboxMode && sandboxMode !== "none") {
    args.push("--sandbox", sandboxMode);
  }

  args.push("--prompt", prompt);

  const env: Record<string, string> = {
    ...buildPaperclipEnv(ctx.agent),
    NULLCLAW_PAPERCLIP_RUN_ID: ctx.runId,
  };

  if (ctx.authToken) {
    env.NULLCLAW_API_KEY = ctx.authToken;
  }

  const configPath = asString(config.configPath, "");
  if (configPath) {
    env.NULLCLAW_CONFIG = configPath;
  }

  const result = await runChildProcess(ctx.runId, binaryPath, args, {
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
        ? result.stderr || `NullClaw exited with code ${result.exitCode}`
        : null,
    errorCode: result.timedOut ? "timeout" : result.exitCode !== 0 ? "nullclaw_error" : null,
  };
}
