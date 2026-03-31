import type { CreateConfigValues } from "@sovereign-clip/adapter-utils";

export function buildNullClawConfig(v: CreateConfigValues): Record<string, unknown> {
  const ac: Record<string, unknown> = {};
  if (v.command) ac.binaryPath = v.command;
  if (v.url) ac.provider = v.url;
  ac.timeoutSec = 60;
  ac.sandboxMode = "landlock";
  return ac;
}
