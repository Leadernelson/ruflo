/**
 * @claude-flow/gemini
 *
 * Google Gemini CLI platform adapter for Claude Flow
 *
 * @packageDocumentation
 */

// Re-export all types
export * from './types.js';

// Re-export generators
export {
  generateGeminiMd,
  generateSkillMd,
  generateGeminiConfig,
} from './generators/index.js';

// Re-export skill generator helper
export { generateBuiltInSkill } from './generators/skill-md.js';

// Re-export config generator helpers
export { generateMinimalGeminiConfig, generateCIGeminiConfig } from './generators/gemini-config.js';

// Re-export migrations
export {
  migrateFromClaudeCode,
  analyzeClaudeMd,
  generateMigrationReport,
  convertSkillSyntax,
  convertSettingsToGeminiConfig,
  FEATURE_MAPPINGS,
} from './migrations/index.js';

// Re-export validators
export {
  validateGeminiMd,
  validateSkillMd,
  validateGeminiConfig,
} from './validators/index.js';

// Main initializer class and helper function
export { GeminiInitializer, initializeGeminiProject } from './initializer.js';

// Dual-mode collaborative execution
export { DualModeOrchestrator, CollaborationTemplates, createDualModeCommand } from './dual-mode/index.js';
export type { DualModeConfig, WorkerConfig, WorkerResult, CollaborationResult } from './dual-mode/index.js';

// Template utilities
export {
  getTemplate,
  listTemplates,
  BUILT_IN_SKILLS,
  TEMPLATES,
  DEFAULT_SKILLS_BY_TEMPLATE,
  DIRECTORY_STRUCTURE,
  PLATFORM_MAPPING,
  GITIGNORE_ENTRIES,
  GEMINI_OVERRIDE_TEMPLATE,
} from './templates/index.js';

/**
 * Package version
 */
export const VERSION = '3.0.0-alpha.1';

/**
 * Package metadata
 */
export const PACKAGE_INFO = {
  name: '@claude-flow/gemini',
  version: VERSION,
  description: 'Gemini CLI integration for Claude Flow',
  futureUmbrella: 'coflow',
  repository: 'https://github.com/ruvnet/claude-flow',
} as const;

/**
 * Default export for convenient imports
 */
export default {
  VERSION,
  PACKAGE_INFO,
};
