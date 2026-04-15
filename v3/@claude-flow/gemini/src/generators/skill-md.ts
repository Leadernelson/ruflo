/**
 * @claude-flow/gemini - SKILL.md Generator
 *
 * Generates skill definition files for the Gemini CLI
 */

import type { SkillMdOptions } from '../types.js';

/**
 * Generate SKILL.md content
 */
export function generateSkillMd(options: SkillMdOptions): string {
  const { name, description, triggers, skipWhen, scripts, references, commands } = options;

  const sections: string[] = [];

  // YAML frontmatter
  sections.push('---');
  sections.push(`name: ${name}`);
  sections.push(`description: ${description}`);

  if (triggers && triggers.length > 0) {
    sections.push('triggers:');
    for (const trigger of triggers) {
      sections.push(`  - ${trigger}`);
    }
  }

  if (skipWhen && skipWhen.length > 0) {
    sections.push('skip_when:');
    for (const skip of skipWhen) {
      sections.push(`  - ${skip}`);
    }
  }

  sections.push('---');
  sections.push('');

  // Title
  sections.push(`# ${name}`);
  sections.push('');
  sections.push(description);
  sections.push('');

  // Scripts section
  if (scripts && scripts.length > 0) {
    sections.push('## Scripts');
    sections.push('');
    for (const script of scripts) {
      sections.push(`### ${script.name}`);
      sections.push('');
      sections.push(script.description);
      sections.push('');
      sections.push(`**Path:** \`${script.path}\``);
      sections.push('');
    }
  }

  // References section
  if (references && references.length > 0) {
    sections.push('## References');
    sections.push('');
    for (const ref of references) {
      sections.push(`- [${ref.name}](${ref.path})${ref.description ? ` - ${ref.description}` : ''}`);
    }
    sections.push('');
  }

  // Commands section
  if (commands && commands.length > 0) {
    sections.push('## Commands');
    sections.push('');
    for (const cmd of commands) {
      sections.push(`### \`${cmd.command}\``);
      sections.push('');
      sections.push(cmd.description);
      if (cmd.example) {
        sections.push('');
        sections.push('```bash');
        sections.push(cmd.example);
        sections.push('```');
      }
      sections.push('');
    }
  }

  return sections.join('\n');
}

/**
 * Generate a built-in skill SKILL.md
 */
export function generateBuiltInSkill(
  skillName: string,
  description: string,
  category: string
): string {
  return generateSkillMd({
    name: skillName,
    description,
    triggers: [`$${skillName}`, `When ${category} tasks are needed`],
    skipWhen: ['Not applicable to current context'],
  });
}
