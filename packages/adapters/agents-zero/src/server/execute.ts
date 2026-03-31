import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import {
  asString,
  asNumber,
  asBoolean,
  buildPaperclipEnv,
  joinPromptSections,
  runChildProcess,
} from "@paperclipai/adapter-utils/server-utils";

interface AgentsZeroExecutionInput {
  runId: string;
  agent: AdapterExecutionContext["agent"];
  config: Record<string, unknown>;
  context: Record<string, unknown>;
  authToken?: string;
}

/**
 * Execute a task via the Agents Zero HTTP API.
 * Agents Zero is a prompt-driven autonomous agent framework that creates
 * tools dynamically and self-corrects. It runs as a Python service.
 */
export async function execute(
  input: AgentsZeroExecutionInput,
): Promise<AdapterExecutionResult> {
  const config = input.config;
  const baseUrl = asString(config.baseUrl) || "http://localhost:5000";
  const timeoutSec = asNumber(config.timeoutSec) || 300;
  const agentProfile = asString(config.agentProfile) || "default";
  const maxIterations = asNumber(config.maxIterations) || 50;
  const enableBrowser = asBoolean(config.enableBrowser) ?? true;
  const enableCodeExecution = asBoolean(config.enableCodeExecution) ?? true;

  const paperclipEnv = buildPaperclipEnv(input.context, input.runId);

  const prompt = joinPromptSections([
    input.context.goal as string,
    input.context.taskTitle as string,
    input.context.taskDescription as string,
    input.context.instructions as string,
  ]);

  const requestBody = {
    prompt,
    profile: agentProfile,
    max_iterations: maxIterations,
    enable_browser: enableBrowser,
    enable_code_execution: enableCodeExecution,
    metadata: {
      runId: input.runId,
      paperclip: paperclipEnv,
    },
  };

  try {
    const response = await fetch(`${baseUrl}/api/v1/agent/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(input.authToken ? { Authorization: `Bearer ${input.authToken}` } : {}),
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeoutSec * 1000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        status: "error",
        error: `Agents Zero API returned ${response.status}: ${errorText}`,
      };
    }

    const result = await response.json();

    return {
      status: result.status === "success" ? "done" : "error",
      output: result.output || result.response || "",
      error: result.error,
      meta: {
        iterations: result.iterations,
        toolsCreated: result.tools_created,
        cost: result.cost,
      },
    };
  } catch (error: any) {
    return {
      status: "error",
      error: `Agents Zero execution failed: ${error.message}`,
    };
  }
}

/**
 * Test connectivity to the Agents Zero API.
 */
export async function test(
  config: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  const baseUrl = asString(config.baseUrl) || "http://localhost:5000";

  try {
    const response = await fetch(`${baseUrl}/api/v1/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return { ok: true, message: "Agents Zero API is reachable" };
    }
    return { ok: false, message: `Agents Zero API returned ${response.status}` };
  } catch (error: any) {
    return { ok: false, message: `Cannot reach Agents Zero API: ${error.message}` };
  }
}
