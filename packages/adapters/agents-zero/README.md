# @sovereign-clip/adapter-agents-zero

Paperclip adapter for [Agents Zero](https://github.com/agent0ai/agent-zero) — a prompt-driven autonomous agent framework.

## Features

- HTTP API integration with Agents Zero
- Configurable agent profiles, iteration limits, and capabilities
- Browser automation and code execution toggles
- Health check and environment probing

## Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `baseUrl` | string | `http://localhost:5000` | Agent Zero API endpoint |
| `apiKey` | string | — | API key for authenticated instances |
| `agentProfile` | string | `default` | Agent Zero profile name |
| `maxIterations` | number | `50` | Max autonomous iterations per task |
| `enableBrowser` | boolean | `true` | Enable browser automation |
| `enableCodeExecution` | boolean | `true` | Enable dynamic code execution |
| `memoryPersistence` | boolean | `true` | Persist agent memory across runs |
| `timeoutSec` | number | `300` | Execution timeout |

## Big Four

This adapter is part of the **Sovereign Agentic OS** federation — four agent runtimes unified under one interface:

| Agent | Adapter | Strength |
|-------|---------|----------|
| Agents Zero | `@sovereign-clip/adapter-agents-zero` | Self-evolving tools, computer-use |
| OpenClaw | `@sovereign-clip/adapter-openclaw-gateway` | Multi-channel, skills, heartbeat |
| Hermes | `@sovereign-clip/adapter-hermes-agent` | Persistent memory, multi-provider |
| NullClaw | `@sovereign-clip/adapter-nullclaw` | Edge deployment, 678KB binary |
