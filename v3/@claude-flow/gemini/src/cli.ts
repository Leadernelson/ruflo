#!/usr/bin/env node
/**
 * @claude-flow/gemini - CLI
 *
 * Command-line interface for Gemini CLI integration
 * Google Gemini platform adapter for Claude Flow
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { GeminiInitializer } from './initializer.js';
import { validateGeminiMd, validateSkillMd, validateGeminiConfig } from './validators/index.js';
import { migrateFromClaudeCode, analyzeClaudeMd, generateMigrationReport } from './migrations/index.js';
import { listTemplates, BUILT_IN_SKILLS } from './templates/index.js';
import { generateSkillMd } from './generators/skill-md.js';
import { VERSION, PACKAGE_INFO } from './index.js';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();

// Custom error handler for better output
function handleError(error: unknown, message?: string): never {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(chalk.red.bold('\nError:'), chalk.red(message ?? errorMessage));

  if (error instanceof Error && error.stack && process.env['DEBUG']) {
    console.error(chalk.gray('\nStack trace:'));
    console.error(chalk.gray(error.stack));
  }

  process.exit(1);
}

// Validate project path exists and is accessible
async function validatePath(projectPath: string): Promise<string> {
  const resolvedPath = path.resolve(projectPath);

  try {
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${resolvedPath}`);
    }
    return resolvedPath;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Directory doesn't exist, try to create it
      console.log(chalk.yellow(`Creating directory: ${resolvedPath}`));
      await fs.ensureDir(resolvedPath);
      return resolvedPath;
    }
    throw error;
  }
}

// Validate skill name format
function validateSkillName(name: string): boolean {
  const validPattern = /^[a-z][a-z0-9-]*$/;
  return validPattern.test(name);
}

// Print banner
function printBanner(): void {
  console.log(chalk.yellow.bold('\n  Claude Flow Gemini'));
  console.log(chalk.gray('  Google Gemini CLI integration for Claude Flow'));
  console.log(chalk.gray('  ------------------------------------------------\n'));
}

program
  .name('claude-flow-gemini')
  .description('Google Gemini CLI integration for Claude Flow - Part of the coflow ecosystem')
  .version(VERSION, '-v, --version', 'Display version number')
  .option('--debug', 'Enable debug mode', false)
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts()['debug'] as boolean) {
      process.env['DEBUG'] = 'true';
    }
  });

// Init command
program
  .command('init')
  .description('Initialize a new Gemini CLI project with GEMINI.md and skills')
  .option('-t, --template <template>', 'Template to use (minimal, default, full, enterprise)', 'default')
  .option('-s, --skills <skills>', 'Comma-separated list of skills to include')
  .option('-f, --force', 'Overwrite existing files', false)
  .option('--dual', 'Generate both Gemini CLI and Claude Code configurations', false)
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-q, --quiet', 'Suppress verbose output', false)
  .action(async (options: {
    template: string;
    skills?: string;
    force: boolean;
    dual: boolean;
    path: string;
    quiet: boolean;
  }) => {
    try {
      if (!options.quiet) {
        printBanner();
      }

      // Validate template
      const validTemplates = ['minimal', 'default', 'full', 'enterprise'];
      if (!validTemplates.includes(options.template)) {
        console.error(chalk.red(`Invalid template: ${options.template}`));
        console.log(chalk.gray(`Valid templates: ${validTemplates.join(', ')}`));
        process.exit(1);
      }

      const projectPath = await validatePath(options.path);

      const initializer = new GeminiInitializer();
      const result = await initializer.initialize({
        projectPath,
        template: options.template as 'minimal' | 'default' | 'full' | 'enterprise',
        skills: options.skills?.split(',').map((s: string) => s.trim()),
        force: options.force,
        dual: options.dual,
      });

      if (!result.success) {
        console.error(chalk.red('\nInitialization failed:'));
        if (result.errors) {
          for (const error of result.errors) {
            console.error(chalk.red(`  • ${error}`));
          }
        }
        process.exit(1);
      }

      console.log(chalk.green.bold('✓ Gemini CLI project initialized successfully!\n'));

      // Summary
      console.log(chalk.bold('Files created:'));
      for (const file of result.filesCreated) {
        console.log(chalk.green(`  ✓ ${file}`));
      }

      if (result.skillsGenerated.length > 0) {
        console.log(chalk.bold('\nSkills installed:'));
        for (const skill of result.skillsGenerated) {
          console.log(chalk.green(`  ✓ ${skill}`));
        }
      }

      if (result.warnings && result.warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'));
        for (const warning of result.warnings) {
          console.log(chalk.yellow(`  ⚠ ${warning}`));
        }
      }

      // Next steps
      console.log(chalk.bold('\nNext steps:'));
      console.log(`  1. Review ${chalk.cyan('GEMINI.md')} for project instructions`);
      console.log(`  2. Configure ${chalk.cyan('.gemini/settings.json')} for your project`);
      console.log(`  3. Add skills with ${chalk.cyan('$skill-name')} syntax`);
      if (options.dual) {
        console.log(`  4. Claude Code users can use ${chalk.cyan('CLAUDE.md')}`);
      }
      console.log();
    } catch (error) {
      handleError(error);
    }
  });

// Generate Skill command
program
  .command('generate-skill')
  .alias('gs')
  .description('Generate a new skill SKILL.md file')
  .requiredOption('-n, --name <name>', 'Skill name (kebab-case)')
  .option('-d, --description <desc>', 'Skill description')
  .option('-t, --triggers <triggers>', 'Comma-separated trigger phrases')
  .option('-s, --skip <conditions>', 'Comma-separated skip conditions')
  .option('-p, --path <path>', 'Output path', process.cwd())
  .option('--dry-run', 'Preview without writing', false)
  .action(async (options: {
    name: string;
    description?: string;
    triggers?: string;
    skip?: string;
    path: string;
    dryRun: boolean;
  }) => {
    try {
      if (!validateSkillName(options.name)) {
        console.error(chalk.red('Skill name must be kebab-case (e.g., my-skill)'));
        process.exit(1);
      }

      const content = generateSkillMd({
        name: options.name,
        description: options.description ?? `Custom skill: ${options.name}`,
        triggers: options.triggers?.split(',').map((t: string) => t.trim()),
        skipWhen: options.skip?.split(',').map((s: string) => s.trim()),
      });

      if (options.dryRun) {
        console.log(chalk.yellow('\n--- Dry run preview ---\n'));
        console.log(content);
        return;
      }

      const skillDir = path.join(options.path, '.gemini', 'skills', options.name);
      await fs.ensureDir(skillDir);
      const skillPath = path.join(skillDir, 'SKILL.md');
      await fs.writeFile(skillPath, content, 'utf-8');

      console.log(chalk.green(`\n✓ Skill created: ${skillPath}`));
    } catch (error) {
      handleError(error);
    }
  });

// Validate command
program
  .command('validate')
  .alias('check')
  .description('Validate GEMINI.md, SKILL.md, or settings.json files')
  .option('-f, --file <file>', 'Specific file to validate')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('--strict', 'Treat warnings as errors', false)
  .action(async (options: { file?: string; path: string; strict: boolean }) => {
    try {
      const projectPath = path.resolve(options.path);
      let hasErrors = false;

      const filesToValidate: Array<{
        path: string;
        validator: (content: string, filePath: string) => { valid: boolean; errors: Array<{ path: string; message: string; line?: number }>; warnings: Array<{ path: string; message: string; suggestion?: string }> };
      }> = [];

      if (options.file) {
        const filePath = path.resolve(options.file);
        const fileName = path.basename(filePath);

        if (fileName === 'GEMINI.md') {
          filesToValidate.push({ path: filePath, validator: validateGeminiMd });
        } else if (fileName === 'SKILL.md') {
          filesToValidate.push({ path: filePath, validator: validateSkillMd });
        } else if (fileName === 'settings.json') {
          filesToValidate.push({ path: filePath, validator: validateGeminiConfig });
        } else {
          console.error(chalk.red(`Unknown file type: ${fileName}`));
          process.exit(1);
        }
      } else {
        // Validate all files
        const geminiMdPath = path.join(projectPath, 'GEMINI.md');
        if (await fs.pathExists(geminiMdPath)) {
          filesToValidate.push({ path: geminiMdPath, validator: validateGeminiMd });
        }

        const settingsPath = path.join(projectPath, '.gemini', 'settings.json');
        if (await fs.pathExists(settingsPath)) {
          filesToValidate.push({ path: settingsPath, validator: validateGeminiConfig });
        }
      }

      if (filesToValidate.length === 0) {
        console.log(chalk.yellow('No files found to validate'));
        return;
      }

      for (const fileToValidate of filesToValidate) {
        const content = await fs.readFile(fileToValidate.path, 'utf-8');
        const result = fileToValidate.validator(content, fileToValidate.path);

        const relativePath = path.relative(projectPath, fileToValidate.path);

        if (result.valid && result.warnings.length === 0) {
          console.log(chalk.green(`✓ ${relativePath}`));
        } else {
          if (result.errors.length > 0) {
            hasErrors = true;
            console.log(chalk.red(`✗ ${relativePath}`));
            for (const error of result.errors) {
              console.log(chalk.red(`  Error: ${error.message}${error.line ? ` (line ${error.line})` : ''}`));
            }
          }
          if (result.warnings.length > 0) {
            if (options.strict) hasErrors = true;
            console.log(chalk.yellow(`⚠ ${relativePath}`));
            for (const warning of result.warnings) {
              console.log(chalk.yellow(`  Warning: ${warning.message}`));
              if (warning.suggestion) {
                console.log(chalk.gray(`    → ${warning.suggestion}`));
              }
            }
          }
        }
      }

      if (hasErrors) {
        process.exit(1);
      }
    } catch (error) {
      handleError(error);
    }
  });

// Migrate command
program
  .command('migrate')
  .description('Migrate from Claude Code (CLAUDE.md) to Gemini CLI (GEMINI.md)')
  .option('-f, --from <file>', 'Source CLAUDE.md file', 'CLAUDE.md')
  .option('-o, --output <dir>', 'Output directory', '.')
  .option('--analyze-only', 'Only analyze without generating files', false)
  .option('--generate-skills', 'Generate skills from found references', false)
  .action(async (options: { from: string; output: string; analyzeOnly: boolean; generateSkills: boolean }) => {
    try {
      printBanner();

      const sourcePath = path.resolve(options.from);
      if (!(await fs.pathExists(sourcePath))) {
        console.error(chalk.red(`Source file not found: ${sourcePath}`));
        process.exit(1);
      }

      const content = await fs.readFile(sourcePath, 'utf-8');
      const analysis = analyzeClaudeMd(content);

      if (options.analyzeOnly) {
        const report = generateMigrationReport(analysis);
        console.log(report);
        return;
      }

      console.log(chalk.cyan('Migrating from Claude Code to Gemini CLI...\n'));

      const result = await migrateFromClaudeCode(content, {
        sourcePath,
        targetPath: path.resolve(options.output),
      });

      if (result.success) {
        console.log(chalk.green.bold('✓ Migration completed successfully!\n'));
        if (result.skillsCreated && result.skillsCreated.length > 0) {
          console.log(chalk.bold('Skills found:'));
          for (const skill of result.skillsCreated) {
            console.log(chalk.green(`  ✓ ${skill}`));
          }
        }
      } else {
        console.error(chalk.red('Migration failed'));
        if (result.warnings) {
          for (const warning of result.warnings) {
            console.error(chalk.yellow(`  ⚠ ${warning}`));
          }
        }
        process.exit(1);
      }
    } catch (error) {
      handleError(error);
    }
  });

// Templates command
program
  .command('templates')
  .alias('list-templates')
  .description('List available project templates')
  .action(() => {
    printBanner();
    console.log(chalk.bold('Available Templates:\n'));

    const templates = listTemplates();
    for (const tmpl of templates) {
      console.log(`  ${chalk.cyan.bold(tmpl.name)}`);
      console.log(`    ${tmpl.description}`);
      console.log(`    Skills: ${tmpl.skillCount}`);
      console.log();
    }
  });

// Skills command
program
  .command('skills')
  .alias('list-skills')
  .description('List built-in skills')
  .action(() => {
    printBanner();
    console.log(chalk.bold('Built-in Skills:\n'));

    for (const [key, skill] of Object.entries(BUILT_IN_SKILLS)) {
      console.log(`  ${chalk.yellow('$')}${chalk.cyan(key)}`);
      console.log(`    ${skill.description}`);
      console.log(`    Category: ${skill.category}`);
      console.log();
    }
  });

// Info command
program
  .command('info')
  .description('Show package information')
  .action(() => {
    console.log(chalk.yellow.bold('\n  @claude-flow/gemini'));
    console.log(chalk.gray(`  Version: ${PACKAGE_INFO.version}`));
    console.log(chalk.gray(`  ${PACKAGE_INFO.description}`));
    console.log(chalk.gray(`  Repository: ${PACKAGE_INFO.repository}`));
    console.log();
  });

// Doctor command
program
  .command('doctor')
  .description('Health check for Gemini CLI integration')
  .action(async () => {
    printBanner();
    console.log(chalk.bold('Running health check...\n'));

    // Check Gemini CLI
    let geminiAvailable = false;
    try {
      const { execSync } = await import('child_process');
      execSync('gemini --version', { stdio: 'pipe' });
      geminiAvailable = true;
      console.log(chalk.green('  ✓ Gemini CLI is installed'));
    } catch {
      console.log(chalk.yellow('  ⚠ Gemini CLI not found'));
      console.log(chalk.gray('    Install: npm install -g @anthropic-ai/gemini'));
    }

    // Check Google API key
    if (process.env['GOOGLE_API_KEY']) {
      console.log(chalk.green('  ✓ GOOGLE_API_KEY is set'));
    } else {
      console.log(chalk.yellow('  ⚠ GOOGLE_API_KEY not set'));
      console.log(chalk.gray('    Set it in your environment or .env file'));
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0] ?? '0', 10);
    if (major >= 18) {
      console.log(chalk.green(`  ✓ Node.js ${nodeVersion}`));
    } else {
      console.log(chalk.red(`  ✗ Node.js ${nodeVersion} (requires >=18)`));
    }

    // Check project initialization
    const geminiMdExists = await fs.pathExists(path.join(process.cwd(), 'GEMINI.md'));
    if (geminiMdExists) {
      console.log(chalk.green('  ✓ GEMINI.md exists'));
    } else {
      console.log(chalk.gray('  ○ GEMINI.md not found (run init to create)'));
    }

    const settingsExists = await fs.pathExists(path.join(process.cwd(), '.gemini', 'settings.json'));
    if (settingsExists) {
      console.log(chalk.green('  ✓ .gemini/settings.json exists'));
    } else {
      console.log(chalk.gray('  ○ .gemini/settings.json not found (run init to create)'));
    }

    console.log();
  });

// Dual-mode command
import { createDualModeCommand } from './dual-mode/index.js';
program.addCommand(createDualModeCommand());

// Parse and execute
program.parseAsync(process.argv).catch((error) => {
  handleError(error);
});
