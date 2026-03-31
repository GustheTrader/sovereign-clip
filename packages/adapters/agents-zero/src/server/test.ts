import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@sovereign-clip/adapter-utils";
import { asString, parseObject } from "@sovereign-clip/adapter-utils/server-utils";

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
  const baseUrl = asString(config.baseUrl, "").trim();

  if (!baseUrl) {
    checks.push({
      code: "agents_zero_url_missing",
      level: "error",
      message: "Agents Zero adapter requires a baseUrl.",
      hint: "Set adapterConfig.baseUrl to http://localhost:5000 (or your Agent Zero endpoint).",
    });
    return {
      adapterType: ctx.adapterType,
      status: summarizeStatus(checks),
      checks,
      testedAt: new Date().toISOString(),
    };
  }

  let url: URL | null = null;
  try {
    url = new URL(baseUrl);
  } catch {
    checks.push({
      code: "agents_zero_url_invalid",
      level: "error",
      message: `Invalid URL: ${baseUrl}`,
    });
  }

  if (url) {
    checks.push({
      code: "agents_zero_url_valid",
      level: "info",
      message: `Configured Agents Zero endpoint: ${url.toString()}`,
    });

    if (url.protocol === "http:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      checks.push({
        code: "agents_zero_plaintext_remote",
        level: "warn",
        message: "Agents Zero URL uses plaintext HTTP on a non-loopback host.",
        hint: "Prefer HTTPS for remote endpoints.",
      });
    }
  }

  // Probe health endpoint
  if (url) {
    try {
      const healthUrl = `${url.toString().replace(/\/$/, "")}/api/v1/health`;
      const response = await fetch(healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        checks.push({
          code: "agents_zero_health_ok",
          level: "info",
          message: "Agents Zero health check passed.",
        });
      } else {
        checks.push({
          code: "agents_zero_health_fail",
          level: "warn",
          message: `Agents Zero health check returned ${response.status}.`,
          hint: "Verify the Agent Zero service is running.",
        });
      }
    } catch (err) {
      checks.push({
        code: "agents_zero_health_error",
        level: "warn",
        message: err instanceof Error ? err.message : "Cannot reach Agents Zero endpoint.",
        hint: "Ensure Agent Zero is running and accessible from the Paperclip server.",
      });
    }
  }

  // Check optional config
  const agentProfile = asString(config.agentProfile);
  if (agentProfile) {
    checks.push({
      code: "agents_zero_profile_set",
      level: "info",
      message: `Using agent profile: ${agentProfile}`,
    });
  }

  const apiKey = asString(config.apiKey);
  if (apiKey) {
    checks.push({
      code: "agents_zero_auth_present",
      level: "info",
      message: "API key is configured.",
    });
  }

  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
