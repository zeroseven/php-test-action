import * as core from '@actions/core';
import { ActionInputs, DatabaseType } from '../types/ActionInputs';
import { resolvePath } from '../utils/fileUtils';

export class ActionConfig {
  static parse(): ActionInputs {
    const testType = this.getInput('test-type') as 'unit' | 'functional' | 'all';
    const testFramework = this.getInput('test-framework') as 'auto' | 'phpunit' | 'pest';
    const testPath = this.getInput('test-path');
    const phpunitConfig = this.getInput('phpunit-config');
    const composerArgs = this.getInput('composer-args');
    const workingDirectory = this.getInput('working-directory');

    // Cache configuration
    const cacheEnabled = this.getBooleanInput('cache-enabled');
    const cacheKeyPrefix = this.getInput('cache-key-prefix');
    const cacheComposerCache = this.getBooleanInput('cache-composer-cache');
    const cacheVendor = this.getBooleanInput('cache-vendor');

    // Coverage configuration
    const coverageEnabled = this.getBooleanInput('coverage-enabled');
    const coverageFormat = this.getInput('coverage-format') as 'clover' | 'html' | 'both';
    const coverageOutput = this.getInput('coverage-output');
    const coverageThreshold = this.getNumberInput('coverage-threshold');
    const coverageComment = this.getBooleanInput('coverage-comment');

    // Codecov configuration
    const codecovUpload = this.getBooleanInput('codecov-upload');
    const codecovToken = this.getInput('codecov-token');

    // Database configuration
    const databaseType = this.getInput('database-type') as DatabaseType;
    const databaseHost = this.getInput('database-host');
    const databasePort = this.getNumberInput('database-port');
    const databaseName = this.getInput('database-name');
    const databaseUser = this.getInput('database-user');
    const databasePassword = this.getInput('database-password');

    // Additional options
    const phpExtensions = this.getInput('php-extensions')
      .split(',')
      .map((ext) => ext.trim());
    const failOnIncomplete = this.getBooleanInput('fail-on-incomplete');
    const failOnRisky = this.getBooleanInput('fail-on-risky');
    const failOnSkipped = this.getBooleanInput('fail-on-skipped');
    const verbose = this.getBooleanInput('verbose');

    // Resolve paths relative to working directory
    const resolvedWorkingDir = resolvePath(process.cwd(), workingDirectory);

    return {
      testType,
      testFramework,
      testPath: resolvePath(resolvedWorkingDir, testPath),
      phpunitConfig: resolvePath(resolvedWorkingDir, phpunitConfig),
      composerArgs,
      workingDirectory: resolvedWorkingDir,
      cache: {
        enabled: cacheEnabled,
        keyPrefix: cacheKeyPrefix,
        composerCache: cacheComposerCache,
        vendor: cacheVendor,
      },
      coverage: {
        enabled: coverageEnabled,
        format: coverageFormat,
        output: resolvePath(resolvedWorkingDir, coverageOutput),
        threshold: coverageThreshold,
        comment: coverageComment,
      },
      codecov: {
        upload: codecovUpload,
        token: codecovToken,
      },
      database: {
        type: databaseType,
        host: databaseHost,
        port: databasePort,
        name: databaseName,
        user: databaseUser,
        password: databasePassword,
      },
      phpExtensions,
      failOnIncomplete,
      failOnRisky,
      failOnSkipped,
      verbose,
    };
  }

  private static getInput(name: string): string {
    return core.getInput(name) || '';
  }

  private static getBooleanInput(name: string): boolean {
    const value = core.getInput(name).toLowerCase();
    return value === 'true' || value === '1' || value === 'yes';
  }

  private static getNumberInput(name: string): number {
    const value = core.getInput(name);
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  }
}
