export type LegendGameInput = {
  sport: string;
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
    clue: 'Legend trivia unavailable in static build.',
    correctAnswer: '',
    options: [],
    justification: '',
  };
}
