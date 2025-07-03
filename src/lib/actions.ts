
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, auth } from '@/lib/firebase/config';
import { doc, getDoc, Timestamp, runTransaction, updateDoc, collection, query, where, setDoc } from 'firebase/firestore';
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
    createOpenChallenge,
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
import { type Sport, type User, reportMatchSchema, challengeSchema, openChallengeSchema, createTournamentSchema, Challenge, OpenChallenge, Tournament, Chat, Match, PredictMatchOutput, profileSettingsSchema, LegendGame, LegendGameRound, RallyGame } from '@/lib/types';
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
    if (!poster) {
        return { success: false, message: 'Not authenticated' };
    }
    try {
        await createOpenChallenge({
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
        return { success: false, message: 'Not authenticated' };
    }

    try {
        const initialRoundData = await getLegendGameRound({ sport, usedPlayers: [] });

        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (!userDoc.exists()) throw new Error("Current user not found.");
        const user = userDoc.data() as User;
        
        const gameRef = doc(collection(db, 'legendGames'));
        const now = Timestamp.now().toMillis();
        const initialRound: LegendGameRound = { ...initialRoundData, guesses: {} };
        
        let newGame: LegendGame;
        if (friendId) {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (!friendDoc.exists()) throw new Error("Friend not found.");
            const friend = friendDoc.data() as User;
            newGame = {
                id: gameRef.id, mode: 'friend', sport,
                participantIds: [currentUserId, friendId],
                participantsData: { [currentUserId]: { name: user.name, avatar: user.avatar, uid: user.uid }, [friendId]: { name: friend.name, avatar: friend.avatar, uid: friend.uid } },
                score: { [currentUserId]: 0, [friendId]: 0 },
                currentPlayerId: Math.random() < 0.5 ? currentUserId : friendId,
                turnState: 'playing', status: 'ongoing',
                currentRound: initialRound, roundHistory: [], usedPlayers: [initialRound.correctAnswer],
                createdAt: now, updatedAt: now,
            };
        } else {
            newGame = {
                id: gameRef.id, mode: 'solo', sport,
                participantIds: [currentUserId],
                participantsData: { [currentUserId]: { name: user.name, avatar: user.avatar, uid: user.uid } },
                score: { [currentUserId]: 0 },
                currentPlayerId: currentUserId,
                turnState: 'playing', status: 'ongoing',
                currentRound: initialRound, roundHistory: [], usedPlayers: [initialRound.correctAnswer],
                createdAt: now, updatedAt: now,
            };
        }
        await setDoc(gameRef, newGame);

        revalidatePath('/games');
        return { success: true, message: 'Game started!', redirect: `/games/legend/${gameRef.id}` };
    } catch (error: any) {
        console.error('Error creating legend game:', error);
        return { success: false, message: error.message || 'Could not start the game. Please try again.' };
    }
}


export async function submitLegendAnswerAction(gameId: string, answer: string, currentUserId: string) {
    if (!currentUserId) {
        return { success: false, message: 'Not authenticated' };
    }
    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'legendGames', gameId);
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error('Game not found.');
            const game = gameDoc.data() as LegendGame;

            if (game.status !== 'ongoing' || !game.currentRound) throw new Error('Game is not active.');
            if (game.currentPlayerId !== currentUserId) throw new Error('It is not your turn.');
            if (game.currentRound.guesses?.[currentUserId]) throw new Error('You have already answered.');

            const isCorrect = answer === game.currentRound.correctAnswer;
            const newGuesses = { ...(game.currentRound.guesses || {}), [currentUserId]: answer };
            
            game.currentRound.guesses = newGuesses;

            if (isCorrect) {
                game.score[currentUserId] = (game.score[currentUserId] || 0) + 1;
            } else {
                // If incorrect in solo mode, end the game.
                if (game.mode === 'solo') {
                    game.status = 'complete';
                    game.winnerId = null; // No winner, just game over.
                }
            }
            
            const allPlayersAnswered = Object.keys(newGuesses).length === game.participantIds.length;
            if (allPlayersAnswered) {
                game.turnState = 'round_over';
                
                // If the game just ended, we still want to show the 'round_over' state to reveal the correct answer.
                // Now, check for friend mode game over condition since the round is complete.
                if (game.mode === 'friend' && game.status === 'ongoing') {
                    const score1 = game.score[game.participantIds[0]] || 0;
                    const score2 = game.score[game.participantIds[1]] || 0;
                    const roundsPlayed = game.roundHistory.length + 1; // +1 for the current round that just finished
                    if (roundsPlayed >= 10 || Math.abs(score1 - score2) > (10 - roundsPlayed)) {
                        game.status = 'complete';
                        game.winnerId = score1 > score2 ? game.participantIds[0] : score2 > score1 ? game.participantIds[1] : 'draw';
                    }
                }
            } else {
                // This branch is only for friend mode.
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

    // Step 1: Fetch current game state and get AI data *before* the transaction
    const game = await getGame<LegendGame>(gameId, 'legendGames');
    if (!game) throw new Error("Game not found.");
    if (game.status !== 'ongoing') throw new Error('Game is not ongoing.');
    // Any player can now start the next round if it's over
    if (game.turnState !== 'round_over') throw new Error("Current round is not over.");

    const nextRoundData = await getLegendGameRound({ sport: game.sport, usedPlayers: game.usedPlayers || [] });

    // Step 2: Run the database transaction with the new data
    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'legendGames', gameId);
            const gameDoc = await transaction.get(gameRef); // Re-fetch inside transaction for consistency
            if (!gameDoc.exists()) throw new Error("Game not found during transaction.");
            const liveGame = gameDoc.data() as LegendGame;

            // State update logic
            if (liveGame.currentRound) {
                liveGame.roundHistory.push(liveGame.currentRound);
            }
            liveGame.usedPlayers.push(nextRoundData.correctAnswer);
            liveGame.currentRound = { ...nextRoundData, guesses: {} };
            liveGame.turnState = 'playing';

            // Set the next player. For solo, it's always the same player. For friend, it toggles.
            if (liveGame.mode === 'friend') {
                const lastPlayerId = liveGame.currentPlayerId;
                liveGame.currentPlayerId = liveGame.participantIds.find(id => id !== lastPlayerId)!;
            } else { // solo mode
                 liveGame.currentPlayerId = liveGame.participantIds[0];
            }

            // Check for solo win condition
            const score1 = liveGame.score[liveGame.participantIds[0]] || 0;
            if (liveGame.mode === 'solo' && score1 >= 10) { // Win after 10 correct answers
                liveGame.status = 'complete';
                liveGame.winnerId = liveGame.participantIds[0];
            }
            
            liveGame.updatedAt = Timestamp.now().toMillis();
            transaction.set(gameRef, liveGame);
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
        const [userDoc, friendDoc] = await Promise.all([
            getDoc(doc(db, 'users', currentUserId)),
            getDoc(doc(db, 'users', friendId))
        ]);

        if (!userDoc.exists() || !friendDoc.exists()) {
            throw new Error("User data not found.");
        }
        
        const user = userDoc.data() as User;
        const friend = friendDoc.data() as User;

        const initialAiResponse = await playRallyPoint({ 
            turn: 'serve', 
            isServeTurn: true, 
            isReturnTurn: false,
            player1Rank: user.sports?.['Tennis']?.racktRank ?? 1200,
            player2Rank: friend.sports?.['Tennis']?.racktRank ?? 1200,
        });

        const gameRef = doc(collection(db, 'rallyGames'));
        const now = Timestamp.now().toMillis();
        const newGame: RallyGame = {
            id: gameRef.id, sport: 'Tennis',
            participantIds: [user.uid, friend.uid],
            participantsData: { [user.uid]: { name: user.name, avatar: user.avatar, uid: user.uid }, [friend.uid]: { name: friend.name, avatar: friend.avatar, uid: friend.uid } },
            score: { [user.uid]: 0, [friend.uid]: 0 },
            turn: 'serving', currentPlayerId: user.uid,
            currentPoint: { servingPlayer: user.uid, returningPlayer: friend.uid, serveOptions: initialAiResponse.serveOptions },
            pointHistory: [], status: 'ongoing',
            createdAt: now, updatedAt: now,
        };
        await setDoc(gameRef, newGame);
        
        revalidatePath('/games');
        return { success: true, message: 'Rally Game started!', redirect: `/games/rally/${gameRef.id}` };
    } catch (error: any) {
        console.error("Error creating rally game:", error);
        return { success: false, message: error.message || 'Failed to start Rally Game.' };
    }
}

export async function playRallyTurnAction(gameId: string, choice: any, currentUserId: string) {
    if (!currentUserId) {
        return { success: false, message: "Not authenticated" };
    }

    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, "rallyGames", gameId);
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error("Game not found.");
            
            const game = gameDoc.data() as RallyGame;
            if (game.status === 'complete' || (game.turn !== 'point_over' && game.currentPlayerId !== currentUserId)) {
                throw new Error("It's not your turn or the game is over.");
            }
            
            const serverData = game.participantsData[game.currentPoint.servingPlayer];
            const returnerData = game.participantsData[game.currentPoint.returningPlayer];
            const serverRank = (await getDoc(doc(db, 'users', serverData.uid))).data()?.sports?.['Tennis']?.racktRank ?? 1200;
            const returnerRank = (await getDoc(doc(db, 'users', returnerData.uid))).data()?.sports?.['Tennis']?.racktRank ?? 1200;

            let aiInput, aiResponse;
            if (game.turn === 'point_over') {
                 aiInput = { turn: 'serve' as const, player1Rank: returnerRank, player2Rank: serverRank, isServeTurn: true, isReturnTurn: false };
                 aiResponse = await playRallyPoint(aiInput);
                 game.turn = 'serving';
                 game.currentPlayerId = game.currentPoint.returningPlayer; // The returner serves next
                 game.currentPoint = { servingPlayer: game.currentPoint.returningPlayer, returningPlayer: game.currentPoint.servingPlayer, serveOptions: aiResponse.serveOptions };
            } else if (game.turn === 'serving') {
                 aiInput = { turn: 'return' as const, serveChoice: choice, player1Rank: serverRank, player2Rank: returnerRank, isServeTurn: false, isReturnTurn: true };
                 aiResponse = await playRallyPoint(aiInput);
                 game.turn = 'returning';
                 game.currentPlayerId = game.currentPoint.returningPlayer;
                 game.currentPoint.serveChoice = choice;
                 game.currentPoint.returnOptions = aiResponse.returnOptions;
            } else { // returning
                 aiInput = { turn: 'return' as const, serveChoice: game.currentPoint.serveChoice!, returnChoice: choice, player1Rank: serverRank, player2Rank: returnerRank, isServeTurn: false, isReturnTurn: true };
                 aiResponse = await playRallyPoint(aiInput);
                 const winnerId = aiResponse.pointWinner === 'server' ? game.currentPoint.servingPlayer : game.currentPoint.returningPlayer;
                 game.score[winnerId] = (game.score[winnerId] || 0) + 1;
                 game.turn = 'point_over';
                 game.currentPlayerId = game.currentPoint.servingPlayer;
                 const completedPoint: RallyGamePoint = { ...game.currentPoint, returnChoice: choice, winner: winnerId, narrative: aiResponse.narrative! };
                 game.pointHistory.push(completedPoint);
                 
                 // Game over condition
                 if (game.score[winnerId] >= 5) {
                     game.status = 'complete';
                     game.winnerId = winnerId;
                     game.turn = 'game_over';
                 }
            }
            
            game.updatedAt = Timestamp.now().toMillis();
            transaction.set(gameRef, game);
        });

        revalidatePath(`/games/rally/${gameId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error playing rally turn:", error);
        return { success: false, message: error.message || 'Failed to play turn.' };
    }
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
