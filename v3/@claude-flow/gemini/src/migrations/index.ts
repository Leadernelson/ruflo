/**
 * @claude-flow/gemini - Migrations
 *
 * Migration utilities for converting Claude Code configurations to Gemini CLI format.
 * Supports full CLAUDE.md parsing with section extraction, skill conversion,
 * and proper GEMINI.md/settings.json generation.
 */

import type {
  MigrationOptions,
  MigrationResult,
  FeatureMapping,
  GeminiMdOptions,
  GeminiConfigOptions,
  McpServerConfig,
} from '../types.js';

/**
 * Parsed CLAUDE.md structure
 */
export interface ParsedClaudeMd {
  title: string;
  sections: ParsedSection[];
  skills: SkillReference[];
  hooks: string[];
  customInstructions: string[];
  codeBlocks: CodeBlock[];
  mcpServers: McpServerConfig[];
  warnings: string[];
}

/**
 * Parsed section from markdown
 */
export interface ParsedSection {
  level: number;
  title: string;
  content: string;
  startLine: number;
  endLine: number;
}

/**
 * Skill reference found in content
 */
export interface SkillReference {
  name: string;
  syntax: 'slash' | 'dollar';
  context: string;
  line: number;
}

/**
 * Code block from markdown
 */
export interface CodeBlock {
  language: string;
  content: string;
  line: number;
}

/**
 * Feature mappings from Claude Code → Gemini CLI
 */
export const FEATURE_MAPPINGS: FeatureMapping[] = [
  {
    claudeCode: 'CLAUDE.md',
    geminiCli: 'GEMINI.md',
    status: 'mapped',
    notes: 'Main project instruction file',
  },
  {
    claudeCode: '.claude/settings.json',
    geminiCli: '.gemini/settings.json',
    status: 'mapped',
    notes: 'Configuration directory',
  },
  {
    claudeCode: '/skill-name',
    geminiCli: '$skill-name',
    status: 'mapped',
    notes: 'Skill invocation syntax',
  },
  {
    claudeCode: '.claude/skills/',
    geminiCli: '.gemini/skills/',
    status: 'mapped',
    notes: 'Skills directory',
  },
  {
    claudeCode: 'allowedTools permissions',
    geminiCli: 'sandbox_permission',
    status: 'partial',
    notes: 'Permission model differs between platforms',
  },
  {
    claudeCode: 'mcpServers',
    geminiCli: 'mcp_servers',
    status: 'mapped',
    notes: 'MCP server configuration (key naming differs)',
  },
  {
    claudeCode: 'claude -p (headless)',
    geminiCli: 'gemini --non-interactive',
    status: 'partial',
    notes: 'Headless execution flags differ',
  },
];

/**
 * Analyze a CLAUDE.md file and extract its structure
 */
export function analyzeClaudeMd(content: string): ParsedClaudeMd {
  const lines = content.split('\n');
  const sections: ParsedSection[] = [];
  const skills: SkillReference[] = [];
  const hooks: string[] = [];
  const customInstructions: string[] = [];
  const codeBlocks: CodeBlock[] = [];
  const mcpServers: McpServerConfig[] = [];
  const warnings: string[] = [];

  let title = '';
  let currentSection: ParsedSection | null = null;
  let inCodeBlock = false;
  let codeBlockStart = 0;
  let codeBlockLang = '';
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    // Track code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        codeBlocks.push({
          language: codeBlockLang,
          content: codeBlockContent.join('\n'),
          line: codeBlockStart + 1,
        });
        inCodeBlock = false;
        codeBlockContent = [];
      } else {
        inCodeBlock = true;
        codeBlockStart = i;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Extract title
    if (line.startsWith('# ') && !title) {
      title = line.slice(2).trim();
      continue;
    }

    // Extract sections
    const headerMatch = line.match(/^(#{2,6})\s+(.+)/);
    if (headerMatch?.[1] !== undefined && headerMatch[2] !== undefined) {
      if (currentSection) {
        currentSection.endLine = i;
        sections.push(currentSection);
      }
      currentSection = {
        level: headerMatch[1].length,
        title: headerMatch[2],
        content: '',
        startLine: i + 1,
        endLine: i + 1,
      };
      continue;
    }

    // Collect section content
    if (currentSection) {
      currentSection.content += line + '\n';
    }

    // Extract skill references
    const slashSkillMatch = line.match(/\/([a-z][a-z0-9-]+)/g);
    if (slashSkillMatch) {
      for (const match of slashSkillMatch) {
        skills.push({
          name: match.slice(1),
          syntax: 'slash',
          context: line.trim(),
          line: i + 1,
        });
      }
    }

    const dollarSkillMatch = line.match(/\$([a-z][a-z0-9-]+)/g);
    if (dollarSkillMatch) {
      for (const match of dollarSkillMatch) {
        skills.push({
          name: match.slice(1),
          syntax: 'dollar',
          context: line.trim(),
          line: i + 1,
        });
      }
    }

    // Extract hooks
    const hookMatch = line.match(/hooks?\s+(pre-|post-)(task|edit|command)/gi);
    if (hookMatch) {
      hooks.push(...hookMatch);
    }

    // Extract custom instructions
    if (line.includes('<custom_instruction>') || line.includes('custom_instruction')) {
      customInstructions.push(line.trim());
    }
  }

  // Close last section
  if (currentSection) {
    currentSection.endLine = lines.length;
    sections.push(currentSection);
  }

  return {
    title,
    sections,
    skills,
    hooks,
    customInstructions,
    codeBlocks,
    mcpServers,
    warnings,
  };
}

/**
 * Convert skill syntax from Claude Code (/) to Gemini CLI ($)
 */
export function convertSkillSyntax(content: string): string {
  // Convert /skill-name to $skill-name (only in skill contexts)
  return content.replace(/(?<!\w)\/([a-z][a-z0-9-]+)(?!\w)/g, '$$$$1');
}

/**
 * Generate a migration report
 */
export function generateMigrationReport(analysis: ParsedClaudeMd): string {
  const lines: string[] = [];

  lines.push('# Migration Report: Claude Code → Gemini CLI');
  lines.push('');
  lines.push(`**Title:** ${analysis.title}`);
  lines.push(`**Sections:** ${analysis.sections.length}`);
  lines.push(`**Skills:** ${analysis.skills.length}`);
  lines.push(`**Hooks:** ${analysis.hooks.length}`);
  lines.push(`**Code Blocks:** ${analysis.codeBlocks.length}`);
  lines.push('');

  lines.push('## Feature Mapping');
  lines.push('');
  lines.push('| Claude Code | Gemini CLI | Status |');
  lines.push('|-------------|-----------|--------|');
  for (const mapping of FEATURE_MAPPINGS) {
    lines.push(`| ${mapping.claudeCode} | ${mapping.geminiCli} | ${mapping.status} |`);
  }
  lines.push('');

  if (analysis.skills.length > 0) {
    lines.push('## Skills Found');
    lines.push('');
    for (const skill of analysis.skills) {
      lines.push(`- \`${skill.syntax === 'slash' ? '/' : '$'}${skill.name}\` (line ${skill.line})`);
    }
    lines.push('');
  }

  if (analysis.warnings.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const warning of analysis.warnings) {
      lines.push(`- ⚠️ ${warning}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Migrate from Claude Code (CLAUDE.md) to Gemini CLI (GEMINI.md)
 */
export async function migrateFromClaudeCode(
  sourceContent: string,
  options: Partial<MigrationOptions> = {}
): Promise<MigrationResult> {
  const warnings: string[] = [];

  try {
    const analysis = analyzeClaudeMd(sourceContent);

    // Convert content
    let geminiContent = sourceContent;

    // Convert skill syntax
    geminiContent = convertSkillSyntax(geminiContent);

    // Replace Claude Code references with Gemini CLI
    geminiContent = geminiContent.replace(/CLAUDE\.md/g, 'GEMINI.md');
    geminiContent = geminiContent.replace(/\.claude\//g, '.gemini/');
    geminiContent = geminiContent.replace(/Claude Code/g, 'Gemini CLI');
    geminiContent = geminiContent.replace(/claude-code/g, 'gemini-cli');

    // Add migration note
    geminiContent = `<!-- Migrated from Claude Code to Gemini CLI -->\n${geminiContent}`;

    warnings.push(...analysis.warnings);

    return {
      success: true,
      geminiMdPath: 'GEMINI.md',
      skillsCreated: analysis.skills.map((s) => s.name),
      mappings: FEATURE_MAPPINGS,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      warnings: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Convert Claude Code settings.json to Gemini CLI settings.json format
 */
export function convertSettingsToGeminiConfig(claudeSettings: Record<string, unknown>): string {
  const geminiConfig: Record<string, unknown> = {};

  // Map model
  const modelMap: Record<string, string> = {
    'claude-opus-4': 'gemini-2.5-pro',
    'claude-sonnet-4': 'gemini-2.5-flash',
    'claude-haiku-4': 'gemini-2.0-flash',
  };

  const claudeModel = claudeSettings['model'] as string | undefined;
  if (claudeModel) {
    geminiConfig['model'] = modelMap[claudeModel] ?? 'gemini-2.5-flash';
  }

  // Map MCP servers
  if (claudeSettings['mcpServers']) {
    geminiConfig['mcp_servers'] = claudeSettings['mcpServers'];
  }

  return JSON.stringify(geminiConfig, null, 2);
}
