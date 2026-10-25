import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  GraduationCap,
  BookMarked,
  CalendarCheck,
  BarChart3,
  ListChecks,
  Settings,
} from 'lucide-react';

export const NAV_ITEMS = [
  {
    name: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    isImplemented: true,
  },
  {
    name: 'Subjects & Topics',
    to: '/subjects',
    icon: BookOpen,
    isImplemented: true,
  },
  {
    name: 'Study Materials',
    to: '/materials',
    icon: FileText,
    isImplemented: true,
  },
  {
    name: 'Quizzes',
    to: '/quizzes',
    icon: GraduationCap,
    isImplemented: true,
  },
  {
    name: 'Mistake Book',
    to: '/mistake-book',
    icon: BookMarked,
    isImplemented: true,
  },
  {
    name: 'Exam Paper Generator',
    to: '/exam-paper-generator',
    icon: FileText,
    isImplemented: true,
  },
  {
    name: 'Important Topics',
    to: '/important-topics',
    icon: ListChecks,
    isImplemented: true,
  },
  {
    name: 'Performance Analytics',
    to: '/analytics',
    icon: BarChart3,
    isImplemented: true,
  },
  {
    name: 'Settings & Profile',
    to: '/settings',
    icon: Settings,
    isImplemented: true,
  },
  {
    name: 'Revision Planner',
    to: '/revisions',
    icon: CalendarCheck,
    isImplemented: false,
    badge: 'Upcoming',
  },
];
