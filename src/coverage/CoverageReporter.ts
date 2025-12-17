import { CoverageData } from '../types/CoverageData';

export class CoverageReporter {
  formatSummary(coverage: CoverageData): string {
    const { summary } = coverage;

    return `
## Coverage Summary

| Metric | Coverage |
|--------|----------|
| Lines | ${summary.lines.covered}/${summary.lines.total} (${summary.lines.percentage.toFixed(2)}%) |
| Methods | ${summary.methods.covered}/${summary.methods.total} (${summary.methods.percentage.toFixed(2)}%) |
| Classes | ${summary.classes.covered}/${summary.classes.total} (${summary.classes.percentage.toFixed(2)}%) |
| **Overall** | **${summary.overall.toFixed(2)}%** |
`;
  }

  formatFileCoverage(coverage: CoverageData, limit: number = 10): string {
    const files = Array.from(coverage.files.values())
      .sort((a, b) => a.lines.percentage - b.lines.percentage)
      .slice(0, limit);

    if (files.length === 0) {
      return '';
    }

    let table = '\n## Files with Lowest Coverage\n\n';
    table += '| File | Lines | Methods |\n';
    table += '|------|-------|----------|\n';

    for (const file of files) {
      const fileName = file.path.split('/').pop() || file.path;
      table += `| ${fileName} | ${file.lines.percentage.toFixed(1)}% | ${file.methods.percentage.toFixed(1)}% |\n`;
    }

    return table;
  }

  formatForConsole(coverage: CoverageData): string {
    const { summary } = coverage;

    const lines = [
      'Coverage Summary:',
      `  Lines:   ${summary.lines.percentage.toFixed(2)}% (${summary.lines.covered}/${summary.lines.total})`,
      `  Methods: ${summary.methods.percentage.toFixed(2)}% (${summary.methods.covered}/${summary.methods.total})`,
      `  Classes: ${summary.classes.percentage.toFixed(2)}% (${summary.classes.covered}/${summary.classes.total})`,
      `  Overall: ${summary.overall.toFixed(2)}%`,
    ];

    return lines.join('\n');
  }

  formatForPRComment(coverage: CoverageData): string {
    let comment = '## Test Coverage Report\n\n';
    comment += this.formatSummary(coverage);
    comment += this.formatFileCoverage(coverage, 5);

    return comment;
  }

  getStatusEmoji(percentage: number, threshold: number): string {
    if (percentage >= threshold) {
      return '✅';
    } else if (percentage >= threshold * 0.9) {
      return '⚠️';
    } else {
      return '❌';
    }
  }

  formatCoverageBadge(percentage: number): string {
    let color = 'red';
    if (percentage >= 80) {
      color = 'brightgreen';
    } else if (percentage >= 60) {
      color = 'yellow';
    } else if (percentage >= 40) {
      color = 'orange';
    }

    return `![Coverage](https://img.shields.io/badge/coverage-${percentage.toFixed(1)}%25-${color})`;
  }
}
