# TRD Workflow Template Customization Guide

**Version**: 1.0.0-beta
**Created**: December 2, 2025
**TRD Reference**: TRD-WORKFLOW-001
**Audience**: Technical Leads, DevOps Engineers, Team Leads

---

## Overview

This guide explains how to customize TRD workflow templates to match your team's specific needs, processes, and tooling. Customization enables you to maintain consistency while adapting the workflow system to your organization's standards.

### What Can Be Customized

- Checkpoint frequency and triggers
- Quality gate definitions and thresholds
- Commit message formats and conventions
- Multi-agent delegation patterns
- Branch naming conventions
- Performance settings and timeouts

### Customization Levels

1. **Project-Level**: Per-PRD customization via frontmatter
2. **Team-Level**: Shared templates and standards
3. **Organization-Level**: Company-wide defaults and policies

---

## Table of Contents

- [Project-Level Customization](#project-level-customization)
- [Team-Level Templates](#team-level-templates)
- [Custom Quality Gates](#custom-quality-gates)
- [Custom Commit Templates](#custom-commit-templates)
- [Custom Delegation Patterns](#custom-delegation-patterns)
- [Tooling Integration](#tooling-integration)
- [Examples by Industry](#examples-by-industry)

---

## Project-Level Customization

### Basic Customization

Override defaults for specific projects using PRD frontmatter.

**Example: High-Security Project**

```yaml
---
workflow:
  checkpoint_frequency: sprint
  execution_command: /implement-trd

  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Test Coverage
          type: test_coverage
          threshold: 90  # Higher than default 80%
          required: true

        - name: Security Scan
          type: security_scan
          required: true

        - name: SAST Analysis
          type: static_analysis
          required: true
          command: npm run sast

    final:
      enabled: true
      gates:
        - name: Penetration Testing
          type: penetration_test
          required: true

        - name: Security Audit
          type: security_audit
          required: true

metadata:
  security_level: high
  compliance: [SOC2, HIPAA]
---
```

**Example: Fast-Paced Startup**

```yaml
---
workflow:
  checkpoint_frequency: manual  # Maximum flexibility
  execution_command: /implement-trd

  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Basic Tests
          type: test_coverage
          threshold: 60  # Lower for speed
          required: false

        - name: Security Scan
          type: security_scan
          required: true  # Still important

    final:
      enabled: true
      gates:
        - name: E2E Tests
          type: e2e_test
          required: false  # Optional for MVP

metadata:
  priority: speed
  stage: mvp
---
```

### Advanced Customization

**Custom Performance Settings**

```yaml
---
workflow:
  performance:
    parallel_task_limit: 5  # More parallelism for large team
    checkpoint_timeout: 600  # 10 minutes for complex checkpoints
    quality_gate_timeout: 1200  # 20 minutes for thorough validation
---
```

**Custom Branch Naming**

```yaml
---
workflow:
  git_workflow:
    branch_naming:
      pattern: "{team}/{trd-id}/{type}-{description}"
      # Example: platform/trd-auth-001/feature-jwt-validation
      description_format: kebab-case
      max_length: 60

    commit_conventions:
      format: conventional
      require_scope: true
      include_task_ids: true
      include_trd_reference: true
      include_team_tag: true  # Custom: Include team in footer
---
```

---

## Team-Level Templates

### Creating Team Templates

**Step 1: Create Template Directory**

```bash
mkdir -p team-templates/
```

**Step 2: Define Standard Template**

**File**: `team-templates/standard-prd-metadata.yaml`

```yaml
---
# Platform Engineering Team - Standard Configuration
# Version: 1.0.0
# Last Updated: 2025-12-02

workflow:
  checkpoint_frequency: sprint
  execution_command: /implement-trd

  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Test Coverage
          type: test_coverage
          threshold: 80
          required: true
          command: npm run test:coverage

        - name: Security Scan
          type: security_scan
          required: true
          command: npm run security:scan

        - name: ESLint
          type: code_quality
          required: true
          command: npm run lint

        - name: TypeScript Check
          type: type_check
          required: true
          command: npm run type-check

    phase:
      enabled: true
      gates:
        - name: Integration Tests
          type: integration_test
          threshold: 70
          required: true
          command: npm run test:integration

        - name: API Documentation
          type: documentation
          required: true
          description: OpenAPI spec must be up to date

    final:
      enabled: true
      gates:
        - name: Full Test Suite
          type: test_coverage
          threshold: 85
          required: true
          command: npm run test:all

        - name: E2E Tests
          type: e2e_test
          required: true
          command: npm run test:e2e

        - name: Performance Tests
          type: performance_test
          required: true
          command: npm run test:performance

        - name: Accessibility Tests
          type: accessibility
          required: true
          command: npm run test:a11y

  git_workflow:
    branch_naming:
      pattern: "platform/feature/{trd-id}-{description}"
      description_format: kebab-case
      max_length: 60

    commit_conventions:
      format: conventional
      require_scope: true
      include_task_ids: true
      include_trd_reference: true

    checkpoint_strategy:
      auto_checkpoint: true
      checkpoint_after_sprint: true
      checkpoint_after_phase: true

  delegation:
    enable_auto_delegation: true
    patterns:
      - task_type: frontend
        keywords: [UI, component, React, interface, form]
        agent: frontend-developer

      - task_type: backend
        keywords: [API, database, service, endpoint]
        agent: backend-developer

      - task_type: infrastructure
        keywords: [AWS, Kubernetes, Docker, Helm, deployment]
        agent: infrastructure-developer

  performance:
    parallel_task_limit: 3
    checkpoint_timeout: 300
    quality_gate_timeout: 600

metadata:
  team: Platform Engineering
  version: 1.0.0
---
```

**Step 3: Document Usage**

**File**: `team-templates/README.md`

```markdown
# Platform Engineering Team Templates

## Usage

Copy the appropriate template to the top of your PRD:

### Standard Projects
```bash
cat team-templates/standard-prd-metadata.yaml > new-prd.md
# Then add your PRD content
```

### High-Security Projects
```bash
cat team-templates/high-security-prd-metadata.yaml > new-prd.md
```

### MVP/Prototype Projects
```bash
cat team-templates/mvp-prd-metadata.yaml > new-prd.md
```

## Customization

You can override any setting in the template for specific projects.
```

### Template Variants

Create specialized variants for different scenarios:

**High-Security Template**: `team-templates/high-security-prd-metadata.yaml`
**MVP Template**: `team-templates/mvp-prd-metadata.yaml`
**Infrastructure Template**: `team-templates/infrastructure-prd-metadata.yaml`
**Mobile Template**: `team-templates/mobile-prd-metadata.yaml`

---

## Custom Quality Gates

### Defining Custom Gate Types

You can create custom quality gate types for your specific tooling:

```yaml
quality_gates:
  sprint:
    gates:
      # Standard gates
      - name: Unit Test Coverage
        type: test_coverage
        threshold: 80
        required: true

      # Custom gate: Lighthouse performance
      - name: Lighthouse Performance
        type: lighthouse
        threshold: 90
        required: true
        command: npm run lighthouse
        description: Lighthouse performance score ≥ 90

      # Custom gate: Bundle size check
      - name: Bundle Size Check
        type: bundle_size
        threshold: 500  # KB
        required: true
        command: npm run bundle:analyze
        description: Bundle size must be < 500KB

      # Custom gate: Dependency audit
      - name: Dependency License Check
        type: license_check
        required: true
        command: npm run license:check
        description: All dependencies must have approved licenses
```

### Industry-Specific Gates

**Healthcare/HIPAA Compliance**

```yaml
quality_gates:
  sprint:
    gates:
      - name: PHI Data Protection
        type: phi_check
        required: true
        command: npm run phi:scan
        description: Verify no PHI in logs or error messages

      - name: Encryption Validation
        type: encryption_check
        required: true
        command: npm run encryption:validate
        description: All PHI must be encrypted at rest and in transit

  final:
    gates:
      - name: HIPAA Compliance Audit
        type: hipaa_audit
        required: true
        command: npm run compliance:hipaa
        description: Full HIPAA compliance validation
```

**Financial/PCI Compliance**

```yaml
quality_gates:
  sprint:
    gates:
      - name: PCI Data Scan
        type: pci_scan
        required: true
        command: npm run pci:scan
        description: No credit card data in logs or storage

      - name: Transaction Validation
        type: transaction_integrity
        required: true
        command: npm run transaction:validate
        description: All transactions must be idempotent

  final:
    gates:
      - name: PCI DSS Compliance
        type: pci_dss_audit
        required: true
        command: npm run compliance:pci-dss
        description: Full PCI DSS compliance validation
```

### Custom Gate Scripts

Create custom validation scripts:

**File**: `scripts/quality-gates/lighthouse-check.js`

```javascript
#!/usr/bin/env node

// Custom quality gate: Lighthouse performance check
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {logLevel: 'error', output: 'json', port: chrome.port};
  const runnerResult = await lighthouse('http://localhost:3000', options);

  const performanceScore = runnerResult.lhr.categories.performance.score * 100;

  console.log(`Lighthouse Performance Score: ${performanceScore}`);

  if (performanceScore < 90) {
    console.error(`❌ FAILED: Score ${performanceScore} is below threshold 90`);
    process.exit(1);
  }

  console.log(`✅ PASSED: Score ${performanceScore} meets threshold`);
  await chrome.kill();
}

runLighthouse();
```

**Add to package.json**:

```json
{
  "scripts": {
    "lighthouse": "node scripts/quality-gates/lighthouse-check.js"
  }
}
```

---

## Custom Commit Templates

### Customizing Commit Format

**Default Format**:
```
{type}({scope}): {subject}

{body}

{tasks}

Related: {TRD-ID}
```

**Custom Format with JIRA Integration**:
```
{type}({scope}): {subject}

{body}

{tasks}

Related: {TRD-ID}
JIRA: {JIRA-TICKET-ID}
Reviewed-By: {reviewers}
```

**Implementation in PRD**:

```yaml
workflow:
  git_workflow:
    commit_conventions:
      format: custom
      template: |
        {type}({scope}): {subject}

        {body}

        {tasks}

        Related: {TRD-ID}
        JIRA: {JIRA-TICKET-ID}
        Reviewed-By: {reviewers}
```

### Organization-Specific Commit Types

Add custom commit types:

```yaml
workflow:
  git_workflow:
    commit_conventions:
      format: conventional
      custom_types:
        - type: security
          description: Security-related changes
          example: "security(auth): patch JWT vulnerability"

        - type: compliance
          description: Compliance-related changes
          example: "compliance(gdpr): add data retention policy"

        - type: perf
          description: Performance improvements
          example: "perf(api): optimize database queries"
```

---

## Custom Delegation Patterns

### Domain-Specific Patterns

**E-Commerce Application**

```yaml
delegation:
  enable_auto_delegation: true
  patterns:
    - task_type: product_catalog
      keywords: [product, catalog, inventory, SKU]
      agent: backend-developer
      handoff_template: "Product catalog task requiring e-commerce domain expertise"

    - task_type: payment_processing
      keywords: [payment, stripe, checkout, cart, order]
      agent: backend-developer
      handoff_template: "Payment processing task requiring PCI compliance knowledge"

    - task_type: customer_experience
      keywords: [UI, UX, customer, shopping, cart]
      agent: frontend-developer
      handoff_template: "Customer experience task requiring UX expertise"
```

**DevOps/Platform**

```yaml
delegation:
  enable_auto_delegation: true
  patterns:
    - task_type: kubernetes
      keywords: [Kubernetes, K8s, pod, deployment, service]
      agent: infrastructure-developer
      handoff_template: "Kubernetes task requiring container orchestration expertise"

    - task_type: cicd
      keywords: [CI/CD, pipeline, GitHub Actions, Jenkins]
      agent: infrastructure-developer
      handoff_template: "CI/CD task requiring automation expertise"

    - task_type: monitoring
      keywords: [monitoring, observability, metrics, logging, tracing]
      agent: infrastructure-developer
      handoff_template: "Monitoring task requiring observability expertise"
```

### Multi-Team Patterns

```yaml
delegation:
  enable_auto_delegation: true
  patterns:
    - task_type: frontend_platform
      keywords: [React, component, UI library]
      agent: frontend-developer
      team: platform
      handoff_template: "Platform team frontend task"

    - task_type: frontend_product
      keywords: [feature, user flow, product]
      agent: frontend-developer
      team: product
      handoff_template: "Product team frontend task"

    - task_type: backend_platform
      keywords: [infrastructure, API gateway, shared service]
      agent: backend-developer
      team: platform
      handoff_template: "Platform team backend task"
```

---

## Tooling Integration

### GitHub Actions Integration

```yaml
workflow:
  quality_gates:
    sprint:
      gates:
        - name: Unit Tests
          type: test_coverage
          threshold: 80
          required: true
          command: npm run test:coverage
          ci_command: npm run test:coverage:ci  # Different for CI

        - name: Security Scan
          type: security_scan
          required: true
          command: npm run security:scan
          ci_integration: .github/workflows/security-scan.yml
```

**File**: `.github/workflows/security-scan.yml`

```yaml
name: Security Scan

on:
  push:
    branches: [feature/**]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Security Scan
        run: npm run security:scan
```

### Jira Integration

```yaml
workflow:
  git_workflow:
    commit_conventions:
      format: conventional
      jira_integration:
        enabled: true
        project_key: PLATFORM
        issue_pattern: "{project_key}-{issue_number}"
        include_in_footer: true

metadata:
  jira:
    project_key: PLATFORM
    epic: PLATFORM-123
    issue_type: Story
```

**Generated Commit**:
```
feat(auth): implement JWT validation

- Add token verification middleware (TASK-001)

Related: TRD-AUTH-001
JIRA: PLATFORM-456
```

### Slack Notifications

```yaml
workflow:
  notifications:
    slack:
      enabled: true
      webhook_url_env: SLACK_WEBHOOK_URL
      channels:
        sprint_complete: "#engineering-updates"
        phase_complete: "#leadership-updates"
        quality_gate_failed: "#alerts"

  quality_gates:
    sprint:
      on_failure:
        notify: slack
        channel: "#alerts"
```

---

## Examples by Industry

### Example 1: Healthcare Application

```yaml
---
workflow:
  checkpoint_frequency: sprint
  execution_command: /implement-trd

  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Test Coverage
          type: test_coverage
          threshold: 95  # Very high for healthcare
          required: true

        - name: PHI Data Scan
          type: phi_check
          required: true
          command: npm run phi:scan

        - name: Encryption Check
          type: encryption_check
          required: true
          command: npm run encryption:validate

    final:
      enabled: true
      gates:
        - name: HIPAA Compliance
          type: hipaa_audit
          required: true
          command: npm run compliance:hipaa

        - name: Penetration Testing
          type: penetration_test
          required: true

metadata:
  compliance: [HIPAA, SOC2]
  security_level: high
  data_classification: PHI
---
```

### Example 2: Financial Services

```yaml
---
workflow:
  checkpoint_frequency: phase  # Fewer, more substantial commits
  execution_command: /implement-trd

  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Unit Test Coverage
          type: test_coverage
          threshold: 90
          required: true

        - name: Transaction Integrity
          type: transaction_test
          required: true
          command: npm run transaction:validate

        - name: PCI Data Scan
          type: pci_scan
          required: true
          command: npm run pci:scan

    phase:
      enabled: true
      gates:
        - name: Audit Trail
          type: audit_check
          required: true
          description: All transactions must be auditable

    final:
      enabled: true
      gates:
        - name: PCI DSS Compliance
          type: pci_dss_audit
          required: true

        - name: Financial Audit
          type: financial_audit
          required: true

metadata:
  compliance: [PCI-DSS, SOX]
  security_level: critical
  audit_required: true
---
```

### Example 3: SaaS Startup (MVP)

```yaml
---
workflow:
  checkpoint_frequency: manual
  execution_command: /implement-trd

  quality_gates:
    sprint:
      enabled: true
      gates:
        - name: Basic Tests
          type: test_coverage
          threshold: 60
          required: false

        - name: Security Scan
          type: security_scan
          required: true

    final:
      enabled: true
      gates:
        - name: E2E Tests
          type: e2e_test
          required: false

        - name: Security Audit
          type: security_audit
          required: true

metadata:
  stage: mvp
  priority: speed
  team: Product
---
```

---

## Best Practices

### DO:
- ✅ Create team-level templates for consistency
- ✅ Document customizations in templates
- ✅ Version your templates
- ✅ Test custom quality gates before deploying
- ✅ Provide clear examples in team documentation
- ✅ Review and update templates quarterly

### DON'T:
- ❌ Create too many variants (maintain 3-5 templates max)
- ❌ Skip documentation of custom configurations
- ❌ Hardcode credentials or secrets in templates
- ❌ Override security gates without approval
- ❌ Create team-specific templates without team input

---

## Related Documentation

- [PRD Metadata Guide](../docs/PRD_METADATA_GUIDE.md)
- [Best Practices](./BEST_PRACTICES.md)
- [Command Reference](../docs/COMMAND_REFERENCE.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-beta | 2025-12-02 | Initial customization guide |

---

**Document Version**: 1.0.0-beta
**Last Updated**: December 2, 2025
**Maintainer**: Fortium Software Configuration Team
