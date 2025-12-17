import { ActionInputs, TestFramework } from '../types/ActionInputs';
import { fileExists } from '../utils/fileUtils';

export class TestConfig {
  private inputs: ActionInputs;
  private framework: TestFramework;

  constructor(inputs: ActionInputs, framework: TestFramework) {
    this.inputs = inputs;
    this.framework = framework;
  }

  getFramework(): TestFramework {
    return this.framework;
  }

  getTestPath(): string {
    return this.inputs.testPath;
  }

  getConfigPath(): string {
    return this.inputs.phpunitConfig;
  }

  async hasConfigFile(): Promise<boolean> {
    return await fileExists(this.getConfigPath());
  }

  shouldRunUnitTests(): boolean {
    return this.inputs.testType === 'unit' || this.inputs.testType === 'all';
  }

  shouldRunFunctionalTests(): boolean {
    return this.inputs.testType === 'functional' || this.inputs.testType === 'all';
  }

  getCoverageArgs(): string[] {
    const args: string[] = [];

    if (!this.inputs.coverage.enabled) {
      return args;
    }

    const { format, output } = this.inputs.coverage;

    if (format === 'clover' || format === 'both') {
      args.push('--coverage-clover', `${output}/clover.xml`);
    }

    if (format === 'html' || format === 'both') {
      args.push('--coverage-html', `${output}/html`);
    }

    return args;
  }

  getTestSuiteArgs(): string[] {
    const args: string[] = [];

    if (this.inputs.testType === 'unit') {
      args.push('--testsuite', 'unit');
    } else if (this.inputs.testType === 'functional') {
      args.push('--testsuite', 'functional');
    }

    return args;
  }

  getAdditionalArgs(): string[] {
    const args: string[] = [];

    if (this.inputs.verbose) {
      args.push('--verbose');
    }

    if (this.inputs.failOnIncomplete) {
      args.push('--fail-on-incomplete');
    }

    if (this.inputs.failOnRisky) {
      args.push('--fail-on-risky');
    }

    if (this.inputs.failOnSkipped) {
      args.push('--fail-on-skipped');
    }

    return args;
  }

  buildCommand(): string[] {
    const args: string[] = [];

    // Add configuration file if it exists
    if (this.inputs.phpunitConfig) {
      args.push('--configuration', this.inputs.phpunitConfig);
    }

    // Add test suite args
    args.push(...this.getTestSuiteArgs());

    // Add coverage args
    args.push(...this.getCoverageArgs());

    // Add JUnit log for parsing test results
    args.push('--log-junit', `${this.inputs.coverage.output}/junit.xml`);

    // Add additional args
    args.push(...this.getAdditionalArgs());

    // Add test path if not using config
    if (!this.inputs.phpunitConfig) {
      args.push(this.inputs.testPath);
    }

    return args;
  }
}
