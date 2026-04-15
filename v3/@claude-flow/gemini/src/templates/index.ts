/**
 * @claude-flow/gemini - Templates
 *
 * Built-in templates and skill definitions for Gemini CLI
 */

import type { GeminiMdTemplate, BuiltInSkill } from '../types.js';

/**
 * Built-in skill definitions
 */
export const BUILT_IN_SKILLS: Record<BuiltInSkill, { name: string; description: string; category: string }> = {
  'swarm-orchestration': {
    name: 'Swarm Orchestration',
    description: 'Multi-agent task coordination',
    category: 'coordination',
  },
  'memory-management': {
    name: 'Memory Management',
    description: 'Pattern storage and retrieval',
    category: 'memory',
  },
  'sparc-methodology': {
    name: 'SPARC Methodology',
    description: 'Structured development workflow',
    category: 'workflow',
  },
  'security-audit': {
    name: 'Security Audit',
    description: 'Security scanning and CVE detection',
    category: 'security',
  },
  'performance-analysis': {
    name: 'Performance Analysis',
    description: 'Profiling and optimization',
    category: 'performance',
  },
  'github-automation': {
    name: 'GitHub Automation',
    description: 'CI/CD and PR management',
    category: 'automation',
  },
};

/**
 * Template descriptions
 */
export const TEMPLATES: Record<GeminiMdTemplate, { name: string; description: string; skillCount: number }> = {
  minimal: {
    name: 'Minimal',
    description: 'Basic setup with essential skills only',
    skillCount: 2,
  },
  default: {
    name: 'Default',
    description: 'Standard setup with common skills',
    skillCount: 4,
  },
  full: {
    name: 'Full',
    description: 'Complete setup with all 137+ skills',
    skillCount: 137,
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Full setup with all skills + governance',
    skillCount: 137,
  },
};

/**
 * Get template information
 */
export function getTemplate(name: GeminiMdTemplate): typeof TEMPLATES[GeminiMdTemplate] {
  return TEMPLATES[name];
}

/**
 * List all available templates
 */
export function listTemplates(): Array<{ key: string; name: string; description: string; skillCount: number }> {
  return Object.entries(TEMPLATES).map(([key, value]) => ({
    key,
    ...value,
  }));
}

/**
 * Default skills by template
 */
export const DEFAULT_SKILLS_BY_TEMPLATE: Record<GeminiMdTemplate, string[]> = {
  minimal: ['swarm-orchestration', 'memory-management'],
  default: ['swarm-orchestration', 'memory-management', 'sparc-methodology', 'security-audit'],
  full: [
    'swarm-orchestration',
    'memory-management',
    'sparc-methodology',
    'security-audit',
    'performance-analysis',
    'github-automation',
  ],
  enterprise: [
    'swarm-orchestration',
    'memory-management',
    'sparc-methodology',
    'security-audit',
    'performance-analysis',
    'github-automation',
  ],
};

/**
 * All available skills (used for full/enterprise templates)
 */
export const ALL_AVAILABLE_SKILLS: string[] = [
  'swarm-orchestration',
  'memory-management',
  'sparc-methodology',
  'security-audit',
  'performance-analysis',
  'github-automation',
];

/**
 * Directory structure for Gemini CLI projects
 */
export const DIRECTORY_STRUCTURE = {
  root: ['.gemini/', '.claude-flow/'],
  gemini: ['settings.json', 'skills/'],
  claudeFlow: ['config.yaml', 'memory/', 'hooks/'],
} as const;

/**
 * Platform mapping between Claude Code and Gemini CLI
 */
export const PLATFORM_MAPPING = {
  instructionFile: { claudeCode: 'CLAUDE.md', geminiCli: 'GEMINI.md' },
  configDir: { claudeCode: '.claude/', geminiCli: '.gemini/' },
  configFile: { claudeCode: '.claude/settings.json', geminiCli: '.gemini/settings.json' },
  skillSyntax: { claudeCode: '/skill-name', geminiCli: '$skill-name' },
} as const;

/**
 * Gitignore entries for Gemini CLI projects
 */
export const GITIGNORE_ENTRIES = [
  '# Gemini CLI local',
  '.gemini/local/',
  '.gemini/*.local.json',
  '',
  '# Claude Flow runtime',
  '.claude-flow/memory/*.db',
  '.claude-flow/hooks/logs/',
  '',
];

/**
 * Template for GEMINI.md override (local)
 */
export const GEMINI_OVERRIDE_TEMPLATE = `# Local GEMINI.md Overrides
# This file is gitignored and can contain local customizations

## Local Settings
- Override any project defaults here
- Add personal workflow preferences
`;
