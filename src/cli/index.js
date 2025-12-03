/**
 * Claude Configuration Installer CLI
 * Main CLI interface for installing Claude configuration
 */

const fs = require('fs').promises;
const path = require('path');
const { AgentInstaller } = require('../installer/agent-installer.js');
const { CommandInstaller } = require('../installer/command-installer.js');
const { CommandMigrator } = require('../installer/command-migrator.js');
const { SkillInstaller } = require('../installer/skill-installer.js');
const { RuntimeSetup } = require('../installer/runtime-setup.js');
const { SettingsManager } = require('../installer/settings-manager.js');
const { MCPServerInstaller } = require('../installer/mcp-server-installer.js');
const { Logger } = require('../utils/logger.js');
const { Validator } = require('../utils/validator.js');

class ClaudeInstaller {
  constructor() {
    this.logger = new Logger();
    this.validator = new Validator();
  }

  async run(args) {
    const command = args[0] || 'install';

    switch (command) {
      case 'install':
        return this.install(args.slice(1));
      case 'update':
        return this.update(args.slice(1));
      case 'validate':
        return this.validate(args.slice(1));
      case 'uninstall':
        return this.uninstall(args.slice(1));
      case '--help':
      case '-h':
      case 'help':
        return this.showHelp();
      case '--version':
      case '-v':
        return this.showVersion();
      default:
        this.logger.error(`Unknown command: ${command}`);
        this.showHelp();
        process.exit(1);
    }
  }

  async install(args) {
    const options = this.parseInstallOptions(args);

    // Display dry-run mode banner if enabled
    if (options.dryRun) {
      const chalk = require('chalk');
      console.log('');
      console.log(chalk.bold.cyan('═'.repeat(60)));
      console.log(chalk.bold.yellow('  🔄 DRY-RUN MODE: No changes will be applied'));
      console.log(chalk.bold.cyan('═'.repeat(60)));
      console.log('');
    }

    this.logger.info('🚀 Starting Claude Configuration Installation...');

    try {
      // Pre-flight checks
      await this.validator.validateEnvironment();

      // Determine tool (if not specified)
      if (!options.tool) {
        options.tool = await this.determineTool();
      }

      // Determine installation scope
      const scope = await this.determineScope(options);
      const installPath = this.getInstallPath(scope, options.tool);

      const installationExists = await this.validator.checkInstallationExists(installPath, options.tool);

      if (installationExists && !options.force && !options.dryRun) {
        this.logger.warning('⚠️  Existing installation detected!');
        this.logger.info(`📁 Found installation at: ${installPath[options.tool]}`);
        this.logger.info('');
        this.logger.info('💡 To update your installation, use:');
        this.logger.info(`   ai-mesh update --tool ${options.tool} ${scope === 'global' ? '--global' : '--local'}`);
        this.logger.info('');
        this.logger.info('💡 To force reinstall (overwrites existing files), use:');
        this.logger.info(`   ai-mesh install --tool ${options.tool} ${scope === 'global' ? '--global' : '--local'} --force`);
        this.logger.info('');

        const shouldUpdate = await this.promptYesNo('Would you like to run update instead?');

        if (shouldUpdate) {
          this.logger.info('🔄 Switching to update command...');
          return this.update(args);
        } else {
          this.logger.warning('❌ Installation cancelled. Use --force to override.');
          process.exit(0);
        }
      }

      if (installationExists && options.dryRun) {
        this.logger.info('[DRY RUN] Existing installation detected - would prompt for update in real run');
        this.logger.info('[DRY RUN] Proceeding with dry-run simulation...');
      }

      this.logger.info(`📍 Tool: ${options.tool}`);
      this.logger.info(`📍 Installation scope: ${scope}`);
      this.logger.info(`📁 Target path: ${installPath[options.tool]}`);

      // Create installation progress tracker
      const steps = [
        'Setting up runtime environment',
        'Installing agents',
        'Installing commands',
        'Migrating commands to subdirectories',
        'Installing skills',
        'Installing MCP servers',
        'Configuring settings',
        'Validating installation'
      ];

      let currentStep = 0;
      const updateProgress = (step) => {
        currentStep++;
        const percentage = Math.round((currentStep / steps.length) * 100);
        const prefix = options.dryRun ? '[DRY RUN] ' : '';
        const verb = options.dryRun ? `Would ${step.toLowerCase()}` : step;
        this.logger.progress(`[${percentage}%] ${prefix}${verb}`);
      };

      // Step 1: Setup runtime environment
      updateProgress(steps[0]);
      if (options.dryRun) {
        this.logger.info(`[DRY RUN] Would create runtime directories for ${options.tool}`);
      } else if (options.tool === 'opencode') {
        this.logger.info('Skipping runtime setup for opencode');
      } else {
        const runtimeSetup = new RuntimeSetup(installPath, this.logger, options.tool);
        await runtimeSetup.initialize();
      }

      // Step 2: Install agents
      updateProgress(steps[1]);
      if (options.dryRun) {
        const fs = require('fs');
        const agentFiles = fs.readdirSync(path.join(__dirname, '../../agents')).filter(f => f.endsWith('.yaml'));
        this.logger.info(`[DRY RUN] Would install ${agentFiles.length} agent files`);
      } else {
        const agentInstaller = new AgentInstaller(installPath, this.logger, options);
        await agentInstaller.install(options.tool);
      }

      // Step 3: Install commands
      updateProgress(steps[2]);
      if (options.dryRun) {
        const fs = require('fs');
        const commandFiles = fs.readdirSync(path.join(__dirname, '../../commands')).filter(f => f.endsWith('.yaml'));
        this.logger.info(`[DRY RUN] Would install ${commandFiles.length} command files`);
      } else {
        const commandInstaller = new CommandInstaller(installPath, this.logger, options);
        await commandInstaller.install(options.tool);
      }

      // Step 4: Migrate commands to subdirectories
      updateProgress(steps[3]);
      if (options.dryRun) {
        this.logger.info('[DRY RUN] Would migrate ai-mesh commands to subdirectory structure');
      } else {
        try {
          const commandsInstallPath = path.join(installPath[options.tool]);
          const commandMigrator = new CommandMigrator(commandsInstallPath, this.logger, options);
          const migrationResult = await commandMigrator.migrate();

          if (migrationResult.success) {
            this.logger.success(`✅ Command migration: ${migrationResult.migratedCount} commands moved to ai-mesh/ subdirectory`);
            if (migrationResult.errorCount > 0) {
              this.logger.warning(`⚠️  ${migrationResult.errorCount} files encountered errors`);
            }
          } else {
            this.logger.warning('⚠️  Command migration completed with warnings (non-critical)');
          }
        } catch (error) {
          this.logger.warning(`⚠️  Command migration encountered an error (non-critical): ${error.message}`);
        }
      }

      // Step 5: Install skills
      updateProgress(steps[4]);
      if (options.dryRun) {
        const fs = require('fs');
        const skillDirs = fs.readdirSync(path.join(__dirname, '../../skills'), { withFileTypes: true })
          .filter(d => d.isDirectory());
        this.logger.info(`[DRY RUN] Would install ${skillDirs.length} skill directories`);
      } else {
        const skillInstaller = new SkillInstaller(installPath, this.logger, options);
        await skillInstaller.install(options.tool);
      }

      // Step 6: Install MCP servers
      updateProgress(steps[5]);
      let mcpResult = null;
      if (options.dryRun) {
        this.logger.info('[DRY RUN] Would install TRD Workflow MCP server');
      } else if (options.tool === 'claude') {
        try {
          const mcpInstaller = new MCPServerInstaller(installPath, this.logger, options);
          mcpResult = await mcpInstaller.install(scope);
          this.logger.success(`✅ MCP Server: ${mcpResult.filesCopied} files, registered: ${mcpResult.registered}`);
        } catch (error) {
          this.logger.warning(`⚠️  MCP Server installation failed (non-critical): ${error.message}`);
          mcpResult = { success: false, error: error.message };
        }
      } else {
        this.logger.info(`Skipping MCP server installation for ${options.tool}`);
      }

      // Step 7: Configure settings
      updateProgress(steps[6]);
      if (options.dryRun) {
        if (options.tool === 'claude') {
          this.logger.info('[DRY RUN] Would configure Claude Code settings');
        } else {
          this.logger.info(`[DRY RUN] Would skip settings configuration for ${options.tool}`);
        }
      } else if (options.tool === 'claude') {
        const settingsManager = new SettingsManager(installPath, this.logger);
        await settingsManager.configure();
      } else {
        this.logger.info(`Skipping settings configuration for ${options.tool}`);
      }

      // Step 8: Validate installation
      updateProgress(steps[7]);
      if (options.dryRun) {
        this.logger.info('[DRY RUN] Would validate installation integrity');
        this.showDryRunSummary(installPath, options.tool, scope);
      } else {
        const validation = await this.validator.validateInstallation(installPath, options.tool);

        if (validation.success) {
          this.logger.success('✅ Installation completed successfully!');
          this.showInstallationSummary(validation.summary, installPath, options.tool, mcpResult);
        } else {
          this.logger.error('❌ Installation validation failed');
          this.logger.error(validation.errors.join('\\n'));
          process.exit(1);
        }
      }

    } catch (error) {
      this.logger.error(`❌ Installation failed: ${error.message}`);
      if (process.env.DEBUG) {
        this.logger.error(error.stack);
      }
      process.exit(1);
    }
  }

  parseInstallOptions(args) {
    const options = {
      scope: null,
      force: false,
      skipValidation: false,
      configFile: null,
      tool: null, // Will prompt if not specified
      dryRun: false, // Enable dry-run simulation mode
      debug: false // Enable debug mode
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case '--global':
        case '-g':
          options.scope = 'global';
          break;
        case '--local':
        case '-l':
          options.scope = 'local';
          break;
        case '--force':
        case '-f':
          options.force = true;
          break;
        case '--skip-validation':
          options.skipValidation = true;
          break;
        case '--config':
        case '-c':
          options.configFile = args[++i];
          break;
        case '--tool':
        case '-t':
          options.tool = args[++i].toLowerCase();
          break;
        case '--dry-run':
        case '-d':
          options.dryRun = true;
          break;
        case '--debug':
          options.debug = true;
          break;
      }
    }

    return options;
  }

  async determineTool() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log('\\n🤖 Choose AI tool:');
      console.log('  1) Claude (Anthropic Claude Code)');
      console.log('  2) OpenCode (OpenAI Assistant)');
      console.log('');

      rl.question('Enter your choice (1 for claude, 2 for opencode): ', (answer) => {
        rl.close();
        const tool = answer.trim() === '1' ? 'claude' : 'opencode';
        resolve(tool);
      });
    });
  }

  async determineScope(options) {
    if (options.scope) {
      return options.scope;
    }

    // Interactive prompt for scope selection
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log('\\n🔧 Choose installation scope:');
      console.log('  1) Global installation (available across all projects)');
      console.log('  2) Local installation (project-specific configuration)');
      console.log('');

      rl.question('Enter your choice (1 for global, 2 for local): ', (answer) => {
        rl.close();
        const scope = answer.trim() === '1' ? 'global' : 'local';
        resolve(scope);
      });
    });
  }

  getInstallPath(scope, tool) {
    const baseDir = tool === 'claude' ? '.claude' : '.opencode';
    const meshDir = tool === 'claude' ? '.ai-mesh' : '.opencode-mesh'; // Adjust if needed

    if (scope === 'global') {
      return {
        [tool]: path.join(require('os').homedir(), baseDir),
        mesh: path.join(require('os').homedir(), meshDir)
      };
    } else {
      return {
        [tool]: path.join(process.cwd(), baseDir),
        mesh: path.join(process.cwd(), meshDir)
      };
    }
  }

  showInstallationSummary(summary, installPath, tool, mcpResult) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 INSTALLATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📁 Config: ${installPath[tool]}`);
    console.log(`📁 Runtime: ${installPath.mesh}`);
    console.log('');
    console.log(`✅ Agents installed: ${summary.agents}`);
    console.log(`✅ Commands installed: ${summary.commands}`);

    // Show MCP server status if applicable
    if (mcpResult && tool === 'claude') {
      const mcpStatus = mcpResult.success ? '✅ Installed' : '⚠️  Failed (non-critical)';
      console.log(`${mcpStatus} MCP Server: trd-workflow`);
    }

    console.log('');
    console.log('🚀 Next steps:');
    console.log('  1. Restart Claude Code to load the new configuration');
    console.log('  2. Test with: ai-mesh validate');
    console.log('  3. Run: /agents command in Claude Code');
    console.log('='.repeat(60));
  }

  showDryRunSummary(installPath, tool, scope) {
    const chalk = require('chalk');
    const fs = require('fs');

    // Count files that would be installed
    const agentFiles = fs.readdirSync(path.join(__dirname, '../../agents')).filter(f => f.endsWith('.yaml'));
    const commandFiles = fs.readdirSync(path.join(__dirname, '../../commands')).filter(f => f.endsWith('.yaml'));
    const skillDirs = fs.readdirSync(path.join(__dirname, '../../skills'), { withFileTypes: true })
      .filter(d => d.isDirectory());

    console.log('');
    console.log(chalk.bold.cyan('═'.repeat(60)));
    console.log(chalk.bold.white('  Dry-Run Installation Summary'));
    console.log(chalk.bold.cyan('═'.repeat(60)));
    console.log('');

    console.log(chalk.white('  Target Configuration:'));
    console.log(chalk.gray(`    Tool: ${chalk.cyan(tool)}`));
    console.log(chalk.gray(`    Scope: ${chalk.cyan(scope)}`));
    console.log(chalk.gray(`    Config path: ${chalk.cyan(installPath[tool])}`));
    console.log(chalk.gray(`    Runtime path: ${chalk.cyan(installPath.mesh || 'N/A')}`));
    console.log('');

    console.log(chalk.white('  Files That Would Be Installed:'));
    console.log(chalk.green(`    ✓ Agents: ${chalk.yellow(agentFiles.length)} files`));
    console.log(chalk.green(`    ✓ Commands: ${chalk.yellow(commandFiles.length)} files`));
    console.log(chalk.green(`    ✓ Skills: ${chalk.yellow(skillDirs.length)} directories`));
    console.log('');

    console.log(chalk.white('  Operations That Would Be Performed:'));
    console.log(chalk.gray(`    • Create runtime directories`));
    console.log(chalk.gray(`    • Copy agent configuration files`));
    console.log(chalk.gray(`    • Copy command definition files`));
    console.log(chalk.gray(`    • Copy skill documentation and examples`));
    if (tool === 'claude') {
      console.log(chalk.gray(`    • Configure Claude Code settings`));
    }
    console.log(chalk.gray(`    • Validate installation integrity`));
    console.log('');

    console.log(chalk.white('  Estimated Resources:'));
    console.log(chalk.gray(`    Duration: ${chalk.cyan('~2-5 seconds')}`));
    console.log(chalk.gray(`    Disk space: ${chalk.cyan('~50-100 KB')}`));
    console.log('');

    console.log(chalk.bold.cyan('═'.repeat(60)));
    console.log(chalk.bold.green('  ✅ Dry-run completed successfully!'));
    console.log(chalk.bold.cyan('═'.repeat(60)));
    console.log('');

    console.log(chalk.yellow('  💡 To perform the actual installation, run:'));
    console.log(chalk.cyan(`     ai-mesh install --tool ${tool} ${scope === 'global' ? '--global' : '--local'}`));
    console.log('');

    console.log(chalk.yellow('  ⚠️  Recommendation: Review the output above before proceeding.'));
    console.log('');
  }

  showUpdateSummary(agentResults, commandResults, installPath, tool) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 UPDATE COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📁 Config: ${installPath[tool]}`);
    console.log(`📁 Runtime: ${installPath.mesh}`);
    console.log('');
    console.log(`✅ Agents: ${agentResults.installed} updated, ${agentResults.skipped} unchanged`);
    console.log(`✅ Commands: ${commandResults.installed} updated, ${commandResults.skipped} unchanged`);
    console.log('');
    console.log('🚀 Next steps:');
    console.log('  1. Restart Claude Code to load the updated configuration');
    console.log('  2. Test with: ai-mesh validate');
    console.log('='.repeat(60));
  }

  async promptYesNo(question) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`${question} (y/n): `, (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
  }

  async update(args) {
    this.logger.info('🔄 Updating Claude Configuration...');

    const options = this.parseInstallOptions(args);
    options.force = true;

    try {
      if (!options.tool) {
        options.tool = await this.determineTool();
      }

      let scope = options.scope;

      if (!scope) {
        const localPath = this.getInstallPath('local', options.tool);
        const globalPath = this.getInstallPath('global', options.tool);

        const localExists = await this.validator.checkInstallationExists(localPath, options.tool);
        const globalExists = await this.validator.checkInstallationExists(globalPath, options.tool);

        if (localExists && globalExists) {
          this.logger.warning('⚠️  Found both local and global installations');
          scope = await this.determineScope(options);
        } else if (localExists) {
          scope = 'local';
          this.logger.info('📍 Detected local installation');
        } else if (globalExists) {
          scope = 'global';
          this.logger.info('📍 Detected global installation');
        } else {
          scope = await this.determineScope(options);
        }
      }

      const installPath = this.getInstallPath(scope, options.tool);
      const installationExists = await this.validator.checkInstallationExists(installPath, options.tool);

      if (!installationExists) {
        this.logger.error('❌ No existing installation found');
        this.logger.info('💡 Use "install" command to perform a fresh installation');
        process.exit(1);
      }

      this.logger.info(`📍 Tool: ${options.tool}`);
      this.logger.info(`📍 Installation scope: ${scope}`);
      this.logger.info(`📁 Target path: ${installPath[options.tool]}`);
      this.logger.info('🔄 Updating existing installation (will overwrite files)...');

      const steps = [
        'Setting up runtime environment',
        'Updating agents',
        'Updating commands',
        'Configuring settings',
        'Validating installation'
      ];

      let currentStep = 0;
      const updateProgress = (step) => {
        currentStep++;
        const percentage = Math.round((currentStep / steps.length) * 100);
        this.logger.progress(`[${percentage}%] ${step}`);
      };

      updateProgress(steps[0]);
      if (options.tool === 'opencode') {
        this.logger.info('Skipping runtime setup for opencode');
      } else {
        const runtimeSetup = new RuntimeSetup(installPath, this.logger, options.tool);
        await runtimeSetup.initialize();
      }

      updateProgress(steps[1]);
      const agentInstaller = new AgentInstaller(installPath, this.logger, options);
      const agentResults = await agentInstaller.install(options.tool);

      updateProgress(steps[2]);
      const commandInstaller = new CommandInstaller(installPath, this.logger, options);
      const commandResults = await commandInstaller.install(options.tool);

      updateProgress(steps[3]);
      if (options.tool === 'claude') {
        const settingsManager = new SettingsManager(installPath, this.logger);
        await settingsManager.configure();
      } else {
        this.logger.info(`Skipping settings configuration for ${options.tool}`);
      }

      updateProgress(steps[4]);
      const validation = await this.validator.validateInstallation(installPath, options.tool);

      if (validation.success) {
        this.logger.success('✅ Update completed successfully!');
        this.showUpdateSummary(agentResults, commandResults, installPath, options.tool);
      } else {
        this.logger.error('❌ Update validation failed');
        this.logger.error(validation.errors.join('\n'));
        process.exit(1);
      }

    } catch (error) {
      this.logger.error(`❌ Update failed: ${error.message}`);
      if (process.env.DEBUG) {
        this.logger.error(error.stack);
      }
      process.exit(1);
    }
  }

  async validate(args) {
    this.logger.info('🔍 Validating Claude Configuration...');

    const options = this.parseInstallOptions(args);

    // Determine tool if not specified
    const tool = options.tool || 'claude';

    // Try to detect which installation exists, or use specified scope
    let installPath;
    let scope;
    if (options.scope) {
      scope = options.scope;
      installPath = this.getInstallPath(options.scope, tool);
    } else {
      // Check local first, then global
      const localPath = this.getInstallPath('local', tool);
      const globalPath = this.getInstallPath('global', tool);

      const localValidation = await this.validator.validateInstallation(localPath, tool);
      const globalValidation = await this.validator.validateInstallation(globalPath, tool);

      if (localValidation.success) {
        installPath = localPath;
        scope = 'local';
        this.logger.info('📍 Found local installation');
      } else if (globalValidation.success) {
        installPath = globalPath;
        scope = 'global';
        this.logger.info('📍 Found global installation');
      } else {
        // If neither works, default to global for error reporting
        installPath = globalPath;
        scope = 'global';
      }
    }

    const validation = await this.validator.validateInstallation(installPath, tool);

    // Validate MCP server if tool is claude
    let mcpValidation = null;
    if (tool === 'claude') {
      try {
        const mcpInstaller = new MCPServerInstaller(installPath, this.logger, options);
        mcpValidation = await mcpInstaller.validate(scope);
      } catch (error) {
        this.logger.debug(`MCP validation error: ${error.message}`);
      }
    }

    if (validation.success) {
      this.logger.success('✅ Installation is valid and working correctly!');
      this.logger.info(`📁 Installation path: ${installPath[tool]}`);
      this.logger.info('');

      // Display MCP server status
      if (mcpValidation && tool === 'claude') {
        this.logger.info('🔌 MCP Server Status:');
        if (mcpValidation.success) {
          this.logger.success('  ✅ trd-workflow server: Installed and configured');
          if (mcpValidation.details.registered) {
            this.logger.info('  ✅ Registered in MCP config');
          }
        } else {
          this.logger.warning('  ⚠️  trd-workflow server: Not installed');
          if (mcpValidation.errors.length > 0) {
            mcpValidation.errors.forEach(error => this.logger.error(`    • ${error}`));
          }
          this.logger.info('');
          this.logger.info('💡 To install MCP server, run:');
          this.logger.info(`   ai-mesh install --tool ${tool} ${scope === 'global' ? '--global' : '--local'} --force`);
        }

        if (mcpValidation.warnings.length > 0) {
          this.logger.info('');
          this.logger.info('⚠️  Warnings:');
          mcpValidation.warnings.forEach(warning => this.logger.warning(`  • ${warning}`));
        }
      }
    } else {
      this.logger.error('❌ Validation failed:');
      validation.errors.forEach(error => this.logger.error(`  • ${error}`));
      process.exit(1);
    }
  }

  async uninstall(args) {
    this.logger.info('🗑️  Uninstalling Claude Configuration...');

    const options = this.parseInstallOptions(args);

    try {
      // Determine tool if not specified
      if (!options.tool) {
        options.tool = await this.determineTool();
      }

      // Determine scope
      let scope = options.scope;
      if (!scope) {
        const localPath = this.getInstallPath('local', options.tool);
        const globalPath = this.getInstallPath('global', options.tool);

        const localExists = await this.validator.checkInstallationExists(localPath, options.tool);
        const globalExists = await this.validator.checkInstallationExists(globalPath, options.tool);

        if (localExists && globalExists) {
          this.logger.warning('⚠️  Found both local and global installations');
          scope = await this.determineScope(options);
        } else if (localExists) {
          scope = 'local';
          this.logger.info('📍 Detected local installation');
        } else if (globalExists) {
          scope = 'global';
          this.logger.info('📍 Detected global installation');
        } else {
          this.logger.error('❌ No installation found to uninstall');
          process.exit(1);
        }
      }

      const installPath = this.getInstallPath(scope, options.tool);

      // Confirm uninstall
      this.logger.warning(`⚠️  This will remove all configuration from: ${installPath[options.tool]}`);
      const confirmed = await this.promptYesNo('Are you sure you want to uninstall?');

      if (!confirmed) {
        this.logger.info('❌ Uninstall cancelled');
        process.exit(0);
      }

      // Uninstall MCP server first (if claude)
      if (options.tool === 'claude') {
        try {
          this.logger.info('🔌 Uninstalling MCP servers...');
          const mcpInstaller = new MCPServerInstaller(installPath, this.logger, options);
          await mcpInstaller.uninstall(scope);
        } catch (error) {
          this.logger.warning(`⚠️  MCP server uninstall failed: ${error.message}`);
        }
      }

      // Remove directories
      this.logger.info('🗑️  Removing configuration files...');
      const dirsToRemove = [
        path.join(installPath[options.tool], 'agents'),
        path.join(installPath[options.tool], 'commands'),
        path.join(installPath[options.tool], 'skills'),
        path.join(installPath[options.tool], 'hooks')
      ];

      for (const dir of dirsToRemove) {
        try {
          await fs.rm(dir, { recursive: true, force: true });
          this.logger.debug(`Removed: ${dir}`);
        } catch (error) {
          this.logger.debug(`Could not remove ${dir}: ${error.message}`);
        }
      }

      // Remove runtime directory if mesh
      if (installPath.mesh) {
        try {
          await fs.rm(installPath.mesh, { recursive: true, force: true });
          this.logger.debug(`Removed runtime: ${installPath.mesh}`);
        } catch (error) {
          this.logger.debug(`Could not remove runtime: ${error.message}`);
        }
      }

      this.logger.success('✅ Uninstall completed successfully!');
      this.logger.info('💡 Restart Claude Code to apply changes');

    } catch (error) {
      this.logger.error(`❌ Uninstall failed: ${error.message}`);
      if (process.env.DEBUG) {
        this.logger.error(error.stack);
      }
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
Claude Configuration Installer

USAGE:
  ai-mesh [COMMAND] [OPTIONS]

COMMANDS:
  install     Install Claude configuration (default)
  update      Update existing installation
  validate    Validate current installation
  uninstall   Remove Claude configuration
  help        Show this help message

INSTALL OPTIONS:
  --tool, -t TOOL     Target tool: 'claude' or 'opencode' (will prompt if not specified)
  --global, -g        Install globally (available across all projects)
  --local, -l         Install locally (project-specific)
  --force, -f         Force installation, overwrite existing files
  --skip-validation   Skip environment validation
  --config, -c FILE   Use custom configuration file
  --dry-run, -d       Simulate installation without making changes
  --debug             Enable debug logging with verbose output

EXAMPLES:
  ai-mesh install
  ai-mesh install --tool opencode --global
  ai-mesh install --tool claude --local --force
  ai-mesh install --dry-run                      # Preview changes before installing
  ai-mesh install --dry-run --debug              # Detailed dry-run simulation
  ai-mesh validate
  ai-mesh update

DRY-RUN MODE:
  Use --dry-run to preview what changes will be made without actually applying them.
  This is useful for:
    • First-time installations to see what will happen
    • Verifying custom command handling
    • Troubleshooting migration issues
    • Generating installation reports

For more information, visit: https://github.com/FortiumPartners/claude-config
`);
  }

  showVersion() {
    const packageJson = require('../../package.json');
    console.log(`ai-mesh v${packageJson.version}`);
  }
}

module.exports = { ClaudeInstaller };
