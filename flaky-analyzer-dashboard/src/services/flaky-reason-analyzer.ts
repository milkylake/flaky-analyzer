import {AggregatedTestResult, RunAttempt} from '@/types/flaky-analyzer.types';

export interface FlakyAnalysis {
  testId: string;
  title: string;
  location: string;
  potentialReasons: Set<string>;
  errorSummary: {
    count: number;
    messages: string[];
    types: string[];
  };
  timing: {
    minDurationMs: number;
    maxDurationMs: number;
    avgDurationMs: number;
    passedAvgDurationMs: number | null;
    failedAvgDurationMs: number | null;
    durationVarianceHigh: boolean;
  };
  consoleOutputHints: string[];
  relevantAttachments: {
    failedTraces: string[];
    failedScreenshots: string[];
    failedVideos: string[];
  };
}


export class FlakyReasonAnalyzer {
  private extractUniqueLogLines(attempts: RunAttempt[]): Set<string> {
    const logLines = new Set<string>();

    for (const attempt of attempts) {
      [...attempt.stdout, ...attempt.stderr]
        .forEach(logEntry => {
          if (typeof logEntry === 'string') {
            logEntry
              .split('\n')
              .forEach(line => {
                const trimmedLine = line.trim();

                if (trimmedLine)
                  logLines.add(trimmedLine.toLowerCase()
                  );
              });
          }
        });
    }

    return logLines;
  }

  public extractBaseFeatures(
    test: AggregatedTestResult,
    analysis: FlakyAnalysis
  ): void {
    const durations: number[] = [];
    const passedDurations: number[] = [];
    const failedDurations: number[] = [];
    const uniqueErrorMessages = new Set<string>();
    const uniqueErrorTypes = new Set<string>();

    const failedAttemptsLogSets: Set<string>[] = [];

    for (const attempt of test.attempts) {
      durations.push(attempt.duration);
      analysis.timing.minDurationMs = Math.min(analysis.timing.minDurationMs, attempt.duration);
      analysis.timing.maxDurationMs = Math.max(analysis.timing.maxDurationMs, attempt.duration);

      if (attempt.status === 'passed') {
        passedDurations.push(attempt.duration);
      } else if (attempt.status === 'failed' || attempt.status === 'timedOut') {
        failedDurations.push(attempt.duration);

        failedAttemptsLogSets.push(
          this.extractUniqueLogLines([attempt])
        );

        if (attempt.error) {
          analysis.errorSummary.count++;
          const errorMessageLines = (attempt.error.message || 'Unknown Error').split('\n');
          const shortErrorMessage = errorMessageLines.slice(0, 5).join('\n');

          let errorName = attempt.error.value || 'Error';
          if (errorMessageLines.join(' ').toLowerCase().includes('timeout')) {
            errorName = 'TimeoutError';
          }

          uniqueErrorMessages.add(shortErrorMessage);
          uniqueErrorTypes.add(errorName);
        }

        attempt.attachments.forEach(att => {
          if (att.name === 'trace' && att.path) {
            analysis.relevantAttachments.failedTraces.push(att.path);
          } else if (att.contentType.startsWith('image/') && att.path) {
            analysis.relevantAttachments.failedScreenshots.push(att.path);
          } else if (att.contentType.startsWith('video/') && att.path) {
            analysis.relevantAttachments.failedVideos.push(att.path);
          }
        });

        const consoleOutput = [...attempt.stdout, ...attempt.stderr].join('\n');

        if (/error|warning|failed|exception/i.test(consoleOutput)) {
          if (!analysis.consoleOutputHints.includes('Errors/Warnings in console of failed runs')) {
            analysis.consoleOutputHints.push('Errors/Warnings in console of failed runs');
          }
        }
      }
    }

    if (durations.length > 0) {
      analysis.timing.avgDurationMs = durations
        .reduce(
          (a, b) => a + b, 0
        ) / durations.length;
    }

    if (passedDurations.length > 0) {
      analysis.timing.passedAvgDurationMs = passedDurations
        .reduce(
          (a, b) => a + b, 0
        ) / passedDurations.length;
    }

    if (failedDurations.length > 0) {
      analysis.timing.failedAvgDurationMs = failedDurations
        .reduce(
          (a, b) => a + b, 0
        ) / failedDurations.length;
    }

    if (
      durations.length > 1
      && analysis.timing.maxDurationMs > analysis.timing.minDurationMs * 2
      && failedDurations.length > 0
      && passedDurations.length > 0
    ) {
      analysis.timing.durationVarianceHigh = true;
    }

    analysis.errorSummary.messages = Array.from(uniqueErrorMessages);
    analysis.errorSummary.types = Array.from(uniqueErrorTypes);

    // @ts-ignore
    analysis._failedAttemptsLogSets = failedAttemptsLogSets;
  }

  private applyBaseHeuristics(analysis: FlakyAnalysis): void {
    if (analysis.timing.durationVarianceHigh) {
      analysis.potentialReasons.add('Inconsistent Performance / Timing Sensitivity');
    }
    if (analysis.errorSummary.types.some(type => type.includes('TimeoutError'))) {
      analysis.potentialReasons.add('Potential Timeout Issues (Waits/Performance)');

      if (analysis.relevantAttachments.failedTraces.length > 0) {
        analysis.potentialReasons.add('Timeout occurred: Review network/DOM activity in Playwright Trace');
      }
    }
    if (
      analysis.errorSummary.messages.some(
        msg => /expect.*(to (be|have) (visible|enabled|editable|checked)|to exist)/i.test(msg)
      )
    ) {
      analysis.potentialReasons.add('Element State/Visibility/Availability Issues');
    }
    if (
      analysis.errorSummary.messages.some(
        msg => /selector|locator|element (is )?not found|detached from document|no element found for selector/i.test(msg)
      )
    ) {
      analysis.potentialReasons.add('Selector Issues or Dynamic DOM Structure');
    }
    if (
      analysis.errorSummary.messages.some(
        msg => /navigation|frame navigated|net::ERR_/i.test(msg)
      )
    ) {
      analysis.potentialReasons.add('Navigation Timing or Network Reliability Issues');
    }
    if (analysis.consoleOutputHints.length > 0) {
      analysis.potentialReasons.add('Check Application Logs (Console Output in Failures)');
    }
    if (analysis.relevantAttachments.failedTraces.length > 0) {
      analysis.potentialReasons.add('Review Playwright Trace for Failed Attempts');
    }
    if (analysis.relevantAttachments.failedScreenshots.length > 0) {
      analysis.potentialReasons.add('Review Screenshots for Failed Attempts');
    }
    if (analysis.relevantAttachments.failedVideos.length > 0) {
      analysis.potentialReasons.add('Review Video Recordings for Failed Attempts');
    }
  }

  private analyzeLogDifferences(
    passedAttempts: RunAttempt[],
    failedAttempts: RunAttempt[],
    analysis: FlakyAnalysis
  ): void {
    if (passedAttempts.length === 0 || failedAttempts.length === 0) {
      return;
    }

    const passedLogs = this.extractUniqueLogLines(passedAttempts);
    const failedLogsOverall = this.extractUniqueLogLines(failedAttempts);

    if (failedLogsOverall.size === 0) return;

    const uniqueToFailedLogs = new Set<string>();
    for (const log of failedLogsOverall) {
      if (!passedLogs.has(log)) {
        uniqueToFailedLogs.add(log);
      }
    }

    const diffRatio = uniqueToFailedLogs.size / failedLogsOverall.size;

    if (diffRatio > 0.3 && uniqueToFailedLogs.size > 2) {
      analysis.potentialReasons.add('Significant Log Differences between Passed/Failed Runs');
    }
  }

  private analyzeErrorConsistency(
    failedAttempts: RunAttempt[],
    analysis: FlakyAnalysis
  ): void {
    if (failedAttempts.length <= 1) {
      return;
    }

    const uniqueErrorMessagesCount = analysis.errorSummary.messages.length;
    const failedAttemptsCount = failedAttempts.length;

    if (
      uniqueErrorMessagesCount === 1
      && failedAttemptsCount > 1
    ) {
      analysis
        .potentialReasons
        .add('Consistent Error Message Pattern in Failures');
    } else if (
      uniqueErrorMessagesCount > 1
      && uniqueErrorMessagesCount < failedAttemptsCount * 0.7
    ) {
      analysis
        .potentialReasons
        .add('Somewhat Diverse Error Messages (Multiple Failure Modes Likely)');
    } else if (
      uniqueErrorMessagesCount >= failedAttemptsCount * 0.7
      && uniqueErrorMessagesCount > 0
    ) {
      analysis
        .potentialReasons
        .add('Highly Diverse Error Messages (Chaotic Failures)');
    }
  }

  private analyzeLogConsistencyInFailures(
    failedAttemptsLogSets: Set<string>[] | undefined,
    analysis: FlakyAnalysis
  ): void {
    if (!failedAttemptsLogSets || failedAttemptsLogSets.length <= 1) {
      return;
    }

    let totalSimilarity = 0;
    let pairCount = 0;

    for (let i = 0; i < failedAttemptsLogSets.length; i++) {
      for (let j = i + 1; j < failedAttemptsLogSets.length; j++) {
        const set1 = failedAttemptsLogSets[i];
        const set2 = failedAttemptsLogSets[j];

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        if (union.size > 0) {
          totalSimilarity += intersection.size / union.size;
        } else if (
          intersection.size === 0
          && set1.size === 0
          && set2.size === 0
        ) {
          totalSimilarity += 1;
        }

        pairCount++;
      }
    }

    if (
      pairCount === 0
      && failedAttemptsLogSets.length === 1
      && failedAttemptsLogSets[0].size > 0
    ) {
      return;
    }

    const avgSimilarity = (pairCount > 0) ? (totalSimilarity / pairCount) : 1;

    if (avgSimilarity > 0.7) {
      analysis.potentialReasons.add('Consistent Log Pattern in Failures');
    } else if (avgSimilarity < 0.3 && failedAttemptsLogSets.some(s => s.size > 0)) {
      analysis.potentialReasons.add('Diverse Log Pattern in Failures');
    }
  }

  public applyDiagnosticRules(
    test: AggregatedTestResult,
    analysis: FlakyAnalysis
  ): void {
    this.applyBaseHeuristics(analysis);

    const passedAttempts = test.attempts.filter(
      attempt => attempt.status === 'passed'
    );
    const failedAttempts = test.attempts.filter(
      attempt => attempt.status === 'failed' || attempt.status === 'timedOut'
    );

    this.analyzeLogDifferences(passedAttempts, failedAttempts, analysis);

    this.analyzeErrorConsistency(failedAttempts, analysis);

    // @ts-ignore
    const failedLogsSetsForConsistency = analysis._failedAttemptsLogSets as Set<string>[] | undefined;
    this.analyzeLogConsistencyInFailures(failedLogsSetsForConsistency, analysis);

    // @ts-ignore
    delete analysis._failedAttemptsLogSets;
  }
}