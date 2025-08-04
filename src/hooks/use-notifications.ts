
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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

    useEffect(() => {
        if (!user) {
            setCounts({ friendRequestCount: 0, challengeCount: 0, gameTurnCount: 0, total: 0 });
            setIsLoading(false);
            return;
        }

        const unsubs: (() => void)[] = [];
        const currentCounts = { friendRequestCount: 0, challengeCount: 0, gameTurnCount: 0 };
        
        const updateTotal = () => {
            const total = currentCounts.friendRequestCount + currentCounts.challengeCount + currentCounts.gameTurnCount;
            setCounts({ ...currentCounts, total });
        };

        // --- Friend Requests Listener ---
        const frQuery = query(collection(db, 'friendRequests'), where('toId', '==', user.uid));
        unsubs.push(onSnapshot(frQuery, (snap) => {
            currentCounts.friendRequestCount = snap.docs.filter(doc => (doc.data() as FriendRequest).status === 'pending').length;
            updateTotal();
        }));

        // --- Challenges Listener ---
        const challengeQuery = query(collection(db, 'challenges'), where('toId', '==', user.uid));
        unsubs.push(onSnapshot(challengeQuery, (snap) => {
            currentCounts.challengeCount = snap.docs.filter(doc => (doc.data() as Challenge).status === 'pending').length;
            updateTotal();
        }));
        
        // --- Game Listeners ---
        let rallyCount = 0;
        let legendCount = 0;
        const updateGameCount = () => {
            currentCounts.gameTurnCount = rallyCount + legendCount;
            updateTotal();
        }

        const rallyQuery = query(collection(db, 'rallyGames'), where('participantIds', 'array-contains', user.uid));
        unsubs.push(onSnapshot(rallyQuery, (snap) => {
            rallyCount = snap.docs.filter(doc => {
                const game = doc.data() as RallyGame;
                return game.status === 'ongoing' && game.currentPlayerId === user.uid;
            }).length;
            updateGameCount();
        }));

        const legendQuery = query(collection(db, 'legendGames'), where('participantIds', 'array-contains', user.uid));
        unsubs.push(onSnapshot(legendQuery, (snap) => {
            legendCount = snap.docs.filter(doc => {
                const game = doc.data() as LegendGame;
                return game.status === 'ongoing' && game.currentPlayerId === user.uid;
            }).length;
            updateGameCount();
        }));
        
        // This is a one-time check for loading state.
        // The listeners will continue to run, but this sets loading to false after initial setup.
        // It's a simplification to avoid complex multi-listener loading state management.
        const timer = setTimeout(() => setIsLoading(false), 2000);
        unsubs.push(() => clearTimeout(timer));

        return () => {
            unsubs.forEach(unsub => unsub());
        };

    }, [user]);

    return { ...counts, isLoading };
}
