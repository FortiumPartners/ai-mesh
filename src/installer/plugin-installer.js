/**
 * Plugin Installer
 * Handles installation of Claude Code plugins (hooks, commands, config)
 */

const fs = require('fs').promises;
const path = require('path');

class PluginInstaller {
  constructor(installPath, logger, options = {}) {
    this.installPath = installPath;
    this.logger = logger;
    this.options = options;
    this.pluginsDir = path.join(__dirname, '../../plugins');
  }

  async install(tool = 'claude') {
    this.logger.info('🔌 Installing plugins...');

    try {
      // Get list of available plugins
      const plugins = await this.getAvailablePlugins();

      if (plugins.length === 0) {
        this.logger.info('No plugins found to install');
        return { installed: 0, skipped: 0, plugins: [] };
      }

      let installed = 0;
      let skipped = 0;
      const installedPlugins = [];

      for (const plugin of plugins) {
        try {
          const result = await this.installPlugin(plugin, tool);
          if (result.success) {
            installed++;
            installedPlugins.push(plugin.name);
            this.logger.debug(`  ✓ Installed plugin: ${plugin.name}`);
          } else {
            skipped++;
            this.logger.debug(`  ⚠ Skipped plugin: ${plugin.name} - ${result.reason}`);
          }
        } catch (error) {
          skipped++;
          this.logger.warning(`  ✗ Failed to install ${plugin.name}: ${error.message}`);
        }
      }

      this.logger.success(`✅ Plugins: ${installed} installed, ${skipped} skipped`);
      return { installed, skipped, plugins: installedPlugins };

    } catch (error) {
      this.logger.error(`Failed to install plugins: ${error.message}`);
      throw error;
    }
  }

  async getAvailablePlugins() {
    const plugins = [];

    try {
      const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(this.pluginsDir, entry.name);
          const manifestPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');

          try {
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
            plugins.push({
              name: manifest.name || entry.name,
              version: manifest.version || '0.0.0',
              description: manifest.description || '',
              path: pluginPath,
              manifest
            });
          } catch {
            // No valid plugin.json, skip
            this.logger.debug(`Skipping ${entry.name}: no valid plugin.json`);
          }
        }
      }
    } catch (error) {
      this.logger.warning(`Could not read plugins directory: ${error.message}`);
    }

    return plugins;
  }

  async installPlugin(plugin, tool) {
    const targetBase = this.installPath[tool];
    const results = {
      success: true,
      hooks: { installed: 0, skipped: 0 },
      commands: { installed: 0, skipped: 0 }
    };

    // Install hooks
    const hooksResult = await this.installPluginHooks(plugin, targetBase);
    results.hooks = hooksResult;

    // Install commands
    const commandsResult = await this.installPluginCommands(plugin, targetBase);
    results.commands = commandsResult;

    // Update settings.json with hook configuration
    await this.updateSettingsWithHooks(plugin, targetBase);

    results.success = results.hooks.installed > 0 || results.commands.installed > 0;
    if (!results.success) {
      results.reason = 'No hooks or commands to install';
    }

    return results;
  }

  async installPluginHooks(plugin, targetBase) {
    const result = { installed: 0, skipped: 0 };
    const hooksSourceDir = path.join(plugin.path, 'hooks');
    const hooksTargetDir = path.join(targetBase, 'plugins', plugin.name, 'hooks');

    try {
      await fs.access(hooksSourceDir);
    } catch {
      return result; // No hooks directory
    }

    // Create target directory
    await fs.mkdir(hooksTargetDir, { recursive: true });

    // Copy all hook files
    const files = await this.getAllFiles(hooksSourceDir);

    for (const file of files) {
      const relativePath = path.relative(hooksSourceDir, file);
      const targetPath = path.join(hooksTargetDir, relativePath);

      // Create subdirectory if needed
      await fs.mkdir(path.dirname(targetPath), { recursive: true });

      try {
        const content = await fs.readFile(file);
        const exists = await this.fileExists(targetPath);

        if (this.options.force || !exists) {
          await fs.writeFile(targetPath, content);

          // Make scripts executable
          if (file.endsWith('.js') || file.endsWith('.sh')) {
            await fs.chmod(targetPath, 0o755);
          }

          result.installed++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        this.logger.debug(`Failed to copy ${relativePath}: ${error.message}`);
        result.skipped++;
      }
    }

    return result;
  }

  async installPluginCommands(plugin, targetBase) {
    const result = { installed: 0, skipped: 0 };
    const commandsSourceDir = path.join(plugin.path, 'commands');
    const commandsTargetDir = path.join(targetBase, 'commands', plugin.name);

    try {
      await fs.access(commandsSourceDir);
    } catch {
      return result; // No commands directory
    }

    // Create target directory
    await fs.mkdir(commandsTargetDir, { recursive: true });

    // Copy command files
    const files = await fs.readdir(commandsSourceDir);

    for (const file of files) {
      if (file.endsWith('.md')) {
        const sourcePath = path.join(commandsSourceDir, file);
        const targetPath = path.join(commandsTargetDir, file);

        try {
          const content = await fs.readFile(sourcePath, 'utf8');
          const exists = await this.fileExists(targetPath);

          if (this.options.force || !exists) {
            await fs.writeFile(targetPath, content, 'utf8');
            result.installed++;
          } else {
            result.skipped++;
          }
        } catch (error) {
          this.logger.debug(`Failed to copy command ${file}: ${error.message}`);
          result.skipped++;
        }
      }
    }

    return result;
  }

  async updateSettingsWithHooks(plugin, targetBase) {
    const settingsPath = path.join(targetBase, 'settings.json');
    const hooksJsonPath = path.join(plugin.path, 'hooks', 'hooks.json');

    try {
      // Read plugin's hooks.json
      await fs.access(hooksJsonPath);
      const pluginHooks = JSON.parse(await fs.readFile(hooksJsonPath, 'utf8'));

      // Read or create settings.json
      let settings = { hooks: {} };
      try {
        settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
        if (!settings.hooks) settings.hooks = {};
      } catch {
        // Settings doesn't exist, use default
      }

      // Calculate installed plugin root path (where hooks/ directory lives)
      const installedPluginRoot = path.join(targetBase, 'plugins', plugin.name);

      // Merge plugin hooks into settings (replacing any existing hooks for this plugin)
      for (const [hookType, hookConfigs] of Object.entries(pluginHooks.hooks || {})) {
        if (!settings.hooks[hookType]) {
          settings.hooks[hookType] = [];
        }

        for (const config of hookConfigs) {
          // Replace ${CLAUDE_PLUGIN_ROOT} with actual path
          const resolvedConfig = JSON.parse(
            JSON.stringify(config).replace(
              /\$\{CLAUDE_PLUGIN_ROOT\}/g,
              installedPluginRoot.replace(/\\/g, '/')
            )
          );

          // Remove any existing hooks for this plugin (by plugin name in command path)
          settings.hooks[hookType] = settings.hooks[hookType].filter(existing =>
            !existing.hooks?.some(h =>
              h.command && h.command.includes(plugin.name)
            )
          );

          // Add the new hook config
          settings.hooks[hookType].push(resolvedConfig);
        }
      }

      // Write updated settings
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
      this.logger.debug(`Updated settings.json with ${plugin.name} hooks`);

    } catch (error) {
      this.logger.debug(`Could not update settings with hooks: ${error.message}`);
    }
  }

  async getAllFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async validate() {
    const plugins = await this.getAvailablePlugins();
    const results = {
      total: plugins.length,
      installed: 0,
      missing: [],
      details: []
    };

    for (const plugin of plugins) {
      const targetBase = this.installPath.claude;
      const hooksDir = path.join(targetBase, 'plugins', plugin.name, 'hooks');
      const commandsDir = path.join(targetBase, 'commands', plugin.name);

      const hooksExist = await this.fileExists(hooksDir);
      const commandsExist = await this.fileExists(commandsDir);

      if (hooksExist || commandsExist) {
        results.installed++;
        results.details.push({
          name: plugin.name,
          status: 'installed',
          hooks: hooksExist,
          commands: commandsExist
        });
      } else {
        results.missing.push(plugin.name);
        results.details.push({
          name: plugin.name,
          status: 'missing',
          hooks: false,
          commands: false
        });
      }
    }

    return results;
  }
}

module.exports = { PluginInstaller };
