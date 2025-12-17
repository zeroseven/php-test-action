import { DatabaseConfig } from '../config/DatabaseConfig';
import { DatabaseType, ProjectType } from '../types/ActionInputs';
import { SQLiteSetup } from './SQLiteSetup';
import { MySQLSetup } from './MySQLSetup';
import { logger } from '../utils/logger';

export class DatabaseSetup {
  private config: DatabaseConfig;
  private projectType: ProjectType;

  constructor(config: DatabaseConfig, projectType: ProjectType) {
    this.config = config;
    this.projectType = projectType;
  }

  async setup(): Promise<void> {
    if (!this.config.isEnabled()) {
      logger.info('Database setup skipped (database type: none)');
      return;
    }

    logger.group('Setting up database');

    try {
      const dbType = this.config.getType();

      switch (dbType) {
        case DatabaseType.SQLITE:
          await this.setupSQLite();
          break;
        case DatabaseType.MYSQL:
          await this.setupMySQL();
          break;
        default:
          logger.warning(`Unknown database type: ${dbType}`);
      }

      // Set environment variables based on project type
      this.setEnvironmentVariables();

      logger.info('Database setup completed');
    } finally {
      logger.endGroup();
    }
  }

  private async setupSQLite(): Promise<void> {
    const sqliteSetup = new SQLiteSetup(this.config);
    await sqliteSetup.setup();
  }

  private async setupMySQL(): Promise<void> {
    const mysqlSetup = new MySQLSetup(this.config);
    await mysqlSetup.setup();
  }

  private setEnvironmentVariables(): void {
    let env: Record<string, string> = {};

    switch (this.projectType) {
      case ProjectType.TYPO3:
        env = this.config.getTYPO3EnvironmentVariables();
        logger.debug('Setting TYPO3 environment variables');
        break;
      case ProjectType.LARAVEL:
        env = this.config.getLaravelEnvironmentVariables();
        logger.debug('Setting Laravel environment variables');
        break;
      case ProjectType.GENERIC:
      default:
        env = this.config.getGenericEnvironmentVariables();
        logger.debug('Setting generic environment variables');
        break;
    }

    // Set environment variables
    for (const [key, value] of Object.entries(env)) {
      process.env[key] = value;
      logger.debug(`Set ${key}=${value}`);
    }
  }
}
