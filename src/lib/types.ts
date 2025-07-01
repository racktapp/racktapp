
// src/lib/types.ts
import { z } from 'zod';
import { SPORTS as sportValues } from './constants';

export const Sport = z.enum(sportValues);
export type Sport = z.infer<typeof Sport>;


export interface Socials {
  twitter?: string;
  instagram?: string;
  facebook?: string;
}

export const EloDataPointSchema = z.object({
  date: z.number(), // timestamp
  elo: z.number(),
});
export type EloDataPoint = z.infer<typeof EloDataPointSchema>;


export interface SportStats {
  racktRank: number;
  wins: number;
  losses: number;
  streak: number; // positive for wins, negative for losses
  achievements: string[]; // IDs of achievements
  flexedAchievementId?: string;
  matchHistory: string[]; // IDs of matches
  eloHistory: EloDataPoint[];
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
export type MatchStatus = 'pending' | 'confirmed' | 'declined';


export interface RankChange {
  userId: string;
  before: number;
  after: number;
}

export interface Match {
  id: string;
  type: MatchType;
  sport: Sport;
  status: MatchStatus;
  participants: string[]; // All user IDs in the match
  participantsData: {
    [key: string]: { name: string; avatar?: string; uid: string };
  };
  teams: {
    team1: {
      playerIds: string[];
    };
    team2: {
      playerIds: string[];
    };
  };
  winner: string[]; // User IDs of the winners
  score: string;
  date: number; // timestamp
  createdAt: number; // timestamp
  reportedById: string;
  participantsToConfirm: string[];
  declinedBy?: string;
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


export type RallyGameTurn = 'serving' | 'returning' | 'point_over' | 'game_over';

export interface RallyGamePoint {
  servingPlayer: string;
  serveChoice: any;
  returningPlayer: string;
  returnChoice: any;
  winner: string; // The UID of the player who won the point
  narrative: string;
}

export interface RallyGame {
  id: string;
  sport: Sport;
  participantIds: string[];
  participantsData: {
    [key: string]: { name: string; avatar?: string; uid: string };
  };
  score: {
    [key: string]: number;
  };
  turn: RallyGameTurn;
  currentPlayerId: string;
  currentPoint: {
    servingPlayer: string;
    returningPlayer: string;
    serveChoice?: any;
    returnChoice?: any;
    serveOptions?: any[];
    returnOptions?: any[];
  };
  pointHistory: RallyGamePoint[];
  status: 'ongoing' | 'complete';
  winnerId?: string;
  createdAt: number;
  updatedAt: number;
}


export type LegendGameTurnState = 'playing' | 'round_over' | 'game_over';

export interface LegendGameRound {
    clue: string;
    options: string[];
    correctAnswer: string;
    justification: string;
    guesses: { [key: string]: string }; // { userId: guess }
}

export interface LegendGame {
    id: string;
    mode: 'solo' | 'friend';
    sport: Sport;
    participantIds: string[];
    participantsData: { [key: string]: { name: string; avatar?: string; uid: string } };
    score: { [key: string]: number };
    currentPlayerId: string;
    turnState: LegendGameTurnState;
    currentRound?: LegendGameRound;
    roundHistory: LegendGameRound[];
    status: 'initializing' | 'ongoing' | 'complete' | 'error';
    winnerId?: string;
    usedPlayers: string[];
    createdAt: number;
    updatedAt: number;
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

// Schema for report match form
export const reportMatchSchema = z.object({
  matchType: z.enum(['Singles', 'Doubles']),
  sport: Sport,
  opponent1: z.string({ required_error: 'Please select an opponent.' }),
  partner: z.string().optional(),
  opponent2: z.string().optional(),
  score: z.string()
    .min(3, "Please enter a valid score (e.g., 6-4, 6-3).")
    .regex(/^(\d+-\d+(\s*,\s*\d+-\d+)*)$/, "Score format must be sets separated by commas (e.g., 6-4, 7-5)."),
  winnerId: z.string({ required_error: 'Please select the winner.' }),
  date: z.date({ required_error: 'Please select the date of the match.' }),
}).refine(data => {
    if (data.matchType === 'Doubles') {
        return !!data.partner && !!data.opponent2;
    }
    return true;
}, { message: "Partner and second opponent are required for Doubles.", path: ["partner"] });


// Zod schemas for forms
export const challengeSchema = z.object({
  sport: Sport,
  location: z.string().optional(),
  wager: z.string().optional(),
  date: z.date({ required_error: "Please select a date." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time (HH:MM)"),
});

export const openChallengeSchema = z.object({
    sport: Sport,
    location: z.string().min(1, 'Location is required.'),
    note: z.string().max(100, "Note must be 100 characters or less.").optional(),
});

export const createTournamentSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters.").max(50, "Name must be 50 characters or less."),
    sport: Sport,
    participantIds: z.array(z.string()).min(3, "You must select at least 3 friends."),
});


// Rally Game
export const rallyGamePointSchema = z.object({
    servingPlayer: z.string(),
    serveChoice: z.any(),
    returningPlayer: z.string(),
    returnChoice: z.any(),
    winner: z.string(),
    narrative: z.string(),
});
export type RallyGamePointZod = z.infer<typeof rallyGamePointSchema>;

export const rallyGameSchema = z.object({
    id: z.string(),
    sport: Sport,
    participantIds: z.array(z.string()),
    participantsData: z.record(z.object({ name: z.string(), avatar: z.string().optional(), uid: z.string() })),
    score: z.record(z.number()),
    turn: z.enum(['serving', 'returning', 'point_over', 'game_over']),
    currentPlayerId: z.string(),
    currentPoint: z.object({
        servingPlayer: z.string(),
        serveChoice: z.any().optional(),
        returningPlayer: z.string(),
        returnChoice: z.any().optional(),
        serveOptions: z.array(z.any()).optional(),
        returnOptions: z.array(z.any()).optional(),
    }),
    pointHistory: z.array(rallyGamePointSchema),
    status: z.enum(['ongoing', 'complete']),
    winnerId: z.string().optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
});
export type RallyGameZod = z.infer<typeof rallyGameSchema>;

// Guess The Legend Game
export const legendGameRoundSchema = z.object({
    clue: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.string(),
    justification: z.string(),
    guesses: z.record(z.string()), // { userId: guess }
    opponentGuess: z.string().optional(),
    winner: z.string().optional(),
});
export type LegendGameRoundZod = z.infer<typeof legendGameRoundSchema>;

export const legendGameSchema = z.object({
    id: z.string(),
    mode: z.enum(['solo', 'friend']),
    sport: Sport,
    participantIds: z.array(z.string()),
    participantsData: z.record(z.object({ name: z.string(), avatar: z.string().optional(), uid: z.string() })),
    score: z.record(z.number()),
    currentPlayerId: z.string(),
    turnState: z.enum(['playing', 'round_over', 'game_over']),
    currentRound: legendGameRoundSchema.optional(),
    roundHistory: z.array(legendGameRoundSchema),
    status: z.enum(['initializing', 'ongoing', 'complete', 'error']),
    winnerId: z.string().optional(), // only in friend mode
    usedPlayers: z.array(z.string()),
    createdAt: z.number(),
    updatedAt: z.number(),
});
export type LegendGameZod = z.infer<typeof legendGameSchema>;

// AI Prediction Schemas
export const PredictMatchInputSchema = z.object({
  player1Name: z.string(),
  player2Name: z.string(),
  player1RacktRank: z.number(),
  player2RacktRank: z.number(),
  player1WinRate: z.number(),
  player2WinRate: z.number(),
  player1Streak: z.number().int(),
  player2Streak: z.number().int(),
  headToHead: z.object({ player1Wins: z.number(), player2Wins: z.number() }),
  sport: Sport,
});
export type PredictMatchInput = z.infer<typeof PredictMatchInputSchema>;

export const PredictMatchOutputSchema = z.object({
  predictedWinner: z.enum(['player1', 'player2']),
  confidence: z.enum(['High', 'Medium', 'Slight Edge']),
  analysis: z.string(),
});
export type PredictMatchOutput = z.infer<typeof PredictMatchOutputSchema>;

// Settings Schema
export const profileSettingsSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    username: z.string().min(3, 'Username must be at least 3 characters.').regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores.'),
    preferredSports: z.array(Sport).min(1, 'Please select at least one preferred sport.'),
});
