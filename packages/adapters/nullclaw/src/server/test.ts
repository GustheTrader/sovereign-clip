import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@sovereign-clip/adapter-utils";
import { asString, parseObject } from "@sovereign-clip/adapter-utils/server-utils";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult["status"] {
  if (checks.some((check) => check.level === "error")) return "fail";
  if (checks.some((check) => check.level === "warn")) return "warn";
  return "pass";
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = parseObject(ctx.config);
  const binaryPath = asString(config.binaryPath, "nullclaw");

  // Check binary availability
  try {
    const { stdout } = await execFileAsync(binaryPath, ["--version"], { timeout: 2000 });
    checks.push({
      code: "nullclaw_binary_available",
      level: "info",
      message: `NullClaw binary found: ${stdout.trim()}`,
    });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      checks.push({
        code: "nullclaw_binary_missing",
        level: "error",
        message: `NullClaw binary not found at: ${binaryPath}`,
        hint: "Install NullClaw: zig build -Doptimize=ReleaseSmall && cp zig-out/bin/nullclaw /usr/local/bin/",
      });
    } else {
      checks.push({
        code: "nullclaw_binary_error",
        level: "warn",
        message: `NullClaw binary check failed: ${err.message}`,
      });
    }
  }

  // Check provider config
  const provider = asString(config.provider, "");
  if (provider) {
    checks.push({
      code: "nullclaw_provider_set",
      level: "info",
      message: `Provider endpoint: ${provider}`,
    });

    // Verify provider is reachable
    try {
      const url = new URL(provider);
      const response = await fetch(`${url.toString().replace(/\/$/, "")}/models`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        checks.push({
          code: "nullclaw_provider_reachable",
          level: "info",
          message: "Provider endpoint is reachable.",
        });
      } else {
        checks.push({
          code: "nullclaw_provider_warn",
          level: "warn",
          message: `Provider returned ${response.status}.`,
        });
      }
    } catch {
      checks.push({
        code: "nullclaw_provider_unreachable",
        level: "warn",
        message: "Cannot reach provider endpoint.",
        hint: "Verify the LLM provider URL is accessible from the Paperclip server.",
      });
    }
  } else {
    checks.push({
      code: "nullclaw_provider_missing",
      level: "warn",
      message: "No provider endpoint configured.",
      hint: "Set adapterConfig.provider to an OpenAI-compatible endpoint URL.",
    });
  }

  // Check sandbox mode
  const sandboxMode = asString(config.sandboxMode, "landlock");
  checks.push({
    code: "nullclaw_sandbox_set",
    level: "info",
    message: `Sandbox mode: ${sandboxMode}`,
  });

  // Check edge deployment config
  const targetHost = asString(config.targetHost, "");
  if (targetHost) {
    checks.push({
      code: "nullclaw_edge_target",
      level: "info",
      message: `Edge deployment target: ${targetHost}`,
    });

    // Test SSH connectivity
    try {
      await execFileAsync("ssh", ["-o", "ConnectTimeout=3", "-o", "BatchMode=yes", targetHost, "echo ok"], {
        timeout: 5000,
      });
      checks.push({
        code: "nullclaw_edge_ssh_ok",
        level: "info",
        message: `SSH to ${targetHost} succeeded.`,
      });
    } catch (err: any) {
      checks.push({
        code: "nullclaw_edge_ssh_fail",
        level: "warn",
        message: `SSH to ${targetHost} failed: ${err.message}`,
        hint: "Ensure SSH keys are configured for the edge target.",
      });
    }
  }

  // Check config file
  const configPath = asString(config.configPath, "");
  if (configPath) {
    checks.push({
      code: "nullclaw_config_set",
      level: "info",
      message: `Config file: ${configPath}`,
    });
  }

  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
