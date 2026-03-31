# @sovereign-clip/adapter-hermes-agent

Paperclip adapter for [Hermes Agent](https://github.com/NousResearch/hermes-agent) — Nous Research's open-source AI agent with persistent memory.

## Features

- CLI and API integration modes
- Multi-provider model support (Nous Portal, OpenRouter, GLM-4, Kimi, MiniMax, OpenAI)
- Persistent memory that grows with the agent
- Self-evolving skill creation
- Environment probing for CLI availability and API health

## Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `command` | string | `hermes` | Path to hermes CLI binary |
| `baseUrl` | string | — | Hermes API endpoint (optional, for API mode) |
| `modelProvider` | string | `openrouter` | Model provider name |
| `modelId` | string | — | Specific model ID within provider |
| `memoryMode` | string | `persistent` | Memory persistence mode |
| `skillSync` | string | `auto` | Skill sync mode |
| `hermesHome` | string | — | Path to hermes home directory |
| `timeoutSec` | number | `300` | Execution timeout |

## Big Four

This adapter is part of the **Sovereign Agentic OS** federation — four agent runtimes unified under one interface:

| Agent | Adapter | Strength |
|-------|---------|----------|
| Agents Zero | `@sovereign-clip/adapter-agents-zero` | Self-evolving tools, computer-use |
| OpenClaw | `@sovereign-clip/adapter-openclaw-gateway` | Multi-channel, skills, heartbeat |
| Hermes | `@sovereign-clip/adapter-hermes-agent` | Persistent memory, multi-provider |
| NullClaw | `@sovereign-clip/adapter-nullclaw` | Edge deployment, 678KB binary |
