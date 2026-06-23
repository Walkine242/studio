import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Timer,
  Trophy,
  History,
  BarChart3,
  Swords,
  User,
  Sparkles,
  Goal,
  Flame,
  ChevronDown,
  PersonStanding,
  Dumbbell,
  Anchor,
  Video,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  type: 'link';
}

interface NavDropdown {
  label: string;
  icon: LucideIcon;
  type: 'dropdown';
  items: NavItem[];
}

export type NavItemConfig = NavItem | NavDropdown;

export const navItems: NavItemConfig[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, type: 'link' },
  { href: '/profile', label: 'Profile', icon: User, type: 'link' },
  { href: '/dual', label: 'Dual Mode', icon: Swords, type: 'link' },
   {
    type: 'dropdown',
    label: 'Leaderboard',
    icon: ChevronDown,
    items: [
      { href: '/leaderboard', label: 'League', icon: BarChart3, type: 'link' },
      { href: '/leaderboard/endurance', label: 'Endurance', icon: Anchor, type: 'link' },
    ]
  },
  {
    type: 'dropdown',
    label: 'Training',
    icon: ChevronDown,
    items: [
      { href: '/workout-generator', label: 'Workout Generator', icon: Flame, type: 'link' },
      { href: '/training/logs', label: 'Workout Logs', icon: History, type: 'link' },
    ]
  },
  { href: '/premium', label: 'Premium', icon: Sparkles, type: 'link' },
];
