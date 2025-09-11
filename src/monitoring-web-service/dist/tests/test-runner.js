"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunner = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
class TestRunner {
    testSuites = [
        {
            name: 'Unit Tests - Authentication',
            command: 'npm',
            args: ['run', 'test', '--', '--testPathPattern=auth', '--coverage'],
            requiredCoverage: {
                statements: 95,
                branches: 95,
                functions: 95,
                lines: 95
            }
        },
        {
            name: 'Unit Tests - Database',
            command: 'npm',
            args: ['run', 'test', '--', '--testPathPattern=database', '--coverage'],
            requiredCoverage: {
                statements: 95,
                branches: 95,
                functions: 95,
                lines: 95
            }
        },
        {
            name: 'Unit Tests - Services',
            command: 'npm',
            args: ['run', 'test', '--', '--testPathPattern=services', '--coverage'],
            requiredCoverage: {
                statements: 90,
                branches: 90,
                functions: 90,
                lines: 90
            }
        },
        {
            name: 'Unit Tests - Middleware',
            command: 'npm',
            args: ['run', 'test', '--', '--testPathPattern=middleware', '--coverage'],
            requiredCoverage: {
                statements: 85,
                branches: 85,
                functions: 85,
                lines: 85
            }
        },
        {
            name: 'Integration Tests',
            command: 'npm',
            args: ['run', 'test:integration', '--coverage'],
            requiredCoverage: {
                statements: 85,
                branches: 80,
                functions: 85,
                lines: 85
            }
        },
        {
            name: 'Full Test Suite',
            command: 'npm',
            args: ['run', 'test:coverage'],
            requiredCoverage: {
                statements: 90,
                branches: 85,
                functions: 90,
                lines: 90
            }
        }
    ];
    async runAllTests() {
        console.log('🧪 Starting comprehensive test suite execution...\n');
        const results = [];
        for (const suite of this.testSuites) {
            console.log(`\n🔍 Running: ${suite.name}`);
            console.log(`Command: ${suite.command} ${suite.args.join(' ')}`);
            const startTime = Date.now();
            const result = await this.runTestSuite(suite);
            const duration = Date.now() - startTime;
            results.push({
                ...result,
                duration
            });
            this.printTestResult(result, duration);
        }
        this.printSummary(results);
        return results;
    }
    async runTestSuite(suite) {
        return new Promise((resolve) => {
            const process = (0, child_process_1.spawn)(suite.command, suite.args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                cwd: path_1.default.resolve(__dirname, '../..')
            });
            let stdout = '';
            let stderr = '';
            process.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            process.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            process.on('close', (code) => {
                const passed = code === 0;
                const coverage = this.extractCoverage(stdout);
                const errors = this.extractErrors(stderr, stdout);
                resolve({
                    suite: suite.name,
                    passed,
                    coverage,
                    errors
                });
            });
            process.on('error', (error) => {
                resolve({
                    suite: suite.name,
                    passed: false,
                    errors: [error.message]
                });
            });
        });
    }
    extractCoverage(output) {
        const coveragePattern = /All files\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)/;
        const match = output.match(coveragePattern);
        if (match) {
            return {
                statements: parseFloat(match[1]),
                branches: parseFloat(match[2]),
                functions: parseFloat(match[3]),
                lines: parseFloat(match[4])
            };
        }
        return undefined;
    }
    extractErrors(stderr, stdout) {
        const errors = [];
        const testFailurePattern = /FAIL\s+(.+)/g;
        let match;
        while ((match = testFailurePattern.exec(stdout)) !== null) {
            errors.push(`Test failure: ${match[1]}`);
        }
        const compilationErrorPattern = /error\s+TS\d+:/g;
        while ((match = compilationErrorPattern.exec(stderr)) !== null) {
            errors.push(`Compilation error: ${match[0]}`);
        }
        if (stderr.trim() && !stderr.includes('Validation Warning')) {
            errors.push(`Standard error: ${stderr.trim()}`);
        }
        return errors;
    }
    printTestResult(result, duration) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        const durationFormatted = `${(duration / 1000).toFixed(2)}s`;
        console.log(`\n${status} ${result.suite} (${durationFormatted})`);
        if (result.coverage) {
            console.log('📊 Coverage:');
            console.log(`  Statements: ${result.coverage.statements}%`);
            console.log(`  Branches: ${result.coverage.branches}%`);
            console.log(`  Functions: ${result.coverage.functions}%`);
            console.log(`  Lines: ${result.coverage.lines}%`);
        }
        if (result.errors.length > 0) {
            console.log('❗ Errors:');
            result.errors.forEach(error => console.log(`  ${error}`));
        }
    }
    printSummary(results) {
        console.log('\n' + '='.repeat(80));
        console.log('📋 TEST EXECUTION SUMMARY');
        console.log('='.repeat(80));
        const totalTests = results.length;
        const passedTests = results.filter(r => r.passed).length;
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
        console.log(`\n📈 Overall Results:`);
        console.log(`  Total Suites: ${totalTests}`);
        console.log(`  Passed: ${passedTests}`);
        console.log(`  Failed: ${totalTests - passedTests}`);
        console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
        const coverageResults = results.filter(r => r.coverage);
        if (coverageResults.length > 0) {
            const avgCoverage = coverageResults.reduce((sum, r) => ({
                statements: sum.statements + r.coverage.statements,
                branches: sum.branches + r.coverage.branches,
                functions: sum.functions + r.coverage.functions,
                lines: sum.lines + r.coverage.lines
            }), { statements: 0, branches: 0, functions: 0, lines: 0 });
            const count = coverageResults.length;
            console.log(`\n📊 Average Coverage:`);
            console.log(`  Statements: ${(avgCoverage.statements / count).toFixed(1)}%`);
            console.log(`  Branches: ${(avgCoverage.branches / count).toFixed(1)}%`);
            console.log(`  Functions: ${(avgCoverage.functions / count).toFixed(1)}%`);
            console.log(`  Lines: ${(avgCoverage.lines / count).toFixed(1)}%`);
        }
        console.log(`\n🎯 Sprint 9.1 Requirements:`);
        const requirements = {
            'Backend API Coverage': { target: 90, achieved: this.getAchievedCoverage(results, 'backend') },
            'Frontend Component Coverage': { target: 80, achieved: this.getAchievedCoverage(results, 'frontend') },
            'Database Operations Coverage': { target: 95, achieved: this.getAchievedCoverage(results, 'database') },
            'Authentication Coverage': { target: 95, achieved: this.getAchievedCoverage(results, 'auth') }
        };
        Object.entries(requirements).forEach(([req, { target, achieved }]) => {
            const status = achieved >= target ? '✅' : '❌';
            console.log(`  ${status} ${req}: ${achieved}% (target: ${target}%)`);
        });
        const allRequirementsMet = Object.values(requirements).every(({ target, achieved }) => achieved >= target);
        const overallStatus = allRequirementsMet && passedTests === totalTests ? '🎉 SUCCESS' : '⚠️  NEEDS WORK';
        console.log(`\n${overallStatus} Sprint 9.1 Test Suite Status`);
        if (!allRequirementsMet || passedTests < totalTests) {
            console.log('\n🔧 Actions Required:');
            if (passedTests < totalTests) {
                console.log('  - Fix failing test suites');
            }
            Object.entries(requirements).forEach(([req, { target, achieved }]) => {
                if (achieved < target) {
                    console.log(`  - Improve ${req} coverage to ${target}%`);
                }
            });
        }
        console.log('\n' + '='.repeat(80));
    }
    getAchievedCoverage(results, category) {
        const categoryResults = results.filter(r => r.suite.toLowerCase().includes(category) && r.coverage);
        if (categoryResults.length === 0) {
            return 0;
        }
        const avgStatements = categoryResults.reduce((sum, r) => sum + r.coverage.statements, 0) / categoryResults.length;
        return Math.round(avgStatements);
    }
    async runSingleSuite(suiteName) {
        const suite = this.testSuites.find(s => s.name.includes(suiteName));
        if (!suite) {
            console.log(`❌ Test suite '${suiteName}' not found`);
            return null;
        }
        console.log(`🔍 Running single suite: ${suite.name}`);
        const startTime = Date.now();
        const result = await this.runTestSuite(suite);
        const duration = Date.now() - startTime;
        const fullResult = { ...result, duration };
        this.printTestResult(fullResult, duration);
        return fullResult;
    }
}
exports.TestRunner = TestRunner;
if (require.main === module) {
    const runner = new TestRunner();
    const args = process.argv.slice(2);
    if (args.length > 0) {
        runner.runSingleSuite(args[0]);
    }
    else {
        runner.runAllTests().then(results => {
            const failed = results.filter(r => !r.passed).length;
            process.exit(failed > 0 ? 1 : 0);
        });
    }
}
//# sourceMappingURL=test-runner.js.map