export interface CoverageData {
  summary: CoverageSummary;
  files: Map<string, FileCoverage>;
}

export interface CoverageSummary {
  lines: CoverageMetric;
  methods: CoverageMetric;
  classes: CoverageMetric;
  overall: number;
}

export interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}

export interface FileCoverage {
  path: string;
  lines: CoverageMetric;
  methods: CoverageMetric;
  classes: CoverageMetric;
  uncoveredLines: number[];
}

export interface CloverXMLMetrics {
  elements: number;
  coveredelements: number;
  statements: number;
  coveredstatements: number;
  methods: number;
  coveredmethods: number;
  classes: number;
  coveredclasses: number;
}

export interface CoverageThresholdResult {
  met: boolean;
  required: number;
  actual: number;
  message: string;
}
