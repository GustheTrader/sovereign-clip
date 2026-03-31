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
  const command = asString(config.command, "hermes");
  const baseUrl = asString(config.baseUrl, "").trim();

  // Check if CLI is available (when not in API-only mode)
  if (!baseUrl) {
    try {
      const { stdout } = await execFileAsync(command, ["--version"], { timeout: 5000 });
      checks.push({
        code: "hermes_cli_available",
        level: "info",
        message: `Hermes CLI found: ${stdout.trim()}`,
      });
    } catch (err: any) {
      if (err.code === "ENOENT") {
        checks.push({
          code: "hermes_cli_missing",
          level: "error",
          message: `Hermes CLI not found at: ${command}`,
          hint: "Install Hermes Agent: curl -sSf https://hermes-agent.nousresearch.com/install | sh",
        });
      } else {
        checks.push({
          code: "hermes_cli_error",
          level: "warn",
          message: `Hermes CLI check failed: ${err.message}`,
        });
      }
    }
  }

  // Check API endpoint if provided
  if (baseUrl) {
    let url: URL | null = null;
    try {
      url = new URL(baseUrl);
      checks.push({
        code: "hermes_url_valid",
        level: "info",
        message: `Configured Hermes API: ${url.toString()}`,
      });
    } catch {
      checks.push({
        code: "hermes_url_invalid",
        level: "error",
        message: `Invalid URL: ${baseUrl}`,
      });
    }

    if (url) {
      try {
        const response = await fetch(`${url.toString().replace(/\/$/, "")}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          checks.push({
            code: "hermes_api_ok",
            level: "info",
            message: "Hermes API health check passed.",
          });
        } else {
          checks.push({
            code: "hermes_api_fail",
            level: "warn",
            message: `Hermes API returned ${response.status}.`,
          });
        }
      } catch (err) {
        checks.push({
          code: "hermes_api_error",
          level: "warn",
          message: err instanceof Error ? err.message : "Cannot reach Hermes API.",
        });
      }
    }
  }

  // Check model provider config
  const modelProvider = asString(config.modelProvider, "");
  if (modelProvider) {
    checks.push({
      code: "hermes_provider_set",
      level: "info",
      message: `Model provider: ${modelProvider}`,
    });
  } else {
    checks.push({
      code: "hermes_provider_default",
      level: "info",
      message: "No model provider specified, using default (openrouter).",
    });
  }

  // Check hermes home / memory directory
  const hermesHome = asString(config.hermesHome, "");
  if (hermesHome) {
    checks.push({
      code: "hermes_home_set",
      level: "info",
      message: `Hermes home: ${hermesHome}`,
    });
  }

  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
