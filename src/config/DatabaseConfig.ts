import { ActionInputs, DatabaseType } from '../types/ActionInputs';
import * as path from 'path';

export class DatabaseConfig {
  private inputs: ActionInputs;

  constructor(inputs: ActionInputs) {
    this.inputs = inputs;
  }

  getType(): DatabaseType {
    return this.inputs.database.type as DatabaseType;
  }

  isEnabled(): boolean {
    return this.inputs.database.type !== DatabaseType.NONE;
  }

  isSQLite(): boolean {
    return this.inputs.database.type === DatabaseType.SQLITE;
  }

  isMySQL(): boolean {
    return this.inputs.database.type === DatabaseType.MYSQL;
  }

  getSQLitePath(): string {
    return path.join(this.inputs.workingDirectory, '.test-db.sqlite');
  }

  getMySQLConfig() {
    return {
      host: this.inputs.database.host,
      port: this.inputs.database.port,
      database: this.inputs.database.name,
      user: this.inputs.database.user,
      password: this.inputs.database.password,
    };
  }

  getTYPO3EnvironmentVariables(): Record<string, string> {
    const env: Record<string, string> = {};

    if (this.isSQLite()) {
      env.typo3DatabaseDriver = 'pdo_sqlite';
      env.typo3DatabasePath = this.getSQLitePath();
    } else if (this.isMySQL()) {
      const mysql = this.getMySQLConfig();
      env.typo3DatabaseDriver = 'pdo_mysql';
      env.typo3DatabaseHost = mysql.host;
      env.typo3DatabasePort = mysql.port.toString();
      env.typo3DatabaseName = mysql.database;
      env.typo3DatabaseUsername = mysql.user;
      env.typo3DatabasePassword = mysql.password;
    }

    return env;
  }

  getLaravelEnvironmentVariables(): Record<string, string> {
    const env: Record<string, string> = {};

    if (this.isSQLite()) {
      env.DB_CONNECTION = 'sqlite';
      env.DB_DATABASE = this.getSQLitePath();
    } else if (this.isMySQL()) {
      const mysql = this.getMySQLConfig();
      env.DB_CONNECTION = 'mysql';
      env.DB_HOST = mysql.host;
      env.DB_PORT = mysql.port.toString();
      env.DB_DATABASE = mysql.database;
      env.DB_USERNAME = mysql.user;
      env.DB_PASSWORD = mysql.password;
    }

    return env;
  }

  getGenericEnvironmentVariables(): Record<string, string> {
    const env: Record<string, string> = {};

    if (this.isSQLite()) {
      env.DATABASE_URL = `sqlite:///${this.getSQLitePath()}`;
    } else if (this.isMySQL()) {
      const mysql = this.getMySQLConfig();
      env.DATABASE_URL = `mysql://${mysql.user}:${mysql.password}@${mysql.host}:${mysql.port}/${mysql.database}`;
    }

    return env;
  }
}
