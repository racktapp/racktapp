
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, Timestamp, runTransaction, updateDoc, collection, query, where, orderBy, writeBatch, limit, addDoc } from 'firebase/firestore';
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
    getHeadToHeadRecord,
    getLeaderboard,
    updateUserProfile,
    getFriendshipStatus,
    deleteGame,
    getGame,
    deleteOpenChallenge
} from '@/lib/firebase/firestore';
import { getMatchRecap } from '@/ai/flows/match-recap';
import { predictMatchOutcome } from '@/ai/flows/predict-match';
import { analyzeSwing } from '@/ai/flows/swing-analysis-flow';
import type { SwingAnalysisInput, RallyGameInput, RallyGameOutput } from '@/ai/flows/swing-analysis-flow';
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
        await createOpenChallenge({
            posterId: poster.uid,
            posterName: poster.name,
            posterAvatar: poster.avatar,
            sport: values.sport,
            location: values.location,
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
        getOpenChallenges(sport)
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

export async function deleteOpenChallengeAction(challengeId: string, userId: string) {
    try {
        await deleteOpenChallenge(challengeId, userId);
        revalidatePath('/challenges');
        return { success: true, message: "Open challenge deleted." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to delete challenge." };
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
    try {
      const chatId = await getOrCreateChat(currentUserId, friendId);
      revalidatePath('/chat');
      return { success: true, message: 'Chat ready.', redirect: `/chat/${chatId}` };
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


// --- Game Actions ---

export async function createLegendGameAction(friendId: string | null, sport: Sport, currentUserId: string) {
    try {
        // AI is called FIRST to ensure a valid round exists before creating the game.
        const initialRoundData = await getLegendGameRound({ sport, usedPlayers: [] });

        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (!userDoc.exists()) throw new Error("Current user not found.");
        const user = userDoc.data() as User;
        
        const gameId = await runTransaction(db, async (transaction) => {
            const gameRef = doc(collection(db, 'legendGames')); // Always create a new game
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
                    currentPlayerId: currentUserId,
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
            transaction.set(gameRef, newGame);
            return gameRef.id;
        });

        revalidatePath('/games');
        return { success: true, message: 'Game started!', redirect: `/games/legend/${gameId}` };
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
        revalidatePath(`/games/legend/${gameId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to submit answer.' };
    }
}

export async function startNextLegendRoundAction(gameId: string) {
    // This is a best practice: fetch external data *before* the transaction
    const game = await getGame<LegendGame>(gameId, 'legendGames');
    if (!game) throw new Error("Game not found.");
    if (game.status !== 'ongoing') throw new Error('Game is not ongoing.');
    
    // Server-side validation for turn state.
    if (game.turnState !== 'round_over') {
        throw new Error("Current round is not over.");
    }

    const nextRoundData = await getLegendGameRound({ sport: game.sport, usedPlayers: game.usedPlayers || [] });

    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'legendGames', gameId);
            // Re-fetch inside transaction for safety
            const liveGameDoc = await transaction.get(gameRef);
            if (!liveGameDoc.exists()) throw new Error("Game not found during transaction.");
            const liveGame = liveGameDoc.data() as LegendGame;

            // Double-check state inside the transaction to prevent race conditions
            if (liveGame.status !== 'ongoing' || liveGame.turnState !== 'round_over') return;
            
            if (liveGame.currentRound) {
                liveGame.roundHistory.push(liveGame.currentRound);
            }
            liveGame.usedPlayers.push(nextRoundData.correctAnswer);
            liveGame.currentRound = { ...nextRoundData, guesses: {} };
            liveGame.turnState = 'playing';

            if (liveGame.mode === 'solo') {
                liveGame.currentPlayerId = liveGame.participantIds[0];
            } else { // friend mode
                // The current player was the one who answered last, so alternate.
                const otherPlayerId = liveGame.participantIds.find(id => id !== liveGame.currentPlayerId);
                liveGame.currentPlayerId = otherPlayerId!;
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

export async function createRallyGameAction(friendId: string, currentUserId: string, sport: Sport) {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        const friendDoc = await getDoc(doc(db, 'users', friendId));

        if (!userDoc.exists() || !friendDoc.exists()) {
            throw new Error("User data not found.");
        }
        
        const user = userDoc.data() as User;
        const friend = friendDoc.data() as User;

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
                participantsData: { [user.uid]: { name: user.name, avatar: user.avatar, uid: user.uid }, [friend.uid]: { name: friend.name, avatar: friend.avatar, uid: friend.uid } },
                score: { [user.uid]: 0, [friend.uid]: 0 },
                turn: 'serving', currentPlayerId: user.uid,
                currentPoint: { servingPlayer: user.uid, returningPlayer: friend.uid, serveOptions: initialAiResponse.serveOptions },
                pointHistory: [], status: 'ongoing',
                createdAt: now, updatedAt: now,
            };
            transaction.set(gameRef, newGame);
            return gameRef.id;
        });
        
        revalidatePath('/games');
        return { success: true, message: 'Rally Game started!', redirect: `/games/rally/${gameId}` };
    } catch (error: any) {
        console.error("Error creating rally game:", error);
        throw new Error(error.message || 'Failed to start Rally Game.');
    }
}

export async function playRallyTurnAction(gameId: string, choice: any, currentUserId: string) {
    try {
      const game = await getGame<RallyGame>(gameId, 'rallyGames');
      if (!game) throw new Error('Game not found.');
  
      if (game.status === 'complete') throw new Error('Game is already complete.');
      if (game.currentPlayerId !== currentUserId) {
        throw new Error("It's not your turn.");
      }
  
      let aiInput: RallyGameInput;
      let updatePayload: Partial<RallyGame> = {};
  
      const serverId = game.turn === 'serving' ? currentUserId : game.currentPoint.servingPlayer;
      const returnerId = game.turn === 'serving' ? game.currentPoint.returningPlayer : currentUserId;
  
      const serverDoc = await getDoc(doc(db, 'users', serverId));
      const returnerDoc = await getDoc(doc(db, 'users', returnerId));
      const serverRank = serverDoc.data()?.sports?.[game.sport]?.racktRank ?? 1200;
      const returnerRank = returnerDoc.data()?.sports?.[game.sport]?.racktRank ?? 1200;
  
      if (game.turn === 'serving') {
        aiInput = { sport: game.sport, serveChoice: choice, servingPlayerRank: serverRank, returningPlayerRank: returnerRank };
        const aiResponse = await playRallyPoint(aiInput);
        if (!aiResponse.returnOptions) throw new Error("AI failed to generate return options.");
  
        const updatedCurrentPoint: RallyGame['currentPoint'] = {
          ...game.currentPoint,
          serveChoice: choice,
          returnOptions: aiResponse.returnOptions,
        };
        updatePayload = {
          turn: 'returning',
          currentPlayerId: game.currentPoint.returningPlayer,
          currentPoint: updatedCurrentPoint,
        };
      } else { // returning
        aiInput = { sport: game.sport, serveChoice: game.currentPoint.serveChoice!, returnChoice: choice, servingPlayerRank: serverRank, returningPlayerRank: returnerRank };
        const pointEvalResponse = await playRallyPoint(aiInput);
        
        if (!pointEvalResponse.pointWinner || !pointEvalResponse.narrative) throw new Error("AI failed to evaluate the point.");
  
        const winnerId = pointEvalResponse.pointWinner === 'server' ? game.currentPoint.servingPlayer : game.currentPoint.returningPlayer;
        const newScore = { ...game.score, [winnerId]: (game.score[winnerId] || 0) + 1 };
  
        const completedPoint: RallyGamePoint = { ...game.currentPoint, returnChoice: choice, winner: winnerId, narrative: pointEvalResponse.narrative! };
        const newPointHistory = [...game.pointHistory, completedPoint];
  
        if (newScore[winnerId] >= 5) {
          updatePayload = {
            score: newScore,
            pointHistory: newPointHistory,
            status: 'complete',
            winnerId: winnerId,
            turn: 'game_over',
          };
        } else {
          // Game is not over, so set up the next point immediately.
          const nextServerId = game.currentPoint.returningPlayer;
          const nextReturnerId = game.currentPoint.servingPlayer;
          
          const nextServerDoc = await getDoc(doc(db, 'users', nextServerId));
          const nextReturnerDoc = await getDoc(doc(db, 'users', nextReturnerId));
          const nextServerRank = nextServerDoc.data()?.sports?.[game.sport]?.racktRank ?? 1200;
          const nextReturnerRank = nextReturnerDoc.data()?.sports?.[game.sport]?.racktRank ?? 1200;
          
          const nextPointServeOptions = await playRallyPoint({ sport: game.sport, servingPlayerRank: nextServerRank, returningPlayerRank: nextReturnerRank });
          if (!nextPointServeOptions.serveOptions) throw new Error("AI failed to generate serve options for the next point.");
          
          const newCurrentPoint: RallyGame['currentPoint'] = {
            servingPlayer: nextServerId,
            returningPlayer: nextReturnerId,
            serveOptions: nextPointServeOptions.serveOptions,
          };

          updatePayload = {
            score: newScore,
            pointHistory: newPointHistory,
            turn: 'serving',
            currentPlayerId: nextServerId,
            currentPoint: newCurrentPoint,
          };
        }
      }
  
      await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'rallyGames', gameId);
        transaction.update(gameRef, { ...updatePayload, updatedAt: Timestamp.now().toMillis() });
      });
  
      revalidatePath(`/games/rally/${gameId}`);
    } catch (error: any) {
      console.error('Error playing rally turn:', error);
      throw new Error(error.message || 'Failed to play turn.');
    }
}


export async function deleteGameAction(gameId: string, gameType: 'Rally' | 'Legend', currentUserId: string) {
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
            player1Wins: headToHead.currentUserWins,
            player2Wins: headToHead.profileUserWins,
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
    try {
        await updateUserProfile(userId, values);
        revalidatePath('/settings');
        revalidatePath(`/profile/${userId}`);
        return { success: true, message: "Profile updated successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to update profile.' };
    }
}


// --- Profile Page Action ---
export async function getProfilePageDataAction(profileUserId: string, currentUserId: string | null, sport: Sport) {
    const profileUserDoc = await getDoc(doc(db, 'users', profileUserId));
    if (!profileUserDoc.exists()) return null;
    const profileUser = profileUserDoc.data() as User;

    const recentMatches = await getConfirmedMatchesForUser(profileUserId, 5);
    
    if (currentUserId && currentUserId !== profileUserId) {
        const friendship = await getFriendshipStatus(currentUserId, profileUserId);
        const headToHead = await getHeadToHeadRecord(currentUserId, profileUserId, sport);

        return {
            profileUser,
            recentMatches,
            friendship,
            headToHead,
        };
    }

    // Data for viewing own profile or when not logged in
    return {
        profileUser,
        recentMatches,
        friendship: null,
        headToHead: null,
    };
}
