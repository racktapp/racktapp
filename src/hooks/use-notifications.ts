
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Challenge, FriendRequest, RallyGame, LegendGame } from '@/lib/types';

export interface NotificationCounts {
    friendRequestCount: number;
    challengeCount: number;
    gameTurnCount: number;
    total: number;
}

export function useNotifications() {
    const { user } = useAuth();
    const [counts, setCounts] = useState<NotificationCounts>({ friendRequestCount: 0, challengeCount: 0, gameTurnCount: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const fetchCounts = useCallback(async () => {
        if (!user) {
            setCounts({ friendRequestCount: 0, challengeCount: 0, gameTurnCount: 0, total: 0 });
            setIsLoading(false);
            return;
        }

        try {
            const frQuery = query(collection(db, 'friendRequests'), where('toId', '==', user.uid), where('status', '==', 'pending'));
            const frSnap = await getDocs(frQuery);
            const friendRequestCount = frSnap.size;

            const challengeQuery = query(collection(db, 'challenges'), where('toId', '==', user.uid), where('status', '==', 'pending'));
            const challengeSnap = await getDocs(challengeQuery);
            const challengeCount = challengeSnap.size;

            // Real-time listeners for games are less likely to cause permission issues
            // because the reads are less frequent and queries are simple.
            // We can keep these as onSnapshot.
            let rallyCount = 0;
            let legendCount = 0;
            const rallyQuery = query(collection(db, 'rallyGames'), where('participantIds', 'array-contains', user.uid), where('status', '==', 'ongoing'), where('currentPlayerId', '==', user.uid));
            const legendQuery = query(collection(db, 'legendGames'), where('participantIds', 'array-contains', user.uid), where('status', '==', 'ongoing'), where('currentPlayerId', '==', user.uid));
            
            const rallySnap = await getDocs(rallyQuery);
            rallyCount = rallySnap.size;

            const legendSnap = await getDocs(legendQuery);
            legendCount = legendSnap.size;

            const gameTurnCount = rallyCount + legendCount;
            const total = friendRequestCount + challengeCount + gameTurnCount;
            setCounts({ friendRequestCount, challengeCount, gameTurnCount, total });

        } catch (error) {
            console.error("Error fetching notification counts:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCounts(); // Initial fetch

        if (!user) return;
        
        // Setup listeners for real-time updates on games, which are less problematic
        const gameQuery = (collectionName: string) => query(
            collection(db, collectionName),
            where('participantIds', 'array-contains', user.uid),
            where('status', '==', 'ongoing'),
            where('currentPlayerId', '==', user.uid)
        );

        const rallyUnsub = onSnapshot(gameQuery('rallyGames'), () => fetchCounts());
        const legendUnsub = onSnapshot(gameQuery('legendGames'), () => fetchCounts());
        
        // Also refetch when friend requests or challenges change status
        const frUnsub = onSnapshot(query(collection(db, 'friendRequests'), where('toId', '==', user.uid)), () => fetchCounts());
        const chUnsub = onSnapshot(query(collection(db, 'challenges'), where('toId', '==', user.uid)), () => fetchCounts());


        return () => {
            rallyUnsub();
            legendUnsub();
            frUnsub();
            chUnsub();
        };
    }, [user, fetchCounts]);

    return { ...counts, isLoading };
}
