/**
 * Calculates the expected score for player A against player B.
 * @param ratingA Player A's rating.
 * @param ratingB Player B's rating.
 * @returns The expected score for player A (a value between 0 and 1).
 */
function getExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculates the new ELO ratings for two players after a match.
 * @param ratingA Player A's current rating.
 * @param ratingB Player B's current rating.
 * @param scoreA Player A's score in the match (1 for a win, 0 for a loss, 0.5 for a draw).
 * @param kFactor The K-factor, which determines the impact of the match on the ratings. Defaults to 32.
 * @returns An object containing the new ratings for both players.
 */
export function calculateNewElo(
  ratingA: number,
  ratingB: number,
  scoreA: 0 | 0.5 | 1,
  kFactor: number = 32
): { newRatingA: number; newRatingB: number } {
  const expectedScoreA = getExpectedScore(ratingA, ratingB);
  const expectedScoreB = getExpectedScore(ratingB, ratingA);

  const scoreB = 1 - scoreA;

  const newRatingA = Math.round(ratingA + kFactor * (scoreA - expectedScoreA));
  const newRatingB = Math.round(ratingB + kFactor * (scoreB - expectedScoreB));

  return { newRatingA, newRatingB };
}
