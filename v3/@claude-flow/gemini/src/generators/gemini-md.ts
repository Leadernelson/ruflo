/**
 * @claude-flow/gemini - GEMINI.md Generator
 *
 * Generates the GEMINI.md project instruction file for the Gemini CLI
 */

import type { GeminiMdOptions, GeminiMdTemplate } from '../types.js';

/**
 * Generate GEMINI.md content for a project
 */
export function generateGeminiMd(options: GeminiMdOptions): string {
  const {
    projectName,
    description,
    techStack,
    buildCommand,
    testCommand,
    devCommand,
    template = 'default',
    skills = [],
    customSections = {},
  } = options;

  const sections: string[] = [];

  // Header
  sections.push(`# ${projectName}`);
  sections.push('');
  if (description) {
    sections.push(description);
    sections.push('');
  }

  // Setup section
  sections.push('## Setup');
  sections.push('');
  if (techStack) {
    sections.push(`**Tech Stack:** ${techStack}`);
    sections.push('');
  }
  if (buildCommand) {
    sections.push(`**Build:** \`${buildCommand}\``);
  }
  if (testCommand) {
    sections.push(`**Test:** \`${testCommand}\``);
  }
  if (devCommand) {
    sections.push(`**Dev:** \`${devCommand}\``);
  }
  if (buildCommand || testCommand || devCommand) {
    sections.push('');
  }

  // Code Standards section
  sections.push('## Code Standards');
  sections.push('');
  sections.push('- Follow existing code style and conventions');
  sections.push('- Write tests for all new features');
  sections.push('- Document public APIs');
  sections.push('- Use TypeScript strict mode when applicable');
  sections.push('');

  // Security section
  sections.push('## Security');
  sections.push('');
  sections.push('- Never commit secrets or API keys');
  sections.push('- Validate all inputs at system boundaries');
  sections.push('- Use parameterized queries for database operations');
  sections.push('- Follow OWASP security best practices');
  sections.push('');

  // Skills section (if any)
  if (skills.length > 0) {
    sections.push('## Skills');
    sections.push('');
    for (const skill of skills) {
      sections.push(`- $${skill}`);
    }
    sections.push('');
  }

  // Template-specific sections
  const templateSections = getTemplateSections(template);
  if (templateSections) {
    sections.push(templateSections);
  }

  // Custom sections
  for (const [title, content] of Object.entries(customSections)) {
    sections.push(`## ${title}`);
    sections.push('');
    sections.push(content);
    sections.push('');
  }

  // Claude Flow integration section
  sections.push('## Claude Flow Integration');
  sections.push('');
  sections.push('This project is configured with Claude Flow V3 for multi-agent coordination.');
  sections.push('');
  sections.push('### MCP Tools Available');
  sections.push('');
  sections.push('| Tool | Purpose |');
  sections.push('|------|---------|');
  sections.push('| `memory_search` | Search stored patterns |');
  sections.push('| `memory_store` | Save successful patterns |');
  sections.push('| `swarm_init` | Initialize agent swarm |');
  sections.push('| `agent_spawn` | Spawn specialized agents |');
  sections.push('');

  return sections.join('\n');
}

/**
 * Get template-specific sections
 */
function getTemplateSections(template: GeminiMdTemplate): string | null {
  switch (template) {
    case 'minimal':
      return null;

    case 'default':
      return [
        '## Workflow',
        '',
        '1. Search memory for relevant patterns before starting',
        '2. Write code following project conventions',
        '3. Test all changes thoroughly',
        '4. Store successful patterns in memory',
        '',
      ].join('\n');

    case 'full':
    case 'enterprise':
      return [
        '## Workflow',
        '',
        '1. Search memory for relevant patterns before starting',
        '2. Coordinate via swarm for complex tasks',
        '3. Write code following project conventions',
        '4. Test all changes thoroughly',
        '5. Review code for security and performance',
        '6. Store successful patterns in memory',
        '',
        '## Architecture',
        '',
        '- Follow Domain-Driven Design with bounded contexts',
        '- Keep files under 500 lines',
        '- Use typed interfaces for all public APIs',
        '- Use event sourcing for state changes',
        '',
        '## Performance',
        '',
        '- Profile before optimizing',
        '- Benchmark critical paths',
        '- Monitor memory usage in long-running processes',
        '',
      ].join('\n');
  }
}
