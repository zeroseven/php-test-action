import { fileExists, readJSONFile, findFileUpwards } from '../utils/fileUtils';
import { logger } from '../utils/logger';

export interface ComposerJSON {
  name?: string;
  type?: string;
  require?: Record<string, string>;
  'require-dev'?: Record<string, string>;
  autoload?: {
    'psr-4'?: Record<string, string>;
  };
  scripts?: Record<string, string>;
}

export class ComposerAnalyzer {
  private composerPath: string | null = null;
  private composerData: ComposerJSON | null = null;

  async analyze(workingDir: string): Promise<void> {
    logger.debug('Analyzing composer.json...');

    // Find composer.json
    this.composerPath = await findFileUpwards('composer.json', workingDir);

    if (!this.composerPath) {
      throw new Error('composer.json not found in project');
    }

    logger.info(`Found composer.json at ${this.composerPath}`);

    // Parse composer.json
    this.composerData = await readJSONFile<ComposerJSON>(this.composerPath);
  }

  hasComposerJSON(): boolean {
    return this.composerPath !== null;
  }

  getComposerData(): ComposerJSON | null {
    return this.composerData;
  }

  hasDependency(packageName: string): boolean {
    if (!this.composerData) {
      return false;
    }

    return (
      (this.composerData.require && packageName in this.composerData.require) ||
      (this.composerData['require-dev'] && packageName in this.composerData['require-dev']) ||
      false
    );
  }

  getDependencies(): string[] {
    if (!this.composerData) {
      return [];
    }

    const deps: string[] = [];

    if (this.composerData.require) {
      deps.push(...Object.keys(this.composerData.require));
    }

    if (this.composerData['require-dev']) {
      deps.push(...Object.keys(this.composerData['require-dev']));
    }

    return deps;
  }

  hasScript(scriptName: string): boolean {
    if (!this.composerData?.scripts) {
      return false;
    }

    return scriptName in this.composerData.scripts;
  }

  getProjectType(): string | null {
    return this.composerData?.type || null;
  }

  async hasVendorBin(binName: string): Promise<boolean> {
    if (!this.composerPath) {
      return false;
    }

    const binPath = this.composerPath.replace('composer.json', `vendor/bin/${binName}`);
    return await fileExists(binPath);
  }
}
