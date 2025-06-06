export type TestStatus = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';

export interface TestError {
  cause?: TestError;
  location?: Location;
  message?: string;
  snippet?: string;
  stack?: string;
  value?: string;
}

export interface Location {
  column: number;
  file: string;
  line: number;
}

export interface RunAttempt {
  attempt: number;
  status: TestStatus;
  duration: number;
  error?: TestError;
  stdout: (string | Buffer<ArrayBufferLike>)[];
  stderr: (string | Buffer<ArrayBufferLike>)[];
  attachments: Attachment[];
}

export interface Attachment {
  name: string;
  contentType: string;
  path?: string;
  body?: Buffer<ArrayBufferLike>;
}

export interface AggregatedTestResult {
  id: string;
  title: string;
  location: string;
  finalStatus: TestStatus;
  isFlaky: boolean;
  attempts: RunAttempt[];
}