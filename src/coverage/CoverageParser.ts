import {
  CoverageData,
  CoverageSummary,
  CoverageMetric,
  FileCoverage,
  CloverXMLMetrics,
} from '../types/CoverageData';
import { fileExists, readFileContent } from '../utils/fileUtils';
import { parseXML } from '../utils/xmlParser';
import { logger } from '../utils/logger';

export class CoverageParser {
  async parse(cloverPath: string): Promise<CoverageData | null> {
    logger.group('Parsing coverage report');

    try {
      if (!(await fileExists(cloverPath))) {
        logger.warning(`Coverage file not found: ${cloverPath}`);
        return null;
      }

      const xmlContent = await readFileContent(cloverPath);
      const parsed = parseXML(xmlContent);

      if (!parsed.coverage) {
        logger.warning('Invalid Clover XML format');
        return null;
      }

      const coverageData = this.parseCoverageXML(parsed.coverage);
      logger.info(`Coverage parsed: ${coverageData.summary.overall.toFixed(2)}%`);

      return coverageData;
    } catch (error) {
      logger.error(`Failed to parse coverage: ${error}`);
      return null;
    } finally {
      logger.endGroup();
    }
  }

  private parseCoverageXML(coverage: any): CoverageData {
    const project = coverage.project;
    const files = new Map<string, FileCoverage>();

    // Parse file-level coverage
    if (project && project.file) {
      const fileList = Array.isArray(project.file) ? project.file : [project.file];

      for (const file of fileList) {
        const filePath = file['@_name'];
        const metrics = file.metrics as CloverXMLMetrics;

        if (metrics) {
          files.set(filePath, {
            path: filePath,
            lines: this.calculateMetric(metrics.coveredstatements, metrics.statements),
            methods: this.calculateMetric(metrics.coveredmethods, metrics.methods),
            classes: this.calculateMetric(metrics.coveredclasses, metrics.classes),
            uncoveredLines: this.extractUncoveredLines(file),
          });
        }
      }
    }

    // Parse project-level metrics
    const projectMetrics = project.metrics as CloverXMLMetrics;

    const summary: CoverageSummary = {
      lines: this.calculateMetric(projectMetrics.coveredstatements, projectMetrics.statements),
      methods: this.calculateMetric(projectMetrics.coveredmethods, projectMetrics.methods),
      classes: this.calculateMetric(projectMetrics.coveredclasses, projectMetrics.classes),
      overall: 0,
    };

    // Calculate overall coverage as average of lines, methods, and classes
    summary.overall =
      (summary.lines.percentage + summary.methods.percentage + summary.classes.percentage) / 3;

    return {
      summary,
      files,
    };
  }

  private calculateMetric(covered: number, total: number): CoverageMetric {
    const percentage = total > 0 ? (covered / total) * 100 : 0;

    return {
      total,
      covered,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    };
  }

  private extractUncoveredLines(file: any): number[] {
    const uncoveredLines: number[] = [];

    if (file.line) {
      const lines = Array.isArray(file.line) ? file.line : [file.line];

      for (const line of lines) {
        if (line['@_type'] === 'stmt' && parseInt(line['@_count'], 10) === 0) {
          uncoveredLines.push(parseInt(line['@_num'], 10));
        }
      }
    }

    return uncoveredLines;
  }
}
