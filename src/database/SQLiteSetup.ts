import { DatabaseConfig } from '../config/DatabaseConfig';
import { logger } from '../utils/logger';
import { fileExists, writeFileContent, getDirName, ensureDir } from '../utils/fileUtils';
import * as fs from 'fs';

export class SQLiteSetup {
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async setup(): Promise<void> {
    const dbPath = this.config.getSQLitePath();

    logger.info(`Setting up SQLite database at ${dbPath}`);

    // Ensure the directory exists
    const dir = getDirName(dbPath);
    await ensureDir(dir);

    // Create empty database file if it doesn't exist
    if (!(await fileExists(dbPath))) {
      // Create empty file - SQLite will initialize it
      await writeFileContent(dbPath, '');
      logger.debug(`Created SQLite database file: ${dbPath}`);
    } else {
      // Clean up existing database
      fs.unlinkSync(dbPath);
      await writeFileContent(dbPath, '');
      logger.debug(`Cleaned up existing SQLite database: ${dbPath}`);
    }

    logger.info('SQLite database setup completed');
  }
}
