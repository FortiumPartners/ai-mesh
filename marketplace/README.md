# AI Mesh Plugin Marketplace

**Official plugin ecosystem for the Fortium AI Mesh platform**

The AI Mesh Plugin Marketplace provides a curated collection of plugins that extend Claude Code with specialized agents, commands, skills, and workflows. All plugins are tested, validated, and follow Fortium's quality standards.

## Quick Start

### Browse Available Plugins

```bash
# View all plugins
ai-mesh-marketplace search

# Search by category
ai-mesh-marketplace search --category monitoring

# Search by tag
ai-mesh-marketplace search --tag wezterm
```

### Install a Plugin

```bash
# Install from registry
ai-mesh-marketplace install ai-mesh-pane-viewer

# Install specific version
ai-mesh-marketplace install ai-mesh-pane-viewer@1.0.0

# Install with npm directly
npm install -g @fortium/ai-mesh-pane-viewer
```

### Verify Installation

```bash
# Check installed plugins
ai-mesh plugins list

# Verify plugin health
ai-mesh plugins verify ai-mesh-pane-viewer
```

## Plugin Categories

### Core Plugins
Essential ai-mesh functionality that extends the base platform with critical capabilities.

### Monitoring Plugins
Real-time monitoring, metrics, and observability tools for agents and system performance.

### Workflow Plugins
Development workflow enhancements, automation, and productivity tools.

### Framework Plugins
Framework-specific tools and integrations (React, NestJS, Rails, Phoenix, etc.).

### Testing Plugins
Testing frameworks, quality assurance tools, and validation utilities.

### Infrastructure Plugins
Infrastructure automation, deployment tools, and DevOps integrations.

## Featured Plugins

### Pane Viewer
**Status:** Preview | **Category:** Monitoring

Real-time subagent monitoring in terminal panes (WezTerm, Zellij, tmux). See agent delegation, tool calls, and workflow orchestration as it happens.

```bash
ai-mesh-marketplace install ai-mesh-pane-viewer
```

**Features:**
- Live subagent activity monitoring
- Tool call tracking with performance metrics
- Multi-pane layouts for parallel monitoring
- Works with WezTerm, Zellij, and tmux

## Plugin Tiers

Plugins are organized into tiers based on functionality:

### Foundation Tier
Core platform extensions that provide fundamental capabilities.

### Workflow Tier
Development workflow enhancements and automation tools.

### Framework Tier
Framework-specific integrations and specialized tooling.

### Testing Tier
Quality assurance and testing infrastructure.

## Plugin Status

- **Stable:** Production-ready, fully tested, breaking changes follow semver
- **Preview:** Feature-complete but may have breaking changes before 1.0
- **Deprecated:** No longer maintained, migration path provided

## Submitting a Plugin

We welcome high-quality plugins from the community! Before submitting:

1. **Review Requirements:** Read [CONTRIBUTING.md](./docs/CONTRIBUTING.md)
2. **Develop Plugin:** Follow [PLUGIN_DEVELOPMENT.md](./docs/PLUGIN_DEVELOPMENT.md)
3. **Test Thoroughly:** Ensure 80%+ test coverage
4. **Submit PR:** Add your plugin to `registry/plugins.json`

### Submission Checklist

- [ ] Plugin follows naming convention (`ai-mesh-*`)
- [ ] Comprehensive README with examples
- [ ] Test coverage ≥80%
- [ ] Valid plugin.json manifest
- [ ] Open source license (MIT, Apache 2.0, etc.)
- [ ] Security review passed
- [ ] Documentation complete

## Quality Standards

All marketplace plugins must meet these standards:

### Code Quality
- ESLint/Prettier configured
- No high-severity linting errors
- Follows ai-mesh coding conventions

### Testing
- Unit tests ≥80% coverage
- Integration tests for key workflows
- E2E tests for user-facing features

### Documentation
- Clear README with installation and usage
- API documentation for public interfaces
- Example configurations and use cases

### Security
- No hardcoded credentials
- Input validation on all user data
- Dependencies scanned for vulnerabilities

### Performance
- Installation time <30 seconds
- Runtime overhead <100ms per operation
- Memory usage <50MB additional

## Plugin Development

### Plugin Structure

```
my-plugin/
├── plugin.json           # Plugin manifest (required)
├── package.json          # NPM package definition
├── README.md            # Plugin documentation
├── hooks/               # Development lifecycle hooks
│   └── hooks.json
├── commands/            # Custom commands
│   └── yaml/
├── agents/              # Specialized agents
│   └── *.yaml
├── skills/              # Domain expertise
│   └── */SKILL.md
└── tests/               # Test suite
    └── *.test.js
```

### Minimal Plugin Manifest

```json
{
  "name": "ai-mesh-my-plugin",
  "version": "1.0.0",
  "description": "My awesome ai-mesh plugin",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "repository": "https://github.com/yourusername/ai-mesh-my-plugin",
  "commands": "./commands",
  "agents": "./agents"
}
```

## Registry API

### Plugin Registry Format

The registry is a JSON file with all available plugins:

```
https://raw.githubusercontent.com/FortiumPartners/ai-mesh-marketplace/main/registry/plugins.json
```

### Fields

- **name:** Package name (must start with `ai-mesh-`)
- **displayName:** Human-readable name
- **version:** Current stable version (semver)
- **author:** Author information (name, email, url)
- **repository:** Source code repository URL
- **npm:** NPM package name (if published)
- **category:** Primary category (core, monitoring, workflow, etc.)
- **tags:** Search tags
- **tier:** Plugin tier (foundation, workflow, framework, testing)
- **status:** Development status (stable, preview, deprecated)
- **featured:** Show in featured section (boolean)

## CLI Reference

### Search Commands

```bash
# Search all plugins
ai-mesh-marketplace search

# Search by keyword
ai-mesh-marketplace search "monitoring"

# Filter by category
ai-mesh-marketplace search --category workflow

# Filter by tag
ai-mesh-marketplace search --tag nestjs

# Show plugin details
ai-mesh-marketplace show ai-mesh-pane-viewer
```

### Installation Commands

```bash
# Install latest version
ai-mesh-marketplace install <plugin-name>

# Install specific version
ai-mesh-marketplace install <plugin-name>@<version>

# Install with options
ai-mesh-marketplace install <plugin-name> --global
ai-mesh-marketplace install <plugin-name> --local

# Uninstall plugin
ai-mesh-marketplace uninstall <plugin-name>
```

### Management Commands

```bash
# List installed plugins
ai-mesh-marketplace list

# Update plugin
ai-mesh-marketplace update <plugin-name>

# Update all plugins
ai-mesh-marketplace update --all

# Verify plugin integrity
ai-mesh-marketplace verify <plugin-name>

# Check for updates
ai-mesh-marketplace outdated
```

## Support and Community

### Getting Help

- **Documentation:** [docs/](./docs/)
- **Issues:** [GitHub Issues](https://github.com/FortiumPartners/ai-mesh-marketplace/issues)
- **Discussions:** [GitHub Discussions](https://github.com/FortiumPartners/ai-mesh-marketplace/discussions)

### Contributing

We welcome contributions! See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for details.

### Plugin Support

Plugin-specific issues should be reported to the plugin's repository. The marketplace team only handles registry issues.

## Security

### Reporting Vulnerabilities

Report security issues to: security@fortiumpartners.com

### Plugin Security

All plugins are scanned for security issues before acceptance. However, you should:

- Review plugin code before installation
- Check plugin reputation and author
- Monitor for security updates
- Use plugins from trusted sources

## License

The marketplace infrastructure is MIT licensed. Individual plugins have their own licenses.

## Roadmap

### Q1 2026
- [ ] Plugin dependency resolution
- [ ] Automated testing framework
- [ ] Plugin compatibility matrix

### Q2 2026
- [ ] Plugin version manager
- [ ] Rollback capabilities
- [ ] Plugin analytics dashboard

### Q3 2026
- [ ] Community plugin ratings
- [ ] Plugin recommendations
- [ ] Automated security scanning

---

**Version:** 1.0.0
**Last Updated:** December 2025
**Maintainer:** Fortium Partners
