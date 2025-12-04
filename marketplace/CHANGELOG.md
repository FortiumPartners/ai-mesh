# Changelog

All notable changes to the AI Mesh Plugin Marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial marketplace structure and infrastructure
- Plugin registry system with JSON schema validation
- CLI tools for searching, installing, and managing plugins
- Comprehensive documentation for contributors and plugin developers
- GitHub Actions workflow for registry validation
- Support for plugin categories and tiers
- Featured plugins system
- Plugin manifest schema (plugin.json)

### Features in Development
- [ ] Full npm installation integration
- [ ] Plugin asset copying (agents, commands, skills, hooks)
- [ ] Plugin dependency resolution
- [ ] Version compatibility checking
- [ ] Plugin update mechanism
- [ ] Uninstall functionality
- [ ] Plugin verification system
- [ ] Community ratings and reviews

## [1.0.0] - 2025-12-04

### Added
- Initial release of AI Mesh Plugin Marketplace
- Plugin registry with ai-mesh-pane-viewer as first plugin
- CLI commands: search, show, install (stub), list (stub), update (stub), verify (stub)
- Comprehensive documentation:
  - README.md with marketplace overview
  - CONTRIBUTING.md with submission guidelines
  - PLUGIN_DEVELOPMENT.md with development guide
- JSON schemas for registry and plugin manifests
- CI/CD with GitHub Actions for registry validation
- ESLint and Prettier configuration
- Jest testing framework setup
- MIT License

### Categories Supported
- Core: Essential ai-mesh functionality
- Monitoring: Agent and system monitoring tools
- Workflow: Development workflow enhancements
- Frameworks: Framework-specific tools
- Testing: Testing and quality tools
- Infrastructure: Infrastructure and deployment tools

### Plugin Tiers
- Foundation: Core platform extensions
- Workflow: Development workflow enhancements
- Framework: Framework-specific integrations
- Testing: Quality assurance and testing

### Known Limitations
- CLI install command is a stub (basic functionality only)
- No actual plugin installation implementation yet
- No plugin asset copying implemented
- No dependency resolution
- No update/uninstall functionality

## [0.1.0] - 2025-12-04

### Added
- Project scaffolding
- Directory structure
- Initial documentation templates

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes
