/**
 * Dual-Mode Orchestrator
 * Runs Claude Code and Gemini CLI workers in parallel with shared memory
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';

export interface WorkerConfig {
  id: string;
  platform: 'claude' | 'gemini';
  role: string;
  prompt: string;
  model?: string;
  maxTurns?: number;
  timeout?: number;
  dependsOn?: string[];
}

export interface WorkerResult {
  id: string;
  platform: 'claude' | 'gemini';
  role: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  memoryKeys?: string[];
}

export interface DualModeConfig {
  projectPath: string;
  maxConcurrent?: number;
  sharedNamespace?: string;
  timeout?: number;
  claudeCommand?: string;
  geminiCommand?: string;
}

export interface CollaborationResult {
  success: boolean;
  workers: WorkerResult[];
  sharedMemory: Record<string, unknown>;
  totalDuration: number;
  errors: string[];
}

/**
 * Orchestrates parallel execution of Claude Code and Gemini CLI workers
 */
export class DualModeOrchestrator extends EventEmitter {
  private config: Required<DualModeConfig>;
  private workers: Map<string, WorkerResult> = new Map();
  private processes: Map<string, ChildProcess> = new Map();

  constructor(config: DualModeConfig) {
    super();
    this.config = {
      projectPath: config.projectPath,
      maxConcurrent: config.maxConcurrent ?? 4,
      sharedNamespace: config.sharedNamespace ?? 'collaboration',
      timeout: config.timeout ?? 300000, // 5 minutes
      claudeCommand: config.claudeCommand ?? 'claude',
      geminiCommand: config.geminiCommand ?? 'gemini',
    };
  }

  /**
   * Initialize shared memory for collaboration
   */
  async initializeSharedMemory(taskContext: string): Promise<void> {
    const { projectPath, sharedNamespace } = this.config;

    // Initialize memory database
    await this.runCommand(
      'npx',
      ['claude-flow@alpha', 'memory', 'init', '--force'],
      projectPath
    );

    // Store task context
    await this.runCommand(
      'npx',
      [
        'claude-flow@alpha', 'memory', 'store',
        '--key', 'task-context',
        '--value', taskContext,
        '--namespace', sharedNamespace,
      ],
      projectPath
    );

    this.emit('memory:initialized', { namespace: sharedNamespace, taskContext });
  }

  /**
   * Spawn a headless worker
   */
  async spawnWorker(workerConfig: WorkerConfig): Promise<void> {
    const { id, platform, role, prompt, model, timeout } = workerConfig;
    const workerTimeout = timeout ?? this.config.timeout;

    const result: WorkerResult = {
      id,
      platform,
      role,
      status: 'pending',
      startedAt: new Date(),
    };

    this.workers.set(id, result);
    this.emit('worker:started', { id, platform, role });

    try {
      result.status = 'running';
      let output: string;

      if (platform === 'claude') {
        output = await this.runClaudeWorker(prompt, model, workerTimeout);
      } else {
        output = await this.runGeminiWorker(prompt, model, workerTimeout);
      }

      result.status = 'completed';
      result.output = output;
      result.completedAt = new Date();
      this.emit('worker:completed', { id, platform, role, output });
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);
      result.completedAt = new Date();
      this.emit('worker:failed', { id, platform, role, error: result.error });
    }
  }

  /**
   * Run a collaboration with multiple workers
   */
  async runCollaboration(
    workers: WorkerConfig[],
    taskContext: string
  ): Promise<CollaborationResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Initialize shared memory
    try {
      await this.initializeSharedMemory(taskContext);
    } catch (error) {
      errors.push(`Memory init failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Group workers by dependency level
    const levels = this.buildDependencyLevels(workers);

    // Execute each level in sequence, workers within a level in parallel
    for (const level of levels) {
      const promises = level.map((worker) => this.spawnWorker(worker));
      const results = await Promise.allSettled(promises);

      for (const result of results) {
        if (result.status === 'rejected') {
          errors.push(String(result.reason));
        }
      }
    }

    const totalDuration = Date.now() - startTime;

    return {
      success: errors.length === 0,
      workers: Array.from(this.workers.values()),
      sharedMemory: {},
      totalDuration,
      errors,
    };
  }

  /**
   * Stop all running workers
   */
  stopAll(): number {
    let count = 0;
    for (const [id, proc] of this.processes) {
      proc.kill('SIGTERM');
      const worker = this.workers.get(id);
      if (worker) {
        worker.status = 'failed';
        worker.error = 'Stopped by user';
        worker.completedAt = new Date();
      }
      this.emit('worker:stopped', { id });
      count++;
    }
    this.processes.clear();
    return count;
  }

  /**
   * Run a Claude Code headless worker
   */
  private async runClaudeWorker(
    prompt: string,
    model?: string,
    timeout?: number
  ): Promise<string> {
    const args = ['-p', prompt];
    if (model) {
      args.push('--model', model);
    }

    return this.runCommand(this.config.claudeCommand, args, this.config.projectPath, timeout);
  }

  /**
   * Run a Gemini CLI headless worker
   */
  private async runGeminiWorker(
    prompt: string,
    model?: string,
    timeout?: number
  ): Promise<string> {
    const args = ['--non-interactive', '-p', prompt];
    if (model) {
      args.push('--model', model);
    }

    return this.runCommand(this.config.geminiCommand, args, this.config.projectPath, timeout);
  }

  /**
   * Build dependency levels for execution ordering
   */
  private buildDependencyLevels(workers: WorkerConfig[]): WorkerConfig[][] {
    const levels: WorkerConfig[][] = [];
    const resolved = new Set<string>();
    const remaining = [...workers];

    while (remaining.length > 0) {
      const currentLevel: WorkerConfig[] = [];
      const nextRemaining: WorkerConfig[] = [];

      for (const worker of remaining) {
        const deps = worker.dependsOn ?? [];
        const allResolved = deps.every((dep) => resolved.has(dep));

        if (allResolved) {
          currentLevel.push(worker);
        } else {
          nextRemaining.push(worker);
        }
      }

      // Avoid infinite loop if there are circular dependencies
      if (currentLevel.length === 0 && nextRemaining.length > 0) {
        // Warn about circular dependencies and force remaining into current level
        const circularIds = nextRemaining.map((w) => w.id).join(', ');
        console.warn(`Warning: Circular dependency detected among workers: ${circularIds}. Executing them in parallel.`);
        currentLevel.push(...nextRemaining);
        nextRemaining.length = 0;
      }

      for (const worker of currentLevel) {
        resolved.add(worker.id);
      }

      levels.push(currentLevel);
      remaining.length = 0;
      remaining.push(...nextRemaining);
    }

    return levels;
  }

  /**
   * Run a command and capture output
   */
  private runCommand(
    command: string,
    args: string[],
    cwd: string,
    timeout?: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      const id = `${command}-${Date.now()}`;
      this.processes.set(id, proc);

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      const timer = timeout
        ? setTimeout(() => {
            proc.kill('SIGTERM');
            reject(new Error(`Command timed out after ${timeout}ms`));
          }, timeout)
        : null;

      proc.on('close', (code) => {
        if (timer) clearTimeout(timer);
        this.processes.delete(id);

        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Command exited with code ${code ?? 'unknown'}: ${stderr.trim()}`));
        }
      });

      proc.on('error', (error) => {
        if (timer) clearTimeout(timer);
        this.processes.delete(id);
        reject(error);
      });
    });
  }
}

/**
 * Pre-built collaboration templates
 */
export const CollaborationTemplates = {
  /**
   * Feature development pipeline
   * Pipeline: architect → coder → tester → reviewer
   */
  featureDevelopment(feature: string): WorkerConfig[] {
    return [
      {
        id: 'architect',
        platform: 'claude',
        role: 'Architect',
        prompt: `Design the implementation for: ${feature}. Store your design in memory namespace 'collaboration'.`,
        model: 'sonnet',
      },
      {
        id: 'coder',
        platform: 'gemini',
        role: 'Coder',
        prompt: `Implement the feature based on the architect's design: ${feature}. Read design from 'collaboration' namespace.`,
        dependsOn: ['architect'],
      },
      {
        id: 'tester',
        platform: 'claude',
        role: 'Tester',
        prompt: `Write tests for: ${feature}. Read implementation from 'collaboration' namespace.`,
        dependsOn: ['coder'],
      },
      {
        id: 'reviewer',
        platform: 'gemini',
        role: 'Reviewer',
        prompt: `Review the code quality and security for: ${feature}. Read from 'collaboration' namespace.`,
        dependsOn: ['coder', 'tester'],
      },
    ];
  },

  /**
   * Security audit pipeline
   * Pipeline: scanner → analyzer → fixer
   */
  securityAudit(target: string): WorkerConfig[] {
    return [
      {
        id: 'scanner',
        platform: 'gemini',
        role: 'Scanner',
        prompt: `Scan ${target} for security vulnerabilities. Store findings in 'collaboration' namespace.`,
      },
      {
        id: 'analyzer',
        platform: 'claude',
        role: 'Analyzer',
        prompt: `Analyze security findings from scanner for ${target}. Read from 'collaboration' namespace.`,
        dependsOn: ['scanner'],
      },
      {
        id: 'fixer',
        platform: 'gemini',
        role: 'Fixer',
        prompt: `Fix identified security issues in ${target}. Read analysis from 'collaboration' namespace.`,
        dependsOn: ['analyzer'],
      },
    ];
  },

  /**
   * Refactoring pipeline
   * Pipeline: analyzer → planner → refactorer → validator
   */
  refactoring(target: string): WorkerConfig[] {
    return [
      {
        id: 'analyzer',
        platform: 'claude',
        role: 'Analyzer',
        prompt: `Analyze ${target} for refactoring opportunities. Store analysis in 'collaboration' namespace.`,
      },
      {
        id: 'planner',
        platform: 'claude',
        role: 'Planner',
        prompt: `Plan refactoring steps for ${target}. Read analysis from 'collaboration' namespace.`,
        dependsOn: ['analyzer'],
      },
      {
        id: 'refactorer',
        platform: 'gemini',
        role: 'Refactorer',
        prompt: `Execute refactoring plan for ${target}. Read plan from 'collaboration' namespace.`,
        dependsOn: ['planner'],
      },
      {
        id: 'validator',
        platform: 'claude',
        role: 'Validator',
        prompt: `Validate the refactoring of ${target}. Ensure no regressions.`,
        dependsOn: ['refactorer'],
      },
    ];
  },
};
