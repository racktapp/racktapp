// src/lib/types.ts
import { z } from 'zod';
import { SPORTS, type Sport as SportType } from './constants';
import type { GeoPoint } from 'firebase/firestore';

export type Sport = SportType;
const SportEnum = z.enum(SPORTS);

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
  username: string;
  email: string;
  emailVerified: boolean;
  avatarUrl?: string | null;
  friendIds: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
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
  isRanked: boolean;
  participants: string[]; // All user IDs in the match
  participantsData: {
    [key: string]: { username: string; avatarUrl?: string | null; uid: string };
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
  fromUsername: string;
  fromAvatarUrl?: string | null;
  toId: string;
  toUsername: string;
  toAvatarUrl?: string | null;
  status: ChallengeStatus;
  sport: Sport;
  wager?: string;
  location?: string;
  matchDateTime: number; // Combined timestamp
  createdAt: number;
  participantsData: {
    [key: string]: { username: string; avatarUrl?: string | null; uid: string };
  };
}

export interface OpenChallenge {
  id: string;
  posterId: string;
  posterUsername: string;
  posterAvatarUrl?: string | null;
  sport: Sport;
  location: string;
  latitude?: number;
  longitude?: number;
  note?: string;
  createdAt: number;
}


export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromId: string;
  fromUsername: string;
  fromAvatarUrl?: string | null;
  toId: string;
  toUsername: string;
  toAvatarUrl?: string | null;
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
        username: string;
        avatarUrl?: string | null;
    }
  };
  lastMessage?: Message;
  updatedAt: number; // timestamp for sorting
  lastRead?: {
      [userId: string]: number; // timestamp
  };
}

export interface UserReport {
  id: string;
  reporterId: string;
  reportedId: string;
  chatId?: string;
  reason?: string; // Optional reason for more detailed reports
  createdAt: number;
  status: 'pending' | 'reviewed';
}


export type SwingAnalysisInput = {
  videoDataUri: string;
  sport: string;
  shotType: string;
};

export type SwingAnalysisOutput = {
  isCorrectShotType: boolean;
  detectedShotType?: string;
  summary: string;
  preparation: { positive: string; improvement: string };
  execution: { positive: string; improvement: string };
  followThrough: { positive: string; improvement: string };
};

// --- Game Type Definitions ---

export type GameStatus = 'ongoing' | 'complete' | 'initializing' | 'error';
export type RallyGameTurn = 'serving' | 'returning' | 'point_over' | 'game_over';
export type LegendGameTurnState = 'playing' | 'round_over' | 'game_over';

export const ServeChoiceSchema = z.object({
  name: z.string(),
  description: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
  reward: z.enum(['low', 'medium', 'high']),
});
export type ServeChoice = z.infer<typeof ServeChoiceSchema>;

export const ReturnChoiceSchema = z.object({
    name: z.string(),
    description: z.string(),
});
export type ReturnChoice = z.infer<typeof ReturnChoiceSchema>;

export const RallyGameInputSchema = z.object({
  sport: SportEnum,
  servingPlayerRank: z.number().describe('The RacktRank of the player who is serving this turn.'),
  returningPlayerRank: z.number().describe('The RacktRank of the player who is receiving serve this turn.'),
  serveChoice: ServeChoiceSchema.optional().describe('The serve chosen by the serving player. If present, the AI should generate return options or evaluate the point.'),
  returnChoice: ReturnChoiceSchema.optional().describe('The return chosen by the returning player. If present (along with serveChoice), the AI should evaluate the point.'),
});
export type RallyGameInput = z.infer<typeof RallyGameInputSchema>;

export const RallyGameOutputSchema = z.object({
  serveOptions: z.array(ServeChoiceSchema).optional().describe('An array of three distinct serve options.'),
  returnOptions: z.array(ReturnChoiceSchema).optional().describe('An array of three distinct return options based on the serve.'),
  pointWinner: z.enum(['server', 'returner']).optional().describe('The winner of the point after evaluation.'),
  narrative: z.string().optional().describe('An exciting, short narrative describing how the point played out.'),
});
export type RallyGameOutput = z.infer<typeof RallyGameOutputSchema>;


export interface RallyGamePoint {
  servingPlayer: string;
  returningPlayer: string;
  serveChoice: ServeChoice;
  returnChoice: ReturnChoice;
  winner: string; // The UID of the player who won the point
  narrative: string;
}

export interface RallyGame {
  id: string;
  sport: Sport;
  participantIds: string[];
  participantsData: {
    [key: string]: { username: string; avatarUrl?: string | null; uid: string };
  };
  score: {
    [key: string]: number;
  };
  turn: RallyGameTurn;
  currentPlayerId: string;
  currentPoint: {
    servingPlayer: string;
    returningPlayer: string;
    serveChoice?: ServeChoice;
    returnChoice?: ReturnChoice;
    serveOptions?: ServeChoice[];
    returnOptions?: ReturnChoice[];
  };
  pointHistory: RallyGamePoint[];
  status: GameStatus;
  winnerId?: string;
  createdAt: number;
  updatedAt: number;
}


export interface LegendGameRound {
    clue: string;
    options: string[];
    correctAnswer: string;
    justification: string;
    guesses?: { [key: string]: string }; // { userId: guess }
}

export interface LegendGame {
    id: string;
    mode: 'solo' | 'friend';
    sport: Sport;
    participantIds: string[];
    participantsData: { [key: string]: { username: string; avatarUrl?: string | null; uid: string } };
    score: { [key: string]: number };
    currentPlayerId: string;
    turnState: LegendGameTurnState;
    currentRound?: LegendGameRound;
    roundHistory: LegendGameRound[];
    status: GameStatus;
    winnerId?: string | 'draw' | null;
    error?: string;
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
  participantsData: { uid: string; username: string; avatarUrl?: string | null }[];
  status: 'pending' | 'ongoing' | 'complete';
  winnerId?: string;
  bracket: TournamentRound[];
  createdAt: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  date: number; // timestamp
  icon: string; // lucide-react icon name
}

export interface PracticeSession {
  id: string;
  userId: string;
  sport: Sport;
  date: number; // timestamp
  duration: number; // in minutes
  notes: string;
  intensity: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface Court {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  supportedSports: Sport[];
  address?: string;
  url?: string;
}

export interface FriendGroup {
    id: string;
    name: string;
    creatorId: string;
    memberIds: string[];
    createdAt: number;
}


// --- Zod Schemas ---

export const reportMatchSchema = z.object({
  matchType: z.enum(['Singles', 'Doubles']),
  sport: SportEnum,
  isRanked: z.boolean().default(true),
  opponent1: z.string({ required_error: 'Please select an opponent.' }),
  partner: z.string().optional(),
  opponent2: z.string().optional(),
  score: z.string()
    .min(3, "Please enter a valid score (e.g., 6-4, 6-3).")
    .regex(/^(\d+-\d+)(\s*,\s*\d+-\d+)*$/, "Score format must be sets separated by commas (e.g., 6-4, 7-5)."),
  winnerId: z.string({ required_error: 'Please select the winner.' }),
  date: z.date({ required_error: 'Please select the date of the match.' }),
}).refine(data => {
    if (data.matchType === 'Doubles') {
        return !!data.partner && !!data.opponent2;
    }
    return true;
}, { message: "Partner and second opponent are required for Doubles.", path: ["partner"] });

export const challengeSchema = z.object({
  sport: SportEnum,
  location: z.string().optional(),
  wager: z.string().optional(),
  date: z.date({ required_error: "Please select a date." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time (HH:MM)"),
});

export const openChallengeSchema = z.object({
    sport: SportEnum,
    location: z.string().min(1, 'Location is required.'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    note: z.string().max(100, "Note must be 100 characters or less.").optional(),
});

export const createTournamentSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters.").max(50, "Name must be 50 characters or less."),
    sport: SportEnum,
    participantIds: z.array(z.string()).min(3, "You must select at least 3 friends."),
});

export const practiceSessionSchema = z.object({
  sport: SportEnum,
  date: z.date({ required_error: 'Please select a date.' }),
  duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes.').max(240, 'Duration cannot exceed 4 hours.'),
  intensity: z.enum(['low', 'medium', 'high']),
  notes: z.string().min(3, 'Notes must be at least 3 characters.').max(500, 'Notes cannot exceed 500 characters.'),
});

export const LegendGameOutputSchema = z.object({
  clue: z.string().describe("A clever, one-sentence, slightly cryptic clue about a famous player."),
  correctAnswer: z.string().describe("The name of the correct player."),
  options: z.array(z.string()).length(4).describe("An array of four player names, including the correct answer and three plausible distractors."),
  justification: z.string().describe("A short, fun justification for why the clue points to the correct player."),
});
export type LegendGameOutput = z.infer<typeof LegendGameOutputSchema>;

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
  sport: SportEnum,
});
export type PredictMatchInput = z.infer<typeof PredictMatchInputSchema>;

export const PredictMatchOutputSchema = z.object({
  predictedWinner: z.enum(['player1', 'player2']),
  confidence: z.enum(['High', 'Medium', 'Slight Edge']),
  analysis: z.string(),
});
export type PredictMatchOutput = z.infer<typeof PredictMatchOutputSchema>;

export const profileSettingsSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters.').regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores.'),
    preferredSports: z.array(SportEnum).min(1, 'Please select at least one preferred sport.'),
});

export const reportUserSchema = z.object({
    reporterId: z.string(),
    reportedId: z.string(),
    chatId: z.string().optional(),
    reason: z.string().optional(),
});
export const AvatarConfigSchema = z.object({
  hairStyle: z.enum(['short', 'long', 'bun', 'bald']),
  hairColor: z.string().regex(/^#[0-9a-f]{6}$/i, 'Invalid hex color'),
  skinColor: z.string().regex(/^#[0-9a-f]{6}$/i, 'Invalid hex color'),
  hasGlasses: z.boolean(),
  eyeColor: z.string().regex(/^#[0-9a-f]{6}$/i, 'Invalid hex color'),
  shirtColor: z.string().regex(/^#[0-9a-f]{6}$/i, 'Invalid hex color'),
});
export type AvatarConfig = z.infer<typeof AvatarConfigSchema>;

export const createFriendGroupSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters.").max(30, "Name must be 30 characters or less."),
    memberIds: z.array(z.string()).min(1, "You must select at least 1 friend."),
});
