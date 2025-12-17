import { TestResult, TestStatus, TestFailure } from '../types/TestResult';
import { TestConfig } from '../config/TestConfig';
import { logger } from '../utils/logger';
import { executeCommandWithOutput } from '../utils/commandUtils';
import { fileExists, ensureDir, readFileContent } from '../utils/fileUtils';
import { parseXML } from '../utils/xmlParser';

export abstract class TestRunner {
  protected config: TestConfig;
  protected workingDir: string;

  constructor(config: TestConfig, workingDir: string) {
    this.config = config;
    this.workingDir = workingDir;
  }

  abstract getExecutable(): string;
  abstract buildCommand(): string[];

  async run(): Promise<TestResult> {
    logger.group(`Running ${this.getFrameworkName()} tests`);

    try {
      // Ensure coverage output directory exists
      if (this.config.getConfigPath()) {
        await ensureDir(this.config.getConfigPath().replace(/\/[^/]+$/, ''));
      }

      // Build and execute command
      const executable = this.getExecutable();
      const args = this.buildCommand();

      logger.info(`Executing: ${executable} ${args.join(' ')}`);

      const result = await executeCommandWithOutput(executable, args, {
        cwd: this.workingDir,
      });

      // Parse test results
      const testResult = await this.parseResults(result.stdout, result.stderr, result.exitCode);

      logger.info(`Tests completed: ${testResult.passed} passed, ${testResult.failed} failed`);

      return testResult;
    } finally {
      logger.endGroup();
    }
  }

  protected abstract getFrameworkName(): string;

  protected async parseResults(
    stdout: string,
    stderr: string,
    exitCode: number
  ): Promise<TestResult> {
    const junitPath = `${this.config.getConfigPath().replace(/\/[^/]+$/, '')}/junit.xml`;

    // Try to parse JUnit XML if it exists
    if (await fileExists(junitPath)) {
      return await this.parseJUnitXML(junitPath, stdout, exitCode);
    }

    // Fallback to parsing stdout
    return this.parseStdout(stdout, stderr, exitCode);
  }

  protected async parseJUnitXML(
    junitPath: string,
    stdout: string,
    exitCode: number
  ): Promise<TestResult> {
    try {
      const xmlContent = await readFileContent(junitPath);
      const parsed = parseXML(xmlContent);

      const testsuites = parsed.testsuites;
      const failures: TestFailure[] = [];
      let total = 0;
      let passed = 0;
      let failed = 0;
      let skipped = 0;
      let incomplete = 0;
      let risky = 0;
      let executionTime = 0;

      if (testsuites && testsuites.testsuite) {
        const suites = Array.isArray(testsuites.testsuite)
          ? testsuites.testsuite
          : [testsuites.testsuite];

        for (const suite of suites) {
          total += parseInt(suite['@_tests'] || '0', 10);
          failed += parseInt(suite['@_failures'] || '0', 10);
          failed += parseInt(suite['@_errors'] || '0', 10);
          skipped += parseInt(suite['@_skipped'] || '0', 10);
          incomplete += parseInt(suite['@_incomplete'] || '0', 10);
          risky += parseInt(suite['@_risky'] || '0', 10);
          executionTime += parseFloat(suite['@_time'] || '0');

          // Parse test cases
          if (suite.testcase) {
            const testcases = Array.isArray(suite.testcase) ? suite.testcase : [suite.testcase];

            for (const testcase of testcases) {
              if (testcase.failure || testcase.error) {
                const failure = testcase.failure || testcase.error;
                failures.push({
                  testName: testcase['@_name'] || 'Unknown',
                  testClass: testcase['@_class'],
                  file: testcase['@_file'] || '',
                  line: parseInt(testcase['@_line'] || '0', 10),
                  message: failure['@_message'] || failure['#text'] || 'Test failed',
                  type: testcase.error ? 'error' : 'failure',
                  trace: failure['#text'],
                });
              }
            }
          }
        }
      }

      passed = total - failed - skipped - incomplete;

      return {
        framework: this.getFrameworkName(),
        status: failed > 0 ? TestStatus.FAILURE : TestStatus.SUCCESS,
        total,
        passed,
        failed,
        skipped,
        incomplete,
        risky,
        failures,
        executionTime,
        rawOutput: stdout,
      };
    } catch (error) {
      logger.warning(`Failed to parse JUnit XML: ${error}`);
      return this.parseStdout(stdout, '', exitCode);
    }
  }

  protected abstract parseStdout(stdout: string, stderr: string, exitCode: number): TestResult;

  protected addCoverageArgs(args: string[]): void {
    args.push(...this.config.getCoverageArgs());
  }

  protected addConfigArgs(args: string[]): void {
    const configPath = this.config.getConfigPath();
    if (configPath) {
      args.push('--configuration', configPath);
    }
  }
}
