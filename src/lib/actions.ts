'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { 
    reportMatchAndupdateRanks, 
    searchUsers, 
    sendFriendRequest,
    getFriends,
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
    playRallyTurn,
    createLegendGame,
    submitLegendAnswer,
    getMatchesForUser,
    getHeadToHeadRecord,
    getLeaderboard,
} from '@/lib/firebase/firestore';
import { getMatchRecap } from '@/ai/flows/match-recap';
import { predictMatchOutcome } from '@/ai/flows/predict-match';
import { analyzeSwing } from '@/ai/flows/swing-analysis-flow';
import type { SwingAnalysisInput } from '@/ai/flows/swing-analysis-flow';
import { type Sport, type User, MatchType, reportMatchSchema, challengeSchema, openChallengeSchema, createTournamentSchema, Challenge, OpenChallenge, Tournament, Chat, Message, RallyGame, Match, PredictMatchOutput } from '@/lib/types';
import { setHours, setMinutes } from 'date-fns';
import { redirect } from 'next/navigation';


// Action to report a match
export async function handleReportMatchAction(
    values: z.infer<typeof reportMatchSchema>, 
    sport: Sport, 
    user: User
) {
    const allPlayers = [
        user,
        ...(values.partner ? [await getDoc(doc(db, 'users', values.partner)).then(d => d.data() as User)] : []),
        await getDoc(doc(db, 'users', values.opponent1)).then(d => d.data() as User),
        ...(values.opponent2 ? [await getDoc(doc(db, 'users', values.opponent2)).then(d => d.data() as User)] : []),
    ];

    const team1Ids = [user.uid, ...(values.partner ? [values.partner] : [])];
    const team2Ids = [values.opponent1, ...(values.opponent2 ? [values.opponent2] : [])];
    
    await reportMatchAndupdateRanks({
        sport,
        matchType: values.matchType as MatchType,
        team1Ids,
        team2Ids,
        sets: values.sets,
        allPlayers,
        reportedById: user.uid,
        date: new Date().getTime(),
    });
    
    revalidatePath('/dashboard');
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
        return { success: true, message: "Friend request sent." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to send friend request." };
    }
}

// --- Friend Management Actions ---

export async function getFriendsAction(userId: string): Promise<User[]> {
    if (!userId) return [];
    return getFriends(userId);
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
        return { success: true, message: "Friend request accepted." };
    } catch (error: any) {
        console.error("Accept friend request action failed:", error);
        return { success: false, message: "Failed to accept friend request." };
    }
}

export async function declineOrCancelFriendRequestAction(requestId: string) {
    try {
        await deleteFriendRequest(requestId);
        revalidatePath('/friends');
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
        return { success: true, message: "Friend removed." };
    } catch (error: any) {
        console.error("Remove friend action failed:", error);
        return { success: false, message: "Failed to remove friend." };
    }
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

export async function getChallengesAction(userId: string, sport: Sport): Promise<{
    incoming: Challenge[],
    sent: Challenge[],
    open: OpenChallenge[]
}> {
    try {
        const [incoming, sent, open] = await Promise.all([
            getIncomingChallenges(userId),
            getSentChallenges(userId),
            getOpenChallenges(userId, sport)
        ]);
        return { incoming, sent, open };
    } catch (error) {
        console.error("Error fetching challenges data:", error);
        return { incoming: [], sent: [], open: [] };
    }
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

export async function getOrCreateChatAction(friendId: string) {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, message: "Not authenticated." };
    }
    try {
      const chatId = await getOrCreateChat(user.uid, friendId);
      revalidatePath('/chat');
      return { success: true, message: 'Chat ready.', chatId };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to get or create chat.' };
    }
}

export async function getChatsAction(): Promise<Chat[]> {
    const user = auth.currentUser;
    if (!user) return [];
    return getChatsForUser(user.uid);
}

export async function sendMessageAction(chatId: string, text: string) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, message: "Not authenticated." };
    }
    try {
        await sendMessage(chatId, user.uid, text);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to send message.' };
    }
}

export async function markChatAsReadAction(chatId: string) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, message: "Not authenticated." };
    }
    try {
        await markChatAsRead(chatId, user.uid);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: 'Failed to mark chat as read.' };
    }
}

// --- Game Actions ---

export async function createRallyGameAction(friendId: string) {
    const user = auth.currentUser;
    if (!user) return { success: false, message: 'You must be logged in to start a game.' };

    try {
        const gameId = await createRallyGame(user.uid, friendId);
        revalidatePath('/games');
        return { success: true, message: 'Rally Game started!', redirect: `/games/rally/${gameId}` };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to start Rally Game.' };
    }
}

export async function playRallyTurnAction(gameId: string, choice: any) {
    const user = auth.currentUser;
    if (!user) return { success: false, message: 'You must be logged in.' };

    try {
        await playRallyTurn(gameId, user.uid, choice);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to play turn.' };
    }
}

export async function createLegendGameAction(friendId: string | null, sport: Sport) {
    const user = auth.currentUser;
    if (!user) return { success: false, message: 'You must be logged in to start a game.' };
    
    try {
        const gameId = await createLegendGame(user.uid, friendId, sport);
        revalidatePath('/games');
        return { success: true, message: 'Game started!', redirect: `/games/legend/${gameId}` };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to start game.' };
    }
}

export async function submitLegendAnswerAction(gameId: string, answer: string) {
     const user = auth.currentUser;
    if (!user) return { success: false, message: 'You must be logged in.' };

    try {
        await submitLegendAnswer(gameId, user.uid, answer);
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to submit answer.' };
    }
}

// --- Match History Actions ---
export async function getMatchHistoryAction(): Promise<Match[]> {
    const user = auth.currentUser;
    if (!user) return [];
    return getMatchesForUser(user.uid);
}

// --- AI Coach Actions ---
export async function analyzeSwingAction(input: SwingAnalysisInput) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    
    try {
        const result = await analyzeSwing(input);
        return result;
    } catch (error: any) {
        console.error("Swing analysis action failed:", error);
        throw new Error(error.message || "Failed to analyze swing.");
    }
}

// --- AI Prediction Actions ---

export async function predictFriendMatchAction(friendId: string, sport: Sport): Promise<PredictMatchOutput> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    
    const [currentUserDoc, friendDoc] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDoc(doc(db, 'users', friendId))
    ]);

    if (!currentUserDoc.exists() || !friendDoc.exists()) {
        throw new Error("User data not found.");
    }
    
    const currentUserData = currentUserDoc.data() as User;
    const friendData = friendDoc.data() as User;

    const currentUserStats = currentUserData.sports?.[sport] ?? { racktRank: 1200, wins: 0, losses: 0, streak: 0 };
    const friendStats = friendData.sports?.[sport] ?? { racktRank: 1200, wins: 0, losses: 0, streak: 0 };

    const headToHead = await getHeadToHeadRecord(user.uid, friendId, sport);

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
    try {
        const users = await getLeaderboard(sport);
        return users;
    } catch (error) {
        console.error("Leaderboard action failed:", error);
        return [];
    }
}
