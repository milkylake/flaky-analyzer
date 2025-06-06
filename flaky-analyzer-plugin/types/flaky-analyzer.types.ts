import type { TestStatus, TestError } from '@playwright/test/reporter';

export interface RunAttempt {
  attempt: number;
  status: TestStatus;
  duration: number;
  error?: TestError;
  stdout: (string | Buffer)[];
  stderr: (string | Buffer)[];
  attachments: Attachment[];
}

export interface Attachment {
  name: string;
  contentType: string;
  path?: string;
  body?: Buffer;
}

export interface AggregatedTestResult {
  id: string;
  title: string;
  location: string;
  finalStatus: TestStatus;
  isFlaky: boolean;
  attempts: RunAttempt[];
}

export interface FlakyAnalyzerOptions {
  outputFile?: string;
  logLevel?: 'info' | 'debug';
}