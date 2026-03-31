export const type = "nullclaw";
export const label = "NullClaw";

export const models: { id: string; label: string }[] = [
  { id: "openai-compatible", label: "OpenAI-Compatible Endpoint" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { id: "llama-3.1-70b", label: "Llama 3.1 70B" },
  { id: "qwen-2.5-72b", label: "Qwen 2.5 72B" },
];

export const agentConfigurationDoc = `# nullclaw agent configuration

Adapter: nullclaw

Use when:
- You want Paperclip to invoke NullClaw for ultra-lightweight agent tasks.
- You need edge deployment on minimal hardware ($5 SBCs, microcontrollers).
- Sub-8ms cold start matters.
- You want a 678 KB static binary with ~1 MB RAM footprint.

Don't use when:
- You need complex multi-step autonomous reasoning (use Agents Zero instead).
- You need persistent memory across sessions (use Hermes instead).

Core fields:
- binaryPath (string, required): path to nullclaw binary
- configPath (string, optional): path to nullclaw config file
- timeoutSec (number, optional): adapter timeout in seconds (default 60)

Agent behavior fields:
- provider (string, optional): LLM provider endpoint URL
- providerType (string, optional): provider type (openai, anthropic, local)
- channels (array, optional): enabled channels for this instance
- sandboxMode (string, optional): sandbox mode (landlock, firejail, bubblewrap, docker, none)

Edge deployment fields:
- targetHost (string, optional): SSH target for remote edge deployment
- targetArch (string, optional): target architecture (x86_64, aarch64, armv7)
- deployMethod (string, optional): deployment method (ssh, ota, docker)
`;
