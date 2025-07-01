
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, Timestamp, collection, runTransaction, updateDoc, arrayUnion } from 'firebase/firestore';
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
    createTournament,
    getTournamentsForUser,
    getTournamentById,
    reportTournamentWinner,
    getOrCreateChat,
    sendMessage,
    markChatAsRead,
    getChatsForUser,
    getChallengeById,
    createRallyGame,
    createLegendGame as createLegendGameInFirestore,
    submitLegendAnswer,
    getGameForNextRound,
    advanceToNextLegendRound,
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
import { type Sport, type User, MatchType, reportMatchSchema, challengeSchema, openChallengeSchema, createTournamentSchema, Challenge, OpenChallenge, Tournament, Chat, Message, RallyGame, Match, PredictMatchOutput, profileSettingsSchema, LegendGame, LegendGameOutput } from '@/lib/types';
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
export async function handleRecapAction(match: Match) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const player1Name = match.participantsData[match.teams.team1.playerIds[0]].name;
    const player2Name = match.participantsData[match.teams.team2.playerIds[0]].name;
    
    const recap = await getMatchRecap({
        player1Name,
        player2Name,
        score: match.score,
        sport: match.sport,
    });
    
    return recap;
}

// Action to search for users
export async function searchUsersAction(query: string, currentUserId: string): Promise<User[]> {
    if (!query) return [];
    try {
        const users = await searchUsers(query, currentUserId);
        return users;
    } catch (error) {
        console.error("Search action failed:", error);
        return [];
    }
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
        console.error("Accept friend request action failed:", error);
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
        console.error("Decline/cancel friend request action failed:", error);
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
        console.error("Remove friend action failed:", error);
        return { success: false, message: "Failed to remove friend." };
    }
}

export async function getFriendshipStatusAction(profileUserId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    
    return getFriendshipStatus(user.uid, profileUserId);
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
        await createTournament(values, organizer);
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
      // Redirect handled client-side now
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

export async function createRallyGameAction(friendId: string, currentUserId: string) {
    if (!currentUserId) return { success: false, message: 'You must be logged in to start a game.' };

    try {
        const gameId = await createRallyGame(currentUserId, friendId);
        revalidatePath('/games');
        return { success: true, message: 'Rally Game started!', redirect: `/games/rally/${gameId}` };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to start Rally Game.' };
    }
}

export async function playRallyTurnAction(gameId: string, choice: any, currentUserId: string) {
    if (!currentUserId) return { success: false, message: 'You must be logged in.' };
    
    // 1. Read game state BEFORE transaction to prepare AI call
    const gameRef = doc(db, "rallyGames", gameId);
    const gameDocPre = await getDoc(gameRef);
    if (!gameDocPre.exists()) return { success: false, message: "Game not found." };
    const gamePre = gameDocPre.data() as RallyGame;

    // 2. Validate turn and prepare AI input
    if (gamePre.status === 'complete') return { success: false, message: 'Game is already over.' };
    if (gamePre.turn !== 'point_over' && gamePre.currentPlayerId !== currentUserId) {
        return { success: false, message: "It's not your turn." };
    }

    const serverId = (gamePre.turn === 'point_over') ? gamePre.currentPoint.returningPlayer : gamePre.currentPoint.servingPlayer;
    const returnerId = (gamePre.turn === 'point_over') ? gamePre.currentPoint.servingPlayer : gamePre.currentPoint.returningPlayer;
    
    // For AI call, we need player stats. We fetch them here, outside the transaction.
    const [serverDoc, returnerDoc] = await Promise.all([
        getDoc(doc(db, 'users', serverId)),
        getDoc(doc(db, 'users', returnerId))
    ]);
    if (!serverDoc.exists() || !returnerDoc.exists()) return { success: false, message: "Player data not found." };
    const server = serverDoc.data() as User;
    const returner = returnerDoc.data() as User;
    const serverRank = server.sports?.[gamePre.sport]?.racktRank || 1200;
    const returnerRank = returner.sports?.[gamePre.sport]?.racktRank || 1200;

    let aiInput;
    let isServeTurn;
    if (gamePre.turn === 'serving') {
        aiInput = { turn: 'return', player1Rank: serverRank, player2Rank: returnerRank, serveChoice: choice };
        isServeTurn = false;
    } else if (gamePre.turn === 'returning') {
        aiInput = { turn: 'return', player1Rank: serverRank, player2Rank: returnerRank, serveChoice: gamePre.currentPoint.serveChoice, returnChoice: choice };
        isServeTurn = false;
    } else if (gamePre.turn === 'point_over') {
        // Point is over, next turn is a serving turn for the previous returner
        aiInput = { turn: 'serve', player1Rank: returnerRank, player2Rank: serverRank };
        isServeTurn = true;
    } else {
        return { success: false, message: "Invalid game state for AI call." };
    }

    try {
        // 3. Call AI Flow (with its new retry logic)
        const aiResponse = await playRallyPoint(aiInput as any);

        // 4. Run the database update in a transaction
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error("Game not found.");
            const game = gameDoc.data() as RallyGame;

            // 5. Concurrency check: Ensure the game state hasn't changed since we read it
            if (game.updatedAt !== gamePre.updatedAt) {
                throw new Error("The game state has changed. Please try again.");
            }
            if (game.status === 'complete' || (game.turn !== 'point_over' && game.currentPlayerId !== currentUserId)) {
                throw new Error("It's no longer your turn or the game is over.");
            }
            
            // 6. Calculate and apply updates
            const updateData: {[key: string]: any} = { updatedAt: Timestamp.now().toMillis() };
            
            if (game.turn === 'serving') {
                updateData['turn'] = 'returning';
                updateData['currentPlayerId'] = returnerId;
                updateData['currentPoint.serveChoice'] = choice;
                updateData['currentPoint.returnOptions'] = aiResponse.returnOptions;
            } else if (game.turn === 'returning') {
                const winnerId = aiResponse.pointWinner === 'server' ? game.currentPoint.servingPlayer : game.currentPoint.returningPlayer;
                const newScore = { ...game.score, [winnerId]: (game.score[winnerId] || 0) + 1 };
                
                updateData['turn'] = 'point_over';
                updateData['currentPlayerId'] = game.currentPoint.servingPlayer;
                updateData['score'] = newScore;
                updateData['pointHistory'] = arrayUnion({ 
                    ...game.currentPoint, 
                    returnChoice: choice, 
                    winner: winnerId, 
                    narrative: aiResponse.narrative! 
                });

                if (newScore[winnerId] >= 5) {
                    updateData['status'] = 'complete';
                    updateData['winnerId'] = winnerId;
                    updateData['turn'] = 'game_over';
                }
            } else if (game.turn === 'point_over') {
                updateData['turn'] = 'serving';
                updateData['currentPlayerId'] = returnerId; // Next server is the previous returner
                updateData['currentPoint'] = { servingPlayer: returnerId, returningPlayer: serverId, serveOptions: aiResponse.serveOptions };
            }
            
            transaction.update(gameRef, updateData);
        });
        
        revalidatePath(`/games/rally/${gameId}`);
        return { success: true };

    } catch (error: any) {
        console.error("Error playing rally turn:", error);
        return { success: false, message: error.message || 'Failed to play turn.' };
    }
}


export async function createLegendGameAction(friendId: string | null, sport: Sport, currentUserId: string) {
    if (!currentUserId) {
        return { success: false, message: 'You must be logged in to start a game.' };
    }
    
    try {
        // Step 1: Get the game round from the AI first.
        const initialRoundData = await getLegendGameRound({ sport, usedPlayers: [] });
        if (!initialRoundData?.correctAnswer) {
             throw new Error("The AI failed to generate a valid game round. Please try again.");
        }
        
        // Step 2: If successful, create the game document in Firestore.
        const gameId = await createLegendGameInFirestore(currentUserId, friendId, sport, initialRoundData);
        
        revalidatePath('/games');
        return { success: true, message: 'Game started!', redirect: `/games/legend/${gameId}` };

    } catch (error: any) {
        console.error("Error creating legend game:", error);
        return { success: false, message: error.message || 'Could not start the game. Please try again.' };
    }
}

export async function submitLegendAnswerAction(gameId: string, answer: string, currentUserId: string) {
    if (!currentUserId) return { success: false, message: 'You must be logged in.' };
    try {
        await submitLegendAnswer(gameId, currentUserId, answer);
        revalidatePath(`/games/legend/${gameId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error submitting legend answer:", error);
        return { success: false, message: error.message || 'Failed to submit answer.' };
    }
}

export async function startNextLegendRoundAction(gameId: string, currentUserId: string) {
    if (!currentUserId) return { success: false, message: 'You must be logged in.' };
    try {
        // Step 1: Get the current game data to determine the sport and used players.
        const game = await getGameForNextRound(gameId);
        if (!game) throw new Error("Game not found.");
        if (game.status !== 'ongoing') return { success: true }; // Game is over, no action needed
        if (game.turnState !== 'round_over') throw new Error("Current round is not over.");

        // Step 2: Call the AI to generate the next round.
        const nextRoundData = await getLegendGameRound({ sport: game.sport, usedPlayers: game.usedPlayers });
        if (!nextRoundData) throw new Error("Failed to generate the next round from AI.");

        // Step 3: Pass this data to the database function to perform the atomic update.
        await advanceToNextLegendRound(gameId, nextRoundData, currentUserId);

        revalidatePath(`/games/legend/${gameId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error starting next round:", error);
        return { success: false, message: error.message || 'Failed to start next round.' };
    }
}


export async function deleteGameAction(gameId: string, gameType: 'Rally' | 'Legend', currentUserId: string) {
    if (!currentUserId) {
        return { success: false, message: 'You must be logged in to delete a game.' };
    }

    const collectionName = gameType === 'Rally' ? 'rallyGames' : 'legendGames';

    try {
        await deleteGame(gameId, collectionName, currentUserId);
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
        console.error("Failed to fetch match history:", error);
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
    
    try {
        const result = await analyzeSwing(input);
        return result;
    } catch (error: any) {
        console.error("Swing analysis action failed:", error);
        throw new Error(error.message || "Failed to analyze swing.");
    }
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

    const result = await predictMatchOutcome(predictionInput);
    return result;
}

// --- Leaderboard Actions ---
export async function getLeaderboardAction(sport: Sport): Promise<User[]> {
    const users = await getLeaderboard(sport);
    return users;
}

// --- Settings Actions ---
export async function updateUserProfileAction(values: z.infer<typeof profileSettingsSchema>) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, message: "Not authenticated." };
    }
    
    try {
        await updateUserProfile(user.uid, values);
        revalidatePath('/settings');
        revalidatePath(`/profile/${user.uid}`);
        return { success: true, message: "Profile updated successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to update profile.' };
    }
}

    