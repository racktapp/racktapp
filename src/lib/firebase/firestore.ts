import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  Timestamp,
  where,
  setDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  updateDoc,
  orderBy,
  limit,
  addDoc,
} from 'firebase/firestore';
import { db } from './config';
import { User, Sport, Match, SportStats, MatchType, FriendRequest, Challenge, OpenChallenge, ChallengeStatus, Tournament, createTournamentSchema, Chat, Message } from '@/lib/types';
import { calculateNewElo } from '../elo';
import { generateBracket } from '../tournament-utils';
import { z } from 'zod';

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
    const q = query(usersRef); // Fetch all users
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
        const user = doc.data() as User;
        if (user.uid !== currentUserId) { // Filter client-side
            users.push(user);
        }
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

/**
 * Creates a friend request document in Firestore.
 * @param fromUser - The user object of the sender.
 * @param toUser - The user object of the receiver.
 */
export async function sendFriendRequest(fromUser: User, toUser: User) {
  const friendRequestsRef = collection(db, 'friendRequests');

  if (toUser.friendIds?.includes(fromUser.uid)) {
    throw new Error("You are already friends with this user.");
  }
  
  const q1 = query(friendRequestsRef, where('fromId', '==', fromUser.uid), where('toId', '==', toUser.uid));
  const q2 = query(friendRequestsRef, where('fromId', '==', toUser.uid), where('toId', '==', fromUser.uid));
  
  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const existingRequest = [...snapshot1.docs, ...snapshot2.docs].find(doc => doc.data().status === 'pending');

  if (existingRequest) {
    throw new Error('A friend request is already pending.');
  }

  const newRequestRef = doc(collection(db, 'friendRequests'));
  
  const newRequest: FriendRequest = {
    id: newRequestRef.id,
    fromId: fromUser.uid,
    fromName: fromUser.name,
    fromAvatar: fromUser.avatar,
    toId: toUser.uid,
    toName: toUser.name,
    toAvatar: toUser.avatar,
    status: 'pending',
    createdAt: Timestamp.now().toMillis(),
  };

  await setDoc(newRequestRef, newRequest);
}

// --- Friend Management Functions ---

export async function getIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const requestsRef = collection(db, 'friendRequests');
  const q = query(requestsRef, where('toId', '==', userId), where('status', '==', 'pending'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as FriendRequest);
}

export async function getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(requestsRef, where('fromId', '==', userId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as FriendRequest);
}

export async function acceptFriendRequest(requestId: string, fromId: string, toId: string) {
  return runTransaction(db, async (transaction) => {
    const fromUserRef = doc(db, 'users', fromId);
    const toUserRef = doc(db, 'users', toId);
    const requestRef = doc(db, 'friendRequests', requestId);

    transaction.update(fromUserRef, { friendIds: arrayUnion(toId) });
    transaction.update(toUserRef, { friendIds: arrayUnion(fromId) });
    
    transaction.delete(requestRef);
  });
}

export async function deleteFriendRequest(requestId: string) {
  const requestRef = doc(db, 'friendRequests', requestId);
  await deleteDoc(requestRef);
}

export async function removeFriend(userId: string, friendId: string) {
  return runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', userId);
    const friendRef = doc(db, 'users', friendId);

    transaction.update(userRef, { friendIds: arrayRemove(friendId) });
    transaction.update(friendRef, { friendIds: arrayRemove(userId) });
  });
}

// --- Challenge System Functions ---

export async function createDirectChallenge(challengeData: Omit<Challenge, 'id' | 'createdAt' | 'status'>) {
    const newChallengeRef = doc(collection(db, 'challenges'));
    const newChallenge: Challenge = {
        ...challengeData,
        id: newChallengeRef.id,
        status: 'pending',
        createdAt: Timestamp.now().toMillis(),
    };
    await setDoc(newChallengeRef, newChallenge);
}

export async function createOpenChallenge(challengeData: Omit<OpenChallenge, 'id' | 'createdAt'>) {
    const newChallengeRef = doc(collection(db, 'openChallenges'));
    const newChallenge: OpenChallenge = {
        ...challengeData,
        id: newChallengeRef.id,
        createdAt: Timestamp.now().toMillis(),
    };
    await setDoc(newChallengeRef, newChallenge);
}

export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
    const challengeRef = doc(db, 'challenges', challengeId);
    const docSnap = await getDoc(challengeRef);
    return docSnap.exists() ? docSnap.data() as Challenge : null;
}

export async function getIncomingChallenges(userId: string): Promise<Challenge[]> {
    const challengesRef = collection(db, 'challenges');
    const q = query(
        challengesRef,
        where('toId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const allChallenges = snapshot.docs.map(doc => doc.data() as Challenge);
    return allChallenges.filter(c => c.status === 'pending');
}

export async function getSentChallenges(userId: string): Promise<Challenge[]> {
    const challengesRef = collection(db, 'challenges');
    const q = query(
        challengesRef,
        where('fromId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const allChallenges = snapshot.docs.map(doc => doc.data() as Challenge);
    return allChallenges.filter(c => c.status === 'pending');
}

export async function getOpenChallenges(userId: string, sport: Sport): Promise<OpenChallenge[]> {
    const openChallengesRef = collection(db, 'openChallenges');
    const q = query(
        openChallengesRef,
        where('sport', '==', sport),
        where('posterId', '!=', userId),
        orderBy('posterId', 'asc'), // required for '!=' query
        orderBy('createdAt', 'desc'),
        limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as OpenChallenge);
}

export async function updateChallengeStatus(challengeId: string, status: 'accepted' | 'declined' | 'cancelled') {
    const challengeRef = doc(db, 'challenges', challengeId);
    await updateDoc(challengeRef, { status });
}

export async function challengeFromOpen(openChallenge: OpenChallenge, challenger: User) {
    if (openChallenge.posterId === challenger.uid) {
        throw new Error("You cannot challenge your own open post.");
    }
    const challengeData = {
        fromId: challenger.uid,
        fromName: challenger.name,
        fromAvatar: challenger.avatar,
        toId: openChallenge.posterId,
        toName: openChallenge.posterName,
        toAvatar: openChallenge.posterAvatar,
        sport: openChallenge.sport,
        location: openChallenge.location,
        matchDateTime: Timestamp.now().toMillis(), // Placeholder, to be edited by players
        wager: "A friendly match",
    };
    await createDirectChallenge(challengeData);
}

// --- Tournament Functions ---

export async function createTournament(values: z.infer<typeof createTournamentSchema>, organizer: User) {
    const participantIds = [organizer.uid, ...values.participantIds];
    if (new Set(participantIds).size !== participantIds.length) {
        throw new Error("Duplicate participants are not allowed.");
    }

    const userDocs = await getDocs(query(collection(db, 'users'), where('uid', 'in', participantIds)));
    const participantsData = userDocs.docs.map(doc => doc.data() as User);

    if (participantsData.length !== participantIds.length) {
        throw new Error("One or more selected participants could not be found.");
    }

    const bracket = generateBracket(participantsData);

    const newTournamentRef = doc(collection(db, 'tournaments'));
    const newTournament: Tournament = {
        id: newTournamentRef.id,
        name: values.name,
        sport: values.sport,
        organizerId: organizer.uid,
        participantIds: participantIds,
        participantsData: participantsData.map(p => ({ uid: p.uid, name: p.name, avatar: p.avatar })),
        status: 'ongoing',
        bracket: bracket,
        createdAt: Timestamp.now().toMillis(),
    };
    await setDoc(newTournamentRef, newTournament);
}

export async function getTournamentsForUser(userId: string): Promise<Tournament[]> {
    const tournamentsRef = collection(db, 'tournaments');
    const q = query(tournamentsRef, where('participantIds', 'array-contains', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Tournament);
}

export async function getTournamentById(tournamentId: string): Promise<Tournament | null> {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    return tournamentDoc.exists() ? tournamentDoc.data() as Tournament : null;
}

export async function reportTournamentWinner(tournamentId: string, matchId: string, winnerId: string) {
    return runTransaction(db, async (transaction) => {
        const tournamentRef = doc(db, 'tournaments', tournamentId);
        const tournamentDoc = await transaction.get(tournamentRef);

        if (!tournamentDoc.exists()) {
            throw new Error("Tournament not found.");
        }

        const tournament = tournamentDoc.data() as Tournament;
        const { bracket } = tournament;

        let matchFound = false;
        let matchIndex = -1;
        let roundIndex = -1;

        for (let i = 0; i < bracket.length; i++) {
            const matchIdx = bracket[i].matches.findIndex(m => m.id === matchId);
            if (matchIdx !== -1) {
                matchFound = true;
                matchIndex = matchIdx;
                roundIndex = i;
                break;
            }
        }

        if (!matchFound) {
            throw new Error("Match not found in the tournament.");
        }
        
        const match = bracket[roundIndex].matches[matchIndex];
        if (match.winnerId) {
             throw new Error("This match already has a winner.");
        }
        match.winnerId = winnerId;
        
        // Advance winner to the next round
        const nextRoundIndex = roundIndex + 1;
        if (nextRoundIndex < bracket.length) {
            const nextMatchIndex = Math.floor(matchIndex / 2);
            const nextMatch = bracket[nextRoundIndex].matches[nextMatchIndex];

            if (matchIndex % 2 === 0) {
                nextMatch.player1Id = winnerId;
            } else {
                nextMatch.player2Id = winnerId;
            }
        } else {
            // This was the final match
            tournament.status = 'complete';
            tournament.winnerId = winnerId;
        }

        transaction.update(tournamentRef, { bracket, status: tournament.status, winnerId: tournament.winnerId });
    });
}


// --- Chat Functions ---

export async function getOrCreateChat(userId1: string, userId2: string): Promise<string> {
    const chatsRef = collection(db, 'chats');
    // Firestore requires that array-contains queries have the same number of elements to combine
    const q = query(chatsRef, 
        where('participantIds', 'array-contains', userId1)
    );

    const querySnapshot = await getDocs(q);
    const existingChat = querySnapshot.docs.find(doc => doc.data().participantIds.includes(userId2));

    if (existingChat) {
        return existingChat.id;
    } else {
        // Create new chat
        const [user1Doc, user2Doc] = await Promise.all([
            getDoc(doc(db, 'users', userId1)),
            getDoc(doc(db, 'users', userId2))
        ]);

        if (!user1Doc.exists() || !user2Doc.exists()) {
            throw new Error("One or both users not found.");
        }

        const user1Data = user1Doc.data() as User;
        const user2Data = user2Doc.data() as User;

        const newChatRef = doc(collection(db, 'chats'));
        const now = Timestamp.now().toMillis();
        const newChat: Chat = {
            id: newChatRef.id,
            participantIds: [userId1, userId2],
            participantsData: {
                [userId1]: { name: user1Data.name, avatar: user1Data.avatar },
                [userId2]: { name: user2Data.name, avatar: user2Data.avatar },
            },
            updatedAt: now,
            lastRead: {
                [userId1]: now,
                [userId2]: now
            }
        };

        await setDoc(newChatRef, newChat);
        return newChatRef.id;
    }
}

export async function getChatsForUser(userId: string): Promise<Chat[]> {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participantIds', 'array-contains', userId), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Chat);
}

export async function sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(chatRef, 'messages');

    const now = Timestamp.now().toMillis();
    const newMessageRef = doc(messagesRef);

    const newMessage: Message = {
        id: newMessageRef.id,
        chatId,
        senderId,
        text,
        createdAt: now
    };

    const batch = writeBatch(db);
    batch.set(newMessageRef, newMessage);
    batch.update(chatRef, {
        lastMessage: newMessage,
        updatedAt: now
    });
    
    await batch.commit();
}

export async function markChatAsRead(chatId: string, userId: string): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    const now = Timestamp.now().toMillis();
    await updateDoc(chatRef, {
        [`lastRead.${userId}`]: now
    });
}
