import type { TranscriptEntry } from "@sovereign-clip/adapter-utils";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const MAGENTA = "\x1b[35m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";

function getText(entry: TranscriptEntry): string {
  if ("text" in entry) return entry.text;
  if ("content" in entry) return entry.content;
  return "";
}

export function formatHermesEvent(entry: TranscriptEntry): string {
  const ts = `${DIM}${entry.ts}${RESET}`;

  switch (entry.kind) {
    case "assistant":
      return `${ts} ${BOLD}${MAGENTA}Hermes${RESET} ${entry.text}`;
    case "tool_call":
      return `${ts} ${YELLOW}⚙ [${entry.name}]${RESET}`;
    case "tool_result":
      return `${ts} ${DIM}↳ ${entry.content}${RESET}`;
    case "thinking":
      return `${ts} ${DIM}💭 ${entry.text}${RESET}`;
    case "stderr":
      return `${ts} ${RED}✗ ${entry.text}${RESET}`;
    case "system":
      return `${ts} ${GREEN}●${RESET} ${entry.text}`;
    case "stdout":
      return `${ts} ${entry.text}`;
    case "init":
      return `${ts} ${DIM}Session started: ${entry.model}${RESET}`;
    case "result":
      return `${ts} ${GREEN}✓${RESET} ${entry.text} (${entry.inputTokens}→${entry.outputTokens} tokens)`;
    case "user":
      return `${ts} ${BOLD}User:${RESET} ${entry.text}`;
    default:
      return `${ts} ${getText(entry)}`;
  }
}
