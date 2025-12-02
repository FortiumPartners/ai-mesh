# Production Monitoring Guide - TRD Workflow System v1.0.0

**Version**: v1.0.0
**Last Updated**: October 29, 2025
**Review Frequency**: Weekly for first month, then monthly

---

## Overview

This guide provides comprehensive monitoring setup for the TRD Workflow System in production. It covers metrics to track, dashboard configuration, alert thresholds, and weekly review procedures.

---

## 1. Key Metrics to Track

### 1.1 Adoption Metrics

#### Installation Success Rate
**Definition**: Percentage of successful installations vs. total attempts
**Target**: ≥95%
**Collection Method**: NPM download statistics + installation completion tracking

**Tracking**:
```bash
# NPM downloads (daily)
npm view @fortium/ai-mesh

# Installation completion (if tracking enabled)
# Check ~/.ai-mesh/metrics/installation-success.json
```

**Alert Threshold**: <90% success rate over 24-hour period

---

#### Active User Count
**Definition**: Number of unique users executing TRD workflow commands per week
**Target**: 50+ users by month 3 (based on beta adoption trajectory)
**Collection Method**: Command execution logs (if user consent obtained)

**Tracking**:
```bash
# Check user profile creation rate
find ~/.ai-mesh/profile/ -name "user.json" -mtime -7 | wc -l

# Command usage stats (if available)
# Parse ~/.claude/logs/ for /create-trd and /implement-trd usage
```

**Alert Threshold**: <10% growth week-over-week for first 3 months

---

#### Command Usage Distribution
**Definition**: Frequency of each TRD workflow command
**Target**: `/create-trd` and `/implement-trd` account for 60%+ of TRD-related usage
**Collection Method**: Command execution logs

**Expected Distribution**:
- `/create-trd`: 25-30%
- `/implement-trd`: 30-35%
- `/plan-product`: 15-20%
- `/analyze-product`: 10-15%
- Other: 10-15%

**Alert Threshold**: `/implement-trd` usage <50% of `/create-trd` (indicates TRD creation but no implementation)

---

### 1.2 Performance Metrics

#### Checkpoint Creation Time
**Definition**: Time from task completion to git checkpoint commit
**Target**: <30 seconds (user-perceived delay)
**Collection Method**: Hook execution timing (if hooks installed)

**Tracking**:
```bash
# Check hook performance logs
cat ~/.ai-mesh/metrics/hook-performance.log | grep "checkpoint-created"
```

**Alert Threshold**: >60 seconds average over 1-hour period

---

#### TRD Generation Time
**Definition**: Time to generate TRD from PRD via `/create-trd`
**Target**: <60 seconds for typical PRD (2-5 pages)
**Collection Method**: Command execution timing

**Tracking**:
```bash
# Parse command logs for /create-trd execution time
grep "create-trd" ~/.claude/logs/*.log | grep "duration"
```

**Alert Threshold**: >120 seconds average over 24-hour period

---

#### Document Archival Latency
**Definition**: Time from 100% TRD completion to automatic archival
**Target**: <5 minutes
**Collection Method**: File monitor logs (if enabled)

**Tracking**:
```bash
# Check file monitor logs for archival events
cat ~/.ai-mesh/monitoring/archival.log | grep "archived"
```

**Alert Threshold**: >15 minutes for any archival event

---

### 1.3 Quality Metrics

#### Checkpoint Message Quality Score
**Definition**: Percentage of checkpoints following format guidelines
**Target**: ≥90%
**Collection Method**: Automated checkpoint validation

**Quality Criteria**:
- First line <72 characters
- Task ID present in correct format
- Checkpoint type specified
- Metadata complete

**Tracking**:
```bash
# Validate last 100 checkpoints
git log --all --grep="TRD-" -100 --format="%s" | \
  node scripts/validate-checkpoint-format.js
```

**Alert Threshold**: <80% quality score over 7-day period

---

#### TRD Completion Rate
**Definition**: Percentage of TRDs reaching 100% task completion
**Target**: ≥75% within 2 sprint cycles
**Collection Method**: TRD file analysis

**Tracking**:
```bash
# Scan TRD files for completion percentage
find docs/TRD/ -name "*.md" -exec \
  node scripts/calculate-trd-completion.js {} \;
```

**Alert Threshold**: <50% completion rate after 4 weeks

---

#### Task Estimation Accuracy
**Definition**: Ratio of actual vs. estimated task time
**Target**: 0.8-1.2 ratio (±20% accuracy)
**Collection Method**: Task completion tracking vs. estimates

**Tracking**:
```bash
# Compare estimated vs. actual time from checkpoint history
node scripts/analyze-task-estimation.js docs/TRD/
```

**Alert Threshold**: <0.6 or >1.5 ratio (indicates poor estimation)

---

### 1.4 Error Metrics

#### Installation Failure Rate
**Definition**: Percentage of failed installations with error codes
**Target**: <5%
**Collection Method**: Installation error logs

**Common Error Categories**:
- Permissions issues
- Missing dependencies
- Path resolution failures
- Validation errors

**Tracking**:
```bash
# Check installation error logs
cat ~/.ai-mesh/logs/installation-errors.log | \
  awk '{print $4}' | sort | uniq -c
```

**Alert Threshold**: >10% failure rate or any new error pattern

---

#### Command Execution Errors
**Definition**: Rate of command failures per 1000 invocations
**Target**: <1% for stable commands
**Collection Method**: Command error logs

**Tracking**:
```bash
# Parse command error logs
grep "ERROR" ~/.claude/logs/*.log | grep -E "(create-trd|implement-trd)"
```

**Alert Threshold**: >5% error rate or spike in specific error type

---

#### Data Loss Incidents
**Definition**: Number of incidents where TRD/PRD data was lost or corrupted
**Target**: 0 incidents
**Collection Method**: User reports + automated file integrity checks

**Tracking**:
```bash
# Verify TRD/PRD file integrity
node scripts/verify-file-integrity.js docs/
```

**Alert Threshold**: Any data loss incident (critical alert)

---

## 2. Dashboard Configuration

### 2.1 Real-Time Dashboard

**Refresh Rate**: 5 minutes
**Retention**: 7 days of granular data, 90 days of aggregated data

#### Widget Layout

**Top Row: Adoption Metrics**
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  Active Users       │  Installation Rate  │  Command Usage      │
│  [Number]           │  [Percentage]       │  [Distribution]     │
│  +X% vs last week   │  +X% vs target      │  Pie chart          │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

**Middle Row: Performance Metrics**
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  Checkpoint Time    │  TRD Gen Time       │  Archival Latency   │
│  [Avg ms]           │  [Avg seconds]      │  [Avg minutes]      │
│  Line chart (24h)   │  Line chart (24h)   │  Line chart (24h)   │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

**Bottom Row: Quality & Error Metrics**
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  Checkpoint Quality │  TRD Completion     │  Error Rate         │
│  [Percentage]       │  [Percentage]       │  [Per 1000]         │
│  Bar chart (7d)     │  Progress bars      │  Stacked area chart │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

### 2.2 Historical Dashboard

**Refresh Rate**: 1 hour
**Retention**: 1 year of data

#### Trend Analysis
- Weekly active users (line chart, 12 weeks)
- TRD creation vs. completion rate (dual-axis chart, 12 weeks)
- Task estimation accuracy over time (line chart with confidence interval, 12 weeks)
- Error rate trends by category (stacked area chart, 12 weeks)

#### Cohort Analysis
- User retention by installation week (cohort table, 12 weeks)
- Feature adoption by user cohort (heatmap, 12 weeks)
- Command usage progression (funnel chart, by week)

---

## 3. Alert Thresholds

### 3.1 Critical Alerts (Immediate Response Required)

**Trigger**: Page on-call engineer immediately

| Alert Name | Condition | Threshold | Response Time |
|------------|-----------|-----------|---------------|
| Data Loss Incident | TRD/PRD corruption or deletion | 1 incident | <15 minutes |
| Installation Failure Spike | Sudden increase in failures | >20% in 1 hour | <15 minutes |
| Command Execution Crash | Segfault or unhandled exception | 1 occurrence | <15 minutes |

**Escalation Path**: On-call engineer → Tech lead → Engineering manager

---

### 3.2 High-Priority Alerts (Response Within 1 Hour)

**Trigger**: Slack notification to #engineering channel

| Alert Name | Condition | Threshold | Response Time |
|------------|-----------|-----------|---------------|
| Installation Success Rate Drop | Success rate falls below target | <90% over 24h | <1 hour |
| Performance Degradation | Command execution time spike | >2x baseline | <1 hour |
| Error Rate Spike | New error pattern emerges | >5% for any command | <1 hour |
| Checkpoint Quality Drop | Format validation failures | <80% quality score | <1 hour |

**Escalation Path**: Assigned team member → Tech lead

---

### 3.3 Medium-Priority Alerts (Review Within 24 Hours)

**Trigger**: Daily digest email to development team

| Alert Name | Condition | Threshold | Response Time |
|------------|-----------|-----------|---------------|
| User Growth Slowdown | Active user growth stagnates | <10% week-over-week | <24 hours |
| TRD Completion Rate Low | Many incomplete TRDs | <50% completion | <24 hours |
| Task Estimation Drift | Estimation accuracy declines | <0.6 or >1.5 ratio | <24 hours |
| Command Usage Imbalance | Disproportionate command usage | See distribution targets | <24 hours |

**Escalation Path**: Product owner reviews and prioritizes fixes

---

### 3.4 Low-Priority Alerts (Weekly Review)

**Trigger**: Weekly metrics report

| Alert Name | Condition | Threshold | Response Time |
|------------|-----------|-----------|---------------|
| Feature Request Volume | High volume of similar requests | >10 requests/week | <7 days |
| Documentation Gaps | Users report confusion | >5 related questions | <7 days |
| Minor Performance Issues | Slight degradation detected | 1.5x baseline | <7 days |

**Escalation Path**: Included in weekly sprint planning

---

## 4. Monitoring Implementation

### 4.1 Metrics Collection Scripts

#### Installation Success Tracking
```javascript
// scripts/track-installation-success.js
const fs = require('fs');
const path = require('path');

function trackInstallation(success, errorCode = null) {
  const metricsFile = path.join(
    process.env.HOME,
    '.ai-mesh/metrics/installation-success.json'
  );

  const data = JSON.parse(fs.readFileSync(metricsFile, 'utf8') || '{"successful": 0, "failed": 0, "errors": {}}');

  if (success) {
    data.successful++;
  } else {
    data.failed++;
    data.errors[errorCode] = (data.errors[errorCode] || 0) + 1;
  }

  fs.writeFileSync(metricsFile, JSON.stringify(data, null, 2));
}

module.exports = { trackInstallation };
```

#### Checkpoint Quality Validation
```javascript
// scripts/validate-checkpoint-format.js
const TASK_ID_REGEX = /TRD-\d{3}-T\d{3}/;
const MAX_FIRST_LINE_LENGTH = 72;

function validateCheckpoint(message) {
  const lines = message.split('\n');
  const firstLine = lines[0];

  const quality = {
    score: 0,
    issues: []
  };

  // Check length (25 points)
  if (firstLine.length <= MAX_FIRST_LINE_LENGTH) {
    quality.score += 25;
  } else {
    quality.issues.push(`First line too long: ${firstLine.length} chars`);
  }

  // Check task ID (25 points)
  if (TASK_ID_REGEX.test(firstLine)) {
    quality.score += 25;
  } else {
    quality.issues.push('Missing or invalid task ID');
  }

  // Check checkpoint type (25 points)
  const hasCheckpointType = /\b(milestone|progress|documentation|test)\b/.test(message);
  if (hasCheckpointType) {
    quality.score += 25;
  } else {
    quality.issues.push('Missing checkpoint type');
  }

  // Check metadata (25 points)
  const hasMetadata = /\d+ files.*\+\d+\/-\d+/.test(message);
  if (hasMetadata) {
    quality.score += 25;
  } else {
    quality.issues.push('Missing metadata');
  }

  return quality;
}

module.exports = { validateCheckpoint };
```

#### TRD Completion Analysis
```javascript
// scripts/calculate-trd-completion.js
const fs = require('fs');

function calculateCompletion(trdPath) {
  const content = fs.readFileSync(trdPath, 'utf8');

  const totalCheckboxes = (content.match(/- \[ \]/g) || []).length +
                         (content.match(/- \[x\]/gi) || []).length;
  const checkedBoxes = (content.match(/- \[x\]/gi) || []).length;

  if (totalCheckboxes === 0) {
    return null; // No tasks defined
  }

  return {
    path: trdPath,
    total: totalCheckboxes,
    completed: checkedBoxes,
    percentage: Math.round((checkedBoxes / totalCheckboxes) * 100)
  };
}

module.exports = { calculateCompletion };
```

### 4.2 Automated Reporting

#### Daily Metrics Report
```bash
#!/bin/bash
# scripts/daily-metrics-report.sh

echo "=== TRD Workflow Daily Metrics Report ==="
echo "Date: $(date +%Y-%m-%d)"
echo ""

echo "Installation Success Rate:"
node scripts/installation-success-rate.js

echo ""
echo "Active Users (Last 24h):"
node scripts/count-active-users.js --since="24 hours ago"

echo ""
echo "Command Usage:"
node scripts/command-usage-stats.js --since="24 hours ago"

echo ""
echo "Error Summary:"
node scripts/error-summary.js --since="24 hours ago"

echo ""
echo "Checkpoint Quality:"
node scripts/checkpoint-quality-summary.js --since="24 hours ago"
```

**Schedule**: Run daily at 8:00 AM, email results to team

#### Weekly Health Report
```bash
#!/bin/bash
# scripts/weekly-health-report.sh

echo "=== TRD Workflow Weekly Health Report ==="
echo "Week: $(date +%Y-W%V)"
echo ""

echo "Adoption Metrics:"
node scripts/weekly-adoption-metrics.js

echo ""
echo "Performance Trends:"
node scripts/performance-trends.js --period="7 days"

echo ""
echo "Quality Metrics:"
node scripts/quality-metrics.js --period="7 days"

echo ""
echo "Top Issues:"
node scripts/top-issues.js --period="7 days" --limit=10

echo ""
echo "User Feedback Summary:"
node scripts/user-feedback-summary.js --period="7 days"
```

**Schedule**: Run weekly on Monday at 9:00 AM, distribute via email and Slack

---

## 5. Weekly Review Checklist

### 5.1 Metrics Review (15 minutes)

- [ ] **Adoption Metrics**
  - Review active user count and growth rate
  - Analyze command usage distribution
  - Identify any adoption barriers from user feedback

- [ ] **Performance Metrics**
  - Check average checkpoint creation time
  - Review TRD generation performance
  - Verify archival latency within target

- [ ] **Quality Metrics**
  - Assess checkpoint message quality score
  - Analyze TRD completion rates
  - Review task estimation accuracy

- [ ] **Error Metrics**
  - Identify top 5 error types
  - Track resolution status of known issues
  - Escalate any persistent problems

### 5.2 Alert Review (10 minutes)

- [ ] **Critical Alerts**
  - Review response time for critical alerts
  - Document root cause and resolution
  - Update runbooks if needed

- [ ] **High-Priority Alerts**
  - Verify all alerts were addressed within SLA
  - Track recurring patterns
  - Plan preventive measures

- [ ] **Medium/Low-Priority Alerts**
  - Triage and prioritize for sprint planning
  - Group related issues for batch resolution
  - Update backlog with improvement tasks

### 5.3 User Feedback Review (10 minutes)

- [ ] **Feature Requests**
  - Categorize and prioritize requests
  - Identify themes across multiple users
  - Add highly-requested features to roadmap

- [ ] **Bug Reports**
  - Verify all bugs are tracked in issue system
  - Prioritize by severity and frequency
  - Assign to team members for investigation

- [ ] **Documentation Issues**
  - Address confusion points in documentation
  - Add examples or clarifications
  - Update FAQ with common questions

### 5.4 Trend Analysis (10 minutes)

- [ ] **Compare Week-over-Week**
  - Calculate % change for key metrics
  - Identify positive and negative trends
  - Investigate significant changes

- [ ] **Cohort Performance**
  - Analyze retention by installation week
  - Compare feature adoption across cohorts
  - Identify successful vs. struggling users

- [ ] **Seasonal Patterns**
  - Note any day-of-week usage patterns
  - Identify peak usage times
  - Plan maintenance windows accordingly

### 5.5 Action Items (5 minutes)

- [ ] **Document Findings**
  - Summarize key insights in weekly report
  - Highlight wins and areas for improvement
  - Share report with team via Slack/email

- [ ] **Create Tasks**
  - Convert action items into trackable tasks
  - Assign owners and due dates
  - Add to sprint backlog

- [ ] **Update Monitoring**
  - Adjust alert thresholds if needed
  - Add new metrics based on findings
  - Deprecate irrelevant metrics

---

## 6. Monthly Review Process

### 6.1 Comprehensive Health Assessment (30 minutes)

#### Review Monthly Trends
- Active user growth trajectory
- Feature adoption patterns
- Error rate trends
- Performance stability

#### Compare Against Targets
| Metric | Target | Actual | Variance | Status |
|--------|--------|--------|----------|--------|
| Active Users | 50+ | [Actual] | [%] | [✅/⚠️/❌] |
| Installation Success | ≥95% | [Actual] | [%] | [✅/⚠️/❌] |
| TRD Completion | ≥75% | [Actual] | [%] | [✅/⚠️/❌] |
| Checkpoint Quality | ≥90% | [Actual] | [%] | [✅/⚠️/❌] |

#### Identify Success Stories
- Highlight teams/users with exceptional adoption
- Document successful workflow patterns
- Create case studies for promotion

### 6.2 Strategic Planning (30 minutes)

#### Roadmap Alignment
- Validate next quarter's roadmap based on metrics
- Prioritize features with highest user demand
- Sunset underutilized features

#### Resource Allocation
- Assess support burden (error rates, user questions)
- Allocate engineering time for improvements
- Plan documentation and training needs

#### Risk Assessment
- Identify potential scalability issues
- Review security and data privacy concerns
- Plan contingency for identified risks

---

## 7. Incident Response Procedures

### 7.1 Critical Incident Response

**Incident Severity Levels**:
- **P0**: Data loss, system-wide outage, security breach
- **P1**: Major functionality broken, >20% error rate
- **P2**: Minor functionality broken, <20% error rate
- **P3**: Cosmetic issues, documentation errors

**P0/P1 Response Process**:
1. **Detection** (0-5 minutes): Alert fires, on-call engineer notified
2. **Triage** (5-15 minutes): Assess severity, gather initial information
3. **Communication** (15-20 minutes): Notify stakeholders, post status update
4. **Mitigation** (variable): Implement fix or rollback
5. **Verification** (post-fix): Confirm resolution, monitor for recurrence
6. **Post-Mortem** (within 48 hours): Document root cause, preventive measures

### 7.2 Incident Communication Template

```
🚨 INCIDENT ALERT - [Severity]

Title: [Brief description]
Start Time: [Timestamp]
Status: [Investigating / Identified / Monitoring / Resolved]

Impact:
- Affected Users: [Number or percentage]
- Affected Features: [List]
- Workaround: [If available]

Updates:
- [Timestamp]: [Status update]
- [Timestamp]: [Status update]

Next Update: [Expected time]

Incident Commander: [Name]
```

---

## Appendix

### A. Metrics Collection Schedule

| Metric | Collection Frequency | Retention |
|--------|---------------------|-----------|
| Installation success | Real-time | 90 days |
| Active users | Hourly | 1 year |
| Command usage | Per invocation | 90 days |
| Checkpoint quality | Per commit | 90 days |
| Performance metrics | Per operation | 30 days |
| Error logs | Real-time | 90 days |

### B. Dashboard Access

**Production Dashboard**: [URL or access instructions]
**Historical Dashboard**: [URL or access instructions]
**Alert Configuration**: [URL or access instructions]

### C. Monitoring Tool Stack

**Recommended Tools** (customize based on your infrastructure):
- **Metrics Collection**: Prometheus, InfluxDB, or custom JSON files
- **Visualization**: Grafana, Datadog, or custom web dashboard
- **Alerting**: PagerDuty, Opsgenie, or Slack webhooks
- **Logging**: ELK stack, Splunk, or structured JSON logs

### D. Contact Information

**Monitoring Questions**: [Team email or Slack channel]
**Alert Escalation**: See PRODUCTION_DEPLOYMENT.md for on-call rotation
**Metrics Requests**: [Product owner or tech lead contact]

---

*Last Updated*: October 29, 2025
*Version*: v1.0.0
*Next Review*: Weekly (Monday 9:00 AM) + Monthly (First Monday of month)
