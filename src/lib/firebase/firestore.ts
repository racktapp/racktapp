

import { nanoid } from 'nanoid';
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
  Transaction,
} from 'firebase/firestore';
import { db } from './config';
import { User, Sport, Match, SportStats, MatchType, FriendRequest, Challenge, OpenChallenge, ChallengeStatus, Tournament, createTournamentSchema, Chat, Message, RallyGame, LegendGame, LegendGameRound, profileSettingsSchema } from '@/lib/types';
import { calculateNewElo } from '../elo';
import { generateBracket } from '../tournament-utils';
import { z } from 'zod';
import { playRallyPoint } from '@/ai/flows/rally-game-flow';
import { getLegendGameRound } from '@/ai/flows/guess-the-legend-flow';

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
    // Firestore 'in' query is limited to 30 elements, so we chunk the requests
    const chunkSize = 30;
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
        
        // Fetch all users and filter client-side because of Firestore query limitations
        const querySnapshot = await getDocs(usersRef);
        
        const users = querySnapshot.docs
            .map(doc => doc.data() as User)
            .filter(user => 
                user.username.toLowerCase().includes(lowerCaseQuery) && 
                user.uid !== currentUserId
            );
        
        return users;
    } catch (error) {
        console.error("Error searching users:", error);
        throw new Error("Failed to search for users in the database.");
    }
}

async function generateUniqueUsername(name: string): Promise<string> {
    let username = name.toLowerCase().replace(/\s/g, '').replace(/[^a-z0-9_]/g, '');
    if (username.length < 3) username = `${username}user`;
    
    let isUnique = false;
    let finalUsername = username;
    let attempts = 0;
    
    while(!isUnique && attempts < 10) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', finalUsername));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            isUnique = true;
        } else {
            finalUsername = `${username}${nanoid(3)}`;
            attempts++;
        }
    }
    if (!isUnique) throw new Error("Could not generate a unique username.");
    return finalUsername;
}

// Function to create a user document on signup or first login
export const createUserDocument = async (user: {
  uid: string;
  email: string;
  displayName: string;
}) => {
  const userRef = doc(db, 'users', user.uid);
  const username = await generateUniqueUsername(user.displayName);

  const newUser: User = {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    username: username,
    avatar: `https://placehold.co/100x100.png?text=${user.displayName.charAt(0)}`,
    friendIds: [],
    preferredSports: ['Tennis'],
    sports: {
      Tennis: { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [], eloHistory: [] },
      Padel: { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [], eloHistory: [] },
      Badminton: { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [], eloHistory: [] },
      'Table Tennis': { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [], eloHistory: [] },
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

interface ReportMatchData {
    sport: Sport;
    matchType: MatchType;
    team1Ids: string[];
    team2Ids: string[];
    winnerIds: string[];
    score: string;
    reportedById: string;
    date: number;
}

export const reportPendingMatch = async (data: ReportMatchData): Promise<string> => {
    const allPlayerIds = [...data.team1Ids, ...data.team2Ids];
    
    const userDocs = await Promise.all(allPlayerIds.map(id => getDoc(doc(db, "users", id))));
    const participantsData = userDocs.reduce((acc, doc) => {
        if (doc.exists()) {
            const player = doc.data() as User;
            acc[player.uid] = { uid: player.uid, name: player.name, avatar: player.avatar };
        }
        return acc;
    }, {} as Match['participantsData']);
    
    const matchRef = doc(collection(db, 'matches'));
    const newMatch: Match = {
        id: matchRef.id,
        type: data.matchType,
        sport: data.sport,
        participants: allPlayerIds,
        participantsData,
        teams: {
            team1: { playerIds: data.team1Ids },
            team2: { playerIds: data.team2Ids },
        },
        winner: data.winnerIds,
        score: data.score,
        date: data.date,
        createdAt: Timestamp.now().toMillis(),
        reportedById: data.reportedById,
        status: 'pending',
        participantsToConfirm: allPlayerIds.filter(id => id !== data.reportedById),
        rankChange: [],
    };
    await setDoc(matchRef, newMatch);
    return matchRef.id;
};

export async function confirmMatchResult(matchId: string, userId: string) {
    return runTransaction(db, async (transaction) => {
        // --- All READS must happen first ---
        const matchRef = doc(db, 'matches', matchId);
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
            throw new Error("Match not found.");
        }
        const match = matchDoc.data() as Match;

        // --- Validation checks (no reads/writes) ---
        if (match.status !== 'pending') {
            throw new Error("This match is not pending confirmation.");
        }
        if (!match.participants.includes(userId)) {
            throw new Error("You are not a participant in this match.");
        }
        if (!match.participantsToConfirm.includes(userId)) {
            throw new Error("You have already confirmed this match or were not required to.");
        }

        const updatedParticipantsToConfirm = match.participantsToConfirm.filter(id => id !== userId);

        if (updatedParticipantsToConfirm.length === 0) {
            // --- FINAL CONFIRMATION ---
            // 1. Perform all remaining READS
            const allPlayerIds = match.participants;
            const playerRefs = allPlayerIds.map(id => doc(db, "users", id));
            const playerDocs = await Promise.all(playerRefs.map(ref => transaction.get(ref)));

            const players = playerDocs.map(pDoc => {
                if (!pDoc.exists()) throw new Error(`User document for ID ${pDoc.id} not found.`);
                return pDoc.data() as User;
            });

            // 2. Perform all calculations
            const getTeamAvgElo = (teamIds: string[]): number => {
                const totalElo = teamIds.reduce((sum, pId) => {
                    const player = players.find(pl => pl.uid === pId);
                    const sportStats = player?.sports?.[match.sport] ?? { racktRank: 1200 };
                    return sum + sportStats.racktRank;
                }, 0);
                return totalElo / teamIds.length;
            };

            const team1AvgElo = getTeamAvgElo(match.teams.team1.playerIds);
            const team2AvgElo = getTeamAvgElo(match.teams.team2.playerIds);
            const team1Won = match.winner.some(id => match.teams.team1.playerIds.includes(id));
            const team1GameScore = team1Won ? 1 : 0;
            const { newRatingA: newTeam1Elo, newRatingB: newTeam2Elo } = calculateNewElo(team1AvgElo, team2AvgElo, team1GameScore as (0|1));
            const team1EloChange = newTeam1Elo - team1AvgElo;
            const team2EloChange = newTeam2Elo - team2AvgElo;
            const rankChanges: Match['rankChange'] = [];

            // 3. Perform all WRITES
            for (const player of players) {
                const team = match.teams.team1.playerIds.includes(player.uid) ? 'team1' : 'team2';
                const eloChange = team === 'team1' ? team1EloChange : team2EloChange;
                const isWinner = match.winner.includes(player.uid);
                const currentSportStats = player.sports?.[match.sport] ?? { racktRank: 1200, wins: 0, losses: 0, streak: 0, matchHistory: [], eloHistory: [] };
                
                const oldRank = currentSportStats.racktRank;
                const newRank = oldRank + eloChange;
                const newWins = currentSportStats.wins + (isWinner ? 1 : 0);
                const newLosses = currentSportStats.losses + (isWinner ? 0 : 1);
                const newStreak = isWinner ? (currentSportStats.streak >= 0 ? currentSportStats.streak + 1 : 1) : (currentSportStats.streak <= 0 ? currentSportStats.streak - 1 : -1);

                const newEloHistory = [...(currentSportStats.eloHistory || [])];
                newEloHistory.push({ date: match.date, elo: newRank });
                if (newEloHistory.length > 30) newEloHistory.shift();

                const updatedSportStats: SportStats = {
                    ...currentSportStats,
                    racktRank: newRank,
                    wins: newWins,
                    losses: newLosses,
                    streak: newStreak,
                    matchHistory: [match.id, ...(currentSportStats.matchHistory || [])].slice(0, 50),
                    eloHistory: newEloHistory,
                };

                transaction.update(doc(db, 'users', player.uid), { [`sports.${match.sport}`]: updatedSportStats });
                rankChanges.push({ userId: player.uid, before: oldRank, after: newRank });
            }
            
            transaction.update(matchRef, { 
                participantsToConfirm: updatedParticipantsToConfirm,
                status: 'confirmed',
                rankChange,
            });

            return { finalized: true };
        } else {
            // --- NOT final confirmation: just one WRITE ---
            transaction.update(matchRef, { participantsToConfirm: updatedParticipantsToConfirm });
            return { finalized: false };
        }
    });
}

export async function declineMatchResult(matchId: string, userId: string) {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
        status: 'declined',
        declinedBy: userId
    });
}

/**
 * Fetches all confirmed matches for a given user, sorted by creation date.
 * This query requires a composite index on (`participants`, `createdAt`).
 * @param userId The UID of the user.
 * @returns A promise that resolves to an array of Match objects.
 */
export async function getConfirmedMatchesForUser(userId: string): Promise<Match[]> {
    const matchesRef = collection(db, 'matches');
    const q = query(
        matchesRef,
        where('participants', 'array-contains', userId),
        where('status', '==', 'confirmed'),
        orderBy('createdAt', 'desc')
    );
    try {
        const snapshot = await getDocs(q);
        const matches = snapshot.docs.map(doc => doc.data() as Match);
        return matches;
    } catch (error) {
        throw error;
    }
}

export async function getPendingMatchesForUser(userId: string): Promise<Match[]> {
    const matchesRef = collection(db, 'matches');
    const q = query(
        matchesRef,
        where('participants', 'array-contains', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Match);
    } catch (error) {
        throw error;
    }
}

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

export async function getFriendshipStatus(currentUserId: string, profileUserId: string) {
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    const currentUserData = currentUserDoc.data() as User;

    if (currentUserData.friendIds?.includes(profileUserId)) {
        return { status: 'friends' };
    }

    const friendRequestsRef = collection(db, 'friendRequests');
    const q1 = query(friendRequestsRef, where('fromId', '==', currentUserId), where('toId', '==', profileUserId), where('status', '==', 'pending'));
    const sentRequestSnapshot = await getDocs(q1);
    if (!sentRequestSnapshot.empty) {
        return { status: 'request_sent', requestId: sentRequestSnapshot.docs[0].id };
    }
    
    const q2 = query(friendRequestsRef, where('fromId', '==', profileUserId), where('toId', '==', currentUserId), where('status', '==', 'pending'));
    const receivedRequestSnapshot = await getDocs(q2);
    if (!receivedRequestSnapshot.empty) {
        return { status: 'request_received', requestId: receivedRequestSnapshot.docs[0].id };
    }
    
    return { status: 'not_friends' };
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
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Challenge);
    } catch(e) {
        throw e;
    }
}

export async function getSentChallenges(userId: string): Promise<Challenge[]> {
    const challengesRef = collection(db, 'challenges');
    const q = query(
        challengesRef,
        where('fromId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Challenge);
    } catch(e) {
        throw e;
    }
}

export async function getOpenChallenges(userId: string, sport: Sport): Promise<OpenChallenge[]> {
    const openChallengesRef = collection(db, 'openChallenges');
    const q = query(
        openChallengesRef,
        where('sport', '==', sport),
        where('posterId', '!=', userId),
        orderBy('posterId'), // required for inequality filter
        orderBy('createdAt', 'desc'),
        limit(50)
    );
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as OpenChallenge);
    } catch(e) {
        throw e;
    }
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
    const tournaments = snapshot.docs.map(doc => doc.data() as Tournament);
    return tournaments;
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
    try {
        const snapshot = await getDocs(q);
        const chats = snapshot.docs.map(doc => doc.data() as Chat);
        return chats;
    } catch(e) {
        throw e;
    }
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


// --- Game Functions ---

export async function createRallyGame(userId1: string, userId2: string): Promise<string> {
    const [user1Doc, user2Doc] = await Promise.all([getDoc(doc(db, 'users', userId1)), getDoc(doc(db, 'users', userId2))]);
    if (!user1Doc.exists() || !user2Doc.exists()) throw new Error("One or both users not found.");
    
    const user1 = user1Doc.data() as User;
    const user2 = user2Doc.data() as User;
    const now = Timestamp.now().toMillis();
    const newGameRef = doc(collection(db, 'rallyGames'));

    const initialAiResponse = await playRallyPoint({
        turn: 'serve',
        player1Rank: user1.sports.Tennis?.racktRank || 1200,
        player2Rank: user2.sports.Tennis?.racktRank || 1200,
    });

    const newGame: RallyGame = {
        id: newGameRef.id,
        sport: 'Tennis',
        participantIds: [user1.uid, user2.uid],
        participantsData: {
            [user1.uid]: { name: user1.name, avatar: user1.avatar },
            [user2.uid]: { name: user2.name, avatar: user2.avatar },
        },
        score: { [user1.uid]: 0, [user2.uid]: 0 },
        turn: 'serving',
        currentPlayerId: user1.uid,
        currentPoint: {
            servingPlayer: user1.uid,
            returningPlayer: user2.uid,
            serveOptions: initialAiResponse.serveOptions,
        },
        pointHistory: [],
        status: 'ongoing',
        createdAt: now,
        updatedAt: now,
    };

    await setDoc(newGameRef, newGame);
    return newGameRef.id;
}

export async function playRallyTurn(gameId: string, playerId: string, choice: any) {
    return runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'rallyGames', gameId);
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw new Error("Game not found.");

        let game = gameDoc.data() as RallyGame;
        if (game.status === 'complete') return; // Don't process turns for completed games
        if (game.currentPlayerId !== playerId) throw new Error("It's not your turn.");
        
        // Use the sport stored on the game, default to 'Tennis' for older games
        const sport = game.sport || 'Tennis'; 
        let aiResponse;

        if (game.turn === 'serving') {
            const servingPlayerDoc = await transaction.get(doc(db, 'users', game.currentPoint.servingPlayer));
            const returningPlayerDoc = await transaction.get(doc(db, 'users', game.currentPoint.returningPlayer));
            if (!servingPlayerDoc.exists() || !returningPlayerDoc.exists()) throw new Error("Player data not found.");
            
            const servingPlayer = servingPlayerDoc.data() as User;
            const returningPlayer = returningPlayerDoc.data() as User;

            game.turn = 'returning';
            game.currentPlayerId = game.currentPoint.returningPlayer;
            game.currentPoint.serveChoice = choice;
            
            aiResponse = await playRallyPoint({
                turn: 'return',
                player1Rank: servingPlayer.sports?.[sport]?.racktRank || 1200,
                player2Rank: returningPlayer.sports?.[sport]?.racktRank || 1200,
                serveChoice: choice,
            });
            game.currentPoint.returnOptions = aiResponse.returnOptions;

        } else if (game.turn === 'returning') {
            const servingPlayerDoc = await transaction.get(doc(db, 'users', game.currentPoint.servingPlayer));
            const returningPlayerDoc = await transaction.get(doc(db, 'users', game.currentPoint.returningPlayer));
            if (!servingPlayerDoc.exists() || !returningPlayerDoc.exists()) throw new Error("Player data not found.");

            const servingPlayer = servingPlayerDoc.data() as User;
            const returningPlayer = returningPlayerDoc.data() as User;
            
            game.turn = 'point_over';
            game.currentPlayerId = game.currentPoint.servingPlayer; // Player who served can click to start next point
            game.currentPoint.returnChoice = choice;

            aiResponse = await playRallyPoint({
                turn: 'return',
                player1Rank: servingPlayer.sports?.[sport]?.racktRank || 1200,
                player2Rank: returningPlayer.sports?.[sport]?.racktRank || 1200,
                serveChoice: game.currentPoint.serveChoice as any,
                returnChoice: choice,
            });
            
            const winnerId = aiResponse.pointWinner === 'server' ? game.currentPoint.servingPlayer : game.currentPoint.returningPlayer;
            game.score[winnerId]++;
            game.pointHistory.push({
                ...(game.currentPoint as any),
                winner: winnerId,
                narrative: aiResponse.narrative!,
            });

            if (game.score[winnerId] >= 5) {
                game.status = 'complete';
                game.winnerId = winnerId;
                game.turn = 'game_over';
            }

        } else if (game.turn === 'point_over') {
            game.turn = 'serving';
            const nextServerId = game.currentPoint.returningPlayer;
            const nextReturnerId = game.currentPoint.servingPlayer;
            
            const nextServerDoc = await transaction.get(doc(db, 'users', nextServerId));
            const nextReturnerDoc = await transaction.get(doc(db, 'users', nextReturnerId));
            if (!nextServerDoc.exists() || !nextReturnerDoc.exists()) throw new Error("Player not found for next point.");
            
            const nextServer = nextServerDoc.data() as User;
            const nextReturner = nextReturnerDoc.data() as User;
            
            aiResponse = await playRallyPoint({
                turn: 'serve',
                player1Rank: nextServer.sports?.[sport]?.racktRank || 1200,
                player2Rank: nextReturner.sports?.[sport]?.racktRank || 1200,
            });

            game.currentPoint = {
                servingPlayer: nextServerId,
                returningPlayer: nextReturnerId,
                serveOptions: aiResponse.serveOptions,
            };
            game.currentPlayerId = nextServerId;
        }

        transaction.update(gameRef, { ...game, updatedAt: Timestamp.now().toMillis() });
    });
}

export async function createLegendGame(userId: string, friendId: string | null, sport: Sport): Promise<string> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) throw new Error("User not found.");
    const user = userDoc.data() as User;
    
    const now = Timestamp.now().toMillis();
    const newGameRef = doc(collection(db, 'legendGames'));

    const initialRound = await getLegendGameRound({ sport, usedPlayers: [] });

    let newGame: LegendGame;

    if (friendId) { // Friend mode
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (!friendDoc.exists()) throw new Error("Friend not found.");
        const friend = friendDoc.data() as User;

        newGame = {
            id: newGameRef.id, mode: 'friend', sport,
            participantIds: [userId, friendId],
            participantsData: {
                [userId]: { name: user.name, avatar: user.avatar },
                [friendId]: { name: friend.name, avatar: friend.avatar },
            },
            score: { [userId]: 0, [friendId]: 0 },
            turn: userId,
            currentRound: { ...initialRound, guesses: {} },
            roundHistory: [], status: 'ongoing', usedPlayers: [initialRound.correctAnswer],
            createdAt: now, updatedAt: now,
        };
    } else { // Solo mode
         newGame = {
            id: newGameRef.id, mode: 'solo', sport,
            participantIds: [userId],
            participantsData: { [userId]: { name: user.name, avatar: user.avatar } },
            score: { [userId]: 0 },
            currentRound: { ...initialRound, guesses: {} },
            roundHistory: [], status: 'ongoing', usedPlayers: [initialRound.correctAnswer],
            createdAt: now, updatedAt: now,
        };
    }

    await setDoc(newGameRef, newGame);
    return newGameRef.id;
}


export async function submitLegendAnswer(gameId: string, playerId: string, answer: string) {
    return runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'legendGames', gameId);
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw new Error("Game not found.");

        let game = gameDoc.data() as LegendGame;
        if (game.mode === 'friend' && game.turn !== playerId) throw new Error("It's not your turn.");
        if (game.currentRound.guesses[playerId]) throw new Error("You have already answered.");

        game.currentRound.guesses[playerId] = answer;
        const isCorrect = answer === game.currentRound.correctAnswer;
        if (isCorrect) {
            game.score[playerId]++;
        }
        
        let roundOver = false;
        if (game.mode === 'solo' || Object.keys(game.currentRound.guesses).length === game.participantIds.length) {
            roundOver = true;
        }

        if (roundOver) {
            if (game.mode === 'friend') {
                const p1Guess = game.currentRound.guesses[game.participantIds[0]];
                const p2Guess = game.currentRound.guesses[game.participantIds[1]];
                if (p1Guess === game.currentRound.correctAnswer && p2Guess !== game.currentRound.correctAnswer) {
                    game.currentRound.winner = game.participantIds[0];
                } else if (p1Guess !== game.currentRound.correctAnswer && p2Guess === game.currentRound.correctAnswer) {
                    game.currentRound.winner = game.participantIds[1];
                }
            }

            // Check for game over
            const WIN_SCORE = 5;
            const p1Score = game.score[game.participantIds[0]];
            const p2Score = game.mode === 'friend' && game.participantIds[1] ? game.score[game.participantIds[1]] : -1;

            if (p1Score >= WIN_SCORE || (p2Score != -1 && p2Score >= WIN_SCORE)) {
                game.status = 'complete';
                game.winnerId = p1Score > p2Score ? game.participantIds[0] : game.participantIds[1];
            } else {
                 // Start next round
                game.roundHistory.push(game.currentRound);
                const nextRound = await getLegendGameRound({ sport: game.sport, usedPlayers: game.usedPlayers });
                game.currentRound = { ...nextRound, guesses: {} };
                game.usedPlayers.push(nextRound.correctAnswer);
                if (game.mode === 'friend') game.turn = game.participantIds.find(id => id !== playerId);
            }

        } else { // Friend mode, waiting for other player
            game.turn = game.participantIds.find(id => id !== playerId);
        }

        transaction.update(gameRef, { ...game, updatedAt: Timestamp.now().toMillis() });
    });
}

export async function getHeadToHeadRecord(userId1: string, userId2: string, sport: Sport): Promise<{ player1Wins: number; player2Wins: number }> {
    const matchesRef = collection(db, 'matches');
    const q = query(
        matchesRef,
        where('sport', '==', sport),
        where('participants', 'array-contains', userId1)
    );
    const snapshot = await getDocs(q);

    let player1Wins = 0;
    let player2Wins = 0;
    
    snapshot.docs.forEach(doc => {
        const match = doc.data() as Match;
        // Ensure this match is between only these two players for singles
        if (match.type === 'Singles' && match.participants.includes(userId2) && match.participants.length === 2) {
            if (match.winner.includes(userId1)) {
                player1Wins++;
            } else if (match.winner.includes(userId2)) {
                player2Wins++;
            }
        }
    });

    return { player1Wins, player2Wins };
}

// --- Leaderboard Functions ---

/**
 * Fetches the top 100 users for a given sport, ranked by RacktRank.
 * This query requires a composite index on (`sports.${sport}.racktRank`, `name`).
 * @param sport The sport to get the leaderboard for.
 * @returns A promise that resolves to an array of User objects.
 */
export async function getLeaderboard(sport: Sport): Promise<User[]> {
    const usersRef = collection(db, 'users');
    const q = query(
        usersRef, 
        orderBy(`sports.${sport}.racktRank`, 'desc'), 
        limit(100)
    );
    
    try {
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs
            .map(doc => doc.data() as User)
            .filter(user => user.sports?.[sport]); // Ensure player has stats for the sport
        
        return users;
    } catch(e) {
        // This is likely a missing index error.
        // Re-throw it so the action can catch it and display it to the user.
        throw e;
    }
}

// --- Settings Functions ---

async function isUsernameUnique(username: string, userId: string): Promise<boolean> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return true; // Username is unique
  }
  
  // If a user is found, check if it's the current user
  const foundUser = querySnapshot.docs[0].data() as User;
  return foundUser.uid === userId;
}


export async function updateUserProfile(userId: string, data: z.infer<typeof profileSettingsSchema>) {
    const userRef = doc(db, 'users', userId);

    if (data.username) {
        const isUnique = await isUsernameUnique(data.username, userId);
        if (!isUnique) {
            throw new Error("Username is already taken.");
        }
    }

    const updateData: Partial<User> = {
        name: data.name,
        username: data.username,
        preferredSports: data.preferredSports,
    };

    await updateDoc(userRef, updateData);
}
