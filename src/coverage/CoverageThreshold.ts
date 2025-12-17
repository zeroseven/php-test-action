import { CoverageData, CoverageThresholdResult } from '../types/CoverageData';
import { logger } from '../utils/logger';

export class CoverageThreshold {
  static validate(coverage: CoverageData, threshold: number): CoverageThresholdResult {
    if (threshold === 0) {
      logger.debug('Coverage threshold validation skipped (threshold: 0)');
      return {
        met: true,
        required: threshold,
        actual: coverage.summary.overall,
        message: 'No coverage threshold set',
      };
    }

    const actual = coverage.summary.overall;
    const met = actual >= threshold;

    const message = met
      ? `Coverage threshold met: ${actual.toFixed(2)}% >= ${threshold}%`
      : `Coverage threshold not met: ${actual.toFixed(2)}% < ${threshold}%`;

    if (met) {
      logger.info(message);
    } else {
      logger.error(message);
    }

    return {
      met,
      required: threshold,
      actual,
      message,
    };
  }

  static validateMetrics(
    coverage: CoverageData,
    thresholds: {
      lines?: number;
      methods?: number;
      classes?: number;
    }
  ): {
    met: boolean;
    results: Record<string, CoverageThresholdResult>;
  } {
    const results: Record<string, CoverageThresholdResult> = {};
    let allMet = true;

    if (thresholds.lines !== undefined) {
      const actual = coverage.summary.lines.percentage;
      const met = actual >= thresholds.lines;
      allMet = allMet && met;

      results.lines = {
        met,
        required: thresholds.lines,
        actual,
        message: met
          ? `Line coverage threshold met: ${actual.toFixed(2)}% >= ${thresholds.lines}%`
          : `Line coverage threshold not met: ${actual.toFixed(2)}% < ${thresholds.lines}%`,
      };
    }

    if (thresholds.methods !== undefined) {
      const actual = coverage.summary.methods.percentage;
      const met = actual >= thresholds.methods;
      allMet = allMet && met;

      results.methods = {
        met,
        required: thresholds.methods,
        actual,
        message: met
          ? `Method coverage threshold met: ${actual.toFixed(2)}% >= ${thresholds.methods}%`
          : `Method coverage threshold not met: ${actual.toFixed(2)}% < ${thresholds.methods}%`,
      };
    }

    if (thresholds.classes !== undefined) {
      const actual = coverage.summary.classes.percentage;
      const met = actual >= thresholds.classes;
      allMet = allMet && met;

      results.classes = {
        met,
        required: thresholds.classes,
        actual,
        message: met
          ? `Class coverage threshold met: ${actual.toFixed(2)}% >= ${thresholds.classes}%`
          : `Class coverage threshold not met: ${actual.toFixed(2)}% < ${thresholds.classes}%`,
      };
    }

    return {
      met: allMet,
      results,
    };
  }
}
