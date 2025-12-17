# PHP Test Action

A comprehensive GitHub Action for running PHP tests with PHPUnit or Pest, featuring automatic framework detection, coverage reporting, and rich GitHub integration.

## Features

- **Auto-detect test framework**: Automatically detects PHPUnit or Pest based on your project
- **Multiple project types**: Supports TYPO3 extensions/sites, Laravel applications, and generic PHP projects
- **Coverage reporting**: Generate and display code coverage with Clover XML format
- **GitHub integration**: Annotations for failures, job summaries, and PR comments
- **Database setup**: Automatic SQLite or MySQL database configuration for functional tests
- **Flexible configuration**: Extensive options for test types, coverage thresholds, and more
- **Codecov integration**: Optional upload to Codecov

## Quick Start

### Simple PHPUnit Project

```yaml
- name: Run PHP Tests
  uses: zeroseven/php-test-action@v1
  with:
    test-path: tests
    coverage-enabled: true
```

### TYPO3 Extension

```yaml
- name: Run TYPO3 Tests
  uses: zeroseven/php-test-action@v1
  with:
    test-type: all  # Run both unit and functional tests
    database-type: sqlite
    coverage-threshold: 80
    coverage-comment: true
```

### Laravel with Pest

```yaml
- name: Run Pest Tests
  uses: zeroseven/php-test-action@v1
  with:
    test-framework: auto  # Will detect Pest automatically
    database-type: mysql
    database-host: 127.0.0.1
    codecov-upload: true
```

## Inputs

### Test Configuration

| Input | Description | Default |
|-------|-------------|---------|
| `test-type` | Type of tests: `unit`, `functional`, or `all` | `all` |
| `test-framework` | Framework: `auto`, `phpunit`, or `pest` | `auto` |
| `test-path` | Path to test directory or file | `tests` |
| `phpunit-config` | Path to PHPUnit configuration file | `phpunit.xml.dist` |
| `composer-args` | Additional Composer install arguments | `--prefer-dist --no-progress` |
| `working-directory` | Working directory for tests | `.` |

### Coverage Configuration

| Input | Description | Default |
|-------|-------------|---------|
| `coverage-enabled` | Enable code coverage reporting | `true` |
| `coverage-format` | Format: `clover`, `html`, or `both` | `clover` |
| `coverage-output` | Coverage output directory | `.coverage` |
| `coverage-threshold` | Minimum coverage percentage (0-100) | `0` |
| `coverage-comment` | Post coverage as PR comment | `true` |

### Codecov Configuration

| Input | Description | Default |
|-------|-------------|---------|
| `codecov-upload` | Upload coverage to Codecov | `false` |
| `codecov-token` | Codecov token for private repos | `` |

### Database Configuration

| Input | Description | Default |
|-------|-------------|---------|
| `database-type` | Database: `sqlite`, `mysql`, or `none` | `sqlite` |
| `database-host` | MySQL host | `127.0.0.1` |
| `database-port` | MySQL port | `3306` |
| `database-name` | Database name | `test_db` |
| `database-user` | MySQL username | `root` |
| `database-password` | MySQL password | `root` |

### Additional Options

| Input | Description | Default |
|-------|-------------|---------|
| `php-extensions` | PHP extensions to check (comma-separated) | `mbstring, xml, ctype, iconv, intl, pdo_sqlite, dom, filter, json` |
| `fail-on-incomplete` | Fail on incomplete tests | `false` |
| `fail-on-risky` | Fail on risky tests | `false` |
| `fail-on-skipped` | Fail on skipped tests | `false` |
| `verbose` | Enable verbose output | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `test-result` | Overall result: `success` or `failure` |
| `tests-total` | Total number of tests run |
| `tests-passed` | Number of tests passed |
| `tests-failed` | Number of tests failed |
| `tests-skipped` | Number of tests skipped |
| `tests-incomplete` | Number of incomplete tests |
| `coverage-percentage` | Overall coverage percentage |
| `coverage-lines` | Line coverage percentage |
| `coverage-methods` | Method coverage percentage |
| `coverage-classes` | Class coverage percentage |
| `coverage-report-path` | Path to coverage report |

## Usage Examples

### PHP Matrix Testing

```yaml
name: Tests

on: [push, pull_request]

jobs:
  tests:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        php: ['8.1', '8.2', '8.3']

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: mbstring, xml, pdo_sqlite
          coverage: xdebug

      - name: Install Dependencies
        run: composer install

      - name: Run Tests
        uses: zeroseven/php-test-action@v1
        with:
          coverage-enabled: true
          coverage-threshold: 80
```

### TYPO3 Extension with MySQL

```yaml
name: TYPO3 Tests

on: [push, pull_request]

jobs:
  functional-tests:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, xml, pdo_mysql, intl
          coverage: xdebug

      - name: Install Dependencies
        run: composer install

      - name: Run Tests
        uses: zeroseven/php-test-action@v1
        with:
          test-type: all
          database-type: mysql
          database-host: 127.0.0.1
          database-password: root
          coverage-enabled: true
```

### Laravel with Pest and Codecov

```yaml
name: Laravel Tests

on: [push, pull_request]

jobs:
  tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, xml, pdo_sqlite
          coverage: xdebug

      - name: Copy Environment File
        run: cp .env.example .env

      - name: Install Dependencies
        run: composer install

      - name: Generate Application Key
        run: php artisan key:generate

      - name: Run Tests
        uses: zeroseven/php-test-action@v1
        with:
          test-framework: pest
          database-type: sqlite
          coverage-enabled: true
          coverage-threshold: 70
          codecov-upload: true
          codecov-token: ${{ secrets.CODECOV_TOKEN }}
```

### Using Outputs

```yaml
- name: Run Tests
  id: tests
  uses: zeroseven/php-test-action@v1
  with:
    coverage-enabled: true

- name: Check Results
  run: |
     
    echo "Test Result: ${{ steps.tests.outputs.test-result }}"
    echo "Tests Passed: ${{ steps.tests.outputs.tests-passed }}"
    echo "Coverage: ${{ steps.tests.outputs.coverage-percentage }}%"

- name: Notify on Failure
  if: steps.tests.outputs.test-result == 'failure'
  run: echo "Tests failed!"
```

## How It Works

### Framework Detection

The action automatically detects your test framework by:

1. Checking `composer.json` for `pestphp/pest` dependency → Pest
2. Looking for `vendor/bin/pest` executable → Pest
3. Checking for `phpunit/phpunit` dependency → PHPUnit
4. Looking for `vendor/bin/phpunit` executable → PHPUnit
5. Defaulting to PHPUnit if no framework is found

You can override auto-detection by setting `test-framework: phpunit` or `test-framework: pest`.

### Project Type Detection

The action detects your project type to configure the environment appropriately:

- **TYPO3**: Detected by `typo3/testing-framework`, `typo3/cms-core`, or `ext_emconf.php`
- **Laravel**: Detected by `laravel/framework` or `artisan` file
- **Generic**: Default for other PHP projects

### Database Setup

#### SQLite (Default)
- Creates temporary SQLite database
- Sets appropriate environment variables for TYPO3/Laravel
- No service container required
- Fast and simple

#### MySQL
- Validates connection to MySQL service container
- Creates database if it doesn't exist
- Sets environment variables for TYPO3/Laravel
- Requires MySQL service in workflow

### Coverage Reporting

The action:

1. Generates Clover XML coverage report
2. Parses metrics (lines, methods, classes)
3. Creates GitHub job summary with tables
4. Posts PR comment with coverage details (optional)
5. Validates against threshold (optional)
6. Uploads to Codecov (optional)

## Troubleshooting

### Tests Not Found

**Problem**: No tests are executed.

**Solution**: Verify your `test-path` input points to the correct directory. For PHPUnit, ensure your `phpunit.xml` or `phpunit.xml.dist` is configured correctly.

### Coverage Not Generated

**Problem**: Coverage is 0% or missing.

**Solution**:
- Ensure Xdebug or PCOV extension is installed
- Check that your PHP setup includes coverage driver
- Verify `coverage-enabled: true` is set

### Database Connection Failed

**Problem**: MySQL connection errors in functional tests.

**Solution**:
- Ensure MySQL service container is running
- Check `database-host`, `database-port` match service configuration
- Verify health check passes before running tests

### Permission Denied

**Problem**: Unable to write coverage files.

**Solution**: Ensure the `coverage-output` directory is writable. The action creates it automatically, but check for any permission issues in your runner.

### Framework Not Detected

**Problem**: Wrong framework detected or not detected.

**Solution**: Explicitly set `test-framework: phpunit` or `test-framework: pest` instead of using `auto`.

## Development

### Building

```bash
npm install
npm run build
npm run package
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run format
```

### Releases

This project uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and releases:

- **Automatic versioning**: Version numbers are determined by commit messages
- **Changelog generation**: CHANGELOG.md is automatically updated
- **GitHub releases**: Releases are created automatically with release notes
- **Tag management**: Major version tags (v1, v2, etc.) are updated automatically

**How it works**:
1. Push commits to `main` branch using conventional commit format
2. semantic-release analyzes commits since last release
3. Determines new version based on commit types:
   - `fix:` → Patch version (1.0.0 → 1.0.1)
   - `feat:` → Minor version (1.0.0 → 1.1.0)
   - `BREAKING CHANGE:` or `!` → Major version (1.0.0 → 2.0.0)
4. Updates package.json, CHANGELOG.md, and creates GitHub release
5. Updates major version tag (v1 points to latest v1.x.x)

**Manual releases**: Trigger the release workflow manually via GitHub Actions

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run all` to build and lint
6. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
7. Submit a pull request

### Conventional Commits

This project uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and releases. Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

**Format**: `<type>(<scope>): <description>`

**Types**:
- `feat`: New feature (triggers minor version bump)
- `fix`: Bug fix (triggers patch version bump)
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples**:
```
feat: add support for Codeception framework
feat(coverage): add HTML coverage format option
fix: resolve SQLite database path issue
fix(database): correct MySQL connection timeout
docs: update README with Laravel examples
chore: update dependencies
```

**Breaking Changes**: Add `BREAKING CHANGE:` in the commit body or use `!` after type:
```
feat!: change coverage output format
fix!: update minimum PHP version to 8.1

BREAKING CHANGE: Coverage output now uses different directory structure
```

## License

MIT License - see [LICENSE](LICENSE) for details

## Credits

Built with:
- [TypeScript](https://www.typescriptlang.org/)
- [@actions/core](https://github.com/actions/toolkit)
- [@actions/exec](https://github.com/actions/toolkit)
- [@actions/github](https://github.com/actions/toolkit)
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)

Inspired by [zeroseven/code-quality-action](https://github.com/zeroseven/code-quality-action)
