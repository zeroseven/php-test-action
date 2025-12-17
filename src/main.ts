import * as core from '@actions/core';
import { ActionConfig } from './config/ActionConfig';
import { TestConfig } from './config/TestConfig';
import { DatabaseConfig } from './config/DatabaseConfig';
import { ComposerAnalyzer } from './detectors/ComposerAnalyzer';
import { FrameworkDetector } from './detectors/FrameworkDetector';
import { ProjectTypeDetector } from './detectors/ProjectTypeDetector';
import { PHPUnitRunner } from './runners/PHPUnitRunner';
import { PestRunner } from './runners/PestRunner';
import { DatabaseSetup } from './database/DatabaseSetup';
import { CoverageParser } from './coverage/CoverageParser';
import { CoverageThreshold } from './coverage/CoverageThreshold';
import { CoverageReporter } from './coverage/CoverageReporter';
import { GitHubReporter } from './reporters/GitHubReporter';
import { CacheManager } from './cache/CacheManager';
import { Logger } from './utils/logger';
import { TestFramework } from './types/ActionInputs';
import { TestStatus } from './types/TestResult';
import { ensureDir } from './utils/fileUtils';

async function run(): Promise<void> {
  let logger: Logger | null = null;

  try {
    // Parse configuration
    const inputs = ActionConfig.parse();

    // Initialize logger with verbose setting
    logger = new Logger(inputs.verbose);

    logger.info('PHP Test Action started');
    logger.debug(`Working directory: ${inputs.workingDirectory}`);

    // Setup cache
    const cacheManager = new CacheManager(inputs.cache, inputs.workingDirectory, logger);
    await cacheManager.restore();

    // Analyze composer.json
    const composer = new ComposerAnalyzer();
    await composer.analyze(inputs.workingDirectory);

    // Detect framework
    const frameworkDetector = new FrameworkDetector(composer, inputs);
    const framework = await frameworkDetector.detect();

    // Detect project type
    const projectTypeDetector = new ProjectTypeDetector(composer);
    const projectType = await projectTypeDetector.detect();

    logger.info(`Project type: ${projectType}`);
    logger.info(`Test framework: ${framework}`);

    // Setup database if needed
    if (inputs.testType === 'functional' || inputs.testType === 'all') {
      const databaseConfig = new DatabaseConfig(inputs);
      if (databaseConfig.isEnabled()) {
        const databaseSetup = new DatabaseSetup(databaseConfig, projectType);
        await databaseSetup.setup();
      }
    }

    // Ensure coverage output directory exists
    if (inputs.coverage.enabled) {
      await ensureDir(inputs.coverage.output);
      logger.debug(`Coverage output directory: ${inputs.coverage.output}`);
    }

    // Create test config
    const testConfig = new TestConfig(inputs, framework);

    // Create appropriate test runner
    const runner =
      framework === TestFramework.PEST
        ? new PestRunner(testConfig, inputs.workingDirectory)
        : new PHPUnitRunner(testConfig, inputs.workingDirectory);

    // Run tests
    const testResult = await runner.run();

    // Parse coverage if enabled
    let coverage = null;
    if (inputs.coverage.enabled) {
      const coverageParser = new CoverageParser();
      const cloverPath = `${inputs.coverage.output}/clover.xml`;
      coverage = await coverageParser.parse(cloverPath);

      if (coverage) {
        // Display coverage in console
        const coverageReporter = new CoverageReporter();
        logger.info('\n' + coverageReporter.formatForConsole(coverage));

        // Validate coverage threshold
        if (inputs.coverage.threshold > 0) {
          const thresholdResult = CoverageThreshold.validate(coverage, inputs.coverage.threshold);

          if (!thresholdResult.met) {
            logger.error(thresholdResult.message);
            core.setFailed(thresholdResult.message);
          }
        }

        // Upload to Codecov if enabled
        if (inputs.codecov.upload) {
          await uploadToCodecov(cloverPath, inputs.codecov.token, logger);
        }
      }
    }

    // Report results to GitHub
    const githubReporter = new GitHubReporter(inputs);
    await githubReporter.report(testResult, coverage);

    // Determine final action status
    if (testResult.status === TestStatus.FAILURE || testResult.failed > 0) {
      const message = `Tests failed: ${testResult.failed} failure(s), ${testResult.passed} passed`;
      logger.error(message);
      core.setFailed(message);
    } else if (inputs.failOnSkipped && testResult.skipped > 0) {
      const message = `Tests skipped: ${testResult.skipped} test(s) were skipped`;
      logger.error(message);
      core.setFailed(message);
    } else if (inputs.failOnIncomplete && testResult.incomplete > 0) {
      const message = `Tests incomplete: ${testResult.incomplete} test(s) were incomplete`;
      logger.error(message);
      core.setFailed(message);
    } else if (inputs.failOnRisky && testResult.risky > 0) {
      const message = `Tests risky: ${testResult.risky} test(s) were risky`;
      logger.error(message);
      core.setFailed(message);
    } else {
      logger.info(`All tests passed! (${testResult.passed}/${testResult.total})`);
    }

    // Save cache after successful test run
    if (logger) {
      const cacheManager = new CacheManager(inputs.cache, inputs.workingDirectory, logger);
      await cacheManager.save();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (logger) {
      logger.error(`Action failed: ${message}`);
    }
    core.setFailed(message);
  }
}

async function uploadToCodecov(
  coveragePath: string,
  token: string,
  logger: Logger
): Promise<void> {
  try {
    logger.group('Uploading coverage to Codecov');

    const { executeCommand } = await import('./utils/commandUtils');

    const args: string[] = ['-f', coveragePath];

    if (token) {
      args.push('-t', token);
    }

    // Use codecov bash uploader or codecov-action
    // For simplicity, we'll use curl to upload directly
    const result = await executeCommand('bash', [
      '-c',
      `curl -s https://codecov.io/bash | bash -s -- ${args.join(' ')}`,
    ]);

    if (result.exitCode === 0) {
      logger.info('Coverage uploaded to Codecov successfully');
    } else {
      logger.warning(`Codecov upload failed: ${result.stderr}`);
    }
  } catch (error) {
    logger.warning(`Failed to upload to Codecov: ${error}`);
  } finally {
    logger.endGroup();
  }
}

// Run the action
run();
