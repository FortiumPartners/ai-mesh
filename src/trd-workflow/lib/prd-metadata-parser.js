/**
 * PRD Metadata Parser - Production Implementation
 *
 * @module prd-metadata-parser
 * @description Production implementation of PRD YAML frontmatter parsing
 * Extracts workflow configuration from PRD files and validates structure.
 * @version 1.0.0
 * @created 2025-12-02
 * @related TRD-WORKFLOW-001, TASK-022
 */

/**
 * Parse PRD metadata from YAML frontmatter
 *
 * @param {string} prdContent - Raw PRD file content with YAML frontmatter
 * @returns {Object} Parsed metadata object
 * @throws {Error} If frontmatter is invalid or missing
 *
 * @example
 * const metadata = parsePrdMetadata(prdFileContent);
 * // => { workflow: { checkpoint_frequency: 'sprint', ... }, metadata: { ... } }
 */
export function parsePrdMetadata(prdContent) {
  if (!prdContent || typeof prdContent !== 'string') {
    throw new Error('Invalid PRD content: expected non-empty string');
  }

  // Extract YAML frontmatter
  const frontmatter = extractYamlFrontmatter(prdContent);

  if (!frontmatter) {
    // Return default configuration if no frontmatter
    return {
      workflow: getDefaultWorkflowConfig(),
      metadata: {},
      hasCustomConfig: false
    };
  }

  // Parse YAML frontmatter
  const parsed = parseYaml(frontmatter);

  // Extract workflow configuration
  const workflowConfig = parsed.workflow || getDefaultWorkflowConfig();

  // Extract general metadata
  const metadata = extractMetadata(parsed);

  return {
    workflow: workflowConfig,
    metadata,
    hasCustomConfig: !!parsed.workflow,
    raw: parsed
  };
}

/**
 * Extract YAML frontmatter from PRD content
 *
 * @param {string} content - PRD file content
 * @returns {string|null} YAML frontmatter content or null if not found
 * @private
 */
function extractYamlFrontmatter(content) {
  // Match YAML frontmatter pattern: ---\n...content...\n---
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match || !match[1]) {
    return null;
  }

  return match[1].trim();
}

/**
 * Parse YAML string to JavaScript object
 *
 * @param {string} yamlString - YAML content to parse
 * @returns {Object} Parsed object
 * @throws {Error} If YAML is invalid
 * @private
 */
function parseYaml(yamlString) {
  try {
    // Simple YAML parser for basic frontmatter (supports nested objects, arrays, booleans, numbers)
    const lines = yamlString.split('\n');
    const result = {};
    let contextStack = [{ obj: result, indent: -1, type: 'object' }];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) {
        continue;
      }

      // Calculate indentation
      const indent = line.search(/\S/);
      const trimmedLine = line.trim();

      // Pop context stack if indent decreased
      while (contextStack.length > 1 && indent <= contextStack[contextStack.length - 1].indent) {
        contextStack.pop();
      }

      const currentStackItem = contextStack[contextStack.length - 1];
      const currentContext = currentStackItem.obj;

      // Parse line
      if (trimmedLine.startsWith('- ')) {
        // Array item
        const itemContent = trimmedLine.substring(2).trim();

        if (!Array.isArray(currentContext)) {
          throw new Error(`Invalid YAML: expected array context at line ${i + 1}`);
        }

        // Check if this is an object array item (has nested properties)
        const nextLine = lines[i + 1];
        const isObjectItem = nextLine && nextLine.search(/\S/) > indent && !nextLine.trim().startsWith('- ');

        if (isObjectItem) {
          // Object array item with nested properties
          const newObj = itemContent ? parseInlineKeyValue(itemContent) : {};
          currentContext.push(newObj);
          contextStack.push({ obj: newObj, indent, type: 'object' });
        } else {
          // Simple array item
          const value = parseValue(itemContent);
          currentContext.push(value);
        }
      } else if (trimmedLine.includes(':')) {
        // Key-value pair
        const colonIndex = trimmedLine.indexOf(':');
        const key = trimmedLine.substring(0, colonIndex).trim();
        const valueStr = trimmedLine.substring(colonIndex + 1).trim();

        if (!valueStr) {
          // Object or array declaration
          const nextLine = lines[i + 1];
          if (nextLine && nextLine.trim().startsWith('- ')) {
            // Array
            currentContext[key] = [];
            contextStack.push({ obj: currentContext[key], indent, type: 'array' });
          } else {
            // Nested object
            currentContext[key] = {};
            contextStack.push({ obj: currentContext[key], indent, type: 'object' });
          }
        } else {
          // Direct value
          currentContext[key] = parseValue(valueStr);
        }
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to parse YAML frontmatter: ${error.message}`);
  }
}

/**
 * Parse inline key-value pair (e.g., "name: value" in array item)
 *
 * @param {string} content - Inline content
 * @returns {Object} Parsed object
 * @private
 */
function parseInlineKeyValue(content) {
  if (!content.includes(':')) {
    return {};
  }

  const colonIndex = content.indexOf(':');
  const key = content.substring(0, colonIndex).trim();
  const value = parseValue(content.substring(colonIndex + 1).trim());

  return { [key]: value };
}

/**
 * Parse YAML value to appropriate JavaScript type
 *
 * @param {string} value - Value string to parse
 * @returns {*} Parsed value (string, number, boolean, null)
 * @private
 */
function parseValue(value) {
  const trimmed = value.trim();

  // Remove quotes if present
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.substring(1, trimmed.length - 1);
  }

  // Boolean values
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Null value
  if (trimmed === 'null' || trimmed === '~') return null;

  // Number values
  if (/^-?\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Array (inline format)
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const items = trimmed.substring(1, trimmed.length - 1)
      .split(',')
      .map(item => parseValue(item.trim()));
    return items;
  }

  // Object (inline format) - basic support
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const obj = {};
    const content = trimmed.substring(1, trimmed.length - 1);
    const pairs = content.split(',');

    pairs.forEach(pair => {
      const [key, val] = pair.split(':').map(s => s.trim());
      if (key && val) {
        obj[key.replace(/['"]/g, '')] = parseValue(val);
      }
    });

    return obj;
  }

  // Default: string
  return trimmed;
}

/**
 * Extract general metadata from parsed frontmatter
 *
 * @param {Object} parsed - Parsed YAML object
 * @returns {Object} Metadata object
 * @private
 */
function extractMetadata(parsed) {
  const metadata = {};

  // Standard metadata fields
  const metadataFields = [
    'version', 'created', 'lastUpdated', 'author',
    'stakeholders', 'priority', 'status', 'title'
  ];

  metadataFields.forEach(field => {
    if (parsed[field] !== undefined) {
      metadata[field] = parsed[field];
    }
  });

  // Include metadata section if present
  if (parsed.metadata && typeof parsed.metadata === 'object') {
    Object.assign(metadata, parsed.metadata);
  }

  return metadata;
}

/**
 * Get default workflow configuration
 *
 * @returns {Object} Default workflow configuration
 * @private
 */
function getDefaultWorkflowConfig() {
  return {
    checkpoint_frequency: 'sprint',
    execution_command: '/implement-trd',
    quality_gates: {
      sprint: {
        enabled: true,
        gates: [
          {
            name: 'Unit Test Coverage',
            type: 'test_coverage',
            threshold: 80,
            required: true
          }
        ]
      },
      phase: {
        enabled: true,
        gates: [
          {
            name: 'Integration Test Coverage',
            type: 'integration_test',
            threshold: 70,
            required: true
          }
        ]
      },
      final: {
        enabled: true,
        gates: [
          {
            name: 'Full Test Suite',
            type: 'test_coverage',
            threshold: 85,
            required: true
          },
          {
            name: 'Security Audit',
            type: 'security_scan',
            required: true
          }
        ]
      }
    },
    git_workflow: {
      branch_naming: {
        pattern: 'feature/{trd-id}-{description}',
        description_format: 'kebab-case',
        max_length: 50
      },
      commit_conventions: {
        format: 'conventional',
        require_scope: false,
        require_body: false,
        include_task_ids: true,
        include_trd_reference: true
      },
      checkpoint_strategy: {
        auto_checkpoint: true,
        checkpoint_after_sprint: true,
        checkpoint_after_phase: true,
        custom_checkpoints: []
      }
    },
    delegation: {
      enable_auto_delegation: true,
      patterns: []
    },
    performance: {
      max_generation_time: 30,
      cache_templates: true,
      parallel_processing: false
    }
  };
}

/**
 * Extract workflow configuration section from parsed metadata
 *
 * @param {Object} metadata - Parsed metadata object
 * @returns {Object} Workflow configuration
 *
 * @example
 * const config = extractWorkflowConfig(parsedMetadata);
 * // => { checkpoint_frequency: 'sprint', execution_command: '/implement-trd', ... }
 */
export function extractWorkflowConfig(metadata) {
  if (!metadata || !metadata.workflow) {
    return getDefaultWorkflowConfig();
  }

  // Merge with defaults to ensure all required fields
  const defaults = getDefaultWorkflowConfig();
  return deepMerge(defaults, metadata.workflow);
}

/**
 * Deep merge two objects
 *
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 * @private
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Check if PRD content has YAML frontmatter
 *
 * @param {string} prdContent - PRD file content
 * @returns {boolean} True if frontmatter is present
 *
 * @example
 * if (hasFrontmatter(content)) {
 *   const metadata = parsePrdMetadata(content);
 * }
 */
export function hasFrontmatter(prdContent) {
  if (!prdContent || typeof prdContent !== 'string') {
    return false;
  }

  const frontmatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n/;
  return frontmatterRegex.test(prdContent);
}

/**
 * Get workflow configuration with helpful error messages
 *
 * @param {string} prdContent - PRD file content
 * @returns {Object} Result object with config or error
 *
 * @example
 * const result = getWorkflowConfig(prdContent);
 * if (result.success) {
 *   console.log(result.config);
 * } else {
 *   console.error(result.error);
 * }
 */
export function getWorkflowConfig(prdContent) {
  try {
    const metadata = parsePrdMetadata(prdContent);
    const config = extractWorkflowConfig(metadata);

    return {
      success: true,
      config,
      metadata: metadata.metadata,
      hasCustomConfig: metadata.hasCustomConfig
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      config: getDefaultWorkflowConfig(),
      usingDefaults: true
    };
  }
}
