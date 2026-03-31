import type { CreateConfigValues } from "@sovereign-clip/adapter-utils";

export function buildNullClawConfig(v: CreateConfigValues): Record<string, unknown> {
  const ac: Record<string, unknown> = {};
  if (v.binaryPath) ac.binaryPath = v.binaryPath;
  if (v.provider) ac.provider = v.provider;
  ac.timeoutSec = 60;
  ac.sandboxMode = "landlock";
  return ac;
}
