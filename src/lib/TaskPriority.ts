import { TaskPriority } from '../types/Schemas';

export interface TaskPriorityMeta {
  id: TaskPriority;
  name: string;
  icon?: string;
  color: string;
  iconColor?: string;
  rank: number;
  badgeBg: string;
  badgeBorder: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

export const DEFAULT_TASK_PRIORITY: TaskPriority = 'standard';

export const TASK_PRIORITY_OPTIONS: TaskPriorityMeta[] = [
  {
    id: 'high',
    name: 'Высокий',
    icon: 'bolt',
    color: 'var(--accent)',
    iconColor: 'var(--accent)',
    rank: 0,
    badgeBg: 'var(--accent-dim)',
    badgeBorder: 'var(--accent)',
    activeBg: 'var(--accent)',
    activeBorder: 'var(--accent)',
    activeText: 'var(--accent-text)',
  },
  {
    id: 'standard',
    name: 'Стандарт',
    color: 'var(--text2)',
    iconColor: 'var(--text2)',
    rank: 1,
    badgeBg: 'rgba(255,255,255,0.06)',
    badgeBorder: 'var(--border2)',
    activeBg: 'rgba(255,255,255,0.09)',
    activeBorder: 'var(--border2)',
    activeText: 'var(--text)',
  },
  {
    id: 'low',
    name: 'Низкий',
    icon: 'chevronsDown',
    color: 'var(--muted)',
    iconColor: 'var(--text2)',
    rank: 2,
    badgeBg: 'rgba(255,255,255,0.05)',
    badgeBorder: 'var(--border2)',
    activeBg: 'rgba(255,255,255,0.07)',
    activeBorder: 'var(--border2)',
    activeText: 'var(--text2)',
  },
];

export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = TASK_PRIORITY_OPTIONS.reduce(
  (acc, option) => {
    acc[option.id] = option.rank;
    return acc;
  },
  {} as Record<TaskPriority, number>,
);

export const isTaskPriority = (value: unknown): value is TaskPriority =>
  value === 'high' || value === 'standard' || value === 'low';

export const normalizeTaskPriority = (value: unknown): TaskPriority =>
  isTaskPriority(value) ? value : DEFAULT_TASK_PRIORITY;

export const getTaskPriorityMeta = (priority: unknown): TaskPriorityMeta =>
  TASK_PRIORITY_OPTIONS.find((option) => option.id === normalizeTaskPriority(priority)) || TASK_PRIORITY_OPTIONS[1];

export const getTaskPriorityIcon = (priority: unknown): string | null => getTaskPriorityMeta(priority).icon || null;
