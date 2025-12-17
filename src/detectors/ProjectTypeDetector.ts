import { ComposerAnalyzer } from './ComposerAnalyzer';
import { ProjectType } from '../types/ActionInputs';
import { fileExists, joinPath, getDirName } from '../utils/fileUtils';
import { logger } from '../utils/logger';

export class ProjectTypeDetector {
  private composer: ComposerAnalyzer;

  constructor(composer: ComposerAnalyzer) {
    this.composer = composer;
  }

  async detect(): Promise<ProjectType> {
    logger.group('Detecting project type');

    try {
      const projectType = await this.detectType();
      logger.info(`Detected project type: ${projectType}`);
      return projectType;
    } finally {
      logger.endGroup();
    }
  }

  private async detectType(): Promise<ProjectType> {
    // Check for TYPO3 Extension
    if (await this.isTYPO3Extension()) {
      return ProjectType.TYPO3;
    }

    // Check for Laravel
    if (await this.isLaravel()) {
      return ProjectType.LARAVEL;
    }

    // Default to generic PHP project
    return ProjectType.GENERIC;
  }

  private async isTYPO3Extension(): Promise<boolean> {
    // Check for TYPO3 testing framework dependency
    if (this.composer.hasDependency('typo3/testing-framework')) {
      logger.debug('Found typo3/testing-framework dependency');
      return true;
    }

    // Check for TYPO3 CMS core dependency
    if (this.composer.hasDependency('typo3/cms-core')) {
      logger.debug('Found typo3/cms-core dependency');
      return true;
    }

    // Check for ext_emconf.php (TYPO3 extension metadata file)
    const composerDir = this.composer.getComposerData()
      ? getDirName(await this.getComposerPath())
      : '.';
    const extEmconfPath = joinPath(composerDir, 'ext_emconf.php');

    if (await fileExists(extEmconfPath)) {
      logger.debug('Found ext_emconf.php file');
      return true;
    }

    // Check composer.json type
    const projectType = this.composer.getProjectType();
    if (projectType === 'typo3-cms-extension' || projectType === 'typo3-cms-framework') {
      logger.debug(`Composer type is ${projectType}`);
      return true;
    }

    return false;
  }

  private async isLaravel(): Promise<boolean> {
    // Check for Laravel framework dependency
    if (this.composer.hasDependency('laravel/framework')) {
      logger.debug('Found laravel/framework dependency');
      return true;
    }

    // Check for artisan file
    const composerDir = this.composer.getComposerData()
      ? getDirName(await this.getComposerPath())
      : '.';
    const artisanPath = joinPath(composerDir, 'artisan');

    if (await fileExists(artisanPath)) {
      logger.debug('Found artisan file');
      return true;
    }

    // Check composer.json type
    const projectType = this.composer.getProjectType();
    if (projectType === 'project' && this.composer.hasDependency('laravel/laravel')) {
      logger.debug('Detected Laravel project type');
      return true;
    }

    return false;
  }

  private async getComposerPath(): Promise<string> {
    // This is a simplified version - in reality, you'd track this in ComposerAnalyzer
    return 'composer.json';
  }
}
