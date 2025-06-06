import { NextResponse } from 'next/server';
import type { AggregatedTestResult as BaseTestResult } from '@/types/flaky-analyzer.types';
import type { FlakyAnalysis } from '@/services/flaky-reason-analyzer';
import path from 'path';
import fs from 'fs/promises';
import { FlakyReasonAnalyzer } from '@/services/flaky-reason-analyzer';

export type ApiTestResult = BaseTestResult & {
  analysis?: Omit<FlakyAnalysis, 'testId' | 'title' | 'location'> & {
    relevantAttachments: {
      failedTracesCount: number;
      failedScreenshotsCount: number;
      failedVideosCount: number;
    }
  };
};

const REPORT_PATH = '@/../../playwright-challenges/flaky-report.json';
const absoluteReportPath = path.resolve(process.cwd(), REPORT_PATH);

function analyzeSingleFlakyTest(
  test: BaseTestResult,
  analyzer: FlakyReasonAnalyzer
): ApiTestResult['analysis'] | undefined {
  if (!test.isFlaky) {
    return undefined;
  }

  const analysisResult: FlakyAnalysis = {
    testId: test.id,
    title: test.title,
    location: test.location,
    potentialReasons: new Set<string>(),
    errorSummary: { count: 0, messages: [], types: [] },
    timing: {
      minDurationMs: Infinity,
      maxDurationMs: -1,
      avgDurationMs: 0,
      passedAvgDurationMs: null,
      failedAvgDurationMs: null,
      durationVarianceHigh: false
    },
    consoleOutputHints: [],
    relevantAttachments: { failedTraces: [], failedScreenshots: [], failedVideos: [] }
  };

  try {
    analyzer.extractBaseFeatures(test, analysisResult);

    analyzer.applyDiagnosticRules(test, analysisResult);

    const { testId, title, location, ...analysisData } = analysisResult;

    return {
      ...analysisData,
      // @ts-ignore
      potentialReasons: Array.from(analysisData.potentialReasons) as string[],
      relevantAttachments: {
        failedTraces: analysisData.relevantAttachments.failedTraces,
        failedTracesCount: analysisData.relevantAttachments.failedTraces.length,
        failedScreenshots: analysisData.relevantAttachments.failedScreenshots,
        failedScreenshotsCount: analysisData.relevantAttachments.failedScreenshots.length,
        failedVideos: analysisData.relevantAttachments.failedVideos,
        failedVideosCount: analysisData.relevantAttachments.failedVideos.length
      }
    };

  } catch (e) {
    console.error(`[API] Error analyzing flaky test ${test.id}:`, e);
    return undefined;
  }
}


export async function GET() {
  try {
    await fs.access(absoluteReportPath);
    const rawData = await fs.readFile(absoluteReportPath, 'utf-8');
    const allTestResults: BaseTestResult[] = JSON.parse(rawData);

    const analyzer = new FlakyReasonAnalyzer();

    const comprehensiveResults: ApiTestResult[] = allTestResults.map(test => ({
      ...test,
      analysis: analyzeSingleFlakyTest(test, analyzer)
    }));

    return NextResponse.json(comprehensiveResults);
  } catch (error: any) {
    console.error('[API] Error processing analysis:', error);
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { message: `Analysis report not found at ${absoluteReportPath}.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to process analysis report.', error: error.message },
      { status: 500 }
    );
  }
}