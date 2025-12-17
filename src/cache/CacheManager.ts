import * as core from '@actions/core';
import * as cache from '@actions/cache';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { executeCommand } from '../utils/commandUtils';
import { fileExists } from '../utils/fileUtils';
import { Logger } from '../utils/logger';

export interface CacheConfig {
  enabled: boolean;
  keyPrefix: string;
  composerCache: boolean;
  vendor: boolean;
}

export class CacheManager {
  private config: CacheConfig;
  private workingDirectory: string;
  private logger: Logger;
  private composerCacheDir: string | null = null;

  constructor(config: CacheConfig, workingDirectory: string, logger: Logger) {
    this.config = config;
    this.workingDirectory = workingDirectory;
    this.logger = logger;
  }

  async restore(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug('Cache is disabled');
      return;
    }

    try {
      this.logger.group('Restoring cache');

      // Get Composer cache directory
      await this.detectComposerCacheDir();

      const paths = await this.getCachePaths();
      if (paths.length === 0) {
        this.logger.info('No cache paths configured');
        return;
      }

      const cacheKey = await this.generateCacheKey();
      const restoreKeys = this.generateRestoreKeys();

      this.logger.info(`Cache key: ${cacheKey}`);
      this.logger.debug(`Cache paths: ${paths.join(', ')}`);

      const cacheHit = await cache.restoreCache(paths, cacheKey, restoreKeys);

      if (cacheHit) {
        this.logger.info(`Cache restored from key: ${cacheHit}`);
        core.saveState('cache-hit', 'true');
        core.saveState('cache-key', cacheKey);
      } else {
        this.logger.info('Cache not found');
        core.saveState('cache-hit', 'false');
        core.saveState('cache-key', cacheKey);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warning(`Failed to restore cache: ${message}`);
    } finally {
      this.logger.endGroup();
    }
  }

  async save(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Only save if we didn't hit the cache
    const cacheHit = core.getState('cache-hit') === 'true';
    if (cacheHit) {
      this.logger.debug('Cache hit occurred, skipping save');
      return;
    }

    try {
      this.logger.group('Saving cache');

      const paths = await this.getCachePaths();
      if (paths.length === 0) {
        this.logger.info('No cache paths configured');
        return;
      }

      const cacheKey = core.getState('cache-key');
      if (!cacheKey) {
        this.logger.warning('No cache key found, skipping save');
        return;
      }

      // Filter out paths that don't exist
      const existingPaths = await this.filterExistingPaths(paths);
      if (existingPaths.length === 0) {
        this.logger.info('No cache paths exist to save');
        return;
      }

      this.logger.info(`Saving cache with key: ${cacheKey}`);
      this.logger.debug(`Cache paths: ${existingPaths.join(', ')}`);

      await cache.saveCache(existingPaths, cacheKey);
      this.logger.info('Cache saved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warning(`Failed to save cache: ${message}`);
    } finally {
      this.logger.endGroup();
    }
  }

  private async detectComposerCacheDir(): Promise<void> {
    try {
      const result = await executeCommand('composer', ['config', 'cache-files-dir'], {
        cwd: this.workingDirectory,
      });

      if (result.exitCode === 0) {
        this.composerCacheDir = result.stdout.trim();
        this.logger.debug(`Composer cache directory: ${this.composerCacheDir}`);
      } else {
        this.logger.debug('Could not detect Composer cache directory');
      }
    } catch (error) {
      this.logger.debug('Composer not available for cache detection');
    }
  }

  private async getCachePaths(): Promise<string[]> {
    const paths: string[] = [];

    // Add Composer cache directory
    if (this.config.composerCache && this.composerCacheDir) {
      paths.push(this.composerCacheDir);
    }

    // Add vendor directory
    if (this.config.vendor) {
      const vendorPath = path.join(this.workingDirectory, 'vendor');
      paths.push(vendorPath);
    }

    return paths;
  }

  private async generateCacheKey(): Promise<string> {
    const platform = process.platform;
    const prefix = this.config.keyPrefix;

    // Hash composer.lock for cache key
    const composerLockPath = path.join(this.workingDirectory, 'composer.lock');
    let lockHash = 'no-lock';

    if (await fileExists(composerLockPath)) {
      const lockContent = await fs.promises.readFile(composerLockPath, 'utf-8');
      lockHash = crypto.createHash('sha256').update(lockContent).digest('hex').substring(0, 8);
    }

    return `${prefix}-${platform}-composer-${lockHash}`;
  }

  private generateRestoreKeys(): string[] {
    const platform = process.platform;
    const prefix = this.config.keyPrefix;

    return [
      `${prefix}-${platform}-composer-`, // Any cache for this platform
      `${prefix}-`, // Any cache for this prefix
    ];
  }

  private async filterExistingPaths(paths: string[]): Promise<string[]> {
    const existingPaths: string[] = [];

    for (const p of paths) {
      if (await fileExists(p)) {
        existingPaths.push(p);
      }
    }

    return existingPaths;
  }
}
