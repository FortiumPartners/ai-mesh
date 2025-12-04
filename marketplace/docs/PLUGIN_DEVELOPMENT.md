# AI Mesh Plugin Development Guide

Comprehensive guide to developing plugins for the AI Mesh ecosystem.

## Table of Contents

- [Getting Started](#getting-started)
- [Plugin Structure](#plugin-structure)
- [Plugin Manifest](#plugin-manifest)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Publishing](#publishing)
- [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Claude Code installed
- AI Mesh Core installed (`npm install -g @fortium/ai-mesh`)
- Git for version control

### Create Plugin from Template

```bash
# Use the plugin scaffold generator
npx @fortium/ai-mesh create-plugin ai-mesh-my-plugin

# Or manually create structure
mkdir ai-mesh-my-plugin
cd ai-mesh-my-plugin
npm init -y
```

### Initial Setup

```bash
# Initialize git repository
git init

# Install development dependencies
npm install --save-dev \
  jest \
  eslint \
  prettier \
  @types/node

# Create initial structure
mkdir -p hooks commands/yaml agents skills tests
```

## Plugin Structure

### Directory Layout

```
ai-mesh-my-plugin/
├── plugin.json              # Plugin manifest (required)
├── package.json             # NPM package definition (required)
├── README.md               # Plugin documentation (required)
├── LICENSE                 # License file (required)
├── CHANGELOG.md            # Version history (required)
├── .gitignore              # Git ignore rules
├── .npmignore              # NPM ignore rules
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── jest.config.js          # Jest configuration
├── hooks/                  # Development lifecycle hooks
│   ├── hooks.json          # Hook definitions
│   └── handlers/           # Hook implementation scripts
│       ├── pre-commit.js
│       └── post-command.js
├── commands/               # Custom Claude Code commands
│   ├── yaml/               # Command YAML definitions
│   │   └── my-command.yaml
│   └── markdown/           # Command documentation
│       └── my-command.md
├── agents/                 # Specialized agents
│   ├── my-agent.yaml       # Agent definition
│   └── README.md           # Agent documentation
├── skills/                 # Domain expertise
│   └── my-skill/
│       ├── SKILL.md        # Quick reference
│       └── REFERENCE.md    # Comprehensive guide
├── config/                 # Configuration templates
│   ├── default.json
│   └── schema.json
├── src/                    # Source code (if programmatic)
│   ├── index.js
│   └── utils/
├── tests/                  # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/                   # Additional documentation
    ├── API.md
    ├── EXAMPLES.md
    └── TROUBLESHOOTING.md
```

## Plugin Manifest

### plugin.json Format

The `plugin.json` file is the core manifest for your plugin:

```json
{
  "name": "ai-mesh-my-plugin",
  "version": "1.0.0",
  "description": "Detailed description of what your plugin does",
  "displayName": "My Plugin",
  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "url": "https://yourwebsite.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/ai-mesh-my-plugin"
  },
  "homepage": "https://github.com/yourusername/ai-mesh-my-plugin#readme",
  "bugs": {
    "url": "https://github.com/yourusername/ai-mesh-my-plugin/issues",
    "email": "bugs@example.com"
  },
  "keywords": ["ai-mesh", "claude-code", "automation"],
  "license": "MIT",
  "category": "workflow",
  "tier": "workflow",
  "hooks": "./hooks/hooks.json",
  "commands": "./commands",
  "agents": "./agents",
  "skills": "./skills",
  "config": "./config",
  "dependencies": {
    "ai-mesh-core": ">=4.0.0"
  },
  "engines": {
    "claude-code": ">=1.0.0",
    "node": ">=18.0.0"
  },
  "aiMesh": {
    "minVersion": "4.0.0",
    "permissions": {
      "filesystem": {
        "read": ["~/.ai-mesh/config"],
        "write": ["~/.ai-mesh/plugins/my-plugin"]
      },
      "tools": ["Read", "Write", "Bash"]
    },
    "configuration": {
      "schema": "./config/schema.json",
      "defaults": "./config/default.json"
    }
  }
}
```

### Key Fields Explained

**Required Fields:**
- `name`: Must start with `ai-mesh-` (e.g., `ai-mesh-my-plugin`)
- `version`: Semantic version (e.g., `1.0.0`)
- `description`: Clear, concise description (10-500 characters)

**Author Information:**
- `author.name`: Your name or organization
- `author.email`: Contact email
- `author.url`: Personal or company website

**Repository:**
- `repository`: GitHub URL or repository object
- `homepage`: Documentation/project homepage
- `bugs`: Issue tracker URL

**Classification:**
- `category`: One of: core, monitoring, workflow, frameworks, testing, infrastructure
- `tier`: One of: foundation, workflow, framework, testing
- `keywords`: Array of search terms

**Plugin Assets:**
- `hooks`: Path to hooks.json (development lifecycle hooks)
- `commands`: Path to commands directory
- `agents`: Path to agents directory
- `skills`: Path to skills directory
- `config`: Path to configuration directory

**Dependencies:**
- `dependencies`: Runtime dependencies (always include `ai-mesh-core`)
- `peerDependencies`: Expected environment dependencies
- `engines`: Required Claude Code and Node.js versions

**AI Mesh Configuration:**
- `aiMesh.minVersion`: Minimum ai-mesh version
- `aiMesh.permissions`: Required permissions (filesystem, network, tools)
- `aiMesh.configuration`: Configuration schema and defaults

## Development Workflow

### 1. Hooks Development

Hooks allow your plugin to intercept development lifecycle events.

**hooks/hooks.json:**
```json
{
  "pre-commit": {
    "enabled": true,
    "script": "./hooks/handlers/pre-commit.js",
    "description": "Run before git commit"
  },
  "post-command": {
    "enabled": true,
    "script": "./hooks/handlers/post-command.js",
    "description": "Run after any command execution"
  },
  "tool-metrics": {
    "enabled": true,
    "script": "./hooks/handlers/tool-metrics.js",
    "description": "Track tool usage metrics"
  }
}
```

**hooks/handlers/pre-commit.js:**
```javascript
#!/usr/bin/env node

/**
 * Pre-commit hook for ai-mesh-my-plugin
 * Validates code before allowing commit
 */

async function preCommit() {
  console.log('Running pre-commit checks...');

  // Run linting
  const { execSync } = require('child_process');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
  } catch (error) {
    console.error('Linting failed. Fix errors before committing.');
    process.exit(1);
  }

  // Run tests
  try {
    execSync('npm test', { stdio: 'inherit' });
  } catch (error) {
    console.error('Tests failed. Fix tests before committing.');
    process.exit(1);
  }

  console.log('✓ Pre-commit checks passed');
}

preCommit().catch(error => {
  console.error('Pre-commit hook failed:', error);
  process.exit(1);
});
```

### 2. Commands Development

Commands extend Claude Code with custom functionality.

**commands/yaml/analyze-code.yaml:**
```yaml
---
name: analyze-code
description: Analyze code quality and suggest improvements
tools:
  - Read
  - Glob
category: quality
---

## Mission
Analyze codebase for quality issues, technical debt, and improvement opportunities.

## Workflow

1. **Discover Files**
   - Use Glob to find all source files
   - Filter by language and framework
   - Exclude node_modules and build artifacts

2. **Analyze Each File**
   - Read file contents
   - Check for code smells
   - Identify refactoring opportunities
   - Assess test coverage

3. **Generate Report**
   - Summarize findings by category
   - Prioritize issues by severity
   - Provide actionable recommendations
   - Include code examples

## Success Criteria
- All source files analyzed
- Issues categorized by severity
- Recommendations are specific and actionable
- Report generated in markdown format
```

**commands/markdown/analyze-code.md:**
```markdown
# /analyze-code Command

Comprehensive code quality analysis with actionable recommendations.

## Usage

\`\`\`
/analyze-code
\`\`\`

Options:
- `--path <dir>`: Directory to analyze (default: current directory)
- `--severity <level>`: Filter by severity (critical, high, medium, low)
- `--format <type>`: Output format (markdown, json, html)

## Examples

Analyze current directory:
\`\`\`
/analyze-code
\`\`\`

Analyze specific directory:
\`\`\`
/analyze-code --path ./src
\`\`\`

Show only critical issues:
\`\`\`
/analyze-code --severity critical
\`\`\`

## Output

The command generates a comprehensive report including:

- Code quality metrics
- Technical debt assessment
- Security vulnerabilities
- Performance issues
- Best practice violations
- Refactoring recommendations
\`\`\`
```

### 3. Agents Development

Agents are specialized AI personas for specific tasks.

**agents/code-quality-analyzer.yaml:**
```yaml
---
name: code-quality-analyzer
description: Expert in code quality analysis and technical debt assessment
tools:
  - Read
  - Glob
  - Grep
---

## Mission

Analyze codebases for quality issues, technical debt, and improvement opportunities. Provide actionable recommendations following industry best practices.

## Core Responsibilities

1. **Code Quality Analysis**
   - Identify code smells and anti-patterns
   - Assess maintainability and readability
   - Check adherence to coding standards
   - Evaluate test coverage

2. **Technical Debt Assessment**
   - Quantify technical debt
   - Prioritize remediation efforts
   - Estimate impact on development velocity
   - Track debt over time

3. **Recommendation Generation**
   - Provide specific, actionable improvements
   - Include code examples and refactoring patterns
   - Prioritize by impact and effort
   - Consider team context and constraints

## Behavior

- **Systematic**: Analyze all relevant files methodically
- **Objective**: Base findings on measurable criteria
- **Constructive**: Frame issues as improvement opportunities
- **Practical**: Prioritize high-impact, low-effort changes

## Quality Standards

- Analysis coverage: 100% of source files
- Issue categorization: Critical, High, Medium, Low
- Recommendation specificity: Include file/line references
- Report clarity: Non-technical stakeholders can understand

## Delegation

**Handoff To:**
- **refactoring-specialist**: For complex refactoring implementations
- **test-coverage-analyzer**: For detailed test analysis
- **security-scanner**: For security-focused reviews

**Handoff From:**
- **tech-lead-orchestrator**: When code review is requested
- **quality-gate-enforcer**: For DoD validation
```

### 4. Skills Development

Skills provide domain-specific expertise and patterns.

**skills/react-performance/SKILL.md:**
```markdown
# React Performance Optimization Skills

Quick reference for React performance optimization patterns and best practices.

## Core Techniques

### 1. Memoization

\`\`\`jsx
// useMemo for expensive calculations
const expensiveResult = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// useCallback for stable function references
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// React.memo for component memoization
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data.name}</div>;
});
\`\`\`

### 2. Code Splitting

\`\`\`jsx
// Route-based splitting
const Dashboard = lazy(() => import('./Dashboard'));

// Component-based splitting
const HeavyChart = lazy(() => import('./HeavyChart'));

<Suspense fallback={<Loading />}>
  <HeavyChart />
</Suspense>
\`\`\`

### 3. Virtual Lists

\`\`\`jsx
import { FixedSizeList } from 'react-window';

const VirtualList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <div style={style}>{items[index]}</div>
    )}
  </FixedSizeList>
);
\`\`\`

## Performance Checklist

- [ ] Use React DevTools Profiler to identify bottlenecks
- [ ] Memoize expensive calculations with useMemo
- [ ] Stabilize callbacks with useCallback
- [ ] Implement code splitting for large components
- [ ] Use virtual lists for long lists
- [ ] Optimize re-renders with React.memo
- [ ] Avoid inline function/object creation in render
- [ ] Use production build for benchmarking
```

## Testing

### Unit Testing

**tests/unit/analyzer.test.js:**
```javascript
const { analyzeCode } = require('../../src/analyzer');

describe('Code Analyzer', () => {
  describe('analyzeCode()', () => {
    it('should identify code smells', () => {
      const code = `
        function badFunction() {
          var x = 1; // var instead of const/let
          if (x == 1) { // == instead of ===
            console.log(x);
          }
        }
      `;

      const result = analyzeCode(code);

      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].type).toBe('var-usage');
      expect(result.issues[1].type).toBe('loose-equality');
    });

    it('should handle empty code gracefully', () => {
      const result = analyzeCode('');

      expect(result.issues).toHaveLength(0);
      expect(result.summary.totalIssues).toBe(0);
    });
  });
});
```

### Integration Testing

**tests/integration/command.test.js:**
```javascript
const { executeCommand } = require('@fortium/ai-mesh-core');

describe('analyze-code command', () => {
  it('should analyze sample project', async () => {
    const result = await executeCommand('analyze-code', {
      path: './tests/fixtures/sample-project'
    });

    expect(result.success).toBe(true);
    expect(result.report).toBeDefined();
    expect(result.report.issues).toBeInstanceOf(Array);
  });
});
```

### E2E Testing

**tests/e2e/workflow.test.js:**
```javascript
const { ClaudeCodeSession } = require('@fortium/ai-mesh-testing');

describe('Code Analysis Workflow', () => {
  it('should complete full analysis workflow', async () => {
    const session = new ClaudeCodeSession();

    // Start analysis
    await session.runCommand('/analyze-code --path ./sample');

    // Verify output
    const output = await session.getOutput();
    expect(output).toContain('Analysis complete');
    expect(output).toContain('issues found');

    // Check generated report
    const report = await session.readFile('analysis-report.md');
    expect(report).toContain('## Critical Issues');
  });
});
```

### Coverage Requirements

Ensure your plugin meets minimum coverage:

```bash
# Run tests with coverage
npm run test:coverage

# Coverage requirements
# - Overall: ≥80%
# - Statements: ≥80%
# - Branches: ≥75%
# - Functions: ≥80%
# - Lines: ≥80%
```

## Publishing

### Pre-publish Checklist

- [ ] All tests passing (`npm test`)
- [ ] Coverage meets requirements (`npm run test:coverage`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation complete
- [ ] CHANGELOG updated
- [ ] Version bumped appropriately
- [ ] Git tag created

### Publish to NPM

```bash
# Login to NPM
npm login

# Dry run to check what will be published
npm publish --dry-run

# Publish to NPM
npm publish --access public

# Verify publication
npm view @yourorg/ai-mesh-my-plugin
```

### Submit to Marketplace

1. Fork marketplace repository
2. Add plugin to `registry/plugins.json`
3. Validate registry (`npm run validate:registry`)
4. Create pull request
5. Address review feedback
6. Merge and celebrate! 🎉

## Best Practices

### Code Quality

1. **Follow ESLint rules**: Configure and adhere to linting standards
2. **Use TypeScript**: For better type safety (optional but recommended)
3. **Write defensive code**: Validate inputs, handle errors gracefully
4. **Keep functions small**: Single responsibility principle
5. **Document complex logic**: Explain "why" not just "what"

### Performance

1. **Minimize dependencies**: Only include what you need
2. **Optimize startup time**: Lazy load heavy modules
3. **Cache expensive operations**: Memoize results when appropriate
4. **Use async operations**: Don't block the event loop
5. **Monitor memory usage**: Profile and optimize memory footprint

### Security

1. **Validate all inputs**: Never trust user input
2. **Use environment variables**: For sensitive configuration
3. **Scan dependencies**: Run `npm audit` regularly
4. **Avoid eval()**: Never use eval() with user input
5. **Follow least privilege**: Request minimum permissions needed

### Documentation

1. **Write clear READMEs**: Installation, usage, examples, troubleshooting
2. **Document public APIs**: JSDoc comments for exported functions
3. **Provide examples**: Real-world usage scenarios
4. **Keep CHANGELOG updated**: Document all changes
5. **Include troubleshooting**: Common issues and solutions

### Versioning

1. **Follow semver**: Major.Minor.Patch versioning
2. **Tag releases**: Create git tags for versions
3. **Write release notes**: Explain what changed and why
4. **Deprecate gracefully**: Provide migration paths
5. **Maintain backwards compatibility**: Until major version bump

## Examples

### Minimal Plugin Example

See [ai-mesh-plugin-template](https://github.com/FortiumPartners/ai-mesh-plugin-template) for a minimal working example.

### Full-Featured Plugin Example

See [ai-mesh-pane-viewer](https://github.com/FortiumPartners/ai-mesh-pane-viewer) for a production-ready plugin with all features.

## Getting Help

- **Documentation**: [Marketplace README](../README.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Discussions**: [GitHub Discussions](https://github.com/FortiumPartners/ai-mesh-marketplace/discussions)
- **Support**: support@fortiumpartners.com

---

**Happy Plugin Development!**

Build something awesome and share it with the AI Mesh community.
