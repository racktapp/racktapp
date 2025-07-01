

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
            
            // --- DYNAMIC K-FACTOR LOGIC ---
            const getKFactor = (playerStats: SportStats): number => {
                const totalGames = (playerStats.wins || 0) + (playerStats.losses || 0);
                return totalGames < 30 ? 40 : 20; // 40 for provisional, 20 for established
            };

            const getMatchKFactor = (playerIds: string[]): number => {
                const totalK = playerIds.reduce((sum, pId) => {
                    const player = players.find(pl => pl.uid === pId);
                    const playerStats = player?.sports?.[match.sport] ?? { wins: 0, losses: 0 };
                    return sum + getKFactor(playerStats);
                }, 0);
                return totalK / playerIds.length;
            }

            const matchKFactor = getMatchKFactor(allPlayerIds);
            // --- END DYNAMIC K-FACTOR LOGIC ---


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
            const { newRatingA: newTeam1Elo, newRatingB: newTeam2Elo } = calculateNewElo(
                team1AvgElo, 
                team2AvgElo, 
                team1GameScore as (0|1),
                matchKFactor
            );
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
                rankChange: rankChanges,
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

    const newGame: RallyGame = {
        id: newGameRef.id,
        sport: 'Tennis',
        participantIds: [user1.uid, user2.uid],
        participantsData: {
            [user1.uid]: { name: user1.name, avatar: user1.avatar, uid: user1.uid },
            [user2.uid]: { name: user2.name, avatar: user2.avatar, uid: user2.uid },
        },
        score: { [user1.uid]: 0, [user2.uid]: 0 },
        turn: 'serving',
        currentPlayerId: user1.uid,
        currentPoint: {
            servingPlayer: user1.uid,
            returningPlayer: user2.uid,
        },
        pointHistory: [],
        status: 'ongoing',
        createdAt: now,
        updatedAt: now,
    };

    await setDoc(newGameRef, newGame);
    return newGameRef.id;
}

export async function createLegendGame(userId: string, friendId: string | null, sport: Sport): Promise<string> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) throw new Error("User not found.");
    const user = userDoc.data() as User;
    
    const now = Timestamp.now().toMillis();
    const newGameRef = doc(collection(db, 'legendGames'));

    let newGame: LegendGame;
    const firstPlayer = friendId ? (Math.random() < 0.5 ? userId : friendId) : userId;

    if (friendId) { // Friend mode
        const friendDoc = await getDoc(doc(db, 'users', friendId));
        if (!friendDoc.exists()) throw new Error("Friend not found.");
        const friend = friendDoc.data() as User;

        newGame = {
            id: newGameRef.id, mode: 'friend', sport,
            participantIds: [userId, friendId],
            participantsData: {
                [userId]: { name: user.name, avatar: user.avatar, uid: user.uid },
                [friendId]: { name: friend.name, avatar: friend.avatar, uid: friend.uid },
            },
            score: { [userId]: 0, [friendId]: 0 },
            currentPlayerId: firstPlayer,
            turnState: 'playing',
            roundHistory: [], 
            status: 'initializing',
            usedPlayers: [],
            createdAt: now, updatedAt: now,
        };
    } else { // Solo mode
         newGame = {
            id: newGameRef.id, mode: 'solo', sport,
            participantIds: [userId],
            participantsData: {
                [userId]: { name: user.name, avatar: user.avatar, uid: user.uid }
            },
            score: { [userId]: 0 },
            currentPlayerId: userId,
            turnState: 'playing',
            roundHistory: [],
            status: 'initializing',
            usedPlayers: [],
            createdAt: now, updatedAt: now,
        };
    }

    // Create the game document immediately in an "initializing" state
    await setDoc(newGameRef, newGame);

    // In the background, fetch the first round and update the document.
    (async () => {
        try {
            const initialRoundData = await getLegendGameRound({ sport, usedPlayers: [] });
            if (!initialRoundData || !initialRoundData.correctAnswer) {
                 throw new Error("AI failed to return valid round data.");
            }
            const initialRound: LegendGameRound = { ...initialRoundData, guesses: {} };

            await updateDoc(newGameRef, {
                currentRound: initialRound,
                status: 'ongoing',
                usedPlayers: arrayUnion(initialRound.correctAnswer),
                updatedAt: Timestamp.now().toMillis()
            });
        } catch (error) {
            console.error(`Failed to initialize round for game ${newGameRef.id}:`, error);
            await updateDoc(newGameRef, { status: 'error', 'currentRound.clue': 'Failed to generate game round.' });
        }
    })();

    return newGameRef.id;
}


export async function submitLegendAnswer(gameId: string, playerId: string, answer: string) {
    const gameRef = doc(db, 'legendGames', gameId);
    return runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw new Error("Game not found.");
        const game = gameDoc.data() as LegendGame;
        
        if (game.status !== 'ongoing' || !game.currentRound) throw new Error("Game is not ready or has ended.");
        if (game.currentPlayerId !== playerId) throw new Error("It is not your turn.");
        if (game.currentRound.guesses[playerId]) throw new Error("You have already answered this round.");

        const isCorrect = answer === game.currentRound.correctAnswer;
        const newGuesses = { ...game.currentRound.guesses, [playerId]: answer };
        const newScore = isCorrect ? { ...game.score, [playerId]: (game.score[playerId] || 0) + 1 } : game.score;

        const allPlayersAnswered = Object.keys(newGuesses).length === game.participantIds.length;
        
        const updatePayload: any = {
            'currentRound.guesses': newGuesses,
            score: newScore,
            updatedAt: Timestamp.now().toMillis(),
        };

        if (allPlayersAnswered) {
            updatePayload.turnState = 'round_over';
        } else {
            const opponentId = game.participantIds.find(id => id !== playerId);
            updatePayload.currentPlayerId = opponentId;
        }
        
        transaction.update(gameRef, updatePayload);
    });
}

export async function startNextLegendRound(gameId: string, currentUserId: string) {
    const gameRef = doc(db, 'legendGames', gameId);
    return runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw new Error("Game not found.");
        let game = gameDoc.data() as LegendGame;

        if (game.status !== 'ongoing' || !game.currentRound) throw new Error("Game is not ongoing.");
        if (game.turnState !== 'round_over') throw new Error("Current round is not over.");
        
        const updatedGame = await completeLegendGame(gameId, transaction);
        if (updatedGame.status === 'complete') {
             return; // Game over, no new round
        }
        game = updatedGame; // Use the updated game state for the next step

        const usedPlayers = [...game.usedPlayers, game.currentRound.correctAnswer];
        const nextRoundData = await getLegendGameRound({ sport: game.sport, usedPlayers });
        
        let nextPlayerId = game.participantIds.find(id => id !== game.currentPlayerId);
        if (!nextPlayerId) nextPlayerId = currentUserId;
        
        transaction.update(gameRef, {
            roundHistory: arrayUnion(game.currentRound),
            usedPlayers: arrayUnion(nextRoundData.correctAnswer),
            currentRound: { ...nextRoundData, guesses: {} },
            turnState: 'playing',
            currentPlayerId: nextPlayerId,
            updatedAt: Timestamp.now().toMillis(),
        });
    });
}

export async function completeLegendGame(gameId: string, transaction: Transaction): Promise<LegendGame> {
    const gameRef = doc(db, 'legendGames', gameId);
    const gameDoc = await transaction.get(gameRef);
    if (!gameDoc.exists()) throw new Error("Game not found during game over check.");
    const game = gameDoc.data() as LegendGame;

    if (game.status !== 'ongoing') return game;

    const roundsPlayed = game.roundHistory.length + 1;
    let isGameOver = false;
    let winnerId: string | 'draw' | null = null;
    
    const newScore = game.score;

    if (game.mode === 'solo') {
        const wrongAnswers = roundsPlayed - newScore[game.participantIds[0]];
        if (newScore[game.participantIds[0]] >= 5) {
            isGameOver = true;
            winnerId = game.participantIds[0];
        } else if (wrongAnswers >= 3) {
            isGameOver = true;
            winnerId = null; // AI wins
        }
    } else { // Friend mode
        const score1 = newScore[game.participantIds[0]];
        const score2 = newScore[game.participantIds[1]];
        if (roundsPlayed >= 10) {
            isGameOver = true;
            if (score1 > score2) winnerId = game.participantIds[0];
            else if (score2 > score1) winnerId = game.participantIds[1];
            else winnerId = 'draw';
        } else if (Math.abs(score1 - score2) > (10 - roundsPlayed)) {
            isGameOver = true;
            winnerId = score1 > score2 ? game.participantIds[0] : game.participantIds[1];
        }
    }
    
    if (isGameOver) {
        transaction.update(gameRef, {
            status: 'complete',
            turnState: 'game_over',
            winnerId: winnerId,
            updatedAt: Timestamp.now().toMillis()
        });
        const finalDoc = await transaction.get(gameRef);
        return finalDoc.data() as LegendGame;
    }
    return game;
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
            .filter(user => user.sports?.[sport]);
        
        return users;
    } catch(e) {
        throw e;
    }
}

async function isUsernameUnique(username: string, userId: string): Promise<boolean> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return true;
  }
  
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

export async function deleteGame(gameId: string, collectionName: 'rallyGames' | 'legendGames', userId: string) {
    const gameRef = doc(db, collectionName, gameId);
    const gameDoc = await getDoc(gameRef);

    if (!gameDoc.exists()) {
        throw new Error("Game not found.");
    }

    const gameData = gameDoc.data() as RallyGame | LegendGame;
    if (!gameData.participantIds.includes(userId)) {
        throw new Error("You are not a participant in this game and cannot delete it.");
    }
    
    await deleteDoc(gameRef);
}

