
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, auth } from '@/lib/firebase/config';
import { doc, getDoc, Timestamp, runTransaction, updateDoc } from 'firebase/firestore';
import { 
    reportPendingMatch,
    confirmMatchResult,
    declineMatchResult,
    searchUsers, 
    sendFriendRequest,
    getFriends as getFriendsFromFirestore,
    getIncomingFriendRequests,
    getSentFriendRequests,
    acceptFriendRequest,
    deleteFriendRequest,
    removeFriend,
    createDirectChallenge,
    createOpenChallengeInDb,
    getIncomingChallenges,
    getSentChallenges,
    getOpenChallenges,
    updateChallengeStatus,
    challengeFromOpen,
    createTournamentInDb,
    getTournamentsForUser,
    getTournamentById,
    reportTournamentWinner,
    getOrCreateChat,
    sendMessage,
    markChatAsRead,
    getChatsForUser,
    getChallengeById,
    createRallyGameInDb,
    createLegendGameInDb,
    getGame,
    getConfirmedMatchesForUser,
    getPendingMatchesForUser,
    getHeadToHeadRecord,
    getLeaderboard,
    updateUserProfile,
    getFriendshipStatus,
    deleteGame,
} from '@/lib/firebase/firestore';
import { getMatchRecap } from '@/ai/flows/match-recap';
import { predictMatchOutcome } from '@/ai/flows/predict-match';
import { analyzeSwing } from '@/ai/flows/swing-analysis-flow';
import type { SwingAnalysisInput } from '@/ai/flows/swing-analysis-flow';
import { type Sport, type User, reportMatchSchema, challengeSchema, openChallengeSchema, createTournamentSchema, Challenge, OpenChallenge, Tournament, Chat, Match, PredictMatchOutput, profileSettingsSchema, LegendGame, LegendGameRound, RallyGame, RallyGamePoint } from '@/lib/types';
import { setHours, setMinutes } from 'date-fns';
import { playRallyPoint } from '@/ai/flows/rally-game-flow';
import { getLegendGameRound } from '@/ai/flows/guess-the-legend-flow';


// Action to report a match
export async function handleReportMatchAction(
    values: z.infer<typeof reportMatchSchema>,
    user: User
) {
    const team1Ids = [user.uid];
    if (values.matchType === 'Doubles' && values.partner) {
        team1Ids.push(values.partner);
    }

    const team2Ids = [values.opponent1];
    if (values.matchType === 'Doubles' && values.opponent2) {
        team2Ids.push(values.opponent2);
    }

    const winnerIsOnTeam1 = team1Ids.includes(values.winnerId);
    const winnerIds = winnerIsOnTeam1 ? team1Ids : team2Ids;

    await reportPendingMatch({
        sport: values.sport,
        matchType: values.matchType,
        team1Ids,
        team2Ids,
        winnerIds: winnerIds,
        score: values.score,
        reportedById: user.uid,
        date: values.date.getTime(),
    });
    
    revalidatePath('/match-history');
}

// Action to get match recap
export async function handleRecapAction(match: Match, currentUserId: string) {
    if (!currentUserId) throw new Error("Not authenticated");
    const player1Name = match.participantsData[match.teams.team1.playerIds[0]].name;
    const player2Name = match.participantsData[match.teams.team2.playerIds[0]].name;
    
    return await getMatchRecap({
        player1Name,
        player2Name,
        score: match.score,
        sport: match.sport,
    });
}

// Action to search for users
export async function searchUsersAction(query: string, currentUserId: string): Promise<User[]> {
    if (!currentUserId) throw new Error("Not authenticated");
    if (!query) return [];
    return searchUsers(query, currentUserId);
}

// Action for sending a friend request
export async function addFriendAction(fromUser: User, toUser: User) {
    try {
        await sendFriendRequest(fromUser, toUser);
        revalidatePath('/friends');
        revalidatePath(`/profile/${toUser.uid}`);
        return { success: true, message: "Friend request sent." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to send friend request." };
    }
}

// --- Friend Management Actions ---

export async function getFriendsAction(userId: string): Promise<User[]> {
    if (!userId) return [];
    return getFriendsFromFirestore(userId);
}

export async function getIncomingRequestsAction(userId: string): Promise<any[]> {
    if (!userId) return [];
    return getIncomingFriendRequests(userId);
}

export async function getSentRequestsAction(userId: string): Promise<any[]> {
    if (!userId) return [];
    return getSentFriendRequests(userId);
}

export async function acceptFriendRequestAction(requestId: string, fromId: string, toId: string) {
    try {
        await acceptFriendRequest(requestId, fromId, toId);
        revalidatePath('/friends');
        revalidatePath(`/profile/${fromId}`);
        return { success: true, message: "Friend request accepted." };
    } catch (error: any) {
        return { success: false, message: "Failed to accept friend request." };
    }
}

export async function declineOrCancelFriendRequestAction(requestId: string, profileIdToRevalidate?: string) {
    try {
        await deleteFriendRequest(requestId);
        revalidatePath('/friends');
        if (profileIdToRevalidate) revalidatePath(`/profile/${profileIdToRevalidate}`);
        return { success: true, message: "Request removed." };
    } catch (error: any) {
        return { success: false, message: "Failed to remove friend request." };
    }
}

export async function removeFriendAction(currentUserId: string, friendId: string) {
    try {
        await removeFriend(currentUserId, friendId);
        revalidatePath('/friends');
        revalidatePath(`/profile/${friendId}`);
        return { success: true, message: "Friend removed." };
    } catch (error: any) {
        return { success: false, message: "Failed to remove friend." };
    }
}

export async function getFriendshipStatusAction(profileUserId: string, currentUserId: string) {
    if (!currentUserId) throw new Error("Not authenticated");
    return getFriendshipStatus(currentUserId, profileUserId);
}

// --- Challenge System Actions ---

export async function createDirectChallengeAction(values: z.infer<typeof challengeSchema>, fromUser: User, toUser: User) {
    try {
        const [hours, minutes] = values.time.split(':').map(Number);
        const matchDateTime = setMinutes(setHours(values.date, hours), minutes).getTime();

        await createDirectChallenge({
            fromId: fromUser.uid,
            fromName: fromUser.name,
            fromAvatar: fromUser.avatar,
            toId: toUser.uid,
            toName: toUser.name,
            toAvatar: toUser.avatar,
            sport: values.sport,
            location: values.location,
            wager: values.wager,
            matchDateTime: matchDateTime,
        });
        revalidatePath('/challenges');
        return { success: true, message: "Challenge sent successfully!" };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to send challenge." };
    }
}

export async function createOpenChallengeAction(values: z.infer<typeof openChallengeSchema>, poster: User) {
    try {
        await createOpenChallengeInDb({
            posterId: poster.uid,
            posterName: poster.name,
            posterAvatar: poster.avatar,
            sport: values.sport,
            location: values.location!,
            note: values.note,
        });
        revalidatePath('/challenges');
        return { success: true, message: "Open challenge posted!" };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to post open challenge." };
    }
}

export async function getChallengesAction(userId: string, sport: Sport) {
    const [incoming, sent, open] = await Promise.all([
        getIncomingChallenges(userId),
        getSentChallenges(userId),
        getOpenChallenges(userId, sport)
    ]);
    return { incoming, sent, open };
}

export async function acceptChallengeAction(challenge: Challenge) {
    try {
        await updateChallengeStatus(challenge.id, 'accepted');
        const chatId = await getOrCreateChat(challenge.fromId, challenge.toId);
        revalidatePath('/challenges');
        revalidatePath('/chat');
        return { success: true, message: "Challenge accepted! Starting chat...", chatId };
    } catch (error: any) {
        return { success: false, message: "Failed to accept challenge." };
    }
}

export async function declineChallengeAction(challengeId: string) {
    try {
        await updateChallengeStatus(challengeId, 'declined');
        revalidatePath('/challenges');
        return { success: true, message: "Challenge declined." };
    } catch (error: any) {
        return { success: false, message: "Failed to decline challenge." };
    }
}

export async function cancelChallengeAction(challengeId: string) {
    try {
        await updateChallengeStatus(challengeId, 'cancelled');
        revalidatePath('/challenges');
        return { success: true, message: "Challenge cancelled." };
    } catch (error: any) {
        return { success: false, message: "Failed to cancel challenge." };
    }
}

export async function challengeFromOpenAction(openChallenge: OpenChallenge, challenger: User) {
    try {
        await challengeFromOpen(openChallenge, challenger);
        revalidatePath('/challenges');
        return { success: true, message: `Challenge sent to ${openChallenge.posterName}!` };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to challenge from open post." };
    }
}


// --- Tournament Actions ---
export async function createTournamentAction(values: z.infer<typeof createTournamentSchema>, organizer: User) {
    try {
        await createTournamentInDb(values, organizer);
        revalidatePath('/tournaments');
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to create tournament.' };
    }
}

export async function getTournamentsForUserAction(userId: string): Promise<Tournament[]> {
    return getTournamentsForUser(userId);
}

export async function getTournamentByIdAction(tournamentId: string): Promise<Tournament | null> {
    return getTournamentById(tournamentId);
}

export async function reportWinnerAction(tournamentId: string, matchId: string, winnerId: string) {
    try {
        await reportTournamentWinner(tournamentId, matchId, winnerId);
        revalidatePath(`/tournaments/${tournamentId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to report winner.' };
    }
}


// --- Chat Actions ---

export async function getOrCreateChatAction(friendId: string, currentUserId: string) {
    if (!currentUserId) {
      return { success: false, message: "Not authenticated." };
    }
    try {
      const chatId = await getOrCreateChat(currentUserId, friendId);
      revalidatePath('/chat');
      return { success: true, message: 'Chat ready.', redirect: `/chat/${chatId}` };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to get or create chat.' };
    }
}

export async function getChatsAction(userId: string): Promise<Chat[]> {
    if (!userId) return [];
    return await getChatsForUser(userId);
}

export async function sendMessageAction(chatId: string, senderId: string, text: string) {
    if (!senderId) {
        return { success: false, message: "Not authenticated." };
    }
    try {
        await sendMessage(chatId, senderId, text);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to send message.' };
    }
}

export async function markChatAsReadAction(chatId: string, userId: string) {
    if (!userId) {
        return { success: false, message: "Not authenticated." };
    }
    try {
        await markChatAsRead(chatId, userId);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: 'Failed to mark chat as read.' };
    }
}


// --- Game Actions ---

export async function createLegendGameAction(friendId: string | null, sport: Sport, currentUserId: string) {
    if (!currentUserId) {
        return { success: false, message: "Not authenticated" };
    }
    try {
        const initialRoundData = await getLegendGameRound({ sport, usedPlayers: [] });
        const gameId = await createLegendGameInDb(currentUserId, friendId, sport, initialRoundData);
        revalidatePath('/games');
        return { success: true, message: 'Game started!', redirect: `/games/legend/${gameId}` };
    } catch (error: any) {
        console.error("Error creating legend game:", error);
        return { success: false, message: error.message || 'Could not start the game. Please try again.' };
    }
}

export async function submitLegendAnswerAction(gameId: string, answer: string, currentUserId: string) {
    if (!currentUserId) {
        return { success: false, message: "Not authenticated" };
    }
    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'legendGames', gameId);
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error("Game not found.");
            const game = gameDoc.data() as LegendGame;

            if (game.status !== 'ongoing' || !game.currentRound) throw new Error("Game is not active.");
            if (game.currentPlayerId !== currentUserId) throw new Error("It is not your turn.");
            if (game.currentRound.guesses?.[currentUserId]) throw new Error("You have already answered.");

            const isCorrect = answer === game.currentRound.correctAnswer;
            const newGuesses = { ...(game.currentRound.guesses || {}), [currentUserId]: answer };
            
            if(isCorrect) {
                game.score[currentUserId] = (game.score[currentUserId] || 0) + 1;
            }
            game.currentRound.guesses = newGuesses;
            
            const allPlayersAnswered = Object.keys(newGuesses).length === game.participantIds.length;
            if (allPlayersAnswered) {
                game.turnState = 'round_over';
                // Keep current player as the one who can click "Next Round"
            } else {
                game.currentPlayerId = game.participantIds.find(id => id !== currentUserId)!;
            }

            game.updatedAt = Timestamp.now().toMillis();
            transaction.set(gameRef, game);
        });
        revalidatePath(`/games/legend/${gameId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to submit answer.' };
    }
}

export async function startNextLegendRoundAction(gameId: string, currentUserId: string) {
    if (!currentUserId) {
        return { success: false, message: "Not authenticated" };
    }
    try {
        const initialGame = await getGame<LegendGame>(gameId, 'legendGames');
        if (!initialGame) throw new Error("Game not found.");
        if (initialGame.status !== 'ongoing') throw new Error('Game is not ongoing.');
        if (initialGame.turnState !== 'round_over') throw new Error("Current round is not over.");

        const usedPlayers = initialGame.usedPlayers || [];
        const nextRoundData = await getLegendGameRound({ sport: initialGame.sport, usedPlayers });
        if (!nextRoundData) {
            throw new Error("The AI failed to generate a valid game round. Please try again.");
        }
        
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'legendGames', gameId);
            const gameDoc = await transaction.get(gameRef); // Re-fetch inside transaction
            if (!gameDoc.exists()) throw new Error("Game not found.");
            const game = gameDoc.data() as LegendGame;
            
            if (game.currentRound) {
                game.roundHistory.push(game.currentRound);
            }
            game.usedPlayers.push(nextRoundData.correctAnswer);
            game.currentRound = { ...nextRoundData, guesses: {} };
            game.turnState = 'playing';
            
            if (game.mode === 'friend') {
                const lastPlayerId = game.currentPlayerId;
                const nextPlayerId = game.participantIds.find(id => id !== lastPlayerId);
                game.currentPlayerId = nextPlayerId!;
            } else {
                game.currentPlayerId = game.participantIds[0];
            }

            // Game over logic
            const score1 = game.score[game.participantIds[0]] || 0;
            const score2 = game.participantIds.length > 1 ? (game.score[game.participantIds[1]] || 0) : 0;
            const roundsPlayed = game.roundHistory.length;

            if (game.mode === 'solo' && (score1 >= 5 || (roundsPlayed - score1) >= 3)) {
                game.status = 'complete';
                game.winnerId = score1 >= 5 ? game.participantIds[0] : null; 
            } else if (g.mode === 'friend' && (roundsPlayed >= 10 || Math.abs(score1 - score2) > (10 - roundsPlayed))) {
                game.status = 'complete';
                game.winnerId = score1 > score2 ? game.participantIds[0] : score2 > score1 ? game.participantIds[1] : 'draw';
            }

            game.updatedAt = Timestamp.now().toMillis();
            transaction.set(gameRef, game);
        });
        
        revalidatePath(`/games/legend/${gameId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error starting next round:", error);
        return { success: false, message: error.message || 'Failed to start next round.' };
    }
}


export async function createRallyGameAction(friendId: string, currentUserId: string) {
     if (!currentUserId) {
        return { success: false, message: "Not authenticated" };
    }
    try {
        const initialAiResponse = await playRallyPoint({ turn: 'serve', isServeTurn: true, isReturnTurn: false });
        const gameId = await createRallyGameInDb(currentUserId, friendId, initialAiResponse.serveOptions!);
        revalidatePath('/games');
        return { success: true, message: 'Rally Game started!', redirect: `/games/rally/${gameId}` };
    } catch (error: any) {
        console.error("Error creating rally game:", error);
        return { success: false, message: error.message || 'Failed to start Rally Game.' };
    }
}

export async function playRallyTurnAction(gameId: string, choice: any, currentUserId: string) {
    if (!currentUserId) {
        return { success: false, message: "Not authenticated" };
    }

    const game = await getGame<RallyGame>(gameId, 'rallyGames');
    if (!game) throw new Error("Game not found.");
    if (game.status === 'complete' || (game.turn !== 'point_over' && game.currentPlayerId !== currentUserId)) {
        throw new Error("It's not your turn or the game is over.");
    }
    
    let aiInput, aiResponse;
    if (game.turn === 'point_over') {
         aiInput = { turn: 'serve' as const, isServeTurn: true, isReturnTurn: false };
    } else if (game.turn === 'serving') {
         aiInput = { turn: 'return' as const, serveChoice: choice, isServeTurn: false, isReturnTurn: true };
    } else { // returning
         aiInput = { turn: 'return' as const, serveChoice: game.currentPoint.serveChoice!, returnChoice: choice, isServeTurn: false, isReturnTurn: true };
    }
    aiResponse = await playRallyPoint(aiInput);

    return await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, "rallyGames", gameId);
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw new Error("Game not found.");
        const freshGame = gameDoc.data() as RallyGame;

        const { servingPlayer, returningPlayer } = freshGame.currentPoint;

        if (freshGame.turn === 'serving') {
            freshGame.turn = 'returning';
            freshGame.currentPlayerId = returningPlayer;
            freshGame.currentPoint.serveChoice = choice;
            freshGame.currentPoint.returnOptions = aiResponse.returnOptions;
        } else if (freshGame.turn === 'returning') {
            const winnerId = aiResponse.pointWinner === 'server' ? servingPlayer : returningPlayer;
            freshGame.score[winnerId] = (freshGame.score[winnerId] || 0) + 1;
            freshGame.turn = 'point_over';
            freshGame.currentPlayerId = servingPlayer;
            const completedPoint: RallyGamePoint = { ...freshGame.currentPoint, returnChoice: choice, winner: winnerId, narrative: aiResponse.narrative! };
            freshGame.pointHistory.push(completedPoint);
            
            if (freshGame.score[winnerId] >= 5) {
                freshGame.status = 'complete';
                freshGame.winnerId = winnerId;
                freshGame.turn = 'game_over';
            }
        } else if (freshGame.turn === 'point_over') {
            freshGame.turn = 'serving';
            freshGame.currentPlayerId = returningPlayer;
            freshGame.currentPoint = { servingPlayer: returningPlayer, returningPlayer: servingPlayer, serveOptions: aiResponse.serveOptions };
        }
        
        freshGame.updatedAt = Timestamp.now().toMillis();
        transaction.set(gameRef, freshGame);
        revalidatePath(`/games/rally/${gameId}`);
        return { success: true };
    }).catch(error => {
        console.error("Error playing rally turn:", error);
        return { success: false, message: error.message || 'Failed to play turn.' };
    });
}


export async function deleteGameAction(gameId: string, gameType: 'Rally' | 'Legend', currentUserId: string) {
    if (!currentUserId) {
        return { success: false, message: "Not authenticated" };
    }
    try {
        await deleteGame(gameId, gameType === 'Rally' ? 'rallyGames' : 'legendGames', currentUserId);
        revalidatePath('/games');
        return { success: true, message: 'Game deleted successfully.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to delete game.' };
    }
}


// --- Match History Actions ---
export async function getMatchHistoryAction(userId: string): Promise<{ success: true, data: { confirmed: Match[], pending: Match[] } } | { success: false, error: string }> {
    if (!userId) {
        return { success: false, error: "Not authenticated" };
    }
    try {
        const [confirmed, pending] = await Promise.all([
            getConfirmedMatchesForUser(userId),
            getPendingMatchesForUser(userId)
        ]);
        return { success: true, data: { confirmed, pending } };
    } catch (error: any) {
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

export async function confirmMatchResultAction(matchId: string, userId: string) {
    if (!userId) return { success: false, message: 'You must be logged in to confirm a result.' };
    
    try {
        const result = await confirmMatchResult(matchId, userId);
        revalidatePath('/match-history');
        if (result.finalized) {
            revalidatePath('/dashboard');
            return { success: true, message: 'Final confirmation received. Ranks have been updated!' };
        }
        return { success: true, message: 'Result confirmed. Waiting for other players.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to confirm result.' };
    }
}

export async function declineMatchResultAction(matchId: string, userId: string) {
    if (!userId) return { success: false, message: 'You must be logged in to decline a result.' };

    try {
        await declineMatchResult(matchId, userId);
        revalidatePath('/match-history');
        return { success: true, message: 'Result declined.' };
    } catch (error: any) {
        return { success: false, message: 'Failed to decline result.' };
    }
}

// --- AI Coach Actions ---
export async function analyzeSwingAction(input: SwingAnalysisInput, userId: string) {
    if (!userId) throw new Error("Not authenticated");
    return analyzeSwing(input);
}

// --- AI Prediction Actions ---

export async function predictFriendMatchAction(currentUserId: string, friendId: string, sport: Sport): Promise<PredictMatchOutput> {
    if (!currentUserId) throw new Error("Not authenticated");
    
    const [currentUserDoc, friendDoc] = await Promise.all([
        getDoc(doc(db, 'users', currentUserId)),
        getDoc(doc(db, 'users', friendId))
    ]);

    if (!currentUserDoc.exists() || !friendDoc.exists()) {
        throw new Error("User data not found.");
    }
    
    const currentUserData = currentUserDoc.data() as User;
    const friendData = friendDoc.data() as User;

    const currentUserStats = currentUserData.sports?.[sport] ?? { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [], eloHistory: [] };
    const friendStats = friendData.sports?.[sport] ?? { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [], eloHistory: [] };

    const headToHead = await getHeadToHeadRecord(currentUserId, friendId, sport);

    const currentUserTotalGames = currentUserStats.wins + currentUserStats.losses;
    const friendTotalGames = friendStats.wins + friendStats.losses;
    
    const predictionInput = {
        player1Name: currentUserData.name,
        player2Name: friendData.name,
        player1RacktRank: currentUserStats.racktRank,
        player2RacktRank: friendStats.racktRank,
        player1WinRate: currentUserTotalGames > 0 ? currentUserStats.wins / currentUserTotalGames : 0,
        player2WinRate: friendTotalGames > 0 ? friendStats.wins / friendTotalGames : 0,
        player1Streak: currentUserStats.streak,
        player2Streak: friendStats.streak,
        headToHead: {
            player1Wins: headToHead.player1Wins,
            player2Wins: headToHead.player2Wins,
        },
        sport,
    };

    return await predictMatchOutcome(predictionInput);
}

// --- Leaderboard Actions ---
export async function getLeaderboardAction(sport: Sport): Promise<User[]> {
    return await getLeaderboard(sport);
}

// --- Settings Actions ---
export async function updateUserProfileAction(values: z.infer<typeof profileSettingsSchema>, userId: string) {
    if (!userId) throw new Error("Not authenticated");
    
    try {
        await updateUserProfile(userId, values);
        revalidatePath('/settings');
        revalidatePath(`/profile/${userId}`);
        return { success: true, message: "Profile updated successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to update profile.' };
    }
}
