export interface TestResult {
  framework: string;
  status: TestStatus;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  incomplete: number;
  risky: number;
  failures: TestFailure[];
  executionTime: number;
  rawOutput: string;
}

export enum TestStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  ERROR = 'error',
}

export interface TestFailure {
  testName: string;
  testClass?: string;
  file: string;
  line: number;
  message: string;
  type: 'failure' | 'error' | 'warning';
  trace?: string;
}

export interface TestSuite {
  name: string;
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  time: number;
  testCases: TestCase[];
}

export interface TestCase {
  name: string;
  class: string;
  file: string;
  line: number;
  assertions: number;
  time: number;
  status: 'passed' | 'failed' | 'error' | 'skipped' | 'incomplete' | 'risky';
  failure?: TestFailure;
}
