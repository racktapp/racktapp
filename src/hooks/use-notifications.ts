
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
            return () => {};
        }

        setIsLoading(true);

        const frQuery = query(collection(db, 'friendRequests'), where('toId', '==', user.uid), where('status', '==', 'pending'));
        const chQuery = query(collection(db, 'challenges'), where('toId', '==', user.uid), where('status', '==', 'pending'));
        const rgQuery = query(collection(db, 'rallyGames'), where('participantIds', 'array-contains', user.uid), where('status', '==', 'ongoing'), where('currentPlayerId', '==', user.uid));
        const lgQuery = query(collection(db, 'legendGames'), where('participantIds', 'array-contains', user.uid), where('status', '==', 'ongoing'), where('currentPlayerId', '==', user.uid));

        const unsubs: (() => void)[] = [];
        let frCount = 0, chCount = 0, rgCount = 0, lgCount = 0;

        const updateTotal = () => {
            const gameTurnCount = rgCount + lgCount;
            const total = frCount + chCount + gameTurnCount;
            setCounts({ friendRequestCount: frCount, challengeCount: chCount, gameTurnCount, total });
        };

        try {
            unsubs.push(onSnapshot(frQuery, snap => {
                frCount = snap.size;
                updateTotal();
                setIsLoading(false);
            }));
            unsubs.push(onSnapshot(chQuery, snap => {
                chCount = snap.size;
                updateTotal();
                setIsLoading(false);
            }));
            unsubs.push(onSnapshot(rgQuery, snap => {
                rgCount = snap.size;
                updateTotal();
                setIsLoading(false);
            }));
            unsubs.push(onSnapshot(lgQuery, snap => {
                lgCount = snap.size;
                updateTotal();
                setIsLoading(false);
            }));
        } catch(error) {
            console.error("Error setting up notification listeners:", error);
            setIsLoading(false);
        }

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, [user]);

    return { ...counts, isLoading };
}
