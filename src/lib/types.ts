// src/lib/types.ts
import { z } from 'zod';
import { SPORTS } from './constants';

export type Sport = 'Tennis' | 'Padel' | 'Badminton' | 'Table Tennis';

export interface Socials {
  twitter?: string;
  instagram?: string;
  facebook?: string;
}

export interface SportStats {
  racktRank: number;
  wins: number;
  losses: number;
  streak: number; // positive for wins, negative for losses
  achievements: string[]; // IDs of achievements
  flexedAchievementId?: string;
  matchHistory: string[]; // IDs of matches
}

export interface User {
  uid: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  friendIds: string[];
  location?: string;
  handPreference?: 'left' | 'right';
  preferredSports: Sport[];
  socials?: Socials;
  sports: {
    [key in Sport]?: SportStats;
  };
}

export type MatchType = 'Singles' | 'Doubles';

export interface RankChange {
  userId: string;
  before: number;
  after: number;
}

export interface Match {
  id: string;
  type: MatchType;
  sport: Sport;
  participants: string[]; // All user IDs in the match
  teams: {
    team1: {
      players: User[];
      score: number;
    }
    team2: {
      players: User[];
      score: number;
    }
  };
  winner: string[]; // User IDs of the winners
  score: string;
  date: number; // timestamp
  createdAt: number; // timestamp
  rankChange: RankChange[];
}

export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface Challenge {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar?: string;
  toId: string;
  toName: string;
  toAvatar?: string;
  status: ChallengeStatus;
  sport: Sport;
  wager?: string;
  location?: string;
  matchDateTime: number; // Combined timestamp
  createdAt: number;
}

export interface OpenChallenge {
  id: string;
  posterId: string;
  posterName: string;
  posterAvatar?: string;
  sport: Sport;
  location: string;
  note?: string;
  createdAt: number;
}


export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar?: string;
  toId: string;
  toName: string;
  toAvatar?: string;
  status: FriendRequestStatus;
  createdAt: number; // timestamp
}

export interface Message {
  id:string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number; // timestamp
}

export interface Chat {
  id: string;
  participantIds: string[];
  participantsData: {
    [key: string]: { // key is userId
        name: string;
        avatar?: string;
    }
  };
  lastMessage?: Message;
  updatedAt: number; // timestamp for sorting
  lastRead?: {
      [userId: string]: number; // timestamp
  };
}


export interface Minigame {
  id: string;
  // ... fields for minigames
}

export interface LegendGame {
  id: string;
  // ... fields for legend games
}

export interface TournamentMatch {
  id: string; // Unique ID for the match within the tournament
  player1Id?: string | null; // Can be null for a bye or TBD
  player2Id?: string | null; // Can be null if waiting for winner
  winnerId?: string | null; // null until decided
  round: number;
  matchNumber: number; // The match number within the round
  isBye?: boolean;
}

export interface TournamentRound {
  roundNumber: number;
  matches: TournamentMatch[];
}

export interface Tournament {
  id: string;
  name: string;
  sport: Sport;
  organizerId: string;
  participantIds: string[];
  participantsData: { uid: string; name: string; avatar?: string }[];
  status: 'pending' | 'ongoing' | 'complete';
  winnerId?: string;
  bracket: TournamentRound[];
  createdAt: number;
}


export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // url or identifier for the icon
}

export interface EloDataPoint {
  date: string; // e.g., "Jan 22"
  elo: number;
}

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

// Zod schemas for forms
export const challengeSchema = z.object({
  sport: z.enum(SPORTS),
  location: z.string().optional(),
  wager: z.string().optional(),
  date: z.date({ required_error: "Please select a date." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time (HH:MM)"),
});

export const openChallengeSchema = z.object({
    sport: z.enum(SPORTS),
    location: z.string().min(1, 'Location is required.'),
    note: z.string().max(100, "Note must be 100 characters or less.").optional(),
});

export const createTournamentSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters.").max(50, "Name must be 50 characters or less."),
    sport: z.enum(SPORTS),
    participantIds: z.array(z.string()).min(3, "You must select at least 3 friends."),
});
