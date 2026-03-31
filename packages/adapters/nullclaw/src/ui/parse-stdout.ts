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
 * Parse NullClaw stdout into transcript entries.
 * NullClaw is ultra-lean — outputs compact JSON or plain text.
 * The 678KB binary keeps things minimal.
 */
export function parseNullClawStdoutLine(line: string, ts: string): TranscriptEntry[] {
  const parsed = safeJsonParse(line.trim());
  const record = asRecord(parsed);

  if (!record) {
    if (line.trim().length > 0) {
      return [{ kind: "stdout", ts, text: line.trim() }];
    }
    return [];
  }

  const type = asString(record.t || record.type);
  const content = asString(record.c || record.content || record.text);

  switch (type) {
    case "a":
    case "assistant":
      return [{ kind: "assistant", ts, text: content }];

    case "t":
    case "tool": {
      const toolName = asString(record.n || record.name);
      return [{
        kind: "tool_call",
        ts,
        name: toolName,
        input: record.input || {},
        toolUseId: asString(record.id),
      }];
    }

    case "tr":
    case "tool_result":
      return [{
        kind: "tool_result",
        ts,
        toolUseId: asString(record.id || record.tool_use_id),
        toolName: asString(record.n || record.name),
        content,
        isError: false,
      }];

    case "e":
    case "error":
      return [{ kind: "stderr", ts, text: content }];

    case "i":
    case "info":
    case "s":
    case "status":
    case "d":
    case "deploy":
      return [{ kind: "system", ts, text: content }];

    default:
      if (content) {
        return [{ kind: "stdout", ts, text: content }];
      }
      return [];
  }
}
