import * as core from '@actions/core';

export class Logger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  info(message: string): void {
    core.info(message);
  }

  debug(message: string): void {
    if (this.verbose) {
      core.debug(message);
    }
  }

  warning(message: string): void {
    core.warning(message);
  }

  error(message: string): void {
    core.error(message);
  }

  group(name: string): void {
    core.startGroup(name);
  }

  endGroup(): void {
    core.endGroup();
  }

  async withGroup<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.group(name);
    try {
      return await fn();
    } finally {
      this.endGroup();
    }
  }

  setOutput(name: string, value: string | number): void {
    core.setOutput(name, value);
  }

  setFailed(message: string): void {
    core.setFailed(message);
  }
}

export const logger = new Logger();
