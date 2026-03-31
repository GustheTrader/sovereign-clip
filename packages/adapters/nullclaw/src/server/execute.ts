import type { AdapterExecutionContext, AdapterExecutionResult } from "@sovereign-clip/adapter-utils";
import {
  asString,
  asNumber,
  asStringArray,
  buildPaperclipEnv,
  joinPromptSections,
  runChildProcess,
} from "@sovereign-clip/adapter-utils/server-utils";

interface NullClawExecutionInput {
  runId: string;
  agent: AdapterExecutionContext["agent"];
  config: Record<string, unknown>;
  context: Record<string, unknown>;
  authToken?: string;
}

/**
 * Execute a task via NullClaw binary.
 * NullClaw is an ultra-lightweight Zig agent runtime: 678 KB binary,
 * ~1 MB RAM, sub-8ms cold start. Designed for edge/IoT deployment.
 */
export async function execute(
  input: NullClawExecutionInput,
): Promise<AdapterExecutionResult> {
  const config = input.config;
  const binaryPath = asString(config.binaryPath) || "nullclaw";
  const timeoutSec = asNumber(config.timeoutSec) || 60;
  const provider = asString(config.provider) || "";
  const sandboxMode = asString(config.sandboxMode) || "landlock";

  const paperclipEnv = buildPaperclipEnv(input.context, input.runId);

  const prompt = joinPromptSections([
    input.context.goal as string,
    input.context.taskTitle as string,
    input.context.taskDescription as string,
    input.context.instructions as string,
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
    ...process.env as Record<string, string>,
    ...paperclipEnv,
    NULLCLAW_PAPERCLIP_RUN_ID: input.runId,
  };

  if (input.authToken) {
    env.NULLCLAW_API_KEY = input.authToken;
  }

  if (config.configPath) {
    env.NULLCLAW_CONFIG = asString(config.configPath);
  }

  try {
    const result = await runChildProcess(binaryPath, args, {
      cwd: config.cwd as string || process.cwd(),
      env,
      timeoutMs: timeoutSec * 1000,
    });

    if (result.exitCode !== 0) {
      return {
        status: "error",
        output: result.stdout,
        error: result.stderr || `NullClaw exited with code ${result.exitCode}`,
      };
    }

    return {
      status: "done",
      output: result.stdout,
      meta: {
        provider,
        sandboxMode,
        binaryPath,
        stderr: result.stderr,
      },
    };
  } catch (error: any) {
    return {
      status: "error",
      error: `NullClaw execution failed: ${error.message}`,
    };
  }
}

/**
 * Test that the NullClaw binary is available and functional.
 * NullClaw boots in <2ms so this should be near-instant.
 */
export async function test(
  config: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  const binaryPath = asString(config.binaryPath) || "nullclaw";

  try {
    const result = await runChildProcess(binaryPath, ["--version"], {
      timeoutMs: 2000, // NullClaw boots in <2ms, 2s is very generous
    });

    if (result.exitCode === 0) {
      return {
        ok: true,
        message: `NullClaw available: ${result.stdout.trim()}`,
      };
    }
    return {
      ok: false,
      message: `NullClaw --version returned exit code ${result.exitCode}`,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: `Cannot run nullclaw binary: ${error.message}`,
    };
  }
}

/**
 * Deploy NullClaw to an edge device via SSH.
 * NullClaw's 678 KB binary makes remote deployment trivial.
 */
export async function deployToEdge(
  config: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  const targetHost = asString(config.targetHost);
  const targetArch = asString(config.targetArch) || "aarch64";
  const binaryPath = asString(config.binaryPath) || "nullclaw";

  if (!targetHost) {
    return { ok: false, message: "No targetHost specified for edge deployment" };
  }

  try {
    // scp the tiny binary to the edge device
    const result = await runChildProcess("scp", [
      binaryPath,
      `${targetHost}:/usr/local/bin/nullclaw`,
    ], { timeoutMs: 30000 });

    if (result.exitCode === 0) {
      return {
        ok: true,
        message: `NullClaw deployed to ${targetHost} (${targetArch})`,
      };
    }
    return {
      ok: false,
      message: `Deployment failed: ${result.stderr}`,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: `Edge deployment failed: ${error.message}`,
    };
  }
}
