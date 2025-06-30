'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { reportMatchAndupdateRanks, searchUsers } from '@/lib/firebase/firestore';
import { getMatchRecap } from '@/ai/flows/match-recap';
import { type Sport, type User, MatchType } from '@/lib/types';

// Schema for report match form
export const reportMatchSchema = z.object({
  matchType: z.enum(['Singles', 'Doubles']),
  opponent1: z.string().min(1, 'Please select an opponent.'),
  partner: z.string().optional(),
  opponent2: z.string().optional(),
  myScore: z.coerce.number().min(0).int(),
  opponentScore: z.coerce.number().min(0).int(),
}).refine(data => {
    if (data.matchType === 'Doubles') {
        return !!data.partner && !!data.opponent2;
    }
    return true;
}, { message: "Partner and second opponent are required for Doubles.", path: ["partner"] })
.refine(data => data.myScore !== data.opponentScore, {
    message: "Scores cannot be the same.",
    path: ["myScore"],
});

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

// Placeholder action for adding a friend
export async function addFriendAction(friendId: string) {
    // This is a placeholder. In a full implementation, this would
    // create a document in a `friend_requests` collection in Firestore.
    console.log(`Friend request logic for user ID: ${friendId} would be implemented here.`);
    
    // For now, we'll just simulate a successful operation.
    // In a real scenario, you'd want to revalidate paths if you were showing
    // friend requests on this page or another.
    // revalidatePath('/friends');

    return { success: true, message: "Friend request sent." };
}
