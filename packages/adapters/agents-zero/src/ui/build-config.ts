import type { CreateConfigValues } from "@sovereign-clip/adapter-utils";

export function buildAgentsZeroConfig(v: CreateConfigValues): Record<string, unknown> {
  const ac: Record<string, unknown> = {};
  if (v.url) ac.baseUrl = v.url;
  ac.timeoutSec = 300;
  ac.agentProfile = "default";
  ac.maxIterations = 50;
  ac.enableBrowser = true;
  ac.enableCodeExecution = true;
  ac.memoryPersistence = true;
  return ac;
}
