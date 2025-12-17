import * as core from '@actions/core';
import { TestResult, TestStatus } from '../types/TestResult';
import { CoverageData } from '../types/CoverageData';
import { logger } from '../utils/logger';

export class SummaryReporter {
  constructor() {
    // Constructor
  }

  async report(testResult: TestResult, coverage: CoverageData | null): Promise<void> {
    logger.debug('Generating job summary');

    const summary = core.summary;

    // Add heading
    const statusEmoji = testResult.status === TestStatus.SUCCESS ? '✅' : '❌';
    summary.addHeading(`${statusEmoji} ${testResult.framework} Test Results`, 2);

    // Add test results table
    summary.addTable([
      [
        { data: 'Metric', header: true },
        { data: 'Value', header: true },
      ],
      ['Status', testResult.status === TestStatus.SUCCESS ? '✅ Passed' : '❌ Failed'],
      ['Total Tests', testResult.total.toString()],
      ['Passed', `✅ ${testResult.passed}`],
      ['Failed', testResult.failed > 0 ? `❌ ${testResult.failed}` : '0'],
      ['Skipped', testResult.skipped > 0 ? `⚠️ ${testResult.skipped}` : '0'],
      ['Incomplete', testResult.incomplete > 0 ? `⚠️ ${testResult.incomplete}` : '0'],
      ['Execution Time', `${testResult.executionTime.toFixed(2)}s`],
    ]);

    // Add coverage information if available
    if (coverage) {
      summary.addHeading('Coverage Summary', 3);

      const overallEmoji = this.getCoverageEmoji(coverage.summary.overall);

      summary.addTable([
        [
          { data: 'Metric', header: true },
          { data: 'Coverage', header: true },
        ],
        ['Lines', `${coverage.summary.lines.percentage.toFixed(2)}%`],
        ['Methods', `${coverage.summary.methods.percentage.toFixed(2)}%`],
        ['Classes', `${coverage.summary.classes.percentage.toFixed(2)}%`],
        ['Overall', `${overallEmoji} ${coverage.summary.overall.toFixed(2)}%`],
      ]);
    }

    // Add failure details if any
    if (testResult.failures.length > 0) {
      summary.addHeading('Test Failures', 3);

      for (const failure of testResult.failures.slice(0, 10)) {
        // Limit to first 10 failures
        summary.addRaw(`\n**${failure.testClass}: ${failure.testName}**\n`, true);
        summary.addRaw(`${failure.file}:${failure.line}\n`, true);
        summary.addCodeBlock(failure.message, 'text');
      }

      if (testResult.failures.length > 10) {
        summary.addRaw(`\n_...and ${testResult.failures.length - 10} more failures_\n`, true);
      }
    }

    await summary.write();
    logger.debug('Job summary generated successfully');
  }

  private getCoverageEmoji(percentage: number): string {
    if (percentage >= 80) return '✅';
    if (percentage >= 60) return '⚠️';
    return '❌';
  }
}
