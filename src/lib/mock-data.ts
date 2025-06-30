import { User, Match, Sport, EloDataPoint } from './types';

export const MOCK_USER: User = {
  uid: 'user-1',
  name: 'Alex Ray',
  username: 'alexray',
  email: 'alex.ray@example.com',
  avatar: 'https://placehold.co/100x100/3982F6/FFFFFF.png?text=A',
  friendIds: ['user-2', 'user-3'],
  location: 'New York, USA',
  handPreference: 'right',
  preferredSports: ['Tennis', 'Padel'],
  sports: {
    Tennis: {
      racktRank: 1580,
      wins: 25,
      losses: 10,
      streak: 3,
      achievements: ['first-win', 'top-100'],
      flexedAchievementId: 'top-100',
      matchHistory: ['match-1', 'match-2', 'match-3'],
    },
    Padel: {
      racktRank: 1250,
      wins: 12,
      losses: 8,
      streak: -2,
      achievements: ['first-win'],
      matchHistory: [],
    },
    Badminton: {
      racktRank: 1100,
      wins: 5,
      losses: 5,
      streak: 1,
      achievements: [],
      matchHistory: [],
    },
    'Table Tennis': {
      racktRank: 1350,
      wins: 15,
      losses: 3,
      streak: 5,
      achievements: [],
      matchHistory: [],
    }
  },
};

export const MOCK_FRIENDS: User[] = [
    {
      uid: 'user-2',
      name: 'Ben Carter',
      username: 'bencarter',
      email: 'ben.carter@example.com',
      avatar: 'https://placehold.co/100x100/E67700/FFFFFF.png?text=B',
      friendIds: ['user-1'],
      location: 'New York, USA',
      handPreference: 'left',
      preferredSports: ['Tennis'],
      sports: {
        Tennis: {
          racktRank: 1620,
          wins: 30,
          losses: 5,
          streak: 5,
          achievements: [],
          matchHistory: [],
        }
      }
    },
    {
      uid: 'user-3',
      name: 'Chloe Davis',
      username: 'chloedavis',
      email: 'chloe.davis@example.com',
      avatar: 'https://placehold.co/100x100/7C3AED/FFFFFF.png?text=C',
      friendIds: ['user-1'],
      location: 'New York, USA',
      handPreference: 'right',
      preferredSports: ['Padel'],
      sports: {
        Padel: {
          racktRank: 1400,
          wins: 20,
          losses: 10,
          streak: -1,
          achievements: [],
          matchHistory: [],
        }
      }
    }
]

const user4: User = { ...MOCK_USER, uid: 'user-4', name: 'Diana', avatar: 'https://placehold.co/100x100.png?text=D' };

export const MOCK_MATCHES: Match[] = [
  {
    id: 'match-1',
    type: 'Singles',
    sport: 'Tennis',
    participants: ['user-1', 'user-2'],
    participantsData: {
      'user-1': { uid: 'user-1', name: MOCK_USER.name, avatar: MOCK_USER.avatar },
      'user-2': { uid: 'user-2', name: MOCK_FRIENDS[0].name, avatar: MOCK_FRIENDS[0].avatar },
    },
    teams: {
      team1: { playerIds: ['user-1'], score: 2 },
      team2: { playerIds: ['user-2'], score: 1 },
    },
    winner: ['user-1'],
    score: '6-4, 4-6, 7-5',
    date: new Date('2024-07-20').getTime(),
    createdAt: new Date('2024-07-20').getTime(),
    rankChange: [
      { userId: 'user-1', before: 1565, after: 1580 },
      { userId: 'user-2', before: 1635, after: 1620 },
    ],
  },
  {
    id: 'match-2',
    type: 'Singles',
    sport: 'Tennis',
    participants: ['user-1', 'user-3'],
    participantsData: {
        'user-1': { uid: 'user-1', name: MOCK_USER.name, avatar: MOCK_USER.avatar },
        'user-3': { uid: 'user-3', name: MOCK_FRIENDS[1].name, avatar: MOCK_FRIENDS[1].avatar },
    },
    teams: {
        team1: { playerIds: ['user-1'], score: 2 },
        team2: { playerIds: ['user-3'], score: 0 },
    },
    winner: ['user-1'],
    score: '6-2, 6-3',
    date: new Date('2024-07-18').getTime(),
    createdAt: new Date('2024-07-18').getTime(),
    rankChange: [
      { userId: 'user-1', before: 1550, after: 1565 },
      { userId: 'user-3', before: 1415, after: 1400 },
    ],
  },
  {
    id: 'match-3',
    type: 'Doubles',
    sport: 'Padel',
    participants: ['user-1', 'user-2', 'user-3', 'user-4'],
    participantsData: {
        'user-1': { uid: 'user-1', name: MOCK_USER.name, avatar: MOCK_USER.avatar },
        'user-2': { uid: 'user-2', name: MOCK_FRIENDS[0].name, avatar: MOCK_FRIENDS[0].avatar },
        'user-3': { uid: 'user-3', name: MOCK_FRIENDS[1].name, avatar: MOCK_FRIENDS[1].avatar },
        'user-4': { uid: 'user-4', name: user4.name, avatar: user4.avatar },
    },
    teams: {
        team1: { playerIds: ['user-1', 'user-2'], score: 1 },
        team2: { playerIds: ['user-3', 'user-4'], score: 2 },
    },
    winner: ['user-3', 'user-4'],
    score: '3-6, 6-4, 2-6',
    date: new Date('2024-07-15').getTime(),
    createdAt: new Date('2024-07-15').getTime(),
    rankChange: [
      { userId: 'user-1', before: 1260, after: 1250 },
      { userId: 'user-2', before: 1625, after: 1615 },
    ],
  },
];


export const MOCK_ELO_HISTORY: EloDataPoint[] = [
    { date: "Jan 24", elo: 1200 },
    { date: "Feb 24", elo: 1250 },
    { date: "Mar 24", elo: 1350 },
    { date: "Apr 24", elo: 1400 },
    { date: "May 24", elo: 1480 },
    { date: "Jun 24", elo: 1520 },
    { date: "Jul 24", elo: 1580 },
]
