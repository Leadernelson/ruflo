/**
 * @claude-flow/gemini - Gemini Configuration Generator
 *
 * Generates the settings.json configuration file for the Gemini CLI
 */

import type { GeminiConfigOptions } from '../types.js';

/**
 * Generate Gemini CLI settings.json content
 */
export function generateGeminiConfig(options: GeminiConfigOptions = {}): string {
  const {
    model = 'gemini-2.5-flash',
    sandboxPermission = 'write',
    toolUseMode = 'auto',
    mcpServers = [],
    skills = [],
  } = options;

  const config: Record<string, unknown> = {
    model,
    sandbox_permission: sandboxPermission,
    tool_use_mode: toolUseMode,
  };

  // Add MCP servers
  if (mcpServers.length > 0) {
    const mcpSection: Record<string, unknown> = {};
    for (const server of mcpServers) {
      mcpSection[server.name] = {
        command: server.command,
        args: server.args ?? [],
        enabled: server.enabled ?? true,
        ...(server.toolTimeout ? { tool_timeout: server.toolTimeout } : {}),
        ...(server.env ? { env: server.env } : {}),
      };
    }
    config.mcp_servers = mcpSection;
  }

  // Add skills
  if (skills.length > 0) {
    config.skills = skills.map((s) => ({
      path: s.path,
      enabled: s.enabled ?? true,
    }));
  }

  return JSON.stringify(config, null, 2);
}

/**
 * Generate a minimal Gemini CLI configuration
 */
export function generateMinimalGeminiConfig(): string {
  return generateGeminiConfig({
    model: 'gemini-2.5-flash',
    sandboxPermission: 'write',
    toolUseMode: 'auto',
  });
}

/**
 * Generate a CI-optimized Gemini CLI configuration
 */
export function generateCIGeminiConfig(): string {
  return generateGeminiConfig({
    model: 'gemini-2.0-flash',
    sandboxPermission: 'readonly',
    toolUseMode: 'auto',
  });
}
