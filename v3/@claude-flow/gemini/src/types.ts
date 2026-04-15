/**
 * @claude-flow/gemini - Type Definitions
 *
 * Google Gemini CLI platform adapter types for Claude Flow
 */

/**
 * Template types for GEMINI.md generation
 */
export type GeminiMdTemplate = 'default' | 'minimal' | 'full' | 'enterprise';

/**
 * Gemini CLI sandbox permission levels
 */
export type SandboxPermission = 'readonly' | 'write' | 'full-access';

/**
 * Gemini CLI model selection
 */
export type GeminiModel =
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemini-pro';

/**
 * Gemini CLI tool use mode
 */
export type ToolUseMode = 'auto' | 'required' | 'none';

/**
 * Configuration options for GEMINI.md generation
 */
export interface GeminiMdOptions {
  projectName: string;
  description?: string;
  techStack?: string;
  buildCommand?: string;
  testCommand?: string;
  devCommand?: string;
  template?: GeminiMdTemplate;
  skills?: string[];
  customSections?: Record<string, string>;
}

/**
 * Configuration options for SKILL.md generation
 */
export interface SkillMdOptions {
  name: string;
  description: string;
  triggers?: string[] | undefined;
  skipWhen?: string[] | undefined;
  scripts?: SkillScript[] | undefined;
  references?: SkillReference[] | undefined;
  commands?: SkillCommand[] | undefined;
}

/**
 * Skill script definition
 */
export interface SkillScript {
  name: string;
  path: string;
  description: string;
}

/**
 * Skill reference documentation
 */
export interface SkillReference {
  name: string;
  path: string;
  description?: string;
}

/**
 * Skill CLI command
 */
export interface SkillCommand {
  name: string;
  command: string;
  description: string;
  example?: string;
}

/**
 * MCP server configuration
 */
export interface McpServerConfig {
  name: string;
  command: string;
  args?: string[];
  enabled?: boolean;
  toolTimeout?: number;
  env?: Record<string, string>;
}

/**
 * Skill path configuration
 */
export interface SkillConfig {
  path: string;
  enabled?: boolean;
}

/**
 * Configuration options for Gemini settings.json generation
 */
export interface GeminiConfigOptions {
  model?: GeminiModel;
  sandboxPermission?: SandboxPermission;
  toolUseMode?: ToolUseMode;
  mcpServers?: McpServerConfig[];
  skills?: SkillConfig[];
}

/**
 * Full initialization options
 */
export interface GeminiInitOptions {
  projectPath: string;
  template?: GeminiMdTemplate | undefined;
  skills?: string[] | undefined;
  force?: boolean | undefined;
  dual?: boolean | undefined;  // Generate both Claude Code and Gemini CLI configs
  migrateFrom?: 'claude.md' | 'CLAUDE.md' | undefined;
}

/**
 * Initialization result
 */
export interface GeminiInitResult {
  success: boolean;
  filesCreated: string[];
  skillsGenerated: string[];
  warnings?: string[] | undefined;
  errors?: string[] | undefined;
}

/**
 * Migration options
 */
export interface MigrationOptions {
  sourcePath: string;
  targetPath: string;
  preserveComments?: boolean;
  generateSkills?: boolean;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  geminiMdPath?: string;
  skillsCreated?: string[];
  settingsJsonPath?: string;
  mappings?: FeatureMapping[];
  warnings?: string[];
}

/**
 * Feature mapping between Claude Code and Gemini CLI
 */
export interface FeatureMapping {
  claudeCode: string;
  geminiCli: string;
  status: 'mapped' | 'partial' | 'unsupported';
  notes?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  path: string;
  message: string;
  line?: number;
  column?: number;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

/**
 * Built-in skill names
 */
export type BuiltInSkill =
  | 'swarm-orchestration'
  | 'memory-management'
  | 'sparc-methodology'
  | 'security-audit'
  | 'performance-analysis'
  | 'github-automation';

/**
 * Gemini CLI environment variables
 */
export interface GeminiEnvVars {
  GOOGLE_API_KEY?: string;
  GEMINI_MODEL?: GeminiModel;
  GEMINI_SANDBOX_PERMISSION?: SandboxPermission;
  GEMINI_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  GEMINI_TOOL_USE_MODE?: ToolUseMode;
}
