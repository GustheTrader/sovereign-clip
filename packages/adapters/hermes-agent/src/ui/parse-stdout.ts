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
 * Parse Hermes Agent stdout into transcript entries.
 * Hermes outputs structured JSON with type, content, and memory/skill metadata.
 */
export function parseHermesStdoutLine(line: string, ts: string): TranscriptEntry[] {
  const parsed = safeJsonParse(line.trim());
  const record = asRecord(parsed);

  if (!record) {
    if (line.trim().length > 0) {
      return [{ kind: "stdout", ts, text: line.trim() }];
    }
    return [];
  }

  const type = asString(record.type);
  const content = asString(record.content || record.text || record.message);

  switch (type) {
    case "assistant":
    case "response":
      return [{ kind: "assistant", ts, text: content }];

    case "tool_use":
    case "function_call": {
      const fnName = asString(record.function || record.name);
      return [{
        kind: "tool",
        ts,
        text: fnName ? `[${fnName}] ${content}` : content,
      }];
    }

    case "tool_result":
    case "function_result":
      return [{ kind: "tool_result", ts, text: content }];

    case "thinking":
    case "reasoning":
      return [{ kind: "thinking", ts, text: content }];

    case "memory_update":
    case "memory_store": {
      const memoryKey = asString(record.key || record.memory_key);
      return [{
        kind: "info",
        ts,
        text: `🧠 Memory updated${memoryKey ? `: ${memoryKey}` : ""}`,
      }];
    }

    case "skill_learned":
    case "skill_created": {
      const skillName = asString(record.skill || record.skill_name);
      return [{
        kind: "info",
        ts,
        text: `🎯 Skill learned${skillName ? `: ${skillName}` : ""}`,
      }];
    }

    case "provider_switch": {
      const provider = asString(record.provider);
      return [{
        kind: "info",
        ts,
        text: `🔄 Switched to provider: ${provider}`,
      }];
    }

    case "error":
      return [{ kind: "error", ts, text: content }];

    case "status":
    case "info":
      return [{ kind: "info", ts, text: content }];

    default:
      if (content) {
        return [{ kind: "stdout", ts, text: content }];
      }
      return [];
  }
}
