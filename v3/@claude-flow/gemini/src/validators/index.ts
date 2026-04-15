/**
 * @claude-flow/gemini - Validators
 *
 * Comprehensive validation functions for GEMINI.md, SKILL.md, and settings.json
 * Provides detailed error messages and suggestions for fixes.
 */

import type { ValidationResult, ValidationError, ValidationWarning } from '../types.js';

/**
 * Secret patterns to detect
 */
const SECRET_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /AIza[0-9A-Za-z_-]{35}/, name: 'Google API key' },
  { pattern: /sk-[a-zA-Z0-9]{32,}/, name: 'OpenAI API key' },
  { pattern: /sk-ant-[a-zA-Z0-9-]{32,}/, name: 'Anthropic API key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub personal access token' },
  { pattern: /gho_[a-zA-Z0-9]{36}/, name: 'GitHub OAuth token' },
  { pattern: /github_pat_[a-zA-Z0-9_]{22,}/, name: 'GitHub fine-grained token' },
  { pattern: /xox[baprs]-[a-zA-Z0-9-]{10,}/, name: 'Slack token' },
  { pattern: /AKIA[A-Z0-9]{16}/, name: 'AWS access key' },
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[a-zA-Z0-9_-]{20,}["']?/i, name: 'Generic API key' },
  { pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"']{8,}["']/i, name: 'Hardcoded password' },
  { pattern: /(?:secret|token)\s*[:=]\s*["'][a-zA-Z0-9_/-]{16,}["']/i, name: 'Hardcoded secret/token' },
  { pattern: /Bearer\s+[a-zA-Z0-9_.-]{20,}/, name: 'Bearer token' },
  { pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/, name: 'Private key' },
];

/**
 * Required sections for GEMINI.md
 */
const GEMINI_MD_REQUIRED_SECTIONS = ['Setup', 'Code Standards', 'Security'];

/**
 * Validate GEMINI.md content
 */
export function validateGeminiMd(content: string, filePath: string = 'GEMINI.md'): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const lines = content.split('\n');

  // Check for empty content
  if (content.trim().length === 0) {
    errors.push({
      path: filePath,
      message: 'GEMINI.md is empty',
      line: 1,
    });
    return { valid: false, errors, warnings };
  }

  // Check for title (H1)
  const hasTitle = lines.some((line) => line.startsWith('# '));
  if (!hasTitle) {
    errors.push({
      path: filePath,
      message: 'GEMINI.md must have a title (# heading)',
      line: 1,
    });
  }

  // Check for required sections
  const sectionHeaders = lines
    .filter((line) => line.startsWith('## '))
    .map((line) => line.replace('## ', '').trim());

  for (const required of GEMINI_MD_REQUIRED_SECTIONS) {
    if (!sectionHeaders.includes(required)) {
      warnings.push({
        path: filePath,
        message: `Missing recommended section: ## ${required}`,
        suggestion: `Add a "## ${required}" section to improve project documentation`,
      });
    }
  }

  // Check for secrets
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    for (const secretPattern of SECRET_PATTERNS) {
      if (secretPattern.pattern.test(line)) {
        errors.push({
          path: filePath,
          message: `Potential ${secretPattern.name} detected`,
          line: i + 1,
        });
      }
    }
  }

  // Check file size
  if (content.length > 100000) {
    warnings.push({
      path: filePath,
      message: 'GEMINI.md is very large (>100KB)',
      suggestion: 'Consider splitting into smaller files or using $skill references',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate SKILL.md content
 */
export function validateSkillMd(content: string, filePath: string = 'SKILL.md'): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const lines = content.split('\n');

  // Check for YAML frontmatter
  if (!content.startsWith('---')) {
    errors.push({
      path: filePath,
      message: 'SKILL.md must start with YAML frontmatter (---)',
      line: 1,
    });
  } else {
    // Find closing ---
    const closingIndex = lines.indexOf('---', 1);
    if (closingIndex === -1) {
      errors.push({
        path: filePath,
        message: 'YAML frontmatter is not properly closed (missing ---)',
        line: 1,
      });
    } else {
      // Check for required frontmatter fields
      const frontmatter = lines.slice(1, closingIndex).join('\n');
      if (!frontmatter.includes('name:')) {
        errors.push({
          path: filePath,
          message: 'SKILL.md frontmatter must include a "name" field',
          line: 2,
        });
      }
      if (!frontmatter.includes('description:')) {
        warnings.push({
          path: filePath,
          message: 'SKILL.md frontmatter should include a "description" field',
          suggestion: 'Add description: to the frontmatter for better skill documentation',
        });
      }
    }
  }

  // Check for secrets in skill content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    for (const secretPattern of SECRET_PATTERNS) {
      if (secretPattern.pattern.test(line)) {
        errors.push({
          path: filePath,
          message: `Potential ${secretPattern.name} detected`,
          line: i + 1,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Gemini CLI settings.json content
 */
export function validateGeminiConfig(content: string, filePath: string = 'settings.json'): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for empty content
  if (content.trim().length === 0) {
    errors.push({
      path: filePath,
      message: 'settings.json is empty',
      line: 1,
    });
    return { valid: false, errors, warnings };
  }

  // Try to parse JSON
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(content) as Record<string, unknown>;
  } catch {
    errors.push({
      path: filePath,
      message: 'settings.json contains invalid JSON',
      line: 1,
    });
    return { valid: false, errors, warnings };
  }

  // Validate model field
  const validModels = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro',
  ];
  if (config['model'] && !validModels.includes(config['model'] as string)) {
    warnings.push({
      path: filePath,
      message: `Unknown model: ${config['model'] as string}`,
      suggestion: `Valid models: ${validModels.join(', ')}`,
    });
  }

  // Check for secrets in raw content
  for (const secretPattern of SECRET_PATTERNS) {
    if (secretPattern.pattern.test(content)) {
      errors.push({
        path: filePath,
        message: `Potential ${secretPattern.name} detected in settings`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
