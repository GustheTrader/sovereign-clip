import type { CreateConfigValues } from "@sovereign-clip/adapter-utils";

export function buildHermesConfig(v: CreateConfigValues): Record<string, unknown> {
  const ac: Record<string, unknown> = {};
  if (v.url) ac.baseUrl = v.url;
  if (v.command) ac.command = v.command;
  ac.timeoutSec = 300;
  ac.modelProvider = "openrouter";
  ac.memoryMode = "persistent";
  ac.skillSync = "auto";
  return ac;
}
