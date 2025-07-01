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
 * Includes a slight inflationary adjustment to reward activity, where the
 * loser's point deduction is slightly less than the winner's gain.
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
  const expectedScoreB = 1 - expectedScoreA; // Simplified from getExpectedScore(ratingB, ratingA)

  const scoreB = 1 - scoreA;

  const changeA = kFactor * (scoreA - expectedScoreA);
  const changeB = kFactor * (scoreB - expectedScoreB);

  // To reward activity and prevent rank stagnation, we make the system slightly inflationary.
  // The winner gains the full amount, but the loser only loses 95% of that amount.
  // This means if players trade wins, they will both slowly climb the ladder.
  const lossMitigationFactor = 0.95;

  const finalChangeA = changeA < 0 ? changeA * lossMitigationFactor : changeA;
  const finalChangeB = changeB < 0 ? changeB * lossMitigationFactor : changeB;
  
  const newRatingA = Math.round(ratingA + finalChangeA);
  const newRatingB = Math.round(ratingB + finalChangeB);

  return { newRatingA, newRatingB };
}
