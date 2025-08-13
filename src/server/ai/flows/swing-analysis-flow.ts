
'use client';

import type { SwingAnalysisInput, SwingAnalysisOutput } from '@/lib/types';

export async function analyzeSwing(_input: SwingAnalysisInput): Promise<SwingAnalysisOutput> {
  return {
    isCorrectShotType: true,
    summary: 'Analysis unavailable in static build.',
    preparation: { positive: '', improvement: '' },
    execution: { positive: '', improvement: '' },
    followThrough: { positive: '', improvement: '' },
  };
}

