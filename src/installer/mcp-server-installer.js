/**
 * MCP Server Installer
 * Deploys TRD Workflow MCP server during ai-mesh installation
 *
 * @module mcp-server-installer
 * @version 1.0.0
 * @related TRD-MCP-WORKFLOW-001, Phase 2, Sprint 2.1
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

class MCPServerInstaller {
  constructor(installPath, logger, options) {
    this.installPath = installPath;
    this.logger = logger;
    this.options = options || {};
    this.sourceDir = path.join(__dirname, '../mcp-servers/trd-workflow');
    this.serverName = 'trd-workflow';
  }

  /**
   * Install MCP server to target directory
   *
   * @param {string} scope - Installation scope ('global' or 'local')
   * @returns {Promise<Object>} Installation results
   */
  async install(scope) {
    this.logger.info('🔌 Installing TRD Workflow MCP Server...');

    try {
      // Determine target directory
      const targetDir = this.getTargetDirectory(scope);

      // Create target directory
      await this.createTargetDirectory(targetDir);

      // Copy server files
      const filesCopied = await this.copyServerFiles(targetDir);

      // Install dependencies
      await this.installDependencies(targetDir);

      // Register in MCP config
      const registered = await this.registerMCPServer(scope, targetDir);

      // Test server startup
      const healthy = await this.testServerStartup(targetDir);

      this.logger.success(`✅ MCP Server installed: ${filesCopied} files, registered: ${registered}, healthy: ${healthy}`);

      return {
        success: true,
        targetDir,
        filesCopied,
        registered,
        healthy,
        scope
      };

    } catch (error) {
      this.logger.error(`Failed to install MCP server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get target installation directory based on scope
   *
   * @param {string} scope - Installation scope ('global' or 'local')
   * @returns {string} Target directory path
   */
  getTargetDirectory(scope) {
    const baseDir = scope === 'global'
      ? path.join(os.homedir(), '.claude')
      : path.join(process.cwd(), '.claude');

    return path.join(baseDir, 'mcp', this.serverName);
  }

  /**
   * Create target directory structure
   *
   * @param {string} targetDir - Target directory path
   * @returns {Promise<void>}
   */
  async createTargetDirectory(targetDir) {
    try {
      await fs.mkdir(targetDir, { recursive: true });

      // Create subdirectories
      await fs.mkdir(path.join(targetDir, 'handlers'), { recursive: true });
      await fs.mkdir(path.join(targetDir, 'lib'), { recursive: true });

      this.logger.debug(`Created target directory: ${targetDir}`);
    } catch (error) {
      throw new Error(`Failed to create target directory: ${error.message}`);
    }
  }

  /**
   * Copy server files from source to target
   *
   * @param {string} targetDir - Target directory path
   * @returns {Promise<number>} Number of files copied
   */
  async copyServerFiles(targetDir) {
    try {
      let fileCount = 0;

      // Copy main server files
      const mainFiles = ['server.js', 'package.json', 'package-lock.json', 'README.md'];

      for (const file of mainFiles) {
        const sourcePath = path.join(this.sourceDir, file);
        const targetPath = path.join(targetDir, file);

        // Check if source file exists
        if (await this.fileExists(sourcePath)) {
          await fs.copyFile(sourcePath, targetPath);
          fileCount++;
        }
      }

      // Copy handlers directory
      const handlersSource = path.join(this.sourceDir, 'handlers');
      const handlersTarget = path.join(targetDir, 'handlers');

      if (await this.fileExists(handlersSource)) {
        const handlerFiles = await fs.readdir(handlersSource);
        for (const file of handlerFiles) {
          if (file.endsWith('.js')) {
            await fs.copyFile(
              path.join(handlersSource, file),
              path.join(handlersTarget, file)
            );
            fileCount++;
          }
        }
      }

      // Copy lib directory
      const libSource = path.join(this.sourceDir, 'lib');
      const libTarget = path.join(targetDir, 'lib');

      if (await this.fileExists(libSource)) {
        const libFiles = await fs.readdir(libSource);
        for (const file of libFiles) {
          if (file.endsWith('.js')) {
            await fs.copyFile(
              path.join(libSource, file),
              path.join(libTarget, file)
            );
            fileCount++;
          }
        }
      }

      this.logger.debug(`Copied ${fileCount} server files`);
      return fileCount;

    } catch (error) {
      throw new Error(`Failed to copy server files: ${error.message}`);
    }
  }

  /**
   * Install server dependencies using npm
   *
   * @param {string} targetDir - Target directory path
   * @returns {Promise<void>}
   */
  async installDependencies(targetDir) {
    this.logger.debug('Installing MCP server dependencies...');

    return new Promise((resolve, reject) => {
      const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

      const proc = spawn(npm, ['install', '--production', '--no-audit', '--no-fund'], {
        cwd: targetDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32'
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          this.logger.debug('Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (error) => {
        reject(new Error(`Failed to run npm install: ${error.message}`));
      });
    });
  }

  /**
   * Register MCP server in Claude's MCP configuration
   *
   * @param {string} scope - Installation scope ('global' or 'local')
   * @param {string} serverPath - Absolute path to server directory
   * @returns {Promise<boolean>} True if registration successful
   */
  async registerMCPServer(scope, serverPath) {
    try {
      const configPath = this.getMCPConfigPath(scope);
      const serverExecutable = path.join(serverPath, 'server.js');

      // Read existing config or create new
      let config = { mcpServers: {} };

      if (await this.fileExists(configPath)) {
        const configContent = await fs.readFile(configPath, 'utf8');
        try {
          config = JSON.parse(configContent);
          if (!config.mcpServers) {
            config.mcpServers = {};
          }
        } catch (parseError) {
          this.logger.warning('Invalid MCP config, creating new one');
          config = { mcpServers: {} };
        }
      } else {
        // Create config directory if it doesn't exist
        await fs.mkdir(path.dirname(configPath), { recursive: true });
      }

      // Add or update trd-workflow server entry
      config.mcpServers[this.serverName] = {
        command: 'node',
        args: [serverExecutable],
        env: {}
      };

      // Write config back
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

      this.logger.debug(`Registered MCP server in: ${configPath}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to register MCP server: ${error.message}`);
      return false;
    }
  }

  /**
   * Get MCP configuration file path
   *
   * @param {string} scope - Installation scope ('global' or 'local')
   * @returns {string} MCP config file path
   */
  getMCPConfigPath(scope) {
    const baseDir = scope === 'global'
      ? path.join(os.homedir(), '.claude')
      : path.join(process.cwd(), '.claude');

    return path.join(baseDir, 'mcp', 'config.json');
  }

  /**
   * Test server startup and basic functionality
   *
   * @param {string} serverPath - Absolute path to server directory
   * @returns {Promise<boolean>} True if server passes health check
   */
  async testServerStartup(serverPath) {
    this.logger.debug('Testing MCP server startup...');

    return new Promise((resolve) => {
      const serverExecutable = path.join(serverPath, 'server.js');

      // Start server with test flag (if supported) or just verify it starts
      const proc = spawn('node', [serverExecutable], {
        cwd: serverPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      });

      let stdout = '';
      let stderr = '';
      let testTimeout;
      let processExited = false;

      // Collect output
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Set timeout for startup test
      testTimeout = setTimeout(() => {
        if (!processExited) {
          // Server is running, consider it healthy
          proc.kill('SIGTERM');

          // Check for startup indicators in output
          const hasStartupMessage = stdout.includes('Server connected') ||
                                   stdout.includes('Starting TRD Workflow') ||
                                   stderr.includes('Server connected') ||
                                   stderr.includes('Starting TRD Workflow');

          this.logger.debug(`Server startup test: ${hasStartupMessage ? 'PASSED' : 'PARTIAL'}`);
          resolve(hasStartupMessage);
        }
      }, 3000); // 3 second startup test

      proc.on('close', (code) => {
        processExited = true;
        clearTimeout(testTimeout);

        // If server exits immediately with error
        if (code !== 0 && code !== null) {
          this.logger.warning(`Server test exited with code ${code}`);
          this.logger.debug(`Server stderr: ${stderr}`);
          resolve(false);
        }
      });

      proc.on('error', (error) => {
        processExited = true;
        clearTimeout(testTimeout);
        this.logger.warning(`Server test error: ${error.message}`);
        resolve(false);
      });
    });
  }

  /**
   * Uninstall MCP server
   *
   * @param {string} scope - Installation scope ('global' or 'local')
   * @returns {Promise<Object>} Uninstallation results
   */
  async uninstall(scope) {
    this.logger.info('🗑️  Uninstalling TRD Workflow MCP Server...');

    try {
      const targetDir = this.getTargetDirectory(scope);
      const configPath = this.getMCPConfigPath(scope);

      // Remove server files
      let filesRemoved = false;
      if (await this.fileExists(targetDir)) {
        await fs.rm(targetDir, { recursive: true, force: true });
        filesRemoved = true;
        this.logger.debug(`Removed server directory: ${targetDir}`);
      }

      // Remove from MCP config
      let configUpdated = false;
      if (await this.fileExists(configPath)) {
        const configContent = await fs.readFile(configPath, 'utf8');
        try {
          const config = JSON.parse(configContent);

          if (config.mcpServers && config.mcpServers[this.serverName]) {
            delete config.mcpServers[this.serverName];
            await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
            configUpdated = true;
            this.logger.debug('Removed server from MCP config');
          }
        } catch (parseError) {
          this.logger.warning('Could not update MCP config during uninstall');
        }
      }

      this.logger.success('✅ MCP Server uninstalled successfully');

      return {
        success: true,
        filesRemoved,
        configUpdated,
        scope
      };

    } catch (error) {
      this.logger.error(`Failed to uninstall MCP server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if file or directory exists
   *
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} True if exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate MCP server installation
   *
   * @param {string} scope - Installation scope ('global' or 'local')
   * @returns {Promise<Object>} Validation results
   */
  async validate(scope) {
    const results = {
      success: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      const targetDir = this.getTargetDirectory(scope);
      const configPath = this.getMCPConfigPath(scope);

      // Check if server directory exists
      if (!(await this.fileExists(targetDir))) {
        results.success = false;
        results.errors.push('Server directory not found');
        return results;
      }

      // Check for required files
      const requiredFiles = ['server.js', 'package.json'];
      for (const file of requiredFiles) {
        const filePath = path.join(targetDir, file);
        if (!(await this.fileExists(filePath))) {
          results.success = false;
          results.errors.push(`Required file missing: ${file}`);
        }
      }

      // Check node_modules
      const nodeModulesPath = path.join(targetDir, 'node_modules');
      if (!(await this.fileExists(nodeModulesPath))) {
        results.warnings.push('node_modules not found - dependencies may not be installed');
      }

      // Check MCP config
      if (await this.fileExists(configPath)) {
        const configContent = await fs.readFile(configPath, 'utf8');
        try {
          const config = JSON.parse(configContent);
          if (!config.mcpServers || !config.mcpServers[this.serverName]) {
            results.warnings.push('Server not registered in MCP config');
          } else {
            results.details.registered = true;
          }
        } catch (parseError) {
          results.warnings.push('Could not parse MCP config');
        }
      } else {
        results.warnings.push('MCP config file not found');
      }

      results.details.targetDir = targetDir;
      results.details.scope = scope;

    } catch (error) {
      results.success = false;
      results.errors.push(`Validation error: ${error.message}`);
    }

    return results;
  }
}

module.exports = { MCPServerInstaller };
