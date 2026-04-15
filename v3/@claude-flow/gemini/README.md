# @claude-flow/gemini

> Google Gemini CLI integration for Claude Flow — Multi-agent coordination for the Gemini CLI platform

Transform Google Gemini CLI into a self-improving AI development system with Claude Flow V3 orchestration, shared memory, and multi-agent swarm coordination.

## Key Concept: Execution Model

```
┌──────────────────────────────────────────────────────────────┐
│  CLAUDE-FLOW = ORCHESTRATOR (tracks state, stores memory)    │
│  GEMINI CLI  = EXECUTOR (writes code, runs commands)         │
└──────────────────────────────────────────────────────────────┘
```

## Quick Start

### Installation

```bash
npm install @claude-flow/gemini
```

### Initialize a Project

```bash
# Default initialization
npx claude-flow-gemini init

# Minimal setup
npx claude-flow-gemini init --template minimal

# Full setup with all 137+ skills
npx claude-flow-gemini init --template full

# Dual mode (Gemini CLI + Claude Code)
npx claude-flow-gemini init --dual
```

### Via Claude Flow CLI

```bash
# Initialize for Gemini CLI
npx claude-flow init --gemini

# Initialize for both Gemini CLI and Claude Code
npx claude-flow init --gemini --dual

# Full setup with all skills
npx claude-flow init --gemini --full
```

## What Gets Created

```
your-project/
├── GEMINI.md              # Main project instructions for Gemini CLI
├── .gemini/
│   ├── settings.json      # Gemini CLI configuration
│   ├── skills/            # Skill definitions
│   │   ├── swarm-orchestration/
│   │   ├── memory-management/
│   │   ├── sparc-methodology/
│   │   └── security-audit/
│   └── local/             # Local overrides (gitignored)
├── .claude-flow/          # Claude Flow runtime data
│   ├── memory/            # Vector memory database
│   └── hooks/             # Hook scripts
└── CLAUDE.md              # (dual mode) Claude Code compatibility
```

## Self-Learning Loop

```
┌───────────────────────────────────────────┐
│         GEMINI CLI WORKFLOW               │
│                                           │
│  1. SEARCH  → memory_search("keywords")   │
│  2. COORDINATE → swarm_init(topology)     │
│  3. EXECUTE → Gemini writes code          │
│  4. STORE  → memory_store("pattern")      │
│                                           │
└───────────────────────────────────────────┘
```

## CLI Commands

### `claude-flow-gemini init`

Initialize a new Gemini CLI project.

| Flag | Description | Default |
|------|-------------|---------|
| `-t, --template` | Template (minimal, default, full, enterprise) | `default` |
| `-s, --skills` | Comma-separated skills list | template default |
| `-f, --force` | Overwrite existing files | `false` |
| `--dual` | Generate Claude Code compatibility | `false` |
| `-p, --path` | Project path | current directory |
| `-q, --quiet` | Suppress verbose output | `false` |

### `claude-flow-gemini generate-skill`

Generate a new skill SKILL.md file.

```bash
claude-flow-gemini generate-skill --name my-skill --description "My custom skill"
```

### `claude-flow-gemini validate`

Validate GEMINI.md, SKILL.md, or settings.json files.

```bash
claude-flow-gemini validate
claude-flow-gemini validate --file GEMINI.md
claude-flow-gemini validate --strict
```

### `claude-flow-gemini migrate`

Migrate from Claude Code (CLAUDE.md) to Gemini CLI (GEMINI.md).

```bash
claude-flow-gemini migrate
claude-flow-gemini migrate --from CLAUDE.md --analyze-only
claude-flow-gemini migrate --generate-skills
```

### `claude-flow-gemini doctor`

Health check for Gemini CLI integration.

```bash
claude-flow-gemini doctor
```

### `claude-flow-gemini dual`

Run collaborative dual-mode swarms (Claude Code + Gemini CLI).

```bash
claude-flow-gemini dual run --template feature --task "Add authentication"
claude-flow-gemini dual run --template security --task "./src"
claude-flow-gemini dual templates
claude-flow-gemini dual status
```

## Dual-Mode Collaboration

Run Claude Code and Gemini CLI workers in parallel with shared memory:

```
Level 0: [🔵 Architect]              # No dependencies
Level 1: [🟡 Coder, 🔵 Tester]       # Depends on Architect
Level 2: [🔵 Reviewer]               # Depends on Coder + Tester
Level 3: [🟡 Optimizer]              # Depends on Reviewer
```

### Platform Strengths

| Task Type | Platform | Reason |
|-----------|----------|--------|
| Architecture & Design | 🔵 Claude Code | Strong reasoning |
| Implementation | 🟡 Gemini CLI | Fast code generation |
| Security Review | 🔵 Claude Code | Careful analysis |
| Performance Optimization | 🟡 Gemini CLI | Code-level optimization |
| Testing Strategy | 🔵 Claude Code | Coverage analysis |
| Refactoring | 🟡 Gemini CLI | Bulk transformations |

### Collaboration Templates

| Template | Workers | Pipeline |
|----------|---------|----------|
| `feature` | 🔵 Architect → 🟡 Coder → 🔵 Tester → 🟡 Reviewer | Full feature dev |
| `security` | 🟡 Scanner → 🔵 Analyzer → 🟡 Fixer | Security audit |
| `refactor` | 🔵 Analyzer → 🔵 Planner → 🟡 Refactorer → 🔵 Validator | Refactoring |

## MCP Integration

The Gemini CLI connects to Claude Flow via MCP (Model Context Protocol):

```json
{
  "mcp_servers": {
    "claude-flow": {
      "command": "npx",
      "args": ["claude-flow@alpha", "mcp", "start"],
      "enabled": true
    }
  }
}
```

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `memory_search` | Semantic search for stored patterns |
| `memory_store` | Store successful patterns |
| `memory_retrieve` | Retrieve by exact key |
| `swarm_init` | Initialize agent swarm |
| `agent_spawn` | Spawn specialized agents |
| `neural_train` | Train on patterns |

## Templates

### Minimal (2 skills)
- `swarm-orchestration` — Multi-agent coordination
- `memory-management` — Pattern storage and retrieval

### Default (4 skills)
- `swarm-orchestration` — Multi-agent coordination
- `memory-management` — Pattern storage and retrieval
- `sparc-methodology` — Structured development workflow
- `security-audit` — Security scanning

### Full (137+ skills)
All built-in skills including:
- V3 Core, AgentDB & Memory, Swarm & Coordination
- GitHub Integration, SPARC Methodology, Flow Nexus
- Development, Monitoring & Analysis, Training
- Automation & Optimization, Hooks, Dual-Mode

## Configuration

### .gemini/settings.json

```json
{
  "model": "gemini-2.5-flash",
  "sandbox_permission": "write",
  "tool_use_mode": "auto",
  "mcp_servers": {
    "claude-flow": {
      "command": "npx",
      "args": ["claude-flow@alpha", "mcp", "start"],
      "enabled": true
    }
  },
  "skills": [
    { "path": ".gemini/skills/swarm-orchestration", "enabled": true },
    { "path": ".gemini/skills/memory-management", "enabled": true }
  ]
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Google API key for Gemini models |
| `GEMINI_MODEL` | Default Gemini model |
| `GEMINI_SANDBOX_PERMISSION` | Sandbox permission level |
| `GEMINI_LOG_LEVEL` | Log level (debug, info, warn, error) |

## Programmatic API

```typescript
import {
  GeminiInitializer,
  DualModeOrchestrator,
  CollaborationTemplates,
  generateGeminiMd,
  validateGeminiMd,
} from '@claude-flow/gemini';

// Initialize a project
const initializer = new GeminiInitializer();
const result = await initializer.initialize({
  projectPath: './my-project',
  template: 'default',
  dual: true,
});

// Run dual-mode collaboration
const orchestrator = new DualModeOrchestrator({
  projectPath: './my-project',
  sharedNamespace: 'my-feature',
});

const workers = CollaborationTemplates.featureDevelopment('Add OAuth login');
const results = await orchestrator.runCollaboration(workers, 'Implement OAuth');
```

## Feature Mapping: Claude Code → Gemini CLI

| Claude Code | Gemini CLI | Status |
|-------------|-----------|--------|
| `CLAUDE.md` | `GEMINI.md` | ✅ Mapped |
| `.claude/settings.json` | `.gemini/settings.json` | ✅ Mapped |
| `/skill-name` | `$skill-name` | ✅ Mapped |
| `.claude/skills/` | `.gemini/skills/` | ✅ Mapped |
| `allowedTools` | `sandbox_permission` | ⚠️ Partial |
| `mcpServers` | `mcp_servers` | ✅ Mapped |
| `claude -p` | `gemini --non-interactive` | ⚠️ Partial |

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues

## License

MIT
