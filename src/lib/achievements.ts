
import type { Match, Achievement } from './types';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: (context: { opponentName: string }) => string;
  icon: string; // Lucide icon name
  checker: (matches: Match[], currentUserId: string) => { date: number } | null;
}

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: ({ opponentName }) => `Earn your first victory against ${opponentName}.`,
    icon: 'Swords',
    checker: (matches, currentUserId) => {
      const firstWin = matches
        .filter(m => m.winner.includes(currentUserId))
        .sort((a, b) => a.date - b.date)[0];
      return firstWin ? { date: firstWin.date } : null;
    },
  },
  {
    id: 'win_streak_3',
    name: 'On a Roll',
    description: ({ opponentName }) => `Win 3 consecutive matches against ${opponentName}.`,
    icon: 'Flame',
    checker: (matches, currentUserId) => {
      let streak = 0;
      let lastWinDate: number | null = null;
      for (const match of matches.sort((a, b) => a.date - b.date)) {
        if (match.winner.includes(currentUserId)) {
          streak++;
          if (streak >= 3) {
            lastWinDate = match.date;
          }
        } else {
          streak = 0;
        }
      }
      return lastWinDate ? { date: lastWinDate } : null;
    },
  },
  {
    id: 'dominator',
    name: 'Dominator',
    description: ({ opponentName }) => `Win a total of 5 matches against ${opponentName}.`,
    icon: 'Trophy',
    checker: (matches, currentUserId) => {
      const wins = matches.filter(m => m.winner.includes(currentUserId));
      if (wins.length >= 5) {
        return { date: wins.sort((a, b) => a.date - b.date)[4].date };
      }
      return null;
    },
  },
  {
    id: 'rivalry',
    name: 'Established Rivalry',
    description: ({ opponentName }) => `Play 10 matches against ${opponentName}.`,
    icon: 'Users',
    checker: (matches, currentUserId) => {
        if (matches.length >= 10) {
            return { date: matches.sort((a,b) => a.date - b.date)[9].date };
        }
        return null;
    }
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: ({ opponentName }) => `Win a match against ${opponentName} after losing at least 2 in a row.`,
    icon: 'Undo2',
    checker: (matches, currentUserId) => {
        let lossStreak = 0;
        for (const match of matches.sort((a, b) => a.date - b.date)) {
            if (match.winner.includes(currentUserId)) {
                if (lossStreak >= 2) {
                    return { date: match.date };
                }
                lossStreak = 0;
            } else {
                lossStreak++;
            }
        }
        return null;
    }
  }
];

export function calculateRivalryAchievements(matches: Match[], currentUserId: string, opponentName: string): Achievement[] {
  const earnedAchievements: Achievement[] = [];
  
  if (!matches || matches.length === 0) {
    return [];
  }

  for (const def of achievementDefinitions) {
    const result = def.checker(matches, currentUserId);
    if (result) {
      earnedAchievements.push({
        id: def.id,
        name: def.name,
        description: def.description({ opponentName }),
        date: result.date,
        icon: def.icon,
      });
    }
  }

  return earnedAchievements;
}
