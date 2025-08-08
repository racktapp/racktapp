export type SwingAnalysisInput = {
  videoDataUri: string;
  sport: string;
  shotType: string;
};

export type SwingAnalysisOutput = {
  isCorrectShotType: boolean;
  detectedShotType?: string;
  summary: string;
  preparation: { positive: string; improvement: string };
  execution: { positive: string; improvement: string };
  followThrough: { positive: string; improvement: string };
};

export async function analyzeSwing(_input: SwingAnalysisInput): Promise<SwingAnalysisOutput> {
  return {
    isCorrectShotType: true,
    summary: 'Analysis unavailable in static build.',
    preparation: { positive: '', improvement: '' },
    execution: { positive: '', improvement: '' },
    followThrough: { positive: '', improvement: '' },
  };
}
