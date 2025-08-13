
'use client';

export type MatchRecapInput = {
  player1Name: string;
  player2Name: string;
  score: string;
  sport: string;
};

export type MatchRecapOutput = {
  recap: string;
};

export async function getMatchRecap(input: MatchRecapInput): Promise<MatchRecapOutput> {
  return {
    recap: `${input.player1Name} vs ${input.player2Name} ended ${input.score}.`,
  };
}
