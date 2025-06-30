// src/lib/types.ts
import { z } from 'zod';

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

export type ChallengeStatus = 'pending' | 'accepted' | 'declined';

export interface Challenge {
  id: string;
  from: User;
  to: User;
  status: ChallengeStatus;
  sport: Sport;
  wager?: string;
  location?: string;
  matchDateTime?: number; // timestamp
}

export interface OpenChallenge {
  id: string;
  poster: User;
  sport: Sport;
  location: string;
  note?: string;
  createdAt: number; // timestamp
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  fromAvatar?: string;
  status: FriendRequestStatus;
  createdAt: number; // timestamp
}

export interface Chat {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  updatedAt: number; // timestamp
}

export interface Message {
  id:string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number; // timestamp
}

export interface Minigame {
  id: string;
  // ... fields for minigames
}

export interface LegendGame {
  id: string;
  // ... fields for legend games
}

export interface Tournament {
  id: string;
  // ... fields for tournaments
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
