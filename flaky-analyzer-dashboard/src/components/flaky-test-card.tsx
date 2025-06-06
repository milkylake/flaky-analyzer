import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { ApiTestResult } from '@/app/api/flaky-analysis/route';
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video,
  Timer,
  Bug,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  SkipForward,
  Ticket
} from 'lucide-react';
import { TestStatus } from '@/types/flaky-analyzer.types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TestResultCardProps {
  test: ApiTestResult;
}

const getStatusAppearance = (status: TestStatus): { color: string; icon: React.ElementType } => {
  switch (status) {
    case 'passed':
      return { color: 'green', icon: CheckCircle };
    case 'failed':
      return { color: 'red', icon: XCircle };
    case 'timedOut':
      return { color: 'red', icon: Timer };
    case 'skipped':
      return { color: 'gray', icon: SkipForward };
    case 'interrupted':
      return { color: 'yellow', icon: AlertTriangle };
    default:
      return { color: 'gray', icon: AlertCircle };
  }
};

export function TestResultCard({ test }: TestResultCardProps) {
  const { toast } = useToast()
  const { color: statusColor, icon: StatusIcon } = getStatusAppearance(test.finalStatus);
  const analysis = test.analysis;


  const hasAnalysis = !!analysis;
  const hasReasons = hasAnalysis && analysis.potentialReasons && Array.from(analysis.potentialReasons).length > 0;
  const hasErrors = hasAnalysis && analysis.errorSummary && analysis.errorSummary.count > 0;
  const hasTiming = hasAnalysis && analysis.timing && analysis.timing.minDurationMs !== Infinity;
  const hasAttachments = hasAnalysis
    && analysis.relevantAttachments
    && (
      analysis.relevantAttachments.failedTracesCount > 0
      || analysis.relevantAttachments.failedScreenshotsCount > 0
      || analysis.relevantAttachments.failedVideosCount > 0
    );
  const hasAttempts = test.attempts && test.attempts.length > 0;

  const handleCopyPath = (sourcePath: string) => {
    const path = sourcePath.split('/').slice(0, -1).join('/');
    navigator.clipboard.writeText(path).catch(() => {
    });
    toast({
      title: "Path successfully copied",
      description: truncate(path, 50, 20, 30),
    })
  };

  function truncate(text: string, maxLength: number, prefixLength = 6, suffixLength = 6) {
    if (text.length <= maxLength) {
      return text;
    }

    const prefix = text.substring(0, prefixLength);
    const suffix = text.substring(text.length - suffixLength);

    return `${prefix}.....${suffix}`;
  }

  return (
    <Card className={cn(`mb-4 break-inside-avoid border-l-4`, statusColor && `border-l-${statusColor}-500`)}>
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg">{test.title}</CardTitle>
          <div className="flex-shrink-0 flex gap-2 items-center">
            {test.isFlaky && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" /> Flaky
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(statusColor && `border-${statusColor}-500`, statusColor && `text-${statusColor}-600`)}
            >
              <StatusIcon className="mr-1 h-3 w-3" /> {test.finalStatus}
            </Badge>
          </div>
        </div>
        <CardDescription>{test.location}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {hasAttempts && (
            <AccordionItem value="attempts">
              <AccordionTrigger>
                <History className="mr-2 h-4 w-4 text-gray-500" /> Attempts ({test.attempts.length})
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pt-2 text-sm">
                {test.attempts.map((attempt: any, index: any) => {
                  const { color: attemptColor, icon: AttemptIcon } = getStatusAppearance(attempt.status);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="flex items-center">
                        <AttemptIcon className={`mr-1.5 h-3 w-3 text-${attemptColor}-500`} />
                        Attempt {index + 1}: {attempt.status}
                      </span>
                      <span className="text-gray-500">{attempt.duration} ms</span>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          )}

          {hasReasons && (
            <AccordionItem value="reasons">
              <AccordionTrigger>
                <AlertCircle className="mr-2 h-4 w-4 text-orange-500" /> Potential Reasons & Observations
              </AccordionTrigger>
              <AccordionContent className="flex flex-wrap gap-2 pt-2">
                {Array.from(analysis.potentialReasons).map((reason: any) => (
                  <Badge key={reason} variant="secondary">{reason}</Badge>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {hasTiming && (
            <AccordionItem value="timing">
              <AccordionTrigger>
                <Timer className="mr-2 h-4 w-4 text-blue-500" /> Timing Analysis
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pt-2 text-sm">
                <p>Duration Range (ms): {analysis.timing.minDurationMs} - {analysis.timing.maxDurationMs}</p>
                <p>Average Duration (ms): {analysis.timing.avgDurationMs.toFixed(0)}</p>
                {
                  analysis.timing.passedAvgDurationMs !== null
                  && <p>Avg Passed Duration (ms): {analysis.timing.passedAvgDurationMs.toFixed(0)}</p>
                }
                {
                  analysis.timing.failedAvgDurationMs !== null
                  && <p>Avg Failed Duration (ms): {analysis.timing.failedAvgDurationMs.toFixed(0)}</p>
                }
                {
                  analysis.timing.durationVarianceHigh
                  && <p className="text-yellow-600">* High duration variance detected.</p>
                }
              </AccordionContent>
            </AccordionItem>
          )}

          {hasErrors && (
            <AccordionItem value="errors">
              <AccordionTrigger>
                <Bug className="mr-2 h-4 w-4 text-red-500" />
                Error Summary ({analysis.errorSummary.count})
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2 text-sm">
                <p>Unique Error Types: <span
                  className="font-mono">{analysis.errorSummary.types.join(', ') || 'None'}</span></p>
                <div>Unique Error Messages (First Line):</div>
                <ul className="list-disc pl-5 space-y-1">
                  {analysis.errorSummary.messages.map((msg: any, idx: any) => (
                    <li key={idx} className="font-mono text-xs">{msg}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {hasAttachments && (
            <AccordionItem value="attachments">
              <AccordionTrigger>
                <Ticket className="mr-2 h-4 w-4 text-gray-500" />
                Relevant Attachments
              </AccordionTrigger>
              <AccordionContent className="flex  flex-col gap-4 pt-2 text-sm">
                {analysis.relevantAttachments.failedTracesCount > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-purple-600" />
                    {analysis.relevantAttachments.failedTracesCount} Trace(s)
                  </span>
                )}
                {analysis.relevantAttachments.failedVideosCount > 0 &&
                  <span className="flex items-center gap-1">
                    <Video className="h-4 w-4 text-purple-600" />
                    {analysis.relevantAttachments.failedVideosCount} Video(s)
                </span>
                }
                {analysis.relevantAttachments.failedScreenshotsCount > 0 &&
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4 text-purple-600" />
                    {analysis.relevantAttachments.failedScreenshotsCount} Screenshot(s)
                </span>
                }
                <Button
                  variant="outline"
                  onClick={() => {
                    if (analysis.relevantAttachments.failedTraces.length > 0)
                      handleCopyPath(analysis?.relevantAttachments.failedTraces[0])
                    else if (analysis.relevantAttachments.failedScreenshots.length > 0)
                      handleCopyPath(analysis?.relevantAttachments.failedScreenshots[0])
                    else if (analysis.relevantAttachments.failedVideos.length > 0)
                      handleCopyPath(analysis?.relevantAttachments.failedVideos[0])
                  }}
                >
                  Copy path
                </Button>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
