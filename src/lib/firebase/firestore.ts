import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { User, Sport, Match, SportStats, MatchType } from '@/lib/types';
import { calculateNewElo } from '../elo';

// Fetches a user's friends from Firestore
export async function getFriends(userId: string): Promise<User[]> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error("Get friends failed: User not found with ID:", userId);
      return [];
    }

    const userData = userDoc.data() as User;
    const friendIds = userData.friendIds;

    if (!friendIds || friendIds.length === 0) {
      return []; // User has no friends
    }

    const friendsData: User[] = [];
    const chunkSize = 30; // Firestore 'in' query is limited to 30 elements
    for (let i = 0; i < friendIds.length; i += chunkSize) {
      const chunk = friendIds.slice(i, i + chunkSize);
      if (chunk.length > 0) {
        const friendsQuery = query(collection(db, 'users'), where('uid', 'in', chunk));
        const querySnapshot = await getDocs(friendsQuery);
        querySnapshot.forEach((doc) => {
          friendsData.push(doc.data() as User);
        });
      }
    }
    
    return friendsData;
  } catch (error) {
    console.error("Error fetching friends:", error);
    return [];
  }
}

/**
 * Fetches all users from the system, excluding the current user.
 * @param currentUserId The UID of the user to exclude from the list.
 * @returns A promise that resolves to an array of User objects.
 */
export async function getAllUsers(currentUserId: string): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '!=', currentUserId));
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

/**
 * Searches for users by their username.
 * @param usernameQuery The partial username to search for.
 * @param currentUserId The UID of the current user to exclude from results.
 * @returns A promise that resolves to an array of matching User objects.
 */
export async function searchUsers(usernameQuery: string, currentUserId: string): Promise<User[]> {
    try {
        const lowerCaseQuery = usernameQuery.toLowerCase().trim();
        if (!lowerCaseQuery) return [];

        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('username', '>=', lowerCaseQuery),
            where('username', '<=', lowerCaseQuery + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            const user = doc.data() as User;
            if (user.uid !== currentUserId) {
                users.push(user);
            }
        });
        return users;
    } catch (error) {
        console.error("Error searching users:", error);
        throw new Error("Failed to search for users in the database.");
    }
}

// Function to create a user document on signup or first login
export const createUserDocument = async (user: {
  uid: string;
  email: string;
  displayName: string;
}) => {
  const userRef = doc(db, 'users', user.uid);
  const newUser: User = {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    username: user.displayName.toLowerCase().replace(/\s/g, ''),
    avatar: `https://placehold.co/100x100.png?text=${user.displayName.charAt(0)}`,
    friendIds: [],
    preferredSports: ['Tennis'],
    sports: {
      Tennis: { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [] },
      Padel: { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [] },
      Badminton: { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [] },
      'Table Tennis': { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [] },
    },
  };
  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
        transaction.set(userRef, newUser);
    }
  });
  return newUser;
};


interface PlayerData {
    id: string;
    score: number;
}
interface ReportMatchData {
    sport: Sport;
    matchType: MatchType;
    team1: PlayerData[];
    team2: PlayerData[];
    score: string;
}

// The core logic for reporting a match and updating ranks
export const reportMatchAndupdateRanks = async (data: ReportMatchData): Promise<string> => {
    return await runTransaction(db, async (transaction) => {
        const allPlayerIds = [...data.team1.map(p => p.id), ...data.team2.map(p => p.id)];
        const playerRefs = allPlayerIds.map(id => doc(db, "users", id));
        const playerDocs = await Promise.all(playerRefs.map(ref => transaction.get(ref)));

        const players = playerDocs.map(doc => {
            if (!doc.exists()) throw new Error(`User document for ID ${doc.id} not found.`);
            return doc.data() as User;
        });

        const getTeamAvgElo = (team: PlayerData[]): number => {
            const totalElo = team.reduce((sum, p) => {
                const player = players.find(pl => pl.uid === p.id);
                const sportStats = player?.sports?.[data.sport] ?? { racktRank: 1200 };
                return sum + sportStats.racktRank;
            }, 0);
            return totalElo / team.length;
        };

        const team1AvgElo = getTeamAvgElo(data.team1);
        const team2AvgElo = getTeamAvgElo(data.team2);

        const team1GameScore = data.team1[0].score > data.team2[0].score ? 1 : 0;
        const { newRatingA: newTeam1Elo, newRatingB: newTeam2Elo } = calculateNewElo(team1AvgElo, team2AvgElo, team1GameScore as (0|1));
        
        const team1EloChange = newTeam1Elo - team1AvgElo;
        const team2EloChange = newTeam2Elo - team2AvgElo;

        const rankChanges: Match['rankChange'] = [];
        const matchRef = doc(collection(db, 'matches'));
        
        for (const player of players) {
            const team = data.team1.some(p => p.id === player.uid) ? 'team1' : 'team2';
            const eloChange = team === 'team1' ? team1EloChange : team2EloChange;
            const isWinner = (team === 'team1' && team1GameScore === 1) || (team === 'team2' && team1GameScore === 0);

            const currentSportStats = player.sports?.[data.sport] ?? { racktRank: 1200, wins: 0, losses: 0, streak: 0, matchHistory: [] };
            
            const oldRank = currentSportStats.racktRank;
            const newRank = oldRank + eloChange;

            const newWins = currentSportStats.wins + (isWinner ? 1 : 0);
            const newLosses = currentSportStats.losses + (isWinner ? 0 : 1);
            const newStreak = isWinner ? (currentSportStats.streak >= 0 ? currentSportStats.streak + 1 : 1) : (currentSportStats.streak <= 0 ? currentSportStats.streak - 1 : -1);

            const updatedSportStats: SportStats = {
                ...currentSportStats,
                racktRank: newRank,
                wins: newWins,
                losses: newLosses,
                streak: newStreak,
                matchHistory: [matchRef.id, ...(currentSportStats.matchHistory || [])],
            };

            const playerRef = doc(db, 'users', player.uid);
            transaction.update(playerRef, {
                [`sports.${data.sport}`]: updatedSportStats
            });

            rankChanges.push({ userId: player.uid, before: oldRank, after: newRank });
        }

        const newMatch: Match = {
            id: matchRef.id,
            type: data.matchType,
            sport: data.sport,
            participants: allPlayerIds,
            teams: {
                team1: { players: players.filter(p => data.team1.some(d => d.id === p.uid)), score: data.team1[0].score },
                team2: { players: players.filter(p => data.team2.some(d => d.id === p.uid)), score: data.team2[0].score },
            },
            winner: team1GameScore === 1 ? data.team1.map(p => p.id) : data.team2.map(p => p.id),
            score: data.score,
            date: Timestamp.now().toMillis(),
            createdAt: Timestamp.now().toMillis(),
            rankChange: rankChanges,
        };
        transaction.set(matchRef, newMatch);

        return matchRef.id;
    });
};
