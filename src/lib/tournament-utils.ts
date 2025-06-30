import { nanoid } from 'nanoid';
import type { User, TournamentRound, TournamentMatch } from './types';

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function generateBracket(participants: User[]): TournamentRound[] {
    const shuffledParticipants = shuffleArray([...participants]);
    const numPlayers = shuffledParticipants.length;

    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
    const numByes = nextPowerOfTwo - numPlayers;
    const numFirstRoundMatches = (numPlayers - numByes) / 2;

    const playersWithByes = shuffledParticipants.slice(0, numByes);
    const playersInFirstRound = shuffledParticipants.slice(numByes);

    const bracket: TournamentRound[] = [];
    const firstRound: TournamentRound = { roundNumber: 1, matches: [] };

    let matchNumber = 1;

    // Create matches for the first round
    for (let i = 0; i < numFirstRoundMatches; i++) {
        firstRound.matches.push({
            id: nanoid(),
            player1Id: playersInFirstRound[i * 2]?.uid ?? null,
            player2Id: playersInFirstRound[i * 2 + 1]?.uid ?? null,
            winnerId: null,
            round: 1,
            matchNumber: matchNumber++,
        });
    }

    // Create subsequent rounds with placeholders
    let matchesInCurrentRound = numFirstRoundMatches + numByes;
    let roundNumber = 2;
    while (matchesInCurrentRound > 1) {
        matchesInCurrentRound /= 2;
        const nextRound: TournamentRound = { roundNumber, matches: [] };
        for (let i = 0; i < matchesInCurrentRound; i++) {
            nextRound.matches.push({
                id: nanoid(),
                player1Id: null,
                player2Id: null,
                winnerId: null,
                round: roundNumber,
                matchNumber: i + 1,
            });
        }
        bracket.push(nextRound);
        roundNumber++;
    }
    
    // Create the full first round with byes and advance them
    const fullFirstRound: TournamentRound = { roundNumber: 1, matches: [] };
    const round2Matches = bracket[0].matches;

    // Interleave players with byes and first-round matchups
    const byePlayersCopy = [...playersWithByes];
    const firstRoundMatchupsCopy = [...firstRound.matches];
    
    while(byePlayersCopy.length > 0 || firstRoundMatchupsCopy.length > 0) {
        if (firstRoundMatchupsCopy.length > 0) {
            fullFirstRound.matches.push(firstRoundMatchupsCopy.shift()!);
        }
        if (byePlayersCopy.length > 0) {
            const byePlayer = byePlayersCopy.shift()!;
            fullFirstRound.matches.push({
                id: nanoid(),
                player1Id: byePlayer.uid,
                player2Id: null,
                winnerId: byePlayer.uid,
                isBye: true,
                round: 1,
                matchNumber: matchNumber++,
            });
        }
    }

    // Populate Round 2
    for(let i=0; i<round2Matches.length; i++) {
        const match1 = fullFirstRound.matches[i*2];
        const match2 = fullFirstRound.matches[i*2+1];

        round2Matches[i].player1Id = match1.winnerId;
        round2Matches[i].player2Id = match2.winnerId;
    }

    bracket.unshift(fullFirstRound);

    return bracket;
}
