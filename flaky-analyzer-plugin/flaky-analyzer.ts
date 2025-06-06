import type {
  FullResult, Reporter, TestCase, TestResult as PlaywrightTestResult
} from '@playwright/test/reporter';
import { TestRunLogger } from './test-run-loger/test-run-loger';
import { FlakyAnalyzerOptions } from './types/flaky-analyzer.types';

class FlakyAnalyzer implements Reporter {
  private logger: TestRunLogger;
  private options: FlakyAnalyzerOptions;

  constructor(options: FlakyAnalyzerOptions = {}) {
    this.options = options;
    const outputFile = this.options.outputFile || './flaky-report.json';
    this.logger = new TestRunLogger(outputFile);
  }

  onTestEnd(test: TestCase, result: PlaywrightTestResult) {
    this.logger.logTestAttempt(test, result);
  }

  async onEnd(result: FullResult) {
    console.log(`[FlakyAnalyzer] Run finished with status: ${result.status}`);
    await this.logger.saveReport();

    const flakyTests = this.logger.getFlakyTests();
    if (
      flakyTests.length > 0
      && result.status !== 'failed'
      && result.status !== 'timedout'
      && result.status !== 'interrupted'
    ) {
      console.warn(`[FlakyAnalyzer] WARNING: ${flakyTests.length} flaky tests were detected during this run!`);
    }
  }
}

export default FlakyAnalyzer;