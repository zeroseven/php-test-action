import { TestRunner } from './TestRunner';
import { TestResult, TestStatus } from '../types/TestResult';
import { TestConfig } from '../config/TestConfig';

export class PestRunner extends TestRunner {
  constructor(config: TestConfig, workingDir: string) {
    super(config, workingDir);
  }

  getExecutable(): string {
    return 'vendor/bin/pest';
  }

  protected getFrameworkName(): string {
    return 'Pest';
  }

  buildCommand(): string[] {
    const args: string[] = [];

    // Pest uses PHPUnit configuration, so add it if available
    this.addConfigArgs(args);

    // Add coverage args (Pest supports PHPUnit coverage options)
    this.addCoverageArgs(args);

    // Pest doesn't use --log-junit, but we can add it for compatibility
    const coverageOutput = this.config.getCoverageArgs()[1] || '.coverage';
    const baseDir = coverageOutput.replace('/clover.xml', '');
    args.push('--log-junit', `${baseDir}/junit.xml`);

    // Add verbose if needed
    if (this.config.getAdditionalArgs().includes('--verbose')) {
      args.push('--verbose');
    }

    // Add test path if no config
    if (!this.config.getConfigPath()) {
      args.push(this.config.getTestPath());
    }

    return args;
  }

  protected parseStdout(stdout: string, _stderr: string, exitCode: number): TestResult {
    // Basic parsing from Pest output
    // Format: "Tests: X passed" or "Tests: X failed, Y passed"

    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Try to extract test counts from Pest output
    const passedMatch = stdout.match(/Tests:\s+(\d+) passed/);
    const failedMatch = stdout.match(/Tests:\s+(\d+) failed/);
    const skippedMatch = stdout.match(/(\d+) skipped/);

    if (passedMatch) {
      passed = parseInt(passedMatch[1], 10);
    }

    if (failedMatch) {
      failed = parseInt(failedMatch[1], 10);
    }

    if (skippedMatch) {
      skipped = parseInt(skippedMatch[1], 10);
    }

    total = passed + failed + skipped;

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
