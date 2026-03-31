# @sovereign-clip/adapter-nullclaw

Paperclip adapter for [NullClaw](https://github.com/nullclaw/nullclaw) — the ultra-lightweight Zig AI agent runtime.

## Why NullClaw

- **678 KB** static binary — no runtime, no VM, no framework overhead
- **~1 MB** peak RSS memory
- **<2 ms** cold start time
- Runs on **$5 hardware** (Raspberry Pi, microcontrollers, ARM SBCs)
- **5,300+ tests**, 50+ providers, 19 channels

## Features

- Binary execution adapter for NullClaw
- Provider endpoint configuration and health probing
- Sandbox mode selection (landlock, firejail, bubblewrap, docker)
- **Edge deployment** via SSH — push the tiny binary to remote devices
- Multi-architecture support (x86_64, aarch64, armv7)

## Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `binaryPath` | string | `nullclaw` | Path to NullClaw binary |
| `configPath` | string | — | Path to NullClaw config file |
| `provider` | string | — | LLM provider endpoint URL |
| `providerType` | string | — | Provider type (openai, anthropic, local) |
| `sandboxMode` | string | `landlock` | Sandbox mode |
| `timeoutSec` | number | `60` | Execution timeout |
| `targetHost` | string | — | SSH target for edge deployment |
| `targetArch` | string | `aarch64` | Target architecture |

## Edge Deployment

NullClaw's 678KB binary makes remote deployment trivial:

```bash
# The adapter can SCP the binary directly to edge devices
paperclip agent deploy --adapter nullclaw --target pi@192.168.1.100
```

## Big Four

This adapter is part of the **Sovereign Agentic OS** federation — four agent runtimes unified under one interface:

| Agent | Adapter | Strength |
|-------|---------|----------|
| Agents Zero | `@sovereign-clip/adapter-agents-zero` | Self-evolving tools, computer-use |
| OpenClaw | `@sovereign-clip/adapter-openclaw-gateway` | Multi-channel, skills, heartbeat |
| Hermes | `@sovereign-clip/adapter-hermes-agent` | Persistent memory, multi-provider |
| NullClaw | `@sovereign-clip/adapter-nullclaw` | Edge deployment, 678KB binary |
