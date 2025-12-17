export interface ActionInputs {
  // Test Configuration
  testType: 'unit' | 'functional' | 'all';
  testFramework: 'auto' | 'phpunit' | 'pest';
  testPath: string;
  phpunitConfig: string;
  composerArgs: string;
  workingDirectory: string;

  // Cache Configuration
  cache: {
    enabled: boolean;
    keyPrefix: string;
    composerCache: boolean;
    vendor: boolean;
  };

  // Coverage Configuration
  coverage: {
    enabled: boolean;
    format: 'clover' | 'html' | 'both';
    output: string;
    threshold: number;
    comment: boolean;
  };

  // Codecov Configuration
  codecov: {
    upload: boolean;
    token: string;
  };

  // Database Configuration
  database: {
    type: 'sqlite' | 'mysql' | 'none';
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };

  // Additional Options
  phpExtensions: string[];
  failOnIncomplete: boolean;
  failOnRisky: boolean;
  failOnSkipped: boolean;
  verbose: boolean;
}

export enum TestFramework {
  PHPUNIT = 'phpunit',
  PEST = 'pest',
}

export enum ProjectType {
  TYPO3 = 'typo3',
  LARAVEL = 'laravel',
  GENERIC = 'generic',
}

export enum DatabaseType {
  SQLITE = 'sqlite',
  MYSQL = 'mysql',
  NONE = 'none',
}
