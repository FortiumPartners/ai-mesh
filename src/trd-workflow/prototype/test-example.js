/**
 * Test Example - Demonstrate Workflow Generation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateWorkflow } from './workflow-generator.js';
import { injectCheckpoints } from './checkpoint-injector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runExample() {
  console.log('='.repeat(80));
  console.log('TRD WORKFLOW GENERATION - EXAMPLE OUTPUT');
  console.log('='.repeat(80));
  console.log('');

  // Load simple TRD
  const simplePath = join(__dirname, 'test-data/simple-trd.json');
  const simpleTrd = JSON.parse(readFileSync(simplePath, 'utf-8'));

  console.log('📄 Example 1: Simple TRD (15 tasks, 3 sprints)');
  console.log('-'.repeat(80));

  // Test checkpoint injection
  const checkpoints = injectCheckpoints(simpleTrd.tasks, {
    frequency: 'sprint',
    trdId: simpleTrd.id
  });

  console.log(`\n✅ Checkpoint Injection:`);
  console.log(`   - Total tasks: ${simpleTrd.tasks.length}`);
  console.log(`   - Checkpoints injected: ${checkpoints.checkpoints.length}`);
  console.log(`   - Coverage: ${checkpoints.metrics.coverage}%`);

  // Test workflow generation
  const workflow = generateWorkflow(simpleTrd);

  console.log(`\n✅ Workflow Generation:`);
  console.log(`   - Complexity: ${workflow.complexityAssessment.complexityLevel.level}`);
  console.log(`   - Score: ${workflow.complexityAssessment.complexityScore}`);
  console.log(`   - Recommended command: ${workflow.executionRecommendations.primaryCommand}`);
  console.log(`   - Generation time: ${workflow.metadata.generationTime}`);

  console.log(`\n📊 Task Type Distribution:`);
  Object.entries(workflow.taskTypeAnalysis.summary.typeDistribution).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count} tasks`);
  });

  console.log('\n📋 Generated Workflow Section (excerpt):');
  console.log('-'.repeat(80));
  console.log(workflow.workflow.split('\n').slice(0, 30).join('\n'));
  console.log('...\n');

  // Load complex TRD
  const complexPath = join(__dirname, 'test-data/complex-trd.json');
  const complexTrd = JSON.parse(readFileSync(complexPath, 'utf-8'));

  console.log('\n📄 Example 2: Complex TRD (60 tasks, 13 sprints)');
  console.log('-'.repeat(80));

  const complexWorkflow = generateWorkflow(complexTrd);

  console.log(`\n✅ Workflow Generation:`);
  console.log(`   - Complexity: ${complexWorkflow.complexityAssessment.complexityLevel.level}`);
  console.log(`   - Score: ${complexWorkflow.complexityAssessment.complexityScore}`);
  console.log(`   - Recommended command: ${complexWorkflow.executionRecommendations.primaryCommand}`);
  console.log(`   - Generation time: ${complexWorkflow.metadata.generationTime}`);

  console.log(`\n📊 Task Type Distribution:`);
  Object.entries(complexWorkflow.taskTypeAnalysis.summary.typeDistribution).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count} tasks`);
  });

  console.log(`\n📊 Agent Delegation:`);
  if (complexWorkflow.delegationPatterns.patterns.length > 0) {
    complexWorkflow.delegationPatterns.patterns.forEach(pattern => {
      console.log(`   - ${pattern.agent}: ${pattern.taskCount} tasks (${pattern.strategy})`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Examples complete!');
  console.log('='.repeat(80));
}

runExample().catch(console.error);
