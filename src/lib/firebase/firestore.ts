
import { nanoid } from 'nanoid';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

import { User, Sport, Match, SportStats, MatchType, FriendRequest, Challenge, OpenChallenge, ChallengeStatus, Tournament, createTournamentSchema, Chat, Message, RallyGame, LegendGame, LegendGameRound, profileSettingsSchema, LegendGameOutput, RallyGamePoint, ServeChoice, ReturnChoice, PracticeSession, practiceSessionSchema, reportUserSchema, UserReport, Court } from '@/lib/types';
import { calculateNewElo } from '../elo';
import { generateBracket } from '../tournament-utils';
import { z } from 'zod';
import { adminDb } from './admin-config';

// Helper to convert Firestore Timestamps to numbers
function convertTimestamps<T extends Record<string, any>>(obj: T): T {
    for (const key in obj) {
        if (obj[key] instanceof Timestamp) {
            obj[key] = obj[key].toMillis() as any;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            convertTimestamps(obj[key]);
        }
    }
    return obj;
}


// Fetches a user's friends from Firestore
export async function getFriends(userId: string): Promise<User[]> {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return [];
    }

    const userData = userDoc.data() as User;
    const friendIds = userData.friendIds;

    if (!friendIds || friendIds.length === 0) {
      return [];
    }

    const friendsData: User[] = [];
    const chunkSize = 30;
    for (let i = 0; i < friendIds.length; i += chunkSize) {
      const chunk = friendIds.slice(i, i + chunkSize);
      if (chunk.length > 0) {
        const friendsQuery = adminDb.collection('users').where('uid', 'in', chunk);
        const querySnapshot = await friendsQuery.get();
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

export async function getAllUsers(currentUserId: string): Promise<User[]> {
  try {
    const usersRef = adminDb.collection('users');
    const q = usersRef.where('uid', '!=', currentUserId);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function searchUsers(usernameQuery: string, currentUserId: string): Promise<User[]> {
    try {
        const lowerCaseQuery = usernameQuery.toLowerCase().trim();
        if (!lowerCaseQuery) return [];

        const usersRef = adminDb.collection('users');
        const querySnapshot = await usersRef.get();
        
        return querySnapshot.docs
            .map(doc => doc.data() as User)
            .filter(user => 
                user.username.toLowerCase().includes(lowerCaseQuery) && 
                user.uid !== currentUserId
            );
    } catch (error) {
        console.error("Error searching users:", error);
        throw new Error("Failed to search for users.");
    }
}

async function isUsernameUnique(username: string, userId: string): Promise<boolean> {
  const q = adminDb.collection('users').where('username', '==', username.toLowerCase());
  const snapshot = await q.get();
  if (snapshot.empty) return true;
  return snapshot.docs[0].data().uid === userId;
}

export async function updateUserProfileInDb(userId: string, data: z.infer<typeof profileSettingsSchema>) {
    if (data.username && !(await isUsernameUnique(data.username, userId))) {
        throw new Error("Username is already taken.");
    }

    const updateData: any = {
        username: data.username,
        preferredSports: data.preferredSports,
    }
    await adminDb.collection('users').doc(userId).update(updateData);
}

export async function generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername.toLowerCase().replace(/\s/g, '').replace(/[^a-z0-9_]/g, '');
    if (username.length < 3) username = `${username}user`;
    
    let isUnique = false;
    let finalUsername = username;
    let attempts = 0;
    
    while(!isUnique && attempts < 10) {
        const usersRef = adminDb.collection('users');
        const q = usersRef.where('username', '==', finalUsername);
        const snapshot = await q.get();
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


interface ReportMatchData {
    sport: Sport;
    matchType: MatchType;
    isRanked: boolean;
    team1Ids: string[];
    team2Ids: string[];
    winnerIds: string[];
    score: string;
    reportedById: string;
    date: number;
}

export const reportPendingMatch = async (data: ReportMatchData): Promise<string> => {
    const allPlayerIds = [...data.team1Ids, ...data.team2Ids];
    
    const userDocsPromises = allPlayerIds.map(id => adminDb.collection("users").doc(id).get());
    const userDocs = await Promise.all(userDocsPromises);

    const participantsData = userDocs.reduce((acc, doc) => {
        if (doc.exists) {
            const player = doc.data() as User;
            acc[player.uid] = { uid: player.uid, username: player.username, avatarUrl: player.avatarUrl || null };
        }
        return acc;
    }, {} as Match['participantsData']);
    
    const matchRef = adminDb.collection('matches').doc();
    const newMatch: Match = {
        id: matchRef.id,
        type: data.matchType,
        sport: data.sport,
        isRanked: data.isRanked,
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
    await matchRef.set(newMatch);
    return matchRef.id;
};

export async function confirmMatchResult(matchId: string, userId: string) {
    return adminDb.runTransaction(async (transaction) => {
        const matchRef = adminDb.collection('matches').doc(matchId);
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists) throw new Error("Match not found.");
        const match = matchDoc.data() as Match;

        if (match.status !== 'pending') throw new Error("This match is not pending confirmation.");
        if (!match.participants.includes(userId)) throw new Error("You are not a participant in this match.");
        if (!match.participantsToConfirm.includes(userId)) throw new Error("You have already confirmed this match.");

        const updatedParticipantsToConfirm = match.participantsToConfirm.filter(id => id !== userId);

        if (updatedParticipantsToConfirm.length > 0) {
            transaction.update(matchRef, { participantsToConfirm: updatedParticipantsToConfirm });
            return { finalized: false };
        }
        
        if (!match.isRanked) {
            transaction.update(matchRef, { status: 'confirmed', participantsToConfirm: [] });
            return { finalized: true };
        }

        const allPlayerIds = match.participants;
        const playerRefs = allPlayerIds.map(id => adminDb.collection("users").doc(id));
        const playerDocs = await transaction.getAll(...playerRefs);
        const players = playerDocs.map(pDoc => {
            if (!pDoc.exists) throw new Error(`User document for ID ${pDoc.id} not found.`);
            return pDoc.data() as User;
        });

        const getKFactor = (playerStats: SportStats) => ((playerStats.wins || 0) + (playerStats.losses || 0) < 30 ? 40 : 20);
        const getMatchKFactor = (pIds: string[]) => pIds.reduce((sum, pId) => {
            const player = players.find(pl => pl.uid === pId);
            return sum + getKFactor(player?.sports?.[match.sport] ?? { wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [], eloHistory: [] });
        }, 0) / pIds.length;
        const matchKFactor = getMatchKFactor(allPlayerIds);

        const getTeamAvgElo = (teamIds: string[]) => teamIds.reduce((sum, pId) => {
            const player = players.find(pl => pl.uid === pId);
            return sum + (player?.sports?.[match.sport]?.racktRank || 1200);
        }, 0) / teamIds.length;

        const team1AvgElo = getTeamAvgElo(match.teams.team1.playerIds);
        const team2AvgElo = getTeamAvgElo(match.teams.team2.playerIds);
        const team1Won = match.winner.some(id => match.teams.team1.playerIds.includes(id));
        
        const { newRatingA: newTeam1Elo, newRatingB: newTeam2Elo } = calculateNewElo(team1AvgElo, team2AvgElo, team1Won ? 1 : 0, matchKFactor);
        const team1EloChange = newTeam1Elo - team1AvgElo;
        const team2EloChange = newTeam2Elo - team2AvgElo;
        const rankChanges: Match['rankChange'] = [];

        for (const player of players) {
            const team = match.teams.team1.playerIds.includes(player.uid) ? 'team1' : 'team2';
            const eloChange = team === 'team1' ? team1EloChange : team2EloChange;
            const isWinner = match.winner.includes(player.uid);
            const currentSportStats = player.sports?.[match.sport] ?? { racktRank: 1200, wins: 0, losses: 0, streak: 0, matchHistory: [], eloHistory: [] };
            
            const oldRank = currentSportStats.racktRank;
            const newRank = oldRank + eloChange;
            const newEloHistory = [...(currentSportStats.eloHistory || []), { date: match.date, elo: newRank }].slice(-30);

            transaction.update(adminDb.collection('users').doc(player.uid), {
                [`sports.${match.sport}.racktRank`]: newRank,
                [`sports.${match.sport}.wins`]: currentSportStats.wins + (isWinner ? 1 : 0),
                [`sports.${match.sport}.losses`]: currentSportStats.losses + (isWinner ? 0 : 1),
                [`sports.${match.sport}.streak`]: isWinner ? Math.max(1, currentSportStats.streak + 1) : Math.min(-1, currentSportStats.streak - 1),
                [`sports.${match.sport}.matchHistory`]: [match.id, ...(currentSportStats.matchHistory || [])].slice(0, 50),
                [`sports.${match.sport}.eloHistory`]: newEloHistory,
            });
            rankChanges.push({ userId: player.uid, before: oldRank, after: newRank });
        }
        
        transaction.update(matchRef, { status: 'confirmed', participantsToConfirm: [], rankChange: rankChanges });
        return { finalized: true };
    });
}


export async function declineMatchResult(matchId: string, userId: string) {
    await adminDb.collection('matches').doc(matchId).update({ status: 'declined', declinedBy: userId });
}

export async function getConfirmedMatchesForUser(userId: string, matchLimit?: number): Promise<Match[]> {
    let q = adminDb.collection('matches')
        .where('participants', 'array-contains', userId)
        .where('status', '==', 'confirmed')
        .orderBy('date', 'desc');
    if (matchLimit) {
        q = q.limit(matchLimit);
    }
    const snapshot = await q.get();
    return snapshot.docs.map(doc => convertTimestamps(doc.data() as Match));
}

export async function getPendingMatchesForUser(userId: string): Promise<Match[]> {
    const q = adminDb.collection('matches').where('participants', 'array-contains', userId).where('status', '==', 'pending').orderBy('createdAt', 'desc');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => convertTimestamps(doc.data() as Match));
}

export async function sendFriendRequest(fromUser: User, toUser: User) {
  if (toUser.friendIds?.includes(fromUser.uid)) throw new Error("You are already friends.");
  
  const q1 = adminDb.collection('friendRequests').where('fromId', '==', fromUser.uid).where('toId', '==', toUser.uid);
  const q2 = adminDb.collection('friendRequests').where('fromId', '==', toUser.uid).where('toId', '==', fromUser.uid);
  const [s1, s2] = await Promise.all([q1.get(), q2.get()]);
  if ([...s1.docs, ...s2.docs].some(d => d.data().status === 'pending')) throw new Error('Friend request already pending.');

  const newRequestRef = adminDb.collection('friendRequests').doc();
  await newRequestRef.set({
    id: newRequestRef.id,
    fromId: fromUser.uid, fromUsername: fromUser.username, fromAvatarUrl: fromUser.avatarUrl,
    toId: toUser.uid, toUsername: toUser.username, toAvatarUrl: toUser.avatarUrl,
    status: 'pending', createdAt: Timestamp.now().toMillis(),
  } as FriendRequest);
}

export async function getIncomingFriendRequests(userId: string): Promise<FriendRequest[]> {
  const q = adminDb.collection('friendRequests').where('toId', '==', userId).where('status', '==', 'pending');
  const snapshot = await q.get();
  return snapshot.docs.map(doc => doc.data() as FriendRequest);
}

export async function getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
    const q = adminDb.collection('friendRequests').where('fromId', '==', userId).where('status', '==', 'pending');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => doc.data() as FriendRequest);
}

export async function acceptFriendRequest(requestId: string, fromId: string, toId: string) {
  await adminDb.runTransaction(async (t) => {
    t.update(adminDb.collection('users').doc(fromId), { friendIds: FieldValue.arrayUnion(toId) });
    t.update(adminDb.collection('users').doc(toId), { friendIds: FieldValue.arrayUnion(fromId) });
    t.delete(adminDb.collection('friendRequests').doc(requestId));
  });
}

export async function deleteFriendRequest(requestId: string) {
  await adminDb.collection('friendRequests').doc(requestId).delete();
}

export async function removeFriend(userId: string, friendId: string) {
  await adminDb.runTransaction(async (t) => {
    t.update(adminDb.collection('users').doc(userId), { friendIds: FieldValue.arrayRemove(friendId) });
    t.update(adminDb.collection('users').doc(friendId), { friendIds: FieldValue.arrayRemove(userId) });
  });
}

export async function getFriendshipStatus(currentUserId: string, profileUserId: string) {
    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    if (currentUserDoc.data()?.friendIds?.includes(profileUserId)) return { status: 'friends' };

    const qSent = adminDb.collection('friendRequests').where('fromId', '==', currentUserId).where('toId', '==', profileUserId).where('status', '==', 'pending');
    const sentSnapshot = await qSent.get();
    if (!sentSnapshot.empty) return { status: 'request_sent', requestId: sentSnapshot.docs[0].id };
    
    const qReceived = adminDb.collection('friendRequests').where('fromId', '==', profileUserId).where('toId', '==', currentUserId).where('status', '==', 'pending');
    const receivedSnapshot = await qReceived.get();
    if (!receivedSnapshot.empty) return { status: 'request_received', requestId: receivedSnapshot.docs[0].id };
    
    return { status: 'not_friends' };
}

export async function createDirectChallenge(challengeData: Omit<Challenge, 'id' | 'createdAt' | 'status'>) {
    const ref = adminDb.collection('challenges').doc();
    const fromUserDoc = await adminDb.collection('users').doc(challengeData.fromId).get();
    const toUserDoc = await adminDb.collection('users').doc(challengeData.toId).get();
    const fromUser = fromUserDoc.data() as User;
    const toUser = toUserDoc.data() as User;

    await ref.set({ 
        ...challengeData, 
        id: ref.id, 
        status: 'pending', 
        createdAt: Timestamp.now().toMillis(),
        participantsData: {
            [fromUser.uid]: { uid: fromUser.uid, username: fromUser.username, avatarUrl: fromUser.avatarUrl || null },
            [toUser.uid]: { uid: toUser.uid, username: toUser.username, avatarUrl: toUser.avatarUrl || null }
        }
    });
}

export async function createOpenChallenge(challengeData: Omit<OpenChallenge, 'id' | 'createdAt'>) {
    const ref = adminDb.collection('openChallenges').doc();
    await ref.set({ 
        ...challengeData, 
        id: ref.id, 
        createdAt: Timestamp.now().toMillis(),
     });
}

export async function getChallengeById(id: string): Promise<Challenge | null> {
    const docSnap = await adminDb.collection('challenges').doc(id).get();
    return docSnap.exists ? docSnap.data() as Challenge : null;
}

export async function getIncomingChallenges(userId: string): Promise<Challenge[]> {
    const q = adminDb.collection('challenges').where('toId', '==', userId).where('status', '==', 'pending');
    const snapshot = await q.get();
    const challenges = snapshot.docs.map(d => d.data() as Challenge);
    return challenges.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSentChallenges(userId: string): Promise<Challenge[]> {
    const q = adminDb.collection('challenges').where('fromId', '==', userId).where('status', '==', 'pending');
    const snapshot = await q.get();
    const challenges = snapshot.docs.map(d => d.data() as Challenge);
    return challenges.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getOpenChallenges(sport: Sport): Promise<OpenChallenge[]> {
    const q = adminDb.collection('openChallenges').where('sport', '==', sport);
    const snapshot = await q.get();
    const challenges = snapshot.docs.map(d => convertTimestamps(d.data() as OpenChallenge));
    return challenges.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
}


export async function deleteOpenChallenge(challengeId: string, userId: string) {
    const challengeRef = adminDb.collection('openChallenges').doc(challengeId);
    const challengeDoc = await challengeRef.get();

    if (!challengeDoc.exists) {
        throw new Error("Challenge not found.");
    }

    if (challengeDoc.data()?.posterId !== userId) {
        throw new Error("You are not authorized to delete this challenge.");
    }

    await challengeRef.delete();
}

export async function updateChallengeStatus(id: string, status: ChallengeStatus) {
    await adminDb.collection('challenges').doc(id).update({ status });
}

export async function challengeFromOpen(openChallenge: OpenChallenge, challenger: User) {
    if (openChallenge.posterId === challenger.uid) throw new Error("You cannot challenge your own post.");
    await createDirectChallenge({
        fromId: challenger.uid, fromUsername: challenger.username, fromAvatarUrl: challenger.avatarUrl,
        toId: openChallenge.posterId, toUsername: openChallenge.posterUsername, toAvatarUrl: openChallenge.posterAvatarUrl,
        sport: openChallenge.sport, location: openChallenge.location,
        matchDateTime: Timestamp.now().toMillis(), wager: "A friendly match",
        participantsData: {}, // This will be populated in createDirectChallenge
    });
}

export async function createTournamentInDb(values: z.infer<typeof createTournamentSchema>, organizer: User) {
    const participantIds = [organizer.uid, ...values.participantIds];
    if (new Set(participantIds).size !== participantIds.length) throw new Error("Duplicate participants are not allowed.");

    const userDocs = await adminDb.collection('users').where('uid', 'in', participantIds).get();
    const participantsData = userDocs.docs.map(doc => doc.data() as User);
    if (participantsData.length !== participantIds.length) throw new Error("Could not find all participant data.");

    const newTournamentRef = adminDb.collection('tournaments').doc();
    await newTournamentRef.set({
        id: newTournamentRef.id, name: values.name, sport: values.sport,
        organizerId: organizer.uid, participantIds: participantIds,
        participantsData: participantsData.map(p => ({ uid: p.uid, username: p.username, avatarUrl: p.avatarUrl || null })),
        status: 'ongoing', bracket: generateBracket(participantsData), createdAt: Timestamp.now().toMillis(),
    } as Omit<Tournament, 'winnerId'>);
}

export async function getTournamentsForUser(userId: string): Promise<Tournament[]> {
    const q = adminDb.collection('tournaments').where('participantIds', 'array-contains', userId).orderBy('createdAt', 'desc');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => convertTimestamps(doc.data() as Tournament));
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
    const docSnap = await adminDb.collection('tournaments').doc(id).get();
    return docSnap.exists ? convertTimestamps(docSnap.data() as Tournament) : null;
}

export async function reportTournamentWinner(tournamentId: string, matchId: string, winnerId: string) {
    await adminDb.runTransaction(async (t) => {
        const tournamentRef = adminDb.collection('tournaments').doc(tournamentId);
        const tournamentDoc = await t.get(tournamentRef);
        if (!tournamentDoc.exists) throw new Error("Tournament not found.");

        const tournament = tournamentDoc.data() as Tournament;
        const { bracket } = tournament;
        let matchFound = false;

        for (let i = 0; i < bracket.length; i++) {
            const matchIdx = bracket[i].matches.findIndex(m => m.id === matchId);
            if (matchIdx !== -1) {
                matchFound = true;
                const match = bracket[i].matches[matchIdx];
                if (match.winnerId) throw new Error("Match already has a winner.");
                match.winnerId = winnerId;

                const nextRoundIndex = i + 1;
                if (nextRoundIndex < bracket.length) {
                    const nextMatchIndex = Math.floor(matchIdx / 2);
                    const nextMatch = bracket[nextRoundIndex].matches[nextMatchIndex];
                    if (matchIdx % 2 === 0) nextMatch.player1Id = winnerId;
                    else nextMatch.player2Id = winnerId;
                } else {
                    tournament.status = 'complete';
                    tournament.winnerId = winnerId;
                }
                break;
            }
        }
        if (!matchFound) throw new Error("Match not found in bracket.");
        t.update(tournamentRef, { bracket, status: tournament.status, winnerId: tournament.winnerId });
    });
}

export async function getOrCreateChat(userId1: string, userId2: string): Promise<string> {
    const q = adminDb.collection('chats').where('participantIds', 'array-contains', userId1);
    const snapshot = await q.get();
    const existingChatDoc = snapshot.docs.find(d => d.data().participantIds.includes(userId2));

    if (existingChatDoc) return existingChatDoc.id;

    const user1Doc = await adminDb.collection('users').doc(userId1).get();
    const user2Doc = await adminDb.collection('users').doc(userId2).get();

    if (!user1Doc.exists || !user2Doc.exists) throw new Error("One or both users not found.");
    const user1 = user1Doc.data() as User;
    const user2 = user2Doc.data() as User;
    
    const newChatRef = adminDb.collection('chats').doc();
    const now = Timestamp.now().toMillis();
    await newChatRef.set({
        id: newChatRef.id, participantIds: [userId1, userId2],
        participantsData: { [userId1]: { username: user1.username, avatarUrl: user1.avatarUrl || null }, [userId2]: { username: user2.username, avatarUrl: user2.avatarUrl || null } },
        updatedAt: now, lastRead: { [userId1]: now, [userId2]: now }
    } as Omit<Chat, 'lastMessage'>);
    return newChatRef.id;
}

export async function getChatsForUser(userId: string): Promise<Chat[]> {
    const q = adminDb.collection('chats').where('participantIds', 'array-contains', userId).orderBy('updatedAt', 'desc');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => doc.data() as Chat);
}

export async function sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
    const chatRef = adminDb.collection('chats').doc(chatId);
    const msgRef = chatRef.collection('messages').doc();
    const now = Timestamp.now().toMillis();
    const newMessage: Message = { id: msgRef.id, chatId, senderId, text, createdAt: now };

    const batch = adminDb.batch();
    batch.set(msgRef, newMessage);
    batch.update(chatRef, { lastMessage: newMessage, updatedAt: now });
    await batch.commit();
}

export async function markChatAsRead(chatId: string, userId: string): Promise<void> {
    await adminDb.collection('chats').doc(chatId).update({ [`lastRead.${userId}`]: Timestamp.now().toMillis() });
}

export async function getGame<T>(gameId: string, collectionName: 'rallyGames' | 'legendGames' | 'users'): Promise<T | null> {
    const docSnap = await adminDb.collection(collectionName).doc(gameId).get();
    return docSnap.exists ? docSnap.data() as T : null;
}

export async function getHeadToHeadMatches(userId1: string, userId2: string, sport: Sport): Promise<Match[]> {
    const q = adminDb.collection('matches')
        .where('sport', '==', sport)
        .where('status', '==', 'confirmed')
        .where('participants', 'array-contains', userId1);
    const snapshot = await q.get();
    const matches: Match[] = [];
    snapshot.forEach(doc => {
        const match = doc.data() as Match;
        if (match.participants.includes(userId2) && match.participants.length === 2) {
            matches.push(match);
        }
    });
    return matches.sort((a, b) => a.date - b.date).map(m => convertTimestamps(m));
}

export async function getLeaderboard(sport: Sport): Promise<User[]> {
    const q = adminDb.collection('users').orderBy(`sports.${sport}.racktRank`, 'desc').limit(100);
    const snapshot = await q.get();
    return snapshot.docs.map(doc => doc.data() as User).filter(user => user.sports?.[sport]);
}

export async function deleteGame(gameId: string, collectionName: 'rallyGames' | 'legendGames', userId: string) {
    const gameRef = adminDb.collection(collectionName).doc(gameId);
    const gameDoc = await gameRef.get();
    if (!gameDoc.exists) throw new Error("Game not found.");
    if (!(gameDoc.data()?.participantIds.includes(userId))) throw new Error("You are not authorized to delete this game.");
    await gameRef.delete();
}

export async function deleteUserDocument(userId: string) {
    if (!userId) throw new Error("User ID is required.");
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.delete();
}

export async function logPracticeSession(
  data: z.infer<typeof practiceSessionSchema>,
  userId: string
): Promise<void> {
  await adminDb.runTransaction(async (transaction) => {
    const userRef = adminDb.collection('users').doc(userId);
    
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error('User not found.');
    
    const sessionRef = userRef.collection('practiceSessions').doc();
    const newSession: PracticeSession = {
      id: sessionRef.id,
      userId,
      sport: data.sport,
      date: data.date.getTime(),
      duration: data.duration,
      intensity: data.intensity,
      notes: data.notes,
      createdAt: Timestamp.now().toMillis(),
    };
    transaction.set(sessionRef, newSession);

    const user = userDoc.data() as User;
    const currentStats = user.sports?.[data.sport] ?? { racktRank: 1200, wins: 0, losses: 0, streak: 0, achievements: [], matchHistory: [], eloHistory: [] };
    const newRank = currentStats.racktRank + 2;
    const updatedEloHistory = [...(currentStats.eloHistory || []), { date: data.date.getTime(), elo: newRank }].slice(-30);

    transaction.update(userRef, {
      [`sports.${data.sport}.racktRank`]: newRank,
      [`sports.${data.sport}.eloHistory`]: updatedEloHistory,
    });
  });
}


export async function getPracticeSessionsForUser(
  userId: string,
  sport: Sport
): Promise<PracticeSession[]> {
  try {
    const sessionsRef = adminDb.collection('users').doc(userId).collection('practiceSessions');
    const q = sessionsRef
      .where('sport', '==', sport)
      .orderBy('date', 'desc');
    const snapshot = await q.get();
    return snapshot.docs.map((doc) => convertTimestamps(doc.data() as PracticeSession));
  } catch (error: any) {
    console.error("Error in getPracticeSessionsForUser:", error);
    throw new Error(error.message);
  }
}

export async function deletePracticeSession(sessionId: string, userId: string): Promise<void> {
    const sessionRef = adminDb.collection('users').doc(userId).collection('practiceSessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
        throw new Error('Session not found.');
    }

    await sessionRef.delete();
}

export async function createReport(data: z.infer<typeof reportUserSchema>) {
  const reportRef = adminDb.collection('reports').doc();
  const newReport: UserReport = {
    id: reportRef.id,
    ...data,
    createdAt: Timestamp.now().toMillis(),
    status: 'pending',
  };
  await reportRef.set(newReport);
}

export async function findCourts(
  latitude: number,
  longitude: number,
  radiusKm: number,
  sports: Sport[]
): Promise<Court[]> {
    const radiusInM = radiusKm * 1000;
    
    const selectedSports = sports.length > 0 ? sports : ['court'];
    const searchPromises = selectedSports.map(sport => {
        const query = `${sport} court`;
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusInM}&keyword=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
        return fetch(url).then(res => res.json());
    });
    
    try {
        const results = await Promise.all(searchPromises);
        const allPlaces: any[] = [];
        const seenPlaceIds = new Set<string>();

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const sport = selectedSports[i];
            if (result.status === 'OK') {
                for (const place of result.results) {
                    if (!seenPlaceIds.has(place.place_id)) {
                        seenPlaceIds.add(place.place_id);
                         const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,url,geometry,vicinity&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
                         allPlaces.push(fetch(placeDetailsUrl).then(res => res.json()).then(detailResult => ({...detailResult.result, sport})));
                    }
                }
            } else if (result.status !== 'ZERO_RESULTS') {
                console.error(`Google Places API Error for sport "${sport}":`, result.status, result.error_message || '');
            }
        }
        
        const detailedPlaces = await Promise.all(allPlaces);

        return detailedPlaces.map(place => ({
            id: place.place_id,
            name: place.name,
            location: {
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
            },
            address: place.vicinity,
            url: place.url,
            supportedSports: [place.sport], 
        }));

    } catch (error) {
        console.error("Failed to fetch courts from Google Maps API:", error);
        return [];
    }
}

export async function createLegendGame(friendId: string | null, sport: Sport, currentUserId: string, initialRoundData: LegendGameOutput): Promise<string> {
    const userDoc = await adminDb.collection('users').doc(currentUserId).get();
    if (!userDoc.exists) throw new Error("Current user not found.");
    const user = userDoc.data() as User;
    
    const gameRef = adminDb.collection('legendGames').doc();
    const now = new Date().getTime();
    const initialRound: LegendGameRound = { ...initialRoundData, guesses: {} };
    
    let newGame: Omit<LegendGame, 'id'> & { id: string };
    
    if (friendId) {
        const friendDoc = await adminDb.collection('users').doc(friendId).get();
        if (!friendDoc.exists) throw new Error("Friend not found.");
        const friend = friendDoc.data() as User;
        newGame = {
            id: gameRef.id, mode: 'friend', sport,
            participantIds: [currentUserId, friendId],
            participantsData: { 
                [currentUserId]: { username: user.username, avatarUrl: user.avatarUrl || null, uid: user.uid }, 
                [friendId]: { username: friend.username, avatarUrl: friend.avatarUrl || null, uid: friend.uid } 
            },
            score: { [currentUserId]: 0, [friendId]: 0 },
            currentPlayerId: currentUserId,
            turnState: 'playing', status: 'ongoing',
            currentRound: initialRound, roundHistory: [], usedPlayers: [initialRound.correctAnswer],
            createdAt: now, updatedAt: now,
        };
    } else {
        newGame = {
            id: gameRef.id, mode: 'solo', sport,
            participantIds: [currentUserId],
            participantsData: { [currentUserId]: { username: user.username, avatarUrl: user.avatarUrl || null, uid: user.uid } },
            score: { [currentUserId]: 0 },
            currentPlayerId: currentUserId,
            turnState: 'playing', status: 'ongoing',
            currentRound: initialRound, roundHistory: [], usedPlayers: [initialRound.correctAnswer],
            createdAt: now, updatedAt: now,
        };
    }

    await gameRef.set(newGame);
    return gameRef.id;
}
    

