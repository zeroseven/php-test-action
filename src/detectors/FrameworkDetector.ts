import { ComposerAnalyzer } from './ComposerAnalyzer';
import { TestFramework, ActionInputs } from '../types/ActionInputs';
import { logger } from '../utils/logger';

export class FrameworkDetector {
  private composer: ComposerAnalyzer;
  private inputs: ActionInputs;

  constructor(composer: ComposerAnalyzer, inputs: ActionInputs) {
    this.composer = composer;
    this.inputs = inputs;
  }

  async detect(): Promise<TestFramework> {
    logger.group('Detecting test framework');

    try {
      // If user explicitly specified framework, use that
      if (this.inputs.testFramework !== 'auto') {
        const framework =
          this.inputs.testFramework === 'pest' ? TestFramework.PEST : TestFramework.PHPUNIT;
        logger.info(`Using explicitly configured framework: ${framework}`);
        return framework;
      }

      // Auto-detect based on composer.json
      const framework = await this.autoDetect();
      logger.info(`Auto-detected framework: ${framework}`);
      return framework;
    } finally {
      logger.endGroup();
    }
  }

  private async autoDetect(): Promise<TestFramework> {
    // Check for Pest in composer.json dependencies
    if (this.composer.hasDependency('pestphp/pest')) {
      logger.debug('Found pestphp/pest in composer.json');
      return TestFramework.PEST;
    }

    // Check for Pest executable
    if (await this.composer.hasVendorBin('pest')) {
      logger.debug('Found pest executable in vendor/bin');
      return TestFramework.PEST;
    }

    // Check for PHPUnit in composer.json dependencies
    if (this.composer.hasDependency('phpunit/phpunit')) {
      logger.debug('Found phpunit/phpunit in composer.json');
      return TestFramework.PHPUNIT;
    }

    // Check for PHPUnit executable
    if (await this.composer.hasVendorBin('phpunit')) {
      logger.debug('Found phpunit executable in vendor/bin');
      return TestFramework.PHPUNIT;
    }

    // Default to PHPUnit
    logger.warning('No test framework detected, defaulting to PHPUnit');
    return TestFramework.PHPUNIT;
  }

  getExecutablePath(framework: TestFramework): string {
    if (framework === TestFramework.PEST) {
      return 'vendor/bin/pest';
    }
    return 'vendor/bin/phpunit';
  }
}
