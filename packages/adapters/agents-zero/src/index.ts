export const type = "agents_zero";
export const label = "Agents Zero";

export const models: { id: string; label: string }[] = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { id: "claude-opus-4-20250514", label: "Claude Opus 4" },
];

export const agentConfigurationDoc = `# agents_zero agent configuration

Adapter: agents_zero

Use when:
- You want Paperclip to invoke Agent Zero via its HTTP API.
- You want prompt-driven autonomous agents with self-evolving tool creation.
- You need computer-use, browser automation, and dynamic code execution.

Don't use when:
- You need edge deployment or minimal resource usage (use NullClaw instead).
- Your workflow is primarily chat-based (use OpenClaw instead).

Core fields:
- baseUrl (string, required): Agent Zero API endpoint (e.g., http://localhost:5000)
- apiKey (string, optional): API key for authenticated Agent Zero instances
- timeoutSec (number, optional): adapter timeout in seconds (default 300)

Agent behavior fields:
- agentProfile (string, optional): Agent Zero profile name (default "default")
- maxIterations (number, optional): max autonomous iterations per task (default 50)
- enableBrowser (boolean, optional): enable browser automation capabilities (default true)
- enableCodeExecution (boolean, optional): enable dynamic code execution (default true)
- memoryPersistence (boolean, optional): persist agent memory across runs (default true)

Runtime fields:
- pythonPath (string, optional): path to Python interpreter for local Agent Zero
- dockerImage (string, optional): Docker image for sandboxed execution
`;
