import type { AdapterExecutionContext, AdapterExecutionResult } from "@sovereign-clip/adapter-utils";
import {
  asString,
  asNumber,
  asBoolean,
  parseObject,
  joinPromptSections,
  buildPaperclipEnv,
} from "@sovereign-clip/adapter-utils/server-utils";

/**
 * Execute a task via the Agents Zero HTTP API.
 * Agents Zero is a prompt-driven autonomous agent framework that creates
 * tools dynamically and self-corrects. It runs as a Python service.
 */
export async function execute(
  ctx: AdapterExecutionContext,
): Promise<AdapterExecutionResult> {
  const config = ctx.config;
  const baseUrl = asString(config.baseUrl, "http://localhost:5000");
  const timeoutSec = asNumber(config.timeoutSec, 300);
  const agentProfile = asString(config.agentProfile, "default");
  const maxIterations = asNumber(config.maxIterations, 50);
  const enableBrowser = asBoolean(config.enableBrowser, true);
  const enableCodeExecution = asBoolean(config.enableCodeExecution, true);

  const paperclipEnv = buildPaperclipEnv(ctx.agent);

  const prompt = joinPromptSections([
    ctx.context.goal as string,
    ctx.context.taskTitle as string,
    ctx.context.taskDescription as string,
    ctx.context.instructions as string,
  ]);

  const requestBody = {
    prompt,
    profile: agentProfile,
    max_iterations: maxIterations,
    enable_browser: enableBrowser,
    enable_code_execution: enableCodeExecution,
    stream: true,
    metadata: {
      runId: ctx.runId,
      paperclip: paperclipEnv,
    },
  };

  let errorMessage: string | null = null;
  let errorCode: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutSec * 1000);

    const response = await fetch(`${baseUrl}/api/v1/agent/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ctx.authToken ? { Authorization: `Bearer ${ctx.authToken}` } : {}),
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      errorMessage = `Agents Zero API returned ${response.status}: ${errorText}`;
      errorCode = "api_error";
    } else if (response.body) {
      // Stream JSON-lines response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            await ctx.onLog("stdout", line + "\n");
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        await ctx.onLog("stdout", buffer + "\n");
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      errorMessage = `Timed out after ${timeoutSec}s`;
      errorCode = "timeout";
    } else {
      errorMessage = `Agents Zero execution failed: ${err.message}`;
      errorCode = "connection_error";
    }
  }

  return {
    exitCode: errorCode ? 1 : 0,
    signal: null,
    timedOut: errorCode === "timeout",
    errorMessage,
    errorCode,
  };
}
