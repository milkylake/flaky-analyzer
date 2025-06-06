import { create } from 'zustand';
import type { ApiTestResult } from '@/app/api/flaky-analysis/route';

interface FlakyState {
  testResults: ApiTestResult[];
  isLoading: boolean;
  error: string | null;
  fetchAnalysis: () => Promise<void>;
}

export const useFlakyStore = create<FlakyState>((set) => ({
  testResults: [],
  isLoading: false,
  error: null,
  fetchAnalysis: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/flaky-analysis');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: ApiTestResult[] = await response.json();
      set({ testResults: data, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch analysis:', error);
      set({ error: error.message, isLoading: false, testResults: [] });
    }
  }
}));