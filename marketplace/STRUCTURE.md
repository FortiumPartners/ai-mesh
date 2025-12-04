# AI Mesh Marketplace Structure

This document provides an overview of the marketplace structure and its components.

## Directory Structure

```
marketplace/
├── README.md                                    # Main marketplace documentation
├── CHANGELOG.md                                 # Version history
├── LICENSE                                      # MIT License
├── STRUCTURE.md                                 # This file
├── package.json                                 # NPM package definition
├── jest.config.js                               # Jest testing configuration
├── .gitignore                                   # Git ignore rules
├── .npmignore                                   # NPM ignore rules
├── .eslintrc.json                               # ESLint configuration
├── .prettierrc                                  # Prettier configuration
│
├── cli/                                         # CLI tools
│   ├── index.js                                 # Main CLI entry point
│   ├── install.js                               # Plugin installation tool
│   └── search.js                                # Plugin search and discovery tool
│
├── registry/                                    # Plugin registry
│   └── plugins.json                             # Central plugin registry
│
├── schemas/                                     # JSON schemas
│   ├── registry-schema.json                     # Registry validation schema
│   └── plugin-schema.json                       # Plugin manifest schema
│
├── docs/                                        # Documentation
│   ├── CONTRIBUTING.md                          # Contribution guidelines
│   ├── PLUGIN_DEVELOPMENT.md                    # Plugin development guide
│   └── CODE_OF_CONDUCT.md                       # Community code of conduct
│
└── .github/                                     # GitHub configuration
    └── workflows/
        └── validate-registry.yml                # CI workflow for registry validation
```

## Component Overview

### Core Files

#### README.md
Main marketplace documentation including:
- Quick start guide
- Plugin categories and tiers
- Installation instructions
- Submission process
- Quality standards

#### package.json
NPM package definition for `@fortium/ai-mesh-marketplace` CLI tool with:
- Dependencies: commander, chalk, ora, inquirer, semver, node-fetch
- Dev dependencies: jest, eslint, prettier, ajv
- Scripts: test, lint, validate, CI
- Bin command: `ai-mesh-marketplace`

### CLI Tools

#### cli/index.js
Main CLI entry point with commands:
- `search [query]` - Search for plugins
- `show <plugin-name>` - Show plugin details
- `install <plugin-name>` - Install a plugin (stub)
- `uninstall <plugin-name>` - Uninstall a plugin (stub)
- `list` - List installed plugins (stub)
- `update [plugin-name]` - Update plugins (stub)
- `verify <plugin-name>` - Verify installation (stub)
- `outdated` - Check for updates (stub)

#### cli/install.js
Plugin installation tool (partially implemented):
- Fetches registry from GitHub
- Validates plugin existence
- Displays plugin information
- TODO: Full installation implementation

#### cli/search.js
Plugin search and discovery tool (fully functional):
- Searches by query, category, tag, status
- Displays formatted results
- Shows detailed plugin information
- Fetches live registry data

### Registry System

#### registry/plugins.json
Central plugin registry with:
- Plugin metadata (name, version, description, author)
- Repository and NPM package information
- Categories, tags, tiers, status
- Dependencies and compatibility
- Featured plugin flags
- Registry metadata and statistics

Current plugins:
- **ai-mesh-pane-viewer** (v1.0.0) - Real-time subagent monitoring

#### schemas/registry-schema.json
JSON Schema for validating registry with:
- Required fields validation
- Version format validation (semver)
- URL format validation
- Category/tier enum validation
- Metadata consistency checks

#### schemas/plugin-schema.json
JSON Schema for validating plugin manifests with:
- Plugin naming conventions
- Semantic versioning
- Author and contributor formats
- Asset path definitions (hooks, commands, agents, skills)
- Dependency specifications
- AI Mesh-specific configuration
- Permission declarations

### Documentation

#### docs/CONTRIBUTING.md
Comprehensive contribution guide with:
- Plugin requirements and naming conventions
- Submission process (8 steps)
- Review criteria (6 categories with weights)
- Versioning guidelines (semver)
- Quality standards (code, testing, documentation, security)
- Support and maintenance expectations

#### docs/PLUGIN_DEVELOPMENT.md
Complete plugin development guide with:
- Plugin structure requirements
- Manifest format and fields
- Hooks development patterns
- Commands development (YAML + markdown)
- Agents development (YAML definitions)
- Skills development (SKILL.md + REFERENCE.md)
- Testing requirements (unit, integration, e2e)
- Publishing workflow

#### docs/CODE_OF_CONDUCT.md
Community code of conduct based on Contributor Covenant 2.1

### CI/CD

#### .github/workflows/validate-registry.yml
Automated registry validation workflow that runs on PRs and pushes:
- Schema validation with ajv
- Metadata consistency checks
- Duplicate name detection
- URL accessibility verification
- Semver version validation
- Category validation
- Required fields verification
- Timestamp validation
- Generates validation report

## Plugin Categories

1. **Core** (⚙️) - Essential ai-mesh functionality
2. **Monitoring** (📊) - Agent and system monitoring tools
3. **Workflow** (🔄) - Development workflow enhancements
4. **Frameworks** (🏗️) - Framework-specific tools
5. **Testing** (✅) - Testing and quality tools
6. **Infrastructure** (🚀) - Infrastructure and deployment tools

## Plugin Tiers

1. **Foundation** (Priority 1) - Core platform extensions
2. **Workflow** (Priority 2) - Workflow enhancements
3. **Framework** (Priority 3) - Framework integrations
4. **Testing** (Priority 4) - QA infrastructure

## Plugin Status

- **Stable** - Production-ready, breaking changes follow semver
- **Preview** - Feature-complete but may have breaking changes
- **Deprecated** - No longer maintained, migration path provided

## Quality Standards

### Code Quality
- ESLint configured with recommended rules
- Prettier formatting
- No high-severity linting errors
- Meaningful naming conventions

### Testing
- Coverage ≥80% (overall, statements, functions, lines)
- Branch coverage ≥75%
- Unit, integration, and e2e tests

### Documentation
- Comprehensive README
- API documentation
- Examples and troubleshooting
- CHANGELOG with version history

### Security
- No hardcoded credentials
- Input validation
- Dependency scanning with npm audit
- Proper permission declarations

### Performance
- Installation time <30 seconds
- Runtime overhead <100ms per operation
- Memory usage <50MB additional

## Implementation Status

### ✅ Completed
- [x] Marketplace structure and documentation
- [x] Registry system with JSON schema
- [x] Plugin search functionality
- [x] Plugin manifest schema
- [x] Contribution guidelines
- [x] Plugin development guide
- [x] CI/CD validation workflow
- [x] ESLint and Prettier configuration
- [x] Jest testing setup
- [x] CLI scaffolding

### 🚧 In Progress (Stubs)
- [ ] Full install functionality
- [ ] Uninstall functionality
- [ ] List installed plugins
- [ ] Update plugins
- [ ] Verify installation
- [ ] Check for outdated plugins

### 📋 Planned
- [ ] Plugin dependency resolution
- [ ] Version compatibility checking
- [ ] Plugin asset copying (agents, commands, skills, hooks)
- [ ] Post-install hooks execution
- [ ] Community ratings and reviews
- [ ] Plugin analytics dashboard
- [ ] Automated security scanning

## Usage Examples

### Search for Plugins
```bash
# Search all plugins
ai-mesh-marketplace search

# Search by keyword
ai-mesh-marketplace search "monitoring"

# Filter by category
ai-mesh-marketplace search --category monitoring

# Show featured only
ai-mesh-marketplace search --featured
```

### Show Plugin Details
```bash
ai-mesh-marketplace show ai-mesh-pane-viewer
```

### Install Plugin (Stub)
```bash
ai-mesh-marketplace install ai-mesh-pane-viewer
```

## Registry URL

Live registry:
```
https://raw.githubusercontent.com/FortiumPartners/ai-mesh-marketplace/main/registry/plugins.json
```

## Next Steps

1. Implement full installation functionality
2. Add plugin asset copying
3. Implement dependency resolution
4. Add plugin verification
5. Create plugin template repository
6. Publish to npm as `@fortium/ai-mesh-marketplace`
7. Integrate with main ai-mesh CLI
8. Add community features (ratings, reviews)

## Self-Contained Design

This marketplace structure is designed to be self-contained and can be:

1. **Extracted to separate repository**: All files are self-contained with no dependencies on parent structure
2. **Published as NPM package**: package.json is ready for npm publishing
3. **Independently maintained**: Has its own CI/CD, documentation, and versioning
4. **Integrated with ai-mesh**: Can be used as part of ai-mesh or standalone

## Contact

- **Issues**: https://github.com/FortiumPartners/ai-mesh-marketplace/issues
- **Discussions**: https://github.com/FortiumPartners/ai-mesh-marketplace/discussions
- **Email**: support@fortiumpartners.com

---

**Version**: 1.0.0
**Last Updated**: December 4, 2025
**Maintainer**: Fortium Partners
