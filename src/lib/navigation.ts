

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
  Menu,
  Dumbbell,
  LifeBuoy,
  Map,
} from 'lucide-react';

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
  { href: '/courts', label: 'Find Courts', icon: Map },
  { href: '/match-history', label: 'Match History', icon: History },
  { href: '/practice', label: 'Practice Log', icon: Dumbbell },
  { href: '/games', label: 'Games', icon: Gamepad2 },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/leaderboard', label: 'Leaderboard', icon: ListOrdered },
  { href: '/coach', label: 'AI Coach', icon: Bot },
];

export const NAV_ITEMS_MOBILE_MAIN: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/challenges', label: 'Challenges', icon: Swords },
    { href: '/courts', label: 'Find Courts', icon: Map },
    { href: '/profile', label: 'Profile', icon: UserIcon },
];

export const NAV_ITEMS_MOBILE_MORE: NavItem[] = [
  // Social
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/friends', label: 'Friends', icon: Users },
  // Performance
  { href: '/match-history', label: 'Match History', icon: History },
  { href: '/practice', label: 'Practice Log', icon: Dumbbell },
  { href: '/leaderboard', label: 'Leaderboard', icon: ListOrdered },
  // AI Tools
  { href: '/coach', label: 'AI Coach', icon: Bot },
  { href: '/games', label: 'AI Games', icon: Gamepad2 },
  // Account
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/legal/support', label: 'Support', icon: LifeBuoy },
];


export const NAV_ITEMS_PROFILE: NavItem[] = [
  { href: '/profile', label: 'Profile', icon: UserIcon },
  { href: '/settings', label: 'Settings', icon: Settings },
];
