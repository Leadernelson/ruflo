/**
 * Dual-Mode CLI Commands
 * CLI interface for running collaborative dual-mode swarms (Claude Code + Gemini CLI)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  DualModeOrchestrator,
  DualModeConfig,
  WorkerConfig,
  CollaborationTemplates,
  CollaborationResult,
} from './orchestrator.js';

/**
 * Create the dual-mode command
 */
export function createDualModeCommand(): Command {
  const cmd = new Command('dual')
    .description('Run collaborative dual-mode swarms (Claude Code + Gemini CLI)')
    .addCommand(createRunCommand())
    .addCommand(createTemplateCommand())
    .addCommand(createStatusCommand());

  return cmd;
}

/**
 * Run a dual-mode collaboration
 */
function createRunCommand(): Command {
  return new Command('run')
    .description('Run a collaborative dual-mode swarm')
    .option('-t, --template <name>', 'Use a pre-built template (feature, security, refactor)')
    .option('-c, --config <path>', 'Path to collaboration config JSON')
    .option('--task <description>', 'Task description for the swarm')
    .option('--max-concurrent <n>', 'Maximum concurrent workers', '4')
    .option('--timeout <ms>', 'Worker timeout in milliseconds', '300000')
    .option('--namespace <name>', 'Shared memory namespace', 'collaboration')
    .action(async (options: {
      template?: string;
      config?: string;
      task?: string;
      maxConcurrent: string;
      timeout: string;
      namespace: string;
    }) => {
      console.log(chalk.cyan('═══════════════════════════════════════════════════════════════'));
      console.log(chalk.cyan.bold('  DUAL-MODE COLLABORATIVE EXECUTION'));
      console.log(chalk.cyan('  Claude Code + Gemini CLI workers with shared memory'));
      console.log(chalk.cyan('═══════════════════════════════════════════════════════════════'));
      console.log();

      const config: DualModeConfig = {
        projectPath: process.cwd(),
        maxConcurrent: parseInt(options.maxConcurrent, 10),
        timeout: parseInt(options.timeout, 10),
        sharedNamespace: options.namespace,
      };

      const orchestrator = new DualModeOrchestrator(config);

      // Set up event listeners
      orchestrator.on('memory:initialized', ({ namespace }: { namespace: string }) => {
        console.log(chalk.green(`✓ Shared memory initialized: ${namespace}`));
      });

      orchestrator.on('worker:started', ({ id, platform, role }: { id: string; platform: string; role: string }) => {
        const icon = platform === 'claude' ? '🔵' : '🟡';
        console.log(chalk.gray(`  ${icon} ${role} (${id}) started on ${platform}`));
      });

      orchestrator.on('worker:completed', ({ id, platform, role }: { id: string; platform: string; role: string }) => {
        const icon = platform === 'claude' ? '🔵' : '🟡';
        console.log(chalk.green(`  ${icon} ${role} (${id}) completed`));
      });

      orchestrator.on('worker:failed', ({ id, role, error }: { id: string; role: string; error: string }) => {
        console.log(chalk.red(`  ❌ ${role} (${id}) failed: ${error}`));
      });

      // Determine workers
      let workers: WorkerConfig[];
      const taskDescription = options.task ?? 'Collaborative task';

      if (options.template) {
        switch (options.template) {
          case 'feature':
            workers = CollaborationTemplates.featureDevelopment(taskDescription);
            break;
          case 'security':
            workers = CollaborationTemplates.securityAudit(taskDescription);
            break;
          case 'refactor':
            workers = CollaborationTemplates.refactoring(taskDescription);
            break;
          default:
            console.error(chalk.red(`Unknown template: ${options.template}`));
            console.log(chalk.gray('Available templates: feature, security, refactor'));
            process.exit(1);
        }
      } else {
        // Default to feature template
        workers = CollaborationTemplates.featureDevelopment(taskDescription);
      }

      console.log(chalk.cyan(`\nStarting ${workers.length} workers for: ${taskDescription}\n`));

      // Run collaboration
      const result: CollaborationResult = await orchestrator.runCollaboration(workers, taskDescription);

      // Print summary
      console.log();
      console.log(chalk.cyan('═══════════════════════════════════════════════════════════════'));
      console.log(chalk.cyan.bold('  COLLABORATION RESULTS'));
      console.log(chalk.cyan('═══════════════════════════════════════════════════════════════'));
      console.log();

      const duration = (result.totalDuration / 1000).toFixed(1);
      const completed = result.workers.filter((w) => w.status === 'completed').length;
      const failed = result.workers.filter((w) => w.status === 'failed').length;

      console.log(`  Duration: ${duration}s`);
      console.log(`  Workers:  ${completed} completed, ${failed} failed`);
      console.log(`  Status:   ${result.success ? chalk.green('SUCCESS') : chalk.red('FAILED')}`);

      if (result.errors.length > 0) {
        console.log();
        console.log(chalk.red('  Errors:'));
        for (const error of result.errors) {
          console.log(chalk.red(`    - ${error}`));
        }
      }
    });
}

/**
 * List collaboration templates
 */
function createTemplateCommand(): Command {
  return new Command('templates')
    .description('List available collaboration templates')
    .action(() => {
      console.log(chalk.cyan.bold('\nAvailable Dual-Mode Templates\n'));

      const templates = [
        {
          name: 'feature',
          description: 'Feature development pipeline',
          workers: '🔵 Architect → 🟡 Coder → 🔵 Tester → 🟡 Reviewer',
        },
        {
          name: 'security',
          description: 'Security audit workflow',
          workers: '🟡 Scanner → 🔵 Analyzer → 🟡 Fixer',
        },
        {
          name: 'refactor',
          description: 'Code refactoring pipeline',
          workers: '🔵 Analyzer → 🔵 Planner → 🟡 Refactorer → 🔵 Validator',
        },
      ];

      for (const tmpl of templates) {
        console.log(`  ${chalk.bold(tmpl.name)}`);
        console.log(`    ${tmpl.description}`);
        console.log(`    ${tmpl.workers}`);
        console.log();
      }

      console.log(chalk.gray('  🔵 = Claude Code    🟡 = Gemini CLI'));
      console.log();
      console.log(chalk.gray('  Usage: claude-flow-gemini dual run --template <name> --task "Your task"'));
    });
}

/**
 * Check dual-mode status
 */
function createStatusCommand(): Command {
  return new Command('status')
    .description('Check dual-mode collaboration status')
    .option('-n, --namespace <name>', 'Memory namespace to check', 'collaboration')
    .action(async (options: { namespace: string }) => {
      console.log(chalk.cyan.bold('\nDual-Mode Status\n'));
      console.log(`  Namespace: ${options.namespace}`);
      console.log(`  Claude Code: ${chalk.gray('checking...')}`);
      console.log(`  Gemini CLI:  ${chalk.gray('checking...')}`);
      console.log();
      console.log(chalk.gray('  Run "claude-flow-gemini dual run" to start a collaboration'));
    });
}
