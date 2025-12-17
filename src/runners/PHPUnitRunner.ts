import { TestRunner } from './TestRunner';
import { TestResult, TestStatus } from '../types/TestResult';
import { TestConfig } from '../config/TestConfig';

export class PHPUnitRunner extends TestRunner {
  constructor(config: TestConfig, workingDir: string) {
    super(config, workingDir);
  }

  getExecutable(): string {
    return 'vendor/bin/phpunit';
  }

  protected getFrameworkName(): string {
    return 'PHPUnit';
  }

  buildCommand(): string[] {
    const args: string[] = [];

    // Add configuration file
    this.addConfigArgs(args);

    // Add test suite args (if specified)
    args.push(...this.config.getTestSuiteArgs());

    // Add coverage args
    this.addCoverageArgs(args);

    // Add JUnit log for parsing
    const coverageOutput = this.config.getCoverageArgs()[1] || '.coverage';
    const baseDir = coverageOutput.replace('/clover.xml', '');
    args.push('--log-junit', `${baseDir}/junit.xml`);

    // Add additional args (verbose, fail-on-*)
    args.push(...this.config.getAdditionalArgs());

    // Add test path if no config
    if (!this.config.getConfigPath()) {
      args.push(this.config.getTestPath());
    }

    return args;
  }

  protected parseStdout(stdout: string, _stderr: string, exitCode: number): TestResult {
    // Basic parsing from PHPUnit output
    // Format: "OK (X tests, Y assertions)" or "FAILURES! Tests: X, Assertions: Y, Failures: Z"

    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Try to extract test counts from output
    const okMatch = stdout.match(/OK \((\d+) tests?, \d+ assertions?\)/);
    const failureMatch = stdout.match(
      /Tests: (\d+), Assertions: \d+(?:, Failures: (\d+))?(?:, Errors: (\d+))?(?:, Skipped: (\d+))?/
    );

    if (okMatch) {
      total = parseInt(okMatch[1], 10);
      passed = total;
    } else if (failureMatch) {
      total = parseInt(failureMatch[1], 10);
      failed = parseInt(failureMatch[2] || '0', 10) + parseInt(failureMatch[3] || '0', 10);
      skipped = parseInt(failureMatch[4] || '0', 10);
      passed = total - failed - skipped;
    }

    return {
      framework: this.getFrameworkName(),
      status: failed > 0 || exitCode !== 0 ? TestStatus.FAILURE : TestStatus.SUCCESS,
      total,
      passed,
      failed,
      skipped,
      incomplete: 0,
      risky: 0,
      failures: [],
      executionTime: 0,
      rawOutput: stdout,
    };
  }
}
