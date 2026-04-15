/**
 * @claude-flow/gemini - GeminiInitializer
 *
 * Main initialization class for setting up Gemini CLI projects
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  GeminiInitOptions,
  GeminiInitResult,
  GeminiMdTemplate,
  BuiltInSkill,
} from './types.js';
import { generateGeminiMd } from './generators/gemini-md.js';
import { generateBuiltInSkill } from './generators/skill-md.js';
import { generateGeminiConfig } from './generators/gemini-config.js';
import { DEFAULT_SKILLS_BY_TEMPLATE, GITIGNORE_ENTRIES, ALL_AVAILABLE_SKILLS } from './templates/index.js';

/**
 * Bundled skills source directory (relative to package)
 */
const BUNDLED_SKILLS_DIR = '../../../../.agents/skills';

/**
 * Main initializer for Gemini CLI projects
 */
export class GeminiInitializer {
  private projectPath: string = '';
  private template: GeminiMdTemplate = 'default';
  private skills: string[] = [];
  private force: boolean = false;
  private dual: boolean = false;
  private bundledSkillsPath: string = '';

  /**
   * Initialize a new Gemini CLI project
   */
  async initialize(options: GeminiInitOptions): Promise<GeminiInitResult> {
    this.projectPath = path.resolve(options.projectPath);
    this.template = options.template ?? 'default';
    this.skills = options.skills ?? DEFAULT_SKILLS_BY_TEMPLATE[this.template];
    this.force = options.force ?? false;
    this.dual = options.dual ?? false;

    // Resolve bundled skills path (relative to this file's location)
    this.bundledSkillsPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      BUNDLED_SKILLS_DIR
    );

    const filesCreated: string[] = [];
    const skillsGenerated: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Validate project path
      await this.validateProjectPath();

      // Check if already initialized
      const alreadyInitialized = await this.isAlreadyInitialized();
      if (alreadyInitialized && !this.force) {
        return {
          success: false,
          filesCreated,
          skillsGenerated,
          warnings: ['Project already initialized. Use --force to overwrite.'],
          errors: ['Project already initialized'],
        };
      }

      if (alreadyInitialized && this.force) {
        warnings.push('Overwriting existing configuration files');
      }

      // Create directory structure
      await this.createDirectoryStructure();

      // Generate GEMINI.md
      const geminiMd = generateGeminiMd({
        projectName: path.basename(this.projectPath),
        description: 'Project configured with Claude Flow for Gemini CLI',
        template: this.template,
        skills: this.skills,
      });
      const geminiMdPath = path.join(this.projectPath, 'GEMINI.md');

      if (await this.shouldWriteFile(geminiMdPath)) {
        await fs.writeFile(geminiMdPath, geminiMd, 'utf-8');
        filesCreated.push('GEMINI.md');
      } else {
        warnings.push('GEMINI.md already exists - skipped');
      }

      // Generate .gemini/settings.json
      const settingsJson = generateGeminiConfig({
        model: 'gemini-2.5-flash',
        sandboxPermission: 'write',
        toolUseMode: 'auto',
        mcpServers: [
          {
            name: 'claude-flow',
            command: 'npx',
            args: ['claude-flow@alpha', 'mcp', 'start'],
            enabled: true,
          },
        ],
        skills: this.skills.map((s) => ({ path: `.gemini/skills/${s}`, enabled: true })),
      });
      const settingsPath = path.join(this.projectPath, '.gemini', 'settings.json');

      if (await this.shouldWriteFile(settingsPath)) {
        await fs.writeFile(settingsPath, settingsJson, 'utf-8');
        filesCreated.push('.gemini/settings.json');
      } else {
        warnings.push('.gemini/settings.json already exists - skipped');
      }

      // Copy bundled skills
      const copiedSkills = await this.copyBundledSkills();
      skillsGenerated.push(...copiedSkills);

      // Generate any missing skill files
      for (const skillName of this.skills) {
        if (!copiedSkills.includes(skillName)) {
          const generated = await this.generateSkillFile(skillName);
          if (generated) {
            skillsGenerated.push(skillName);
          }
        }
      }

      // Handle dual mode - generate CLAUDE.md for Claude Code users
      if (this.dual) {
        const claudeMdPath = path.join(this.projectPath, 'CLAUDE.md');
        if (await this.shouldWriteFile(claudeMdPath)) {
          const claudeMd = [
            `# ${path.basename(this.projectPath)}`,
            '',
            'This project is also configured for Gemini CLI. See GEMINI.md for details.',
            '',
            '## Claude Flow Integration',
            '',
            'This project uses Claude Flow V3 for multi-agent coordination.',
            'MCP tools are available for memory management and swarm orchestration.',
            '',
          ].join('\n');
          await fs.writeFile(claudeMdPath, claudeMd, 'utf-8');
          filesCreated.push('CLAUDE.md');
        }
      }

      // Update .gitignore
      await this.updateGitignore();

      return {
        success: true,
        filesCreated,
        skillsGenerated,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        filesCreated,
        skillsGenerated,
        warnings: warnings.length > 0 ? warnings : undefined,
        errors,
      };
    }
  }

  /**
   * Validate the project path exists and is writable
   */
  private async validateProjectPath(): Promise<void> {
    try {
      const stats = await fs.stat(this.projectPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${this.projectPath}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.ensureDir(this.projectPath);
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if project is already initialized
   */
  private async isAlreadyInitialized(): Promise<boolean> {
    const geminiMdExists = await fs.pathExists(path.join(this.projectPath, 'GEMINI.md'));
    const settingsExists = await fs.pathExists(path.join(this.projectPath, '.gemini', 'settings.json'));
    return geminiMdExists || settingsExists;
  }

  /**
   * Create the directory structure for a Gemini CLI project
   */
  private async createDirectoryStructure(): Promise<void> {
    const dirs = [
      '.gemini',
      '.gemini/skills',
      '.gemini/local',
      '.claude-flow',
      '.claude-flow/memory',
      '.claude-flow/hooks',
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.projectPath, dir));
    }
  }

  /**
   * Copy bundled skills to the project
   */
  private async copyBundledSkills(): Promise<string[]> {
    const copied: string[] = [];

    try {
      const skillsExist = await fs.pathExists(this.bundledSkillsPath);
      if (!skillsExist) {
        return copied;
      }

      const entries = await fs.readdir(this.bundledSkillsPath);

      for (const entry of entries) {
        if (this.skills.includes(entry)) {
          const sourcePath = path.join(this.bundledSkillsPath, entry);
          const targetPath = path.join(this.projectPath, '.gemini', 'skills', entry);

          if (await this.shouldWriteFile(targetPath)) {
            const stat = await fs.stat(sourcePath);
            if (stat.isDirectory()) {
              await fs.copy(sourcePath, targetPath, { overwrite: this.force });
            } else {
              await fs.copyFile(sourcePath, targetPath);
            }
            copied.push(entry);
          }
        }
      }
    } catch {
      // Bundled skills not available, will generate instead
    }

    return copied;
  }

  /**
   * Generate a skill file if it doesn't exist
   */
  private async generateSkillFile(skillName: string): Promise<boolean> {
    const skillDir = path.join(this.projectPath, '.gemini', 'skills', skillName);
    const skillMdPath = path.join(skillDir, 'SKILL.md');

    if (!(await this.shouldWriteFile(skillMdPath))) {
      return false;
    }

    await fs.ensureDir(skillDir);

    const builtInSkills: Record<string, { description: string; category: string }> = {
      'swarm-orchestration': { description: 'Multi-agent task coordination', category: 'coordination' },
      'memory-management': { description: 'Pattern storage and retrieval', category: 'memory' },
      'sparc-methodology': { description: 'Structured development workflow', category: 'workflow' },
      'security-audit': { description: 'Security scanning and CVE detection', category: 'security' },
      'performance-analysis': { description: 'Profiling and optimization', category: 'performance' },
      'github-automation': { description: 'CI/CD and PR management', category: 'automation' },
    };

    const skillInfo = builtInSkills[skillName];
    if (skillInfo) {
      const content = generateBuiltInSkill(skillName, skillInfo.description, skillInfo.category);
      await fs.writeFile(skillMdPath, content, 'utf-8');
      return true;
    }

    return false;
  }

  /**
   * Check if a file should be written (doesn't exist or force mode)
   */
  private async shouldWriteFile(filePath: string): Promise<boolean> {
    if (this.force) return true;
    return !(await fs.pathExists(filePath));
  }

  /**
   * Update .gitignore with Gemini CLI entries
   */
  private async updateGitignore(): Promise<void> {
    const gitignorePath = path.join(this.projectPath, '.gitignore');

    let content = '';
    try {
      content = await fs.readFile(gitignorePath, 'utf-8');
    } catch {
      // No .gitignore exists
    }

    const entriesToAdd = GITIGNORE_ENTRIES.filter(
      (entry) => entry.trim() && !entry.startsWith('#') && !content.includes(entry)
    );

    if (entriesToAdd.length > 0) {
      const newEntries = '\n' + GITIGNORE_ENTRIES.join('\n') + '\n';
      await fs.appendFile(gitignorePath, newEntries);
    }
  }
}

/**
 * Convenience function for initializing a Gemini CLI project
 */
export async function initializeGeminiProject(options: GeminiInitOptions): Promise<GeminiInitResult> {
  const initializer = new GeminiInitializer();
  return initializer.initialize(options);
}
