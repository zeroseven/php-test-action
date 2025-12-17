import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readFileContent(filePath: string): Promise<string> {
  return await readFile(filePath, 'utf-8');
}

export async function writeFileContent(filePath: string, content: string): Promise<void> {
  await writeFile(filePath, content, 'utf-8');
}

export async function readJSONFile<T>(filePath: string): Promise<T> {
  const content = await readFileContent(filePath);
  return JSON.parse(content) as T;
}

export async function ensureDir(dirPath: string): Promise<void> {
  if (!(await fileExists(dirPath))) {
    await mkdir(dirPath, { recursive: true });
  }
}

export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export function resolvePath(...paths: string[]): string {
  return path.resolve(...paths);
}

export function joinPath(...paths: string[]): string {
  return path.join(...paths);
}

export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

export function getDirName(filePath: string): string {
  return path.dirname(filePath);
}

export function getExtension(filePath: string): string {
  return path.extname(filePath);
}

export async function findFileUpwards(
  fileName: string,
  startDir: string = process.cwd()
): Promise<string | null> {
  let currentDir = startDir;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const filePath = joinPath(currentDir, fileName);
    if (await fileExists(filePath)) {
      return filePath;
    }

    const parentDir = getDirName(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}
