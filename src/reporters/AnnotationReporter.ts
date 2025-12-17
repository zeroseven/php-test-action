import * as core from '@actions/core';
import { TestFailure } from '../types/TestResult';
import { logger } from '../utils/logger';

export class AnnotationReporter {
  report(failures: TestFailure[]): void {
    logger.debug(`Creating ${failures.length} annotations for test failures`);

    for (const failure of failures) {
      this.createAnnotation(failure);
    }
  }

  private createAnnotation(failure: TestFailure): void {
    const title = `${failure.testClass || 'Test'}: ${failure.testName}`;
    const message = this.formatMessage(failure);

    const properties: core.AnnotationProperties = {
      title,
      file: failure.file,
      startLine: failure.line,
    };

    if (failure.type === 'error') {
      core.error(message, properties);
    } else if (failure.type === 'warning') {
      core.warning(message, properties);
    } else {
      core.error(message, properties);
    }
  }

  private formatMessage(failure: TestFailure): string {
    let message = failure.message;

    if (failure.trace && failure.trace.length > 0) {
      // Include first few lines of stack trace
      const traceLines = failure.trace.split('\n').slice(0, 3);
      message += '\n\n' + traceLines.join('\n');
    }

    return message;
  }
}
