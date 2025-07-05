
import {
  Bot,
  Gamepad2,
  History,
  LayoutDashboard,
  Swords,
  Trophy,
  Users,
  type LucideIcon,
  Home,
  User as UserIcon,
  Settings,
  MessageSquare,
  ListOrdered,
} from 'lucide-react';

export const SPORTS = ['Tennis', 'Padel', 'Badminton', 'Table Tennis'] as const;
export type Sport = (typeof SPORTS)[number];

export const SPORT_ICONS: Record<Sport, string> = {
  'Tennis': '/tennis_icon.png',
  'Padel': '/padel_icon.png',
  'Badminton': '/badminton_icon.png',
  'Table Tennis': '/tabletennis_icon.png',
};

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const NAV_ITEMS_MAIN: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/challenges', label: 'Challenges', icon: Swords },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/match-history', label: 'Match History', icon: History },
  { href: '/games', label: 'Games', icon: Gamepad2 },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/leaderboard', label: 'Leaderboard', icon: ListOrdered },
  { href: '/coach', label: 'AI Coach', icon: Bot },
];

export const NAV_ITEMS_MOBILE: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/challenges', label: 'Challenges', icon: Swords },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
]

export const NAV_ITEMS_PROFILE: NavItem[] = [
  { href: '/profile', label: 'Profile', icon: UserIcon },
  { href: '/settings', label: 'Settings', icon: Settings },
];
