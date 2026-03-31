export const type = "hermes_agent";
export const label = "Hermes Agent";

export const models: { id: string; label: string }[] = [
  { id: "nous-portal", label: "Nous Portal" },
  { id: "openrouter", label: "OpenRouter (200+ models)" },
  { id: "glm-4", label: "GLM-4 (z.ai)" },
  { id: "kimi", label: "Kimi (Moonshot)" },
  { id: "minimax", label: "MiniMax" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
];

export const agentConfigurationDoc = `# hermes_agent agent configuration

Adapter: hermes_agent

Use when:
- You want Paperclip to invoke Hermes Agent via its CLI or API.
- You need persistent memory that grows with the agent over time.
- You want self-evolving skills that the agent builds autonomously.
- You need multi-provider model support without lock-in.

Don't use when:
- You need ultra-lightweight edge deployment (use NullClaw instead).
- You need structured org-chart governance (use Paperclip's built-in).

Core fields:
- baseUrl (string, optional): Hermes API endpoint (default: CLI mode)
- hermesHome (string, optional): path to hermes home directory
- timeoutSec (number, optional): adapter timeout in seconds (default 300)

Agent behavior fields:
- modelProvider (string, optional): provider name (nous-portal, openrouter, etc.)
- modelId (string, optional): specific model ID within provider
- skillSync (string, optional): skill sync mode (auto, manual, none)
- memoryMode (string, optional): memory persistence mode (persistent, session, none)

Runtime fields:
- command (string, optional): path to hermes CLI binary
- env (object, optional): environment variables for hermes process
`;
