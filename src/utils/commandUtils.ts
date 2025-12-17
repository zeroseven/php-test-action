import * as exec from '@actions/exec';
import { logger } from './logger';

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function executeCommand(
  command: string,
  args: string[] = [],
  options: exec.ExecOptions = {}
): Promise<CommandResult> {
  let stdout = '';
  let stderr = '';

  const execOptions: exec.ExecOptions = {
    ...options,
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
      stderr: (data: Buffer) => {
        stderr += data.toString();
      },
    },
    ignoreReturnCode: true,
  };

  logger.debug(`Executing: ${command} ${args.join(' ')}`);

  const exitCode = await exec.exec(command, args, execOptions);

  return {
    exitCode,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
}

export async function executeCommandWithOutput(
  command: string,
  args: string[] = [],
  options: exec.ExecOptions = {}
): Promise<CommandResult> {
  const result = await executeCommand(command, args, {
    ...options,
    silent: false,
  });

  if (result.exitCode !== 0) {
    logger.debug(`Command failed with exit code ${result.exitCode}`);
    logger.debug(`STDOUT: ${result.stdout}`);
    logger.debug(`STDERR: ${result.stderr}`);
  }

  return result;
}

export async function commandExists(command: string): Promise<boolean> {
  try {
    const result = await executeCommand('which', [command]);
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

export async function getCommandVersion(command: string): Promise<string | null> {
  try {
    const result = await executeCommand(command, ['--version']);
    if (result.exitCode === 0) {
      return result.stdout.split('\n')[0];
    }
    return null;
  } catch {
    return null;
  }
}
