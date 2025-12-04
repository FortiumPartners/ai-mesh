# Contributing to AI Mesh Marketplace

Thank you for your interest in contributing to the AI Mesh Plugin Marketplace! This guide will help you submit high-quality plugins that enhance the AI Mesh ecosystem.

## Table of Contents

- [Plugin Requirements](#plugin-requirements)
- [Submission Process](#submission-process)
- [Review Criteria](#review-criteria)
- [Versioning Guidelines](#versioning-guidelines)
- [Quality Standards](#quality-standards)
- [Support and Maintenance](#support-and-maintenance)

## Plugin Requirements

### Naming Convention

All plugins must follow the naming convention:

```
ai-mesh-<descriptive-name>
```

**Examples:**
- `ai-mesh-pane-viewer` ✅
- `ai-mesh-react-optimizer` ✅
- `my-awesome-plugin` ❌ (missing prefix)
- `ai-mesh_monitor` ❌ (underscore instead of hyphen)

### Required Files

Every plugin must include:

1. **plugin.json** - Plugin manifest (see [PLUGIN_DEVELOPMENT.md](./PLUGIN_DEVELOPMENT.md))
2. **package.json** - NPM package definition
3. **README.md** - Comprehensive documentation
4. **LICENSE** - Open source license file
5. **CHANGELOG.md** - Version history

### Recommended Structure

```
ai-mesh-your-plugin/
├── plugin.json           # Plugin manifest (required)
├── package.json          # NPM package (required)
├── README.md            # Documentation (required)
├── LICENSE              # License file (required)
├── CHANGELOG.md         # Version history (required)
├── .gitignore           # Git ignore rules
├── .npmignore           # NPM ignore rules
├── hooks/               # Development hooks (optional)
│   └── hooks.json
├── commands/            # Custom commands (optional)
│   ├── yaml/
│   └── markdown/
├── agents/              # Specialized agents (optional)
│   └── *.yaml
├── skills/              # Domain expertise (optional)
│   └── */SKILL.md
├── config/              # Configuration templates (optional)
│   └── *.json
├── tests/               # Test suite (required)
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/                # Additional documentation (recommended)
    ├── API.md
    ├── EXAMPLES.md
    └── TROUBLESHOOTING.md
```

### License Requirements

Plugins must use an OSI-approved open source license:

- **MIT** (recommended)
- **Apache 2.0**
- **BSD 3-Clause**
- **GPL 3.0**
- Other OSI-approved licenses

Proprietary or closed-source plugins are not accepted in the marketplace.

## Submission Process

### 1. Develop Your Plugin

Follow the [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md) to create your plugin.

### 2. Test Thoroughly

Ensure your plugin meets quality standards:

```bash
# Run tests
npm test

# Check coverage (minimum 80%)
npm run test:coverage

# Lint code
npm run lint

# Validate plugin manifest
npx ai-mesh-validate plugin.json
```

### 3. Publish to NPM (Optional but Recommended)

```bash
# Login to NPM
npm login

# Publish your plugin
npm publish --access public

# Verify publication
npm view @yourorg/ai-mesh-your-plugin
```

### 4. Fork the Marketplace Repository

```bash
git clone https://github.com/FortiumPartners/ai-mesh-marketplace.git
cd ai-mesh-marketplace
git checkout -b add-plugin-your-plugin-name
```

### 5. Add Your Plugin to Registry

Edit `registry/plugins.json` and add your plugin:

```json
{
  "name": "ai-mesh-your-plugin",
  "displayName": "Your Plugin",
  "description": "Brief description of your plugin",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com",
    "url": "https://yourwebsite.com"
  },
  "repository": "https://github.com/yourusername/ai-mesh-your-plugin",
  "npm": "@yourorg/ai-mesh-your-plugin",
  "category": "workflow",
  "tags": ["automation", "productivity"],
  "tier": "workflow",
  "dependencies": {
    "ai-mesh-core": ">=4.0.0"
  },
  "status": "preview",
  "featured": false
}
```

### 6. Validate Registry

```bash
# Validate registry against schema
npm run validate:registry

# Run all checks
npm run test
```

### 7. Create Pull Request

```bash
git add registry/plugins.json
git commit -m "feat: add ai-mesh-your-plugin to registry"
git push origin add-plugin-your-plugin-name
```

Create a PR with the following template:

```markdown
## Plugin Submission: [Plugin Name]

### Plugin Information
- **Name:** ai-mesh-your-plugin
- **Version:** 1.0.0
- **Category:** workflow
- **Repository:** https://github.com/yourusername/ai-mesh-your-plugin
- **NPM:** @yourorg/ai-mesh-your-plugin (or N/A)

### Checklist
- [ ] Plugin follows naming convention (`ai-mesh-*`)
- [ ] All required files present (plugin.json, README.md, LICENSE, etc.)
- [ ] Test coverage ≥80%
- [ ] Documentation is comprehensive
- [ ] Repository is public
- [ ] License is OSI-approved
- [ ] No security vulnerabilities detected
- [ ] Plugin manifest validated successfully

### Description
[Brief description of what your plugin does and why it's useful]

### Testing
[Describe how you tested the plugin]

### Additional Notes
[Any additional context or notes for reviewers]
```

## Review Criteria

Your plugin will be reviewed against these criteria:

### 1. Code Quality (Weight: 25%)

- [ ] Follows JavaScript/TypeScript best practices
- [ ] Consistent code style (ESLint/Prettier configured)
- [ ] No high-severity linting errors
- [ ] Meaningful variable and function names
- [ ] Proper error handling
- [ ] No hardcoded credentials or secrets

### 2. Testing (Weight: 25%)

- [ ] Test coverage ≥80%
- [ ] Unit tests for core functionality
- [ ] Integration tests for key workflows
- [ ] E2E tests for user-facing features (if applicable)
- [ ] All tests passing in CI

### 3. Documentation (Weight: 20%)

- [ ] Comprehensive README with:
  - Clear description
  - Installation instructions
  - Usage examples
  - Configuration options
  - Troubleshooting guide
- [ ] API documentation for public interfaces
- [ ] Inline code comments where needed
- [ ] CHANGELOG with version history

### 4. Security (Weight: 15%)

- [ ] No known security vulnerabilities
- [ ] Input validation on all user data
- [ ] No exposure of sensitive information
- [ ] Dependencies scanned for vulnerabilities
- [ ] Proper permission declarations

### 5. Performance (Weight: 10%)

- [ ] Installation time <30 seconds
- [ ] Runtime overhead <100ms per operation
- [ ] Memory usage <50MB additional
- [ ] No blocking operations without async handling

### 6. Usability (Weight: 5%)

- [ ] Clear error messages
- [ ] Intuitive configuration
- [ ] Good user experience
- [ ] Helpful defaults

## Versioning Guidelines

Plugins must follow [Semantic Versioning](https://semver.org/):

### Version Format: MAJOR.MINOR.PATCH

**MAJOR version** when you make incompatible API changes:
```
1.0.0 → 2.0.0 (breaking changes)
```

**MINOR version** when you add functionality in a backward-compatible manner:
```
1.0.0 → 1.1.0 (new features, backward compatible)
```

**PATCH version** when you make backward-compatible bug fixes:
```
1.0.0 → 1.0.1 (bug fixes only)
```

### Pre-release Versions

Use pre-release identifiers for beta/alpha releases:

```
1.0.0-alpha.1
1.0.0-beta.1
1.0.0-rc.1
```

### Version Updates in Registry

When updating your plugin version:

1. Update `version` in `plugin.json`
2. Update `version` in `package.json`
3. Add entry to `CHANGELOG.md`
4. Submit PR to update registry version
5. Tag release in GitHub
6. Publish new version to NPM

## Quality Standards

### Code Quality Standards

**ESLint Configuration (Minimum):**
```json
{
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "no-undef": "error"
  }
}
```

**Prettier Configuration (Recommended):**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Testing Standards

**Minimum Coverage Requirements:**
- Overall coverage: ≥80%
- Statement coverage: ≥80%
- Branch coverage: ≥75%
- Function coverage: ≥80%
- Line coverage: ≥80%

**Test Structure:**
```javascript
describe('Plugin Feature', () => {
  describe('Unit Tests', () => {
    it('should handle valid input', () => {
      // Test implementation
    });

    it('should reject invalid input', () => {
      // Test error handling
    });
  });

  describe('Integration Tests', () => {
    it('should integrate with ai-mesh core', () => {
      // Integration test
    });
  });
});
```

### Documentation Standards

**README.md Template:**
```markdown
# AI Mesh [Plugin Name]

Brief description of your plugin.

## Installation

\`\`\`bash
npm install -g @yourorg/ai-mesh-your-plugin
\`\`\`

## Usage

Basic usage example with explanation.

## Configuration

Configuration options and defaults.

## Examples

Real-world usage examples.

## API Reference

Public API documentation.

## Troubleshooting

Common issues and solutions.

## Contributing

How to contribute to your plugin.

## License

License information.
```

### Security Standards

**Security Checklist:**
- [ ] No hardcoded credentials
- [ ] Environment variables for sensitive data
- [ ] Input validation on all user data
- [ ] Dependencies scanned with `npm audit`
- [ ] No eval() or Function() with user input
- [ ] Proper file permission handling
- [ ] XSS prevention in UI components
- [ ] SQL injection prevention (if applicable)

**Security Scanning:**
```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Check for outdated dependencies
npm outdated
```

## Support and Maintenance

### Expected Support Level

Plugin authors are expected to:

1. **Respond to Issues:** Within 7 days
2. **Security Updates:** Within 48 hours for critical issues
3. **Bug Fixes:** Regular updates for reported bugs
4. **Compatibility:** Maintain compatibility with latest ai-mesh versions
5. **Documentation:** Keep docs up-to-date with changes

### Deprecation Process

If you need to deprecate your plugin:

1. Update status to `"deprecated"` in registry
2. Add deprecation notice to README
3. Provide migration path or alternative
4. Maintain for 6 months before removal
5. Submit PR to update registry status

### Plugin Removal

Plugins may be removed from the registry if:

- Critical security issues remain unfixed for >30 days
- Plugin is abandoned (no updates for >1 year)
- Author requests removal
- Violates marketplace terms
- Causes system instability

## Getting Help

### Questions?

- **Documentation:** Review [PLUGIN_DEVELOPMENT.md](./PLUGIN_DEVELOPMENT.md)
- **Discussions:** [GitHub Discussions](https://github.com/FortiumPartners/ai-mesh-marketplace/discussions)
- **Issues:** [GitHub Issues](https://github.com/FortiumPartners/ai-mesh-marketplace/issues)
- **Email:** support@fortiumpartners.com

### Example Plugins

Study these plugins for reference:

- [ai-mesh-pane-viewer](https://github.com/FortiumPartners/ai-mesh-pane-viewer) - Monitoring plugin example

## Code of Conduct

All contributors must follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

By submitting a plugin, you agree that your plugin is licensed under an OSI-approved open source license and that you have the right to submit it to the marketplace.

---

**Thank you for contributing to AI Mesh!**

We appreciate your effort to make the AI Mesh ecosystem better for everyone.
