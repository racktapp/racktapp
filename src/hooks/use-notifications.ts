
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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

        const queries = {
            friendRequests: query(collection(db, 'friendRequests'), where('toId', '==', user.uid), where('status', '==', 'pending')),
            challenges: query(collection(db, 'challenges'), where('toId', '==', user.uid), where('status', '==', 'pending')),
            rallyGames: query(collection(db, 'rallyGames'), where('currentPlayerId', '==', user.uid), where('status', '==', 'ongoing')),
            legendGames: query(collection(db, 'legendGames'), where('currentPlayerId', '==', user.uid), where('status', '==', 'ongoing')),
        };

        const unsubs: (() => void)[] = [];
        let currentCounts = { friendRequestCount: 0, challengeCount: 0, gameTurnCount: 0 };
        
        let loaded = 0;
        const totalQueries = 4;
        
        const updateState = () => {
            const total = currentCounts.friendRequestCount + currentCounts.challengeCount + currentCounts.gameTurnCount;
            setCounts({ ...currentCounts, total });
            if (loaded === totalQueries) {
                setIsLoading(false);
            }
        };

        unsubs.push(onSnapshot(queries.friendRequests, (snap) => {
            currentCounts.friendRequestCount = snap.size;
            if(loaded < totalQueries) loaded++;
            updateState();
        }));

        unsubs.push(onSnapshot(queries.challenges, (snap) => {
            currentCounts.challengeCount = snap.size;
            if(loaded < totalQueries) loaded++;
            updateState();
        }));
        
        let rallyCount = 0;
        let legendCount = 0;

        const updateGameCount = () => {
            currentCounts.gameTurnCount = rallyCount + legendCount;
            updateState();
        }

        unsubs.push(onSnapshot(queries.rallyGames, (snap) => {
            rallyCount = snap.size;
            if(loaded < totalQueries) loaded++;
            updateGameCount();
        }));

        unsubs.push(onSnapshot(queries.legendGames, (snap) => {
            legendCount = snap.size;
            if(loaded < totalQueries) loaded++;
            updateGameCount();
        }));

        return () => {
            unsubs.forEach(unsub => unsub());
        };

    }, [user]);

    return { ...counts, isLoading };
}
