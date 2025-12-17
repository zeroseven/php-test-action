import * as core from '@actions/core';
import { TestResult } from '../types/TestResult';
import { CoverageData } from '../types/CoverageData';
import { ActionInputs } from '../types/ActionInputs';
import { AnnotationReporter } from './AnnotationReporter';
import { SummaryReporter } from './SummaryReporter';
import { PRCommentReporter } from './PRCommentReporter';
import { logger } from '../utils/logger';

export class GitHubReporter {
  private inputs: ActionInputs;
  private annotationReporter: AnnotationReporter;
  private summaryReporter: SummaryReporter;
  private prCommentReporter: PRCommentReporter;

  constructor(inputs: ActionInputs) {
    this.inputs = inputs;
    this.annotationReporter = new AnnotationReporter();
    this.summaryReporter = new SummaryReporter();
    this.prCommentReporter = new PRCommentReporter();
  }

  async report(testResult: TestResult, coverage: CoverageData | null): Promise<void> {
    logger.group('Reporting results to GitHub');

    try {
      // Set action outputs
      this.setOutputs(testResult, coverage);

      // Create annotations for test failures
      if (testResult.failures.length > 0) {
        this.annotationReporter.report(testResult.failures);
      }

      // Generate job summary
      await this.summaryReporter.report(testResult, coverage);

      // Post PR comment if enabled
      if (this.inputs.coverage.comment && coverage) {
        await this.prCommentReporter.report(testResult, coverage);
      }

      logger.info('GitHub reporting completed');
    } catch (error) {
      logger.error(`Failed to report to GitHub: ${error}`);
    } finally {
      logger.endGroup();
    }
  }

  private setOutputs(testResult: TestResult, coverage: CoverageData | null): void {
    // Test result outputs
    core.setOutput('test-result', testResult.status);
    core.setOutput('tests-total', testResult.total.toString());
    core.setOutput('tests-passed', testResult.passed.toString());
    core.setOutput('tests-failed', testResult.failed.toString());
    core.setOutput('tests-skipped', testResult.skipped.toString());
    core.setOutput('tests-incomplete', testResult.incomplete.toString());

    // Coverage outputs
    if (coverage) {
      core.setOutput('coverage-percentage', coverage.summary.overall.toFixed(2));
      core.setOutput('coverage-lines', coverage.summary.lines.percentage.toFixed(2));
      core.setOutput('coverage-methods', coverage.summary.methods.percentage.toFixed(2));
      core.setOutput('coverage-classes', coverage.summary.classes.percentage.toFixed(2));
      core.setOutput('coverage-report-path', `${this.inputs.coverage.output}/clover.xml`);
    }

    logger.debug('Action outputs set successfully');
  }
}
