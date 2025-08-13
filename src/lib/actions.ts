

'use client';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase/config';
import { doc, getDoc, Timestamp, runTransaction, updateDoc, collection, query, where, orderBy, writeBatch, limit, addDoc, setDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, uploadBytes, deleteObject, listAll } from 'firebase/storage';
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
    getConfirmedMatchesForUser,
    getPendingMatchesForUser,
    getHeadToHeadMatches,
    getLeaderboard,
    updateUserProfileInDb,
    getFriendshipStatus,
    deleteGame,
    getGameFromDb,
    deleteOpenChallenge,
    logPracticeSession,
    deletePracticeSession,
    getPracticeSessionsForUser,
    createReport,
    deleteUserDocument,
    findCourts,
    createUserDocument,
    createFriendGroup,
    getFriendGroups as getFriendGroupsFromDb,
    createLegendGameInDb
} from '@/lib/firebase/firestore';
import type { SwingAnalysisInput } from '@/lib/types';
import type { Sport, User, Challenge, OpenChallenge, Tournament, Chat, Message, Match, PredictMatchOutput, LegendGame, LegendGameRound, RallyGame, RallyGamePoint, UserReport, Court, RallyGameInput } from '@/lib/types';
import { reportMatchSchema, challengeSchema, openChallengeSchema, createTournamentSchema, profileSettingsSchema, practiceSessionSchema, reportUserSchema, createFriendGroupSchema } from '@/lib/types';
import { setHours, setMinutes } from 'date-fns';
import { calculateRivalryAchievements } from '@/lib/achievements';


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
        isRanked: values.isRanked,
        team1Ids,
        team2Ids,
        winnerIds: winnerIds,
        score: values.score,
        reportedById: user.uid,
        date: values.date.getTime(),
    });
    
}

// Action to get match recap
export async function handleRecapAction(match: Match, currentUserId: string) {
  const player1Name = match.participantsData[match.teams.team1.playerIds[0]].username;
  const player2Name = match.participantsData[match.teams.team2.playerIds[0]].username;
  const { getMatchRecap } = await import('@/server/ai/flows/match-recap');
  return await getMatchRecap({
    player1Name,
    player2Name,
    score: match.score,
    sport: match.sport,
  });
}

// Action to search for users
export async function searchUsersAction(query: string, currentUserId: string): Promise<User[]> {
    if (!query) return [];
    return searchUsers(query, currentUserId);
}

// Action for sending a friend request
export async function addFriendAction(fromUser: User, toUser: User) {
    try {
        await sendFriendRequest(fromUser, toUser);
        return { success: true, message: "Friend request sent." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to send friend request." };
    }
}

// --- Friend Management Actions ---

export async function getFriendsAction(userId: string): Promise<User[]> {
    return getFriendsFromFirestore(userId);
}

export async function getIncomingRequestsAction(userId: string): Promise<any[]> {
    return getIncomingFriendRequests(userId);
}

export async function getSentRequestsAction(userId: string): Promise<any[]> {
    return getSentFriendRequests(userId);
}

export async function acceptFriendRequestAction(requestId: string, fromId: string, toId: string) {
    try {
        await acceptFriendRequest(requestId, fromId, toId);
        return { success: true, message: "Friend request accepted." };
    } catch (error: any) {
        return { success: false, message: "Failed to accept friend request." };
    }
}

export async function declineOrCancelFriendRequestAction(requestId: string, profileIdToRevalidate?: string) {
    try {
        await deleteFriendRequest(requestId);
        return { success: true, message: "Request removed." };
    } catch (error: any) {
        return { success: false, message: "Failed to remove friend request." };
    }
}

export async function removeFriendAction(currentUserId: string, friendId: string) {
    try {
        await removeFriend(currentUserId, friendId);
        return { success: true, message: "Friend removed." };
    } catch (error: any) {
        return { success: false, message: "Failed to remove friend." };
    }
}

export async function getFriendshipStatusAction(profileUserId: string, currentUserId: string) {
    return getFriendshipStatus(currentUserId, profileUserId);
}

// --- Challenge System Actions ---

export async function createDirectChallengeAction(values: z.infer<typeof challengeSchema>, fromUser: User, toUser: User) {
    try {
        const [hours, minutes] = values.time.split(':').map(Number);
        const matchDateTime = setMinutes(setHours(values.date, hours), minutes).getTime();

        await createDirectChallenge({
            fromId: fromUser.uid,
            fromUsername: fromUser.username,
            fromAvatarUrl: fromUser.avatarUrl || null,
            toId: toUser.uid,
            toUsername: toUser.username,
            toAvatarUrl: toUser.avatarUrl || null,
            sport: values.sport,
            location: values.location,
            wager: values.wager,
            matchDateTime: matchDateTime,
        } as any);
        return { success: true, message: "Challenge sent successfully!" };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to send challenge." };
    }
}

export async function createOpenChallengeAction(values: z.infer<typeof openChallengeSchema>, poster: User) {
    try {
        await createOpenChallenge({
            posterId: poster.uid,
            posterUsername: poster.username,
            posterAvatarUrl: poster.avatarUrl || null,
            sport: values.sport,
            location: values.location,
            latitude: values.latitude,
            longitude: values.longitude,
            note: values.note,
        });
        return { success: true, message: "Open challenge posted!" };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to post open challenge." };
    }
}

export async function getChallengesAction(
    userId: string,
    sport: Sport,
    latitude?: number,
    longitude?: number,
    radiusKm: number = 25
) {
    const [incoming, sent, open] = await Promise.all([
        getIncomingChallenges(userId),
        getSentChallenges(userId),
        getOpenChallenges(sport, latitude, longitude, radiusKm)
    ]);
    return { incoming, sent, open };
}

export async function acceptChallengeAction(challenge: Challenge) {
    try {
        await updateChallengeStatus(challenge.id, 'accepted');
        const chatId = await getOrCreateChat(challenge.fromId, challenge.toId);
        return { success: true, message: "Challenge accepted! Starting chat...", chatId };
    } catch (error: any) {
        return { success: false, message: "Failed to accept challenge." };
    }
}

export async function declineChallengeAction(challengeId: string) {
    try {
        await updateChallengeStatus(challengeId, 'declined');
        return { success: true, message: "Challenge declined." };
    } catch (error: any) {
        return { success: false, message: "Failed to decline challenge." };
    }
}

export async function cancelChallengeAction(challengeId: string) {
    try {
        await updateChallengeStatus(challengeId, 'cancelled');
        return { success: true, message: "Challenge cancelled." };
    } catch (error: any) {
        return { success: false, message: "Failed to cancel challenge." };
    }
}

export async function challengeFromOpenAction(openChallenge: OpenChallenge, challenger: User) {
    try {
        await challengeFromOpen(openChallenge, challenger);
        return { success: true, message: `Challenge sent to @${openChallenge.posterUsername}!` };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to challenge from open post." };
    }
}

export async function deleteOpenChallengeAction(challengeId: string, userId: string) {
    try {
        await deleteOpenChallenge(challengeId, userId);
        return { success: true, message: "Open challenge deleted." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to delete challenge." };
    }
}


// --- Tournament Actions ---
export async function createTournamentAction(values: z.infer<typeof createTournamentSchema>, organizer: User) {
    try {
        await createTournamentInDb(values, organizer);
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
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to report winner.' };
    }
}


// --- Chat Actions ---

export async function getOrCreateChatAction(friendId: string, currentUserId: string) {
    try {
      const chatId = await getOrCreateChat(currentUserId, friendId);
      return { success: true, message: 'Chat ready.', redirect: `/chat?id=${chatId}` };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to get or create chat.' };
    }
}

export async function sendMessageAction(chatId: string, senderId: string, text: string) {
    try {
        await sendMessage(chatId, senderId, text);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to send message.' };
    }
}

export async function markChatAsReadAction(chatId: string, userId: string) {
    try {
        await markChatAsRead(chatId, userId);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: 'Failed to mark chat as read.' };
    }
}

export async function reportUserAction(data: z.infer<typeof reportUserSchema>) {
    try {
        // Validate input data
        reportUserSchema.parse(data);
        await createReport(data);
        return { success: true, message: 'User has been reported.' };
    } catch (error: any) {
        console.error("Error reporting user:", error);
        return { success: false, message: error.message || 'Failed to report user.' };
    }
}


// --- Game Actions ---

export async function createLegendGameAction(friendId: string | null, sport: Sport, currentUserId: string) {
    try {
        const { getLegendGameRound } = await import('@/server/ai/flows/guess-the-legend-flow');
        const initialRoundData = await getLegendGameRound({ sport, usedPlayers: [] });
        if (!initialRoundData) throw new Error("Failed to generate the first round.");

        const gameId = await createLegendGameInDb(currentUserId, friendId, sport, initialRoundData);

        return { success: true, message: 'Game started!', redirect: `/games/legend?id=${gameId}` };
    } catch (error: any) {
        console.error('Error creating legend game:', error);
        return { success: false, message: error.message || 'Could not start the game. Please try again.' };
    }
}


export async function submitLegendAnswerAction(gameId: string, answer: string, currentUserId: string) {
    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'legendGames', gameId);
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error('Game not found.');
            const game = gameDoc.data() as LegendGame;

            if (game.status !== 'ongoing' || !game.currentRound) throw new Error('Game is not active.');
            if (game.currentRound.guesses?.[currentUserId]) throw new Error('You have already answered for this round.');

            const isCorrect = answer === game.currentRound.correctAnswer;
            const newGuesses = { ...(game.currentRound.guesses || {}), [currentUserId]: answer };
            
            game.currentRound.guesses = newGuesses;

            if (isCorrect) {
                game.score[currentUserId] = (game.score[currentUserId] || 0) + 1;
            }
            
            const allPlayersAnswered = Object.keys(newGuesses).length === game.participantIds.length;

            if (game.mode === 'solo') {
                game.turnState = 'round_over';
                // End game on a wrong answer in solo mode OR after 10 correct answers.
                if (!isCorrect) {
                     game.status = 'complete';
                     game.winnerId = null; // No winner for a loss
                } else if ((game.score[currentUserId] || 0) >= 10) { // Win condition
                     game.status = 'complete';
                     game.winnerId = currentUserId;
                }
            } else { // friend mode
                if (allPlayersAnswered) {
                    game.turnState = 'round_over';
                    const p1Id = game.participantIds[0];
                    const p2Id = game.participantIds[1];
                    
                    const p1Correct = newGuesses[p1Id] === game.currentRound!.correctAnswer;
                    const p2Correct = newGuesses[p2Id] === game.currentRound!.correctAnswer;
            
                    // "Sudden death" win condition
                    if (p1Correct !== p2Correct) {
                        game.status = 'complete';
                        game.winnerId = p1Correct ? p1Id : p2Id;
                    }
                }
            }

            game.updatedAt = Timestamp.now().toMillis();
            transaction.set(gameRef, game);
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to submit answer.' };
    }
}

export async function startNextLegendRoundAction(gameId: string) {
    try {
        const game = await getGameFromDb<LegendGame>(gameId, 'legendGames');
        if (!game) throw new Error("Game not found.");
        if (game.status !== 'ongoing') return { success: true }; // Game already ended
        if (game.turnState !== 'round_over') return { success: true }; // Another user already started it.

        const { getLegendGameRound } = await import('@/server/ai/flows/guess-the-legend-flow');
        const nextRoundData = await getLegendGameRound({ sport: game.sport, usedPlayers: game.usedPlayers || [] });
        if (!nextRoundData) throw new Error("Failed to generate the next round.");

        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'legendGames', gameId);
            const liveGame = game; // We use the one we fetched outside the transaction

            if (liveGame.currentRound) {
                liveGame.roundHistory.push(liveGame.currentRound);
            }
            liveGame.usedPlayers.push(nextRoundData.correctAnswer);
            liveGame.currentRound = { ...nextRoundData, guesses: {} };
            liveGame.turnState = 'playing';

            if (liveGame.mode === 'solo') {
                liveGame.currentPlayerId = liveGame.participantIds[0];
            } else { // friend mode
                const otherPlayerId = liveGame.participantIds.find(id => id !== liveGame.currentPlayerId);
                liveGame.currentPlayerId = otherPlayerId!;
            }
            
            liveGame.updatedAt = Timestamp.now().toMillis();
            transaction.set(gameRef, liveGame);
        });
        
        return { success: true };
    } catch (error: any) {
        console.error("Error starting next round:", error);
        return { success: false, message: error.message || 'Failed to start next round.' };
    }
}

export async function createRallyGameAction(friendId: string, currentUserId: string, sport: Sport) {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        const friendDoc = await getDoc(doc(db, 'users', friendId));

        if (!userDoc.exists() || !friendDoc.exists()) {
            throw new Error("User data not found.");
        }
        
        const user = userDoc.data() as User;
        const friend = friendDoc.data() as User;

        const { playRallyPoint } = await import('@/server/ai/flows/rally-game-flow');
        const initialAiResponse = await playRallyPoint({
            sport: sport,
            servingPlayerRank: user.sports?.[sport]?.racktRank ?? 1200,
            returningPlayerRank: friend.sports?.[sport]?.racktRank ?? 1200,
        });

        const gameId = await runTransaction(db, async (transaction) => {
            const gameRef = doc(collection(db, 'rallyGames'));
            const now = Timestamp.now().toMillis();
            const newGame: RallyGame = {
                id: gameRef.id,
                sport: sport,
                participantIds: [user.uid, friend.uid],
                participantsData: { [user.uid]: { username: user.username, avatarUrl: user.avatarUrl || null, uid: user.uid }, [friend.uid]: { username: friend.username, avatarUrl: friend.avatarUrl || null, uid: friend.uid } },
                score: { [user.uid]: 0, [friend.uid]: 0 },
                turn: 'serving', currentPlayerId: user.uid,
                currentPoint: { servingPlayer: user.uid, returningPlayer: friend.uid, serveOptions: initialAiResponse.serveOptions },
                pointHistory: [], status: 'ongoing',
                createdAt: now, updatedAt: now,
            };
            transaction.set(gameRef, newGame);
            return gameRef.id;
        });
        
        return { success: true, message: 'Rally Game started!', redirect: `/games/rally?id=${gameId}` };
    } catch (error: any) {
        console.error("Error creating rally game:", error);
        throw new Error(error.message || 'Failed to start Rally Game.');
    }
}

export async function playRallyTurnAction(gameId: string, choice: any, currentUserId: string) {
    try {
      const { playRallyPoint } = await import('@/server/ai/flows/rally-game-flow');
      const game = await getGameFromDb<RallyGame>(gameId, 'rallyGames');
      if (!game) throw new Error('Game not found.');
  
      if (game.status === 'complete') throw new Error('Game is already complete.');
      if (game.currentPlayerId !== currentUserId) {
        throw new Error("It's not your turn.");
      }
  
      let aiInput: RallyGameInput;
      let updatePayload: Partial<RallyGame> = {};
  
      const serverId = game.currentPoint.servingPlayer;
      const returnerId = game.currentPoint.returningPlayer;
      const serverDoc = await getDoc(doc(db, 'users', serverId));
      const returnerDoc = await getDoc(doc(db, 'users', returnerId));
      const serverRank = serverDoc.data()?.sports?.[game.sport]?.racktRank ?? 1200;
      const returnerRank = returnerDoc.data()?.sports?.[game.sport]?.racktRank ?? 1200;
  
      if (game.turn === 'serving') {
        aiInput = { sport: game.sport, serveChoice: choice, servingPlayerRank: serverRank, returningPlayerRank: returnerRank };
        const aiResponse = await playRallyPoint(aiInput);
        if (!aiResponse.returnOptions) throw new Error("AI failed to generate return options.");
  
        updatePayload = {
          turn: 'returning',
          currentPlayerId: returnerId,
          currentPoint: { ...game.currentPoint, serveChoice: choice, returnOptions: aiResponse.returnOptions },
        };
      } else { // returning
        aiInput = { sport: game.sport, serveChoice: game.currentPoint.serveChoice!, returnChoice: choice, servingPlayerRank: serverRank, returningPlayerRank: returnerRank };
        const pointEvalResponse = await playRallyPoint(aiInput);
        
        if (!pointEvalResponse.pointWinner || !pointEvalResponse.narrative) throw new Error("AI failed to evaluate the point.");
        
        const winnerId = pointEvalResponse.pointWinner === 'server' ? serverId : returnerId;
        
        updatePayload = {
            turn: 'point_over',
            score: { ...game.score, [winnerId]: (game.score[winnerId] || 0) + 1 },
            pointHistory: [...game.pointHistory, { ...game.currentPoint, returnChoice: choice, winner: winnerId, narrative: pointEvalResponse.narrative! } as RallyGamePoint],
            // The currentPlayerId for the *next* turn is the one who *just* played.
            // This allows them to be the one to trigger the next point.
            currentPlayerId: currentUserId
        };
      }
  
      await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'rallyGames', gameId);
        transaction.update(gameRef, { ...updatePayload, updatedAt: Timestamp.now().toMillis() });
      });
  
    } catch (error: any) {
        console.error('Error playing rally turn:', error);
        throw new Error(error.message || 'Failed to play turn.');
    }
}

export async function startNextRallyPointAction(gameId: string) {
    try {
        const game = await getGameFromDb<RallyGame>(gameId, 'rallyGames');
        if (!game) throw new Error("Game not found.");
        if (game.status !== 'ongoing') return { success: true };

        const winnerId = game.pointHistory[game.pointHistory.length - 1]?.winner;
        if (game.score[winnerId] >= 5) {
            await updateDoc(doc(db, 'rallyGames', gameId), { status: 'complete', winnerId: winnerId, turn: 'game_over' });
        } else {
            await startNextRallyPointFlow(gameId);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error starting next rally point:', error);
        return { success: false, message: error.message || 'Failed to start next point.' };
    }
}


export async function deleteGameAction(gameId: string, gameType: 'Rally' | 'Legend', currentUserId: string) {
    try {
        await deleteGame(gameId, gameType === 'Rally' ? 'rallyGames' : 'legendGames', currentUserId);
        return { success: true, message: 'Game deleted successfully.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to delete game.' };
    }
}


// --- Match History Actions ---
export async function getMatchHistoryAction(userId: string): Promise<{ success: true, data: { confirmed: Match[], pending: Match[] } } | { success: false, error: string }> {
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
        if (result.finalized) {
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
        return { success: true, message: 'Result declined.' };
    } catch (error: any) {
        return { success: false, message: 'Failed to decline result.' };
    }
}

// --- AI Coach Actions ---
export async function analyzeSwingAction(input: SwingAnalysisInput, userId: string) {
    const { analyzeSwing } = await import('@/server/ai/flows/swing-analysis-flow');
    return analyzeSwing(input);
}

// --- AI Prediction Actions ---

export async function predictFriendMatchAction(currentUserId: string, friendId: string, sport: Sport): Promise<PredictMatchOutput> {
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

    const headToHeadMatches = await getHeadToHeadMatches(currentUserId, friendId, sport);
    const currentUserWins = headToHeadMatches.filter(m => m.winner.includes(currentUserId)).length;
    const profileUserWins = headToHeadMatches.filter(m => m.winner.includes(friendId)).length;

    const currentUserTotalGames = currentUserStats.wins + currentUserStats.losses;
    const friendTotalGames = friendStats.wins + friendStats.losses;
    
    const predictionInput = {
        player1Name: currentUserData.username,
        player2Name: friendData.username,
        player1RacktRank: currentUserStats.racktRank,
        player2RacktRank: friendStats.racktRank,
        player1WinRate: currentUserTotalGames > 0 ? currentUserStats.wins / currentUserTotalGames : 0,
        player2WinRate: friendTotalGames > 0 ? friendStats.wins / friendTotalGames : 0,
        player1Streak: currentUserStats.streak,
        player2Streak: friendStats.streak,
        headToHead: {
            player1Wins: currentUserWins,
            player2Wins: profileUserWins,
        },
        sport,
    };

    const { predictMatchOutcome } = await import('@/server/ai/flows/predict-match');
    return await predictMatchOutcome(predictionInput);
}

// --- Leaderboard Actions ---
export async function getLeaderboardAction(sport: Sport, limitNum: number = 100, userIds?: string[] | null) {
    return await getLeaderboard(sport, limitNum, userIds);
}

export async function createFriendGroupAction(values: z.infer<typeof createFriendGroupSchema>, creatorId: string) {
    try {
        await createFriendGroup(values, creatorId);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to create group.' };
    }
}

export async function getFriendGroupsAction(userId: string) {
    return getFriendGroupsFromDb(userId);
}


// --- Settings Actions ---
export async function updateUserProfileAction(values: z.infer<typeof profileSettingsSchema>, userId: string) {
    try {
      await updateUserProfileInDb(userId, values);
      
      return { success: true, message: 'Profile updated successfully.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update profile.' };
    }
}

export async function updateUserAvatarAction(userId: string, newAvatarUrl: string) {
    try {
        await updateUserProfileInDb(userId, { avatarUrl: newAvatarUrl });


        return { success: true, message: 'Profile picture updated.' };
    } catch (error: any) {
        console.error("Error updating avatar in action:", error);
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
}

export async function deleteUserAccountAction(userId: string) {
    try {
        await deleteUserDocument(userId);
        return { success: true, message: 'Your account data has been deleted.' };
    } catch (error: any) {
        console.error("Error deleting user account action:", error);
        return { success: false, message: error.message || 'Failed to delete account. Please re-authenticate and try again.' };
    }
}


// --- Profile Page Action ---
const calculateLongestStreak = (matches: Match[], targetPlayerId: string): number => {
    let longestStreak = 0;
    let currentStreak = 0;
    // Matches are sorted by date in getHeadToHeadMatches
    for (const match of matches) {
        if (match.winner.includes(targetPlayerId)) {
            currentStreak++;
        } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 0;
        }
    }
    longestStreak = Math.max(longestStreak, currentStreak); // Check streak at the end
    return longestStreak;
};


export async function getProfilePageDataAction(profileUserId: string, currentUserId: string | null, sport: Sport) {
    const profileUserDoc = await getGameFromDb<User>(profileUserId, 'users');
    if (!profileUserDoc) return null;
    const profileUser = profileUserDoc;

    const recentMatches = await getConfirmedMatchesForUser(profileUserId, 5);
    
    if (currentUserId && currentUserId !== profileUserId) {
        const friendship = await getFriendshipStatus(currentUserId, profileUserId);
        
        const headToHeadMatches = await getHeadToHeadMatches(currentUserId, profileUserId, sport);
        
        const currentUserWins = headToHeadMatches.filter(m => m.winner.includes(currentUserId)).length;
        const profileUserWins = headToHeadMatches.filter(m => m.winner.includes(profileUserId)).length;

        const currentUserLongestStreak = calculateLongestStreak(headToHeadMatches, currentUserId);
        const profileUserLongestStreak = calculateLongestStreak(headToHeadMatches, profileUserId);
        
        const headToHead = { 
            currentUserWins, 
            profileUserWins,
            totalMatches: headToHeadMatches.length,
            currentUserLongestStreak,
            profileUserLongestStreak
        };
        
        const achievements = calculateRivalryAchievements(headToHeadMatches, currentUserId, profileUser.username);

        return {
            profileUser,
            recentMatches,
            friendship,
            headToHead,
            achievements,
        };
    }

    // Data for viewing own profile or when not logged in
    return {
        profileUser,
        recentMatches,
        friendship: null,
        headToHead: null,
        achievements: [],
    };
}


// --- Practice Log Actions ---

export async function logPracticeSessionAction(
  data: z.infer<typeof practiceSessionSchema>,
  userId: string
) {
  try {
    await logPracticeSession(data, userId);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getPracticeSessionsAction(userId: string, sport: Sport) {
    try {
        const sessions = await getPracticeSessionsForUser(userId, sport);
        return { success: true, data: sessions };
    } catch (error: any) {
        // Return the full error message, which may contain the index creation URL
        return { success: false, error: error.message };
    }
}

export async function deletePracticeSessionAction(sessionId: string, userId: string) {
    try {
        await deletePracticeSession(sessionId, userId);
        return { success: true, message: 'Practice session deleted.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to delete session.' };
    }
}


// --- Courts Actions ---
export async function findCourtsAction(
  latitude: number,
  longitude: number,
  radiusKm: number,
  sports: Sport[]
): Promise<Court[]> {
  try {
    const results = await findCourts(latitude, longitude, radiusKm, sports);
    return results;
  } catch (error) {
    console.error("Error in findCourtsAction:", error);
    return [];
  }
}

export async function createUserDocumentAction(user: {
  uid: string;
  email: string;
  username: string;
  emailVerified: boolean;
  avatarUrl?: string | null;
}) {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await createUserDocument(user);
  }
}

// Private helper flow
async function startNextRallyPointFlow(gameId: string) {
    const { playRallyPoint } = await import('@/server/ai/flows/rally-game-flow');
    await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, "rallyGames", gameId);
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw new Error("Game not found during next point start");

        const game = gameDoc.data() as RallyGame;
        const nextServerId = game.currentPoint.returningPlayer;
        const nextReturnerId = game.currentPoint.servingPlayer;

        const serverDoc = await getDoc(doc(db, 'users', nextServerId));
        const returnerDoc = await getDoc(doc(db, 'users', nextReturnerId));
        const nextServerRank = serverDoc.data()?.sports?.[game.sport]?.racktRank ?? 1200;
        const nextReturnerRank = returnerDoc.data()?.sports?.[game.sport]?.racktRank ?? 1200;

        const aiResponse = await playRallyPoint({
            sport: game.sport,
            servingPlayerRank: nextServerRank,
            returningPlayerRank: nextReturnerRank,
        });

        if (!aiResponse.serveOptions) throw new Error("AI failed to generate serve options for next point.");

        const newCurrentPoint: RallyGame['currentPoint'] = {
            servingPlayer: nextServerId,
            returningPlayer: nextReturnerId,
            serveOptions: aiResponse.serveOptions,
        };

        transaction.update(gameRef, {
            turn: 'serving',
            currentPlayerId: nextServerId,
            currentPoint: newCurrentPoint,
            updatedAt: Timestamp.now().toMillis()
        });
    });
}
