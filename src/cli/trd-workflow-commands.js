/**
 * TRD Workflow CLI Commands
 * Provides command-line access to trd-workflow library functions
 *
 * @module cli/trd-workflow-commands
 * @description CLI wrapper for TRD workflow enhancement tools
 * @version 1.0.0
 * @created 2025-12-03
 * @related TRD-WORKFLOW-001, Phase 3, Sprint 3
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * TRD Workflow CLI Commands Handler
 * Routes subcommands to appropriate handlers
 */
class TrdWorkflowCommands {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Main command router
   * @param {string[]} args - Command line arguments
   * @returns {Promise<void>}
   */
  async run(args) {
    const [subcommand, ...rest] = args;

    switch (subcommand) {
      case 'inject':
        return this.inject(rest);
      case 'workflow':
        return this.workflow(rest);
      case 'complexity':
        return this.complexity(rest);
      case 'validate':
        return this.validate(rest);
      case '--help':
      case '-h':
      case 'help':
        return this.showHelp();
      default:
        this.logger.error(`Unknown subcommand: ${subcommand}`);
        this.showHelp();
        process.exit(1);
    }
  }

  /**
   * Inject checkpoints command
   * Usage: ai-mesh trd-workflow inject --input tasks.json --output enhanced.json
   * @param {string[]} args - Command arguments
   */
  async inject(args) {
    const { input, output } = this.parseArgs(args, ['input', 'output']);

    if (!input || !output) {
      this.logger.error('Missing required arguments: --input and --output');
      this.logger.info('Usage: ai-mesh trd-workflow inject --input tasks.json --output enhanced.json');
      process.exit(1);
    }

    try {
      // Read input file
      this.logger.info(`Reading input: ${input}`);
      const inputData = await this.readJsonFile(input);

      // Dynamically import ES module
      const { injectWorkflowTasks } = await import('../trd-workflow/lib/index.js');

      // Inject workflow tasks
      this.logger.info('Injecting workflow checkpoints...');
      const enhanced = injectWorkflowTasks(inputData, {
        checkpoint_frequency: inputData.checkpoint_frequency || 'sprint',
        trd_id: inputData.trd_id || 'TRD-UNKNOWN',
        trdContext: inputData
      });

      // Write output file
      this.logger.info(`Writing output: ${output}`);
      await this.writeJsonFile(output, enhanced);

      this.logger.success('✅ Checkpoint injection complete!');
      this.logger.info(`📁 Output saved to: ${output}`);

      // Show summary
      const checkpointCount = this.countCheckpoints(enhanced);
      this.logger.info(`📊 Injected ${checkpointCount} checkpoint tasks`);

    } catch (error) {
      this.logger.error(`❌ Injection failed: ${error.message}`);
      if (process.env.DEBUG) {
        this.logger.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Generate workflow section command
   * Usage: ai-mesh trd-workflow workflow --input trd.json --output workflow.md
   * @param {string[]} args - Command arguments
   */
  async workflow(args) {
    const { input, output } = this.parseArgs(args, ['input', 'output']);

    if (!input || !output) {
      this.logger.error('Missing required arguments: --input and --output');
      this.logger.info('Usage: ai-mesh trd-workflow workflow --input trd.json --output workflow.md');
      process.exit(1);
    }

    try {
      // Read input file
      this.logger.info(`Reading input: ${input}`);
      const trdContext = await this.readJsonFile(input);

      // Dynamically import ES module
      const { generateWorkflowSection } = await import('../trd-workflow/lib/index.js');

      // Generate workflow section
      this.logger.info('Generating workflow section...');
      const workflow = generateWorkflowSection(trdContext, {
        executionCommand: '/implement-trd',
        includeComplexityAnalysis: true,
        includeDelegation: true,
        includeQualityGates: true
      });

      // Write output file
      this.logger.info(`Writing output: ${output}`);
      await fs.writeFile(output, workflow.markdown, 'utf8');

      this.logger.success('✅ Workflow section generation complete!');
      this.logger.info(`📁 Output saved to: ${output}`);

      // Show summary
      this.logger.info(`📊 Task types: ${workflow.analysis.taskTypes.length}`);
      this.logger.info(`📊 Quality gates: ${workflow.analysis.qualityGates.length}`);

    } catch (error) {
      this.logger.error(`❌ Workflow generation failed: ${error.message}`);
      if (process.env.DEBUG) {
        this.logger.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Analyze complexity command
   * Usage: ai-mesh trd-workflow complexity --input tasks.json [--json]
   * @param {string[]} args - Command arguments
   */
  async complexity(args) {
    const { input, json } = this.parseArgs(args, ['input', 'json']);

    if (!input) {
      this.logger.error('Missing required argument: --input');
      this.logger.info('Usage: ai-mesh trd-workflow complexity --input tasks.json [--json]');
      process.exit(1);
    }

    try {
      // Read input file
      const taskBreakdown = await this.readJsonFile(input);

      // Dynamically import ES module
      const { analyzeTaskTypes, calculateCheckpointInterval } = await import('../trd-workflow/lib/index.js');

      // Analyze task types
      const taskTypeAnalysis = analyzeTaskTypes(taskBreakdown);

      // Calculate checkpoint strategy
      const checkpointStrategy = calculateCheckpointInterval(taskBreakdown);

      const analysis = {
        taskTypes: taskTypeAnalysis,
        checkpointStrategy: checkpointStrategy,
        summary: {
          totalTasks: this.countTasks(taskBreakdown),
          totalHours: this.calculateTotalHours(taskBreakdown),
          phases: taskBreakdown.phases?.length || 0,
          sprints: taskBreakdown.sprints?.length || 0
        }
      };

      // Output format
      if (json) {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        this.displayComplexityAnalysis(analysis);
      }

      process.exit(0);

    } catch (error) {
      this.logger.error(`❌ Complexity analysis failed: ${error.message}`);
      if (process.env.DEBUG) {
        this.logger.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Validate TRD structure command
   * Usage: ai-mesh trd-workflow validate --input trd.md [--json]
   * @param {string[]} args - Command arguments
   */
  async validate(args) {
    const { input, json } = this.parseArgs(args, ['input', 'json']);

    if (!input) {
      this.logger.error('Missing required argument: --input');
      this.logger.info('Usage: ai-mesh trd-workflow validate --input trd.md [--json]');
      process.exit(1);
    }

    try {
      // Read input file
      const content = await fs.readFile(input, 'utf8');

      // Dynamically import ES module
      const { validateTRDContext } = await import('../trd-workflow/lib/index.js');

      // Validate TRD structure
      const validation = validateTRDContext(content);

      // Output format
      if (json) {
        console.log(JSON.stringify(validation, null, 2));
      } else {
        this.displayValidationResult(validation);
      }

      // Exit with appropriate code
      process.exit(validation.valid ? 0 : 1);

    } catch (error) {
      this.logger.error(`❌ Validation failed: ${error.message}`);
      if (process.env.DEBUG) {
        this.logger.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Show help message
   */
  showHelp() {
    console.log(`
TRD Workflow CLI Commands

USAGE:
  ai-mesh trd-workflow <subcommand> [OPTIONS]

SUBCOMMANDS:
  inject       Inject checkpoint tasks into task breakdown
  workflow     Generate complete workflow section for TRD
  complexity   Analyze task complexity and checkpoint strategy
  validate     Validate TRD structure and content
  help         Show this help message

INJECT OPTIONS:
  --input FILE     Input JSON file with task breakdown (required)
  --output FILE    Output JSON file with enhanced task breakdown (required)

WORKFLOW OPTIONS:
  --input FILE     Input JSON file with TRD context (required)
  --output FILE    Output markdown file with workflow section (required)

COMPLEXITY OPTIONS:
  --input FILE     Input JSON file with task breakdown (required)
  --json           Output in JSON format (optional)

VALIDATE OPTIONS:
  --input FILE     Input TRD markdown file (required)
  --json           Output in JSON format (optional)

EXAMPLES:
  # Inject checkpoints
  ai-mesh trd-workflow inject --input tasks.json --output enhanced.json

  # Generate workflow section
  ai-mesh trd-workflow workflow --input trd.json --output workflow.md

  # Analyze complexity
  ai-mesh trd-workflow complexity --input tasks.json

  # Validate TRD structure
  ai-mesh trd-workflow validate --input trd.md

For more information, visit: https://github.com/FortiumPartners/claude-config
`);
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Parse command line arguments
   * @param {string[]} args - Command arguments
   * @param {string[]} flags - Expected flag names
   * @returns {Object} Parsed arguments
   */
  parseArgs(args, flags) {
    const parsed = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('--')) {
        const flag = arg.slice(2);

        if (flags.includes(flag)) {
          // Check if next arg is a value (doesn't start with --)
          if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
            parsed[flag] = args[i + 1];
            i++; // Skip next arg
          } else {
            // Boolean flag
            parsed[flag] = true;
          }
        }
      }
    }

    return parsed;
  }

  /**
   * Read JSON file
   * @param {string} filePath - Path to JSON file
   * @returns {Promise<Object>} Parsed JSON data
   */
  async readJsonFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      } else if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in file: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Write JSON file
   * @param {string} filePath - Path to JSON file
   * @param {Object} data - Data to write
   * @returns {Promise<void>}
   */
  async writeJsonFile(filePath, data) {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Count checkpoint tasks in enhanced breakdown
   * @param {Object} taskBreakdown - Task breakdown object
   * @returns {number} Checkpoint count
   */
  countCheckpoints(taskBreakdown) {
    let count = 0;

    const countInArray = (tasks) => {
      if (!Array.isArray(tasks)) return;

      for (const task of tasks) {
        if (task.id && task.id.includes('CHECKPOINT')) {
          count++;
        }
        if (task.subtasks) {
          countInArray(task.subtasks);
        }
      }
    };

    if (taskBreakdown.sprints) {
      for (const sprint of taskBreakdown.sprints) {
        countInArray(sprint.tasks);
      }
    } else if (taskBreakdown.phases) {
      for (const phase of taskBreakdown.phases) {
        countInArray(phase.tasks);
      }
    } else if (taskBreakdown.tasks) {
      countInArray(taskBreakdown.tasks);
    }

    return count;
  }

  /**
   * Count total tasks
   * @param {Object} taskBreakdown - Task breakdown object
   * @returns {number} Total task count
   */
  countTasks(taskBreakdown) {
    let count = 0;

    const countInArray = (tasks) => {
      if (!Array.isArray(tasks)) return;

      for (const task of tasks) {
        count++;
        if (task.subtasks) {
          countInArray(task.subtasks);
        }
      }
    };

    if (taskBreakdown.sprints) {
      for (const sprint of taskBreakdown.sprints) {
        countInArray(sprint.tasks);
      }
    } else if (taskBreakdown.phases) {
      for (const phase of taskBreakdown.phases) {
        countInArray(phase.tasks);
      }
    } else if (taskBreakdown.tasks) {
      countInArray(taskBreakdown.tasks);
    }

    return count;
  }

  /**
   * Calculate total hours
   * @param {Object} taskBreakdown - Task breakdown object
   * @returns {number} Total hours
   */
  calculateTotalHours(taskBreakdown) {
    let total = 0;

    const sumHours = (tasks) => {
      if (!Array.isArray(tasks)) return;

      for (const task of tasks) {
        if (task.effort_hours) {
          total += task.effort_hours;
        }
        if (task.subtasks) {
          sumHours(task.subtasks);
        }
      }
    };

    if (taskBreakdown.sprints) {
      for (const sprint of taskBreakdown.sprints) {
        sumHours(sprint.tasks);
      }
    } else if (taskBreakdown.phases) {
      for (const phase of taskBreakdown.phases) {
        sumHours(phase.tasks);
      }
    } else if (taskBreakdown.tasks) {
      sumHours(taskBreakdown.tasks);
    }

    return total;
  }

  /**
   * Display complexity analysis in human-readable format
   * @param {Object} analysis - Analysis results
   */
  displayComplexityAnalysis(analysis) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPLEXITY ANALYSIS');
    console.log('='.repeat(60));
    console.log('');

    // Summary
    console.log('Summary:');
    console.log(`  Total tasks: ${analysis.summary.totalTasks}`);
    console.log(`  Total hours: ${analysis.summary.totalHours}h`);
    console.log(`  Phases: ${analysis.summary.phases}`);
    console.log(`  Sprints: ${analysis.summary.sprints}`);
    console.log('');

    // Task Types
    console.log('Task Types:');
    const typeMap = analysis.taskTypes.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(typeMap).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} tasks`);
    });
    console.log('');

    // Checkpoint Strategy
    console.log('Checkpoint Strategy:');
    console.log(`  Strategy: ${analysis.checkpointStrategy.strategy}`);
    console.log(`  Interval: ${analysis.checkpointStrategy.interval || 'N/A'}`);
    console.log(`  Reasoning: ${analysis.checkpointStrategy.reasoning}`);
    console.log('');

    console.log('='.repeat(60));
  }

  /**
   * Display validation result in human-readable format
   * @param {Object} validation - Validation results
   */
  displayValidationResult(validation) {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 TRD VALIDATION');
    console.log('='.repeat(60));
    console.log('');

    if (validation.valid) {
      console.log('✅ TRD structure is valid!');
      console.log('');

      if (validation.summary) {
        console.log('Summary:');
        Object.entries(validation.summary).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    } else {
      console.log('❌ TRD validation failed!');
      console.log('');

      if (validation.errors && validation.errors.length > 0) {
        console.log('Errors:');
        validation.errors.forEach(error => {
          console.log(`  • ${error}`);
        });
      }
      console.log('');

      if (validation.warnings && validation.warnings.length > 0) {
        console.log('Warnings:');
        validation.warnings.forEach(warning => {
          console.log(`  ⚠️  ${warning}`);
        });
      }
    }

    console.log('');
    console.log('='.repeat(60));
  }
}

module.exports = { TrdWorkflowCommands };
