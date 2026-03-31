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
        kind: "tool_call",
        ts,
        name: fnName,
        input: record.input || record.args || {},
        toolUseId: asString(record.tool_use_id),
      }];
    }

    case "tool_result":
    case "function_result":
      return [{
        kind: "tool_result",
        ts,
        toolUseId: asString(record.tool_use_id),
        toolName: asString(record.function || record.name),
        content,
        isError: false,
      }];

    case "thinking":
    case "reasoning":
      return [{ kind: "thinking", ts, text: content }];

    case "memory_update":
    case "memory_store":
      return [{
        kind: "system",
        ts,
        text: `Memory updated: ${asString(record.key || record.memory_key)}`,
      }];

    case "skill_learned":
    case "skill_created":
      return [{
        kind: "system",
        ts,
        text: `Skill learned: ${asString(record.skill || record.skill_name)}`,
      }];

    case "provider_switch":
      return [{
        kind: "system",
        ts,
        text: `Switched to provider: ${asString(record.provider)}`,
      }];

    case "error":
      return [{ kind: "stderr", ts, text: content }];

    case "status":
    case "info":
      return [{ kind: "system", ts, text: content }];

    default:
      if (content) {
        return [{ kind: "stdout", ts, text: content }];
      }
      return [];
  }
}
