'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { reportMatchAndupdateRanks, searchUsers, sendFriendRequest } from '@/lib/firebase/firestore';
import { getMatchRecap } from '@/ai/flows/match-recap';
import { type Sport, type User, MatchType, reportMatchSchema } from '@/lib/types';

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
export async function addFriendAction(fromUser: User, toId: string) {
    try {
        await sendFriendRequest(fromUser, toId);
        revalidatePath('/friends');
        return { success: true, message: "Friend request sent." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to send friend request." };
    }
}
