
'use client';

import type { Sport } from '@/lib/types';

export type LegendGameInput = {
  sport: Sport;
  usedPlayers: string[];
};

export type LegendGameOutput = {
  clue: string;
  correctAnswer: string;
  options: string[];
  justification: string;
};

export async function getLegendGameRound(_input: LegendGameInput): Promise<LegendGameOutput> {
  return {
    clue: 'Clue unavailable in static build.',
    correctAnswer: 'Player A',
    options: ['Player A', 'Player B', 'Player C', 'Player D'],
    justification: 'Justification unavailable in static build.',
  };
}

