import * as fs from 'fs/promises';
import * as path from 'path';
import type { TestCase, TestResult as PlaywrightTestResult } from '@playwright/test/reporter';
import type { AggregatedTestResult, RunAttempt } from '../types/flaky-analyzer.types';

export class TestRunLogger {
  private testResults: Map<string, AggregatedTestResult> = new Map();
  private outputFile: string;

  constructor(outputFile: string = './flaky-report.json') {
    this.outputFile = outputFile;
    console.log(`[FlakyAnalyzer] Report will be saved to: ${path.resolve(this.outputFile)}`);
  }

  logTestAttempt(test: TestCase, result: PlaywrightTestResult) {
    const testId = test.id;

    if (!this.testResults.has(testId)) {
      this.testResults.set(testId, {
        id: testId,
        title: test.title,
        location: `${path.relative(test.parent.project()?.testDir || process.cwd(), test.location.file)}:${test.location.line}:${test.location.column}`,
        finalStatus: 'skipped',
        isFlaky: false,
        attempts: []
      });
    }

    const aggregatedResult = this.testResults.get(testId)!;

    const attemptData: RunAttempt = {
      attempt: result.retry,
      status: result.status,
      duration: result.duration,
      error: result.error,
      stdout: result.stdout,
      stderr: result.stderr,
      attachments: result.attachments
    };

    aggregatedResult.attempts.push(attemptData);

    aggregatedResult.finalStatus = result.status;

    const statuses = aggregatedResult.attempts.map(a => a.status);
    const hasPassed = statuses.includes('passed');
    const hasFailed = statuses.some(s => s === 'failed' || s === 'timedOut');

    if (aggregatedResult.attempts.length > 1 && hasPassed && hasFailed) {
      aggregatedResult.isFlaky = true;
    } else {
      aggregatedResult.isFlaky = false;
    }
  }

  getAggregatedResults(): AggregatedTestResult[] {
    return Array.from(this.testResults.values());
  }

  getFlakyTests(): AggregatedTestResult[] {
    return this.getAggregatedResults().filter(test => test.isFlaky);
  }

  async saveReport() {
    const reportData = this.getAggregatedResults();
    const flakyTests = this.getFlakyTests();

    console.log(`[FlakyAnalyzer] Total tests analyzed: ${reportData.length}`);
    console.log(`[FlakyAnalyzer] Flaky tests detected in this run: ${flakyTests.length}`);

    try {
      const outputDir = path.dirname(this.outputFile);
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(this.outputFile, JSON.stringify(reportData, null, 2));
      console.log(`[FlakyAnalyzer] Report saved to ${this.outputFile}`);
    } catch (error) {
      console.error(`[FlakyAnalyzer] Failed to save report to ${this.outputFile}`, error);
    }
  }
}