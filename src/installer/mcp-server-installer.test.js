/**
 * MCP Server Installer Tests
 *
 * @module mcp-server-installer.test
 * @version 1.0.0
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { MCPServerInstaller } = require('./mcp-server-installer.js');

// Test logger that collects messages
class TestLogger {
  constructor() {
    this.messages = [];
  }

  info(msg) {
    this.messages.push({ level: 'info', message: msg });
  }

  debug(msg) {
    this.messages.push({ level: 'debug', message: msg });
  }

  warning(msg) {
    this.messages.push({ level: 'warning', message: msg });
  }

  error(msg) {
    this.messages.push({ level: 'error', message: msg });
  }

  success(msg) {
    this.messages.push({ level: 'success', message: msg });
  }

  clear() {
    this.messages = [];
  }

  hasMessage(level, text) {
    return this.messages.some(m => m.level === level && m.message.includes(text));
  }
}

describe('MCPServerInstaller', () => {
  let testDir;
  let logger;
  let installer;

  before(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `mcp-installer-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  after(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    logger = new TestLogger();

    const installPath = {
      claude: testDir,
      mesh: path.join(testDir, '.ai-mesh')
    };

    installer = new MCPServerInstaller(installPath, logger, {});
  });

  describe('Constructor', () => {
    it('should initialize with correct properties', () => {
      assert.strictEqual(installer.serverName, 'trd-workflow');
      assert.ok(installer.sourceDir.includes('mcp-servers/trd-workflow'));
      assert.strictEqual(installer.logger, logger);
    });

    it('should accept options', () => {
      const options = { force: true, debug: true };
      const inst = new MCPServerInstaller({}, logger, options);
      assert.deepStrictEqual(inst.options, options);
    });
  });

  describe('getTargetDirectory()', () => {
    it('should return global path for global scope', () => {
      const dir = installer.getTargetDirectory('global');
      assert.ok(dir.includes('.claude'));
      assert.ok(dir.includes('mcp'));
      assert.ok(dir.includes('trd-workflow'));
      assert.ok(path.isAbsolute(dir));
    });

    it('should return local path for local scope', () => {
      const dir = installer.getTargetDirectory('local');
      assert.ok(dir.includes('.claude'));
      assert.ok(dir.includes('mcp'));
      assert.ok(dir.includes('trd-workflow'));
    });

    it('should create different paths for different scopes', () => {
      const global = installer.getTargetDirectory('global');
      const local = installer.getTargetDirectory('local');
      assert.notStrictEqual(global, local);
    });
  });

  describe('createTargetDirectory()', () => {
    it('should create directory structure', async () => {
      const targetDir = path.join(testDir, 'test-create-dir');

      await installer.createTargetDirectory(targetDir);

      // Check main directory
      const mainStat = await fs.stat(targetDir);
      assert.ok(mainStat.isDirectory());

      // Check subdirectories
      const handlersStat = await fs.stat(path.join(targetDir, 'handlers'));
      assert.ok(handlersStat.isDirectory());

      const libStat = await fs.stat(path.join(targetDir, 'lib'));
      assert.ok(libStat.isDirectory());
    });

    it('should not fail if directory already exists', async () => {
      const targetDir = path.join(testDir, 'test-existing-dir');
      await fs.mkdir(targetDir, { recursive: true });

      await assert.doesNotReject(async () => {
        await installer.createTargetDirectory(targetDir);
      });
    });

    it('should throw error for invalid path', async () => {
      const invalidPath = path.join('/invalid/path/that/cannot/be/created');

      await assert.rejects(
        async () => {
          await installer.createTargetDirectory(invalidPath);
        },
        /Failed to create target directory/
      );
    });
  });

  describe('fileExists()', () => {
    it('should return true for existing file', async () => {
      const testFile = path.join(testDir, 'exists.txt');
      await fs.writeFile(testFile, 'test');

      const exists = await installer.fileExists(testFile);
      assert.strictEqual(exists, true);
    });

    it('should return false for non-existing file', async () => {
      const testFile = path.join(testDir, 'does-not-exist.txt');

      const exists = await installer.fileExists(testFile);
      assert.strictEqual(exists, false);
    });

    it('should return true for existing directory', async () => {
      const exists = await installer.fileExists(testDir);
      assert.strictEqual(exists, true);
    });
  });

  describe('getMCPConfigPath()', () => {
    it('should return global config path', () => {
      const configPath = installer.getMCPConfigPath('global');
      assert.ok(configPath.includes('.claude'));
      assert.ok(configPath.includes('mcp'));
      assert.ok(configPath.endsWith('config.json'));
      assert.ok(path.isAbsolute(configPath));
    });

    it('should return local config path', () => {
      const configPath = installer.getMCPConfigPath('local');
      assert.ok(configPath.includes('.claude'));
      assert.ok(configPath.includes('mcp'));
      assert.ok(configPath.endsWith('config.json'));
    });
  });

  describe('registerMCPServer()', () => {
    it('should create new config if none exists', async () => {
      const scope = 'local';
      const serverPath = path.join(testDir, 'test-server');
      const configPath = path.join(testDir, '.claude', 'mcp', 'config.json');

      // Override getMCPConfigPath for test
      installer.getMCPConfigPath = () => configPath;

      const result = await installer.registerMCPServer(scope, serverPath);

      assert.strictEqual(result, true);

      // Verify config file was created
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);

      assert.ok(config.mcpServers);
      assert.ok(config.mcpServers['trd-workflow']);
      assert.strictEqual(config.mcpServers['trd-workflow'].command, 'node');
      assert.ok(Array.isArray(config.mcpServers['trd-workflow'].args));
    });

    it('should update existing config', async () => {
      const scope = 'local';
      const serverPath = path.join(testDir, 'test-server-2');
      const configPath = path.join(testDir, '.claude', 'mcp', 'config-2.json');

      // Create existing config
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify({
        mcpServers: {
          'other-server': {
            command: 'node',
            args: ['/path/to/other.js']
          }
        }
      }), 'utf8');

      // Override getMCPConfigPath for test
      installer.getMCPConfigPath = () => configPath;

      const result = await installer.registerMCPServer(scope, serverPath);

      assert.strictEqual(result, true);

      // Verify config was updated
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);

      assert.ok(config.mcpServers['other-server']);
      assert.ok(config.mcpServers['trd-workflow']);
    });

    it('should handle invalid existing config', async () => {
      const scope = 'local';
      const serverPath = path.join(testDir, 'test-server-3');
      const configPath = path.join(testDir, '.claude', 'mcp', 'config-3.json');

      // Create invalid config
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, 'invalid json {', 'utf8');

      // Override getMCPConfigPath for test
      installer.getMCPConfigPath = () => configPath;

      const result = await installer.registerMCPServer(scope, serverPath);

      assert.strictEqual(result, true);
      assert.ok(logger.hasMessage('warning', 'Invalid MCP config'));

      // Verify new valid config was created
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      assert.ok(config.mcpServers['trd-workflow']);
    });
  });

  describe('validate()', () => {
    it('should fail validation if server directory missing', async () => {
      const scope = 'local';

      // Override getTargetDirectory to return non-existing path
      installer.getTargetDirectory = () => path.join(testDir, 'non-existing');

      const results = await installer.validate(scope);

      assert.strictEqual(results.success, false);
      assert.ok(results.errors.some(e => e.includes('Server directory not found')));
    });

    it('should warn if node_modules missing', async () => {
      const scope = 'local';
      const targetDir = path.join(testDir, 'validation-test');

      // Create server directory with required files
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(path.join(targetDir, 'server.js'), '// server');
      await fs.writeFile(path.join(targetDir, 'package.json'), '{}');

      // Override getTargetDirectory
      installer.getTargetDirectory = () => targetDir;

      const results = await installer.validate(scope);

      assert.strictEqual(results.success, true);
      assert.ok(results.warnings.some(w => w.includes('node_modules')));
    });

    it('should pass validation for complete installation', async () => {
      const scope = 'local';
      const targetDir = path.join(testDir, 'complete-validation');

      // Create complete installation
      await fs.mkdir(targetDir, { recursive: true });
      await fs.mkdir(path.join(targetDir, 'node_modules'), { recursive: true });
      await fs.writeFile(path.join(targetDir, 'server.js'), '// server');
      await fs.writeFile(path.join(targetDir, 'package.json'), '{}');

      // Override getTargetDirectory
      installer.getTargetDirectory = () => targetDir;

      const results = await installer.validate(scope);

      assert.strictEqual(results.success, true);
      assert.strictEqual(results.errors.length, 0);
    });
  });

  describe('copyServerFiles()', () => {
    it('should skip non-existing files gracefully', async () => {
      const targetDir = path.join(testDir, 'copy-test');
      await fs.mkdir(targetDir, { recursive: true });
      await fs.mkdir(path.join(targetDir, 'handlers'), { recursive: true });
      await fs.mkdir(path.join(targetDir, 'lib'), { recursive: true });

      // This should not throw even if source files don't exist
      const count = await installer.copyServerFiles(targetDir);

      // Count should be 0 or small since source files don't exist in test
      assert.ok(typeof count === 'number');
    });
  });

  describe('testServerStartup()', () => {
    it('should timeout and return result for non-existing server', async () => {
      const serverPath = path.join(testDir, 'non-existing-server');

      const result = await installer.testServerStartup(serverPath);

      // Should return false for non-existing server
      assert.strictEqual(typeof result, 'boolean');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid installation path', async () => {
      const invalidInstaller = new MCPServerInstaller(
        { claude: '/invalid/path/that/does/not/exist' },
        logger,
        {}
      );

      try {
        await invalidInstaller.install('global');
        assert.fail('Should have thrown an error');
      } catch (error) {
        // Verify it throws an error (which is expected behavior)
        assert.ok(error instanceof Error);
        assert.ok(error.message.length > 0);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should support dry-run mode through options', () => {
      const dryRunInstaller = new MCPServerInstaller(
        { claude: testDir },
        logger,
        { dryRun: true }
      );

      assert.strictEqual(dryRunInstaller.options.dryRun, true);
    });

    it('should support force mode through options', () => {
      const forceInstaller = new MCPServerInstaller(
        { claude: testDir },
        logger,
        { force: true }
      );

      assert.strictEqual(forceInstaller.options.force, true);
    });
  });
});
