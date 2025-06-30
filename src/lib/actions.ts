'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/firebase/config';
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
} from '@/lib/firebase/firestore';
import { getMatchRecap } from '@/ai/flows/match-recap';
import { type Sport, type User, MatchType, reportMatchSchema, challengeSchema, openChallengeSchema, createTournamentSchema, Challenge, OpenChallenge, Tournament, Chat, Message, RallyGame } from '@/lib/types';
import { setHours, setMinutes } from 'date-fns';
import { redirect } from 'next/navigation';


// Action to report a match
export async function handleReportMatchAction(
    values: z.infer<typeof reportMatchSchema>, 
    sport: Sport, 
    user: { uid: string, name: string }
) {
    const team1 = [{ id: user.uid, score: values.myScore }];
    if (values.matchType === 'Doubles' && values.partner) {
        team1.push({ id: values.partner, score: values.myScore });
    }

    const team2 = [{ id: values.opponent1, score: values.opponentScore }];
    if (values.matchType === 'Doubles' && values.opponent2) {
        team2.push({ id: values.opponent2, score: values.opponentScore });
    }
    
    await reportMatchAndupdateRanks({
        sport,
        matchType: values.matchType as MatchType,
        team1,
        team2,
        score: `${values.myScore}-${values.opponentScore}`,
    });
    
    revalidatePath('/dashboard');
    revalidatePath('/match-history');
}


// Action to get match recap
export async function handleRecapAction() {
    // In a real implementation, you would pass actual match data.
    const recap = await getMatchRecap({
        player1Name: "Alex",
        player2Name: "Ben",
        score: "6-4, 7-5",
        sport: "Tennis"
    });
    console.log(recap);
    // You would then display this recap in a dialog or toast.
    // For this example, we just log it.
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

export async function getIncomingRequestsAction(userId: string): Promise<FriendRequest[]> {
    if (!userId) return [];
    return getIncomingFriendRequests(userId);
}

export async function getSentRequestsAction(userId: string): Promise<FriendRequest[]> {
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
