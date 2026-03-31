import type { TranscriptEntry } from "@sovereign-clip/adapter-utils";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const MAGENTA = "\x1b[35m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";

export function formatHermesEvent(entry: TranscriptEntry): string {
  const ts = `${DIM}${entry.ts}${RESET}`;

  switch (entry.kind) {
    case "assistant":
      return `${ts} ${BOLD}${MAGENTA}Hermes${RESET} ${entry.text}`;
    case "tool":
      return `${ts} ${YELLOW}⚙ ${entry.text}${RESET}`;
    case "tool_result":
      return `${ts} ${DIM}↳ ${entry.text}${RESET}`;
    case "thinking":
      return `${ts} ${DIM}💭 ${entry.text}${RESET}`;
    case "error":
      return `${ts} ${RED}✗ ${entry.text}${RESET}`;
    case "info":
      if (entry.text?.includes("🧠")) {
        return `${ts} ${BLUE}${entry.text}${RESET}`;
      }
      if (entry.text?.includes("🎯")) {
        return `${ts} ${GREEN}${entry.text}${RESET}`;
      }
      if (entry.text?.includes("🔄")) {
        return `${ts} ${MAGENTA}${entry.text}${RESET}`;
      }
      return `${ts} ${GREEN}●${RESET} ${entry.text}`;
    case "stdout":
    default:
      return `${ts} ${entry.text}`;
  }
}
