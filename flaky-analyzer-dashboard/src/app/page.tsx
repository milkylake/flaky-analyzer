'use client';

import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlakyStore } from '@/store/flaky.store';
import { TestResultCard } from '@/components/flaky-test-card';

export default function Dashboard() {
  const { testResults, isLoading, error, fetchAnalysis } = useFlakyStore();

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleRefresh = () => {
    fetchAnalysis();
  };

  const flakyCount = testResults.filter(test => test.isFlaky).length;

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Test Run Report</h1>
          {!isLoading && !error && (
            <span className="text-sm text-muted-foreground">
              {testResults.length} total tests analyzed.
              {flakyCount > 0 ? `${flakyCount} flaky test(s) detected.` : 'No flaky tests detected.'}
            </span>
          )}
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} variant="outline" size="icon">
          <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Report</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && testResults.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Test Results Found</AlertTitle>
          <AlertDescription>
            The analysis report file might be empty or missing. Run tests with the FlakyAnalyzer reporter
            first.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && testResults.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {testResults.map((test) => (
            <TestResultCard key={test.id} test={test} />
          ))}
        </div>
      )}
    </main>
  );
}