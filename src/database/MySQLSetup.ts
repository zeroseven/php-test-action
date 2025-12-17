import { DatabaseConfig } from '../config/DatabaseConfig';
import { logger } from '../utils/logger';
import { executeCommand } from '../utils/commandUtils';

export class MySQLSetup {
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async setup(): Promise<void> {
    const mysqlConfig = this.config.getMySQLConfig();

    logger.info(`Setting up MySQL database: ${mysqlConfig.database}`);

    // Test MySQL connection
    const connected = await this.testConnection();

    if (!connected) {
      throw new Error(
        'Failed to connect to MySQL. Ensure MySQL service container is running and accessible.'
      );
    }

    // Create database if it doesn't exist
    await this.createDatabase();

    logger.info('MySQL database setup completed');
  }

  private async testConnection(): Promise<boolean> {
    const mysqlConfig = this.config.getMySQLConfig();

    logger.debug('Testing MySQL connection...');

    try {
      const result = await executeCommand('mysql', [
        `-h${mysqlConfig.host}`,
        `-P${mysqlConfig.port}`,
        `-u${mysqlConfig.user}`,
        `-p${mysqlConfig.password}`,
        '-e',
        'SELECT 1;',
      ]);

      if (result.exitCode === 0) {
        logger.debug('MySQL connection successful');
        return true;
      }

      logger.warning(`MySQL connection failed: ${result.stderr}`);
      return false;
    } catch (error) {
      logger.warning(`MySQL connection error: ${error}`);
      return false;
    }
  }

  private async createDatabase(): Promise<void> {
    const mysqlConfig = this.config.getMySQLConfig();

    logger.debug(`Creating database: ${mysqlConfig.database}`);

    try {
      const result = await executeCommand('mysql', [
        `-h${mysqlConfig.host}`,
        `-P${mysqlConfig.port}`,
        `-u${mysqlConfig.user}`,
        `-p${mysqlConfig.password}`,
        '-e',
        `CREATE DATABASE IF NOT EXISTS \`${mysqlConfig.database}\`;`,
      ]);

      if (result.exitCode === 0) {
        logger.debug(`Database created: ${mysqlConfig.database}`);
      } else {
        logger.warning(`Failed to create database: ${result.stderr}`);
      }
    } catch (error) {
      logger.warning(`Database creation error: ${error}`);
    }
  }
}
