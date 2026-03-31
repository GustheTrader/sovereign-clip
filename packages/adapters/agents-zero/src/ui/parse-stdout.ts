import type { TranscriptEntry } from "@sovereign-clip/adapter-utils";

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * Parse Agents Zero stdout into transcript entries.
 * Agents Zero outputs JSON-lines with type, content, and metadata.
 */
export function parseAgentsZeroStdoutLine(line: string, ts: string): TranscriptEntry[] {
  const parsed = safeJsonParse(line.trim());
  const record = asRecord(parsed);

  if (!record) {
    // Plain text output
    if (line.trim().length > 0) {
      return [{ kind: "stdout", ts, text: line.trim() }];
    }
    return [];
  }

  const type = asString(record.type);
  const content = asString(record.content || record.output || record.message);

  switch (type) {
    case "assistant":
    case "response":
      return [{ kind: "assistant", ts, text: content }];

    case "tool_use":
    case "tool_call": {
      const toolName = asString(record.tool || record.name);
      return [{
        kind: "tool",
        ts,
        text: toolName ? `[${toolName}] ${content}` : content,
      }];
    }

    case "tool_result":
      return [{ kind: "tool_result", ts, text: content }];

    case "thinking":
    case "reasoning":
      return [{ kind: "thinking", ts, text: content }];

    case "error":
      return [{ kind: "error", ts, text: content }];

    case "iteration":
      return [{ kind: "info", ts, text: `Iteration ${record.iteration}: ${content}` }];

    case "tool_created":
      return [{ kind: "info", ts, text: `🔧 Created tool: ${asString(record.tool_name)}` }];

    case "status":
      return [{ kind: "info", ts, text: content }];

    default:
      if (content) {
        return [{ kind: "stdout", ts, text: content }];
      }
      return [];
  }
}
