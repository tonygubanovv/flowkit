import { Category, Project, Task } from '../types/Schemas';
import { dateDiffDays, todayStr } from './Helpers';
import { isDoneTask } from './TaskDomain';
import { normalizeTaskPriority, TASK_PRIORITY_RANK } from './TaskPriority';

export type TaskSortBy = 'default' | 'created' | 'deadline' | 'category' | 'priority';

type TaskFilterState = {
  categoryId: string | null;
  priority: 'high' | 'standard' | 'low' | null;
  sortBy: TaskSortBy;
};

export const compareTasksBySort = (
  left: Task,
  right: Task,
  sortBy: TaskSortBy,
  categories: Category[],
): number => {
  if (sortBy === 'deadline') {
    if (!left.deadline && !right.deadline) return 0;
    if (!left.deadline) return 1;
    if (!right.deadline) return -1;

    return left.deadline.localeCompare(right.deadline);
  }

  if (sortBy === 'created') {
    return (right.createdAt || '').localeCompare(left.createdAt || '');
  }

  if (sortBy === 'category') {
    const categoryA = categories.find((category) => category.id === left.categoryId)?.name || 'яяя';
    const categoryB = categories.find((category) => category.id === right.categoryId)?.name || 'яяя';

    return categoryA.localeCompare(categoryB, 'ru');
  }

  if (sortBy === 'priority') {
    const priorityDiff =
      TASK_PRIORITY_RANK[normalizeTaskPriority(left.priority)] -
      TASK_PRIORITY_RANK[normalizeTaskPriority(right.priority)];

    if (priorityDiff !== 0) return priorityDiff;
  }

  return (left.order ?? 0) - (right.order ?? 0);
};

export const getVisibleTasks = ({
  activeView,
  categories,
  filterProjectId,
  filters,
  isGlobalView,
  projects,
  showDone,
  tasks,
  archiveDays,
}: {
  activeView: string;
  categories: Category[];
  filterProjectId: string | null;
  filters: TaskFilterState;
  isGlobalView: boolean;
  projects: Project[];
  showDone: boolean;
  tasks: Task[];
  archiveDays: number;
}) => {
  const today = todayStr();
  let result = [...tasks];

  if (isGlobalView && filterProjectId) {
    result = result.filter((task) => task.projectId === filterProjectId);
  }

  if (filters.categoryId) {
    result = result.filter((task) => task.categoryId === filters.categoryId);
  }

  if (filters.priority) {
    result = result.filter((task) => task.priority === filters.priority);
  }

  if (activeView === 'today') {
    result = result.filter((task) => {
      const completed = isDoneTask(task, projects);

      if (completed) {
        return task.completedAt === today;
      }

      return Boolean(task.deadline && task.deadline <= today);
    });
  } else if (!isGlobalView && activeView !== 'calendar') {
    result = result.filter((task) => task.projectId === activeView);
  }

  result = result.filter((task) => {
    const completed = isDoneTask(task, projects);

    if (!showDone && completed) return false;

    if (archiveDays > 0 && completed && task.completedAt) {
      return dateDiffDays(task.completedAt, today) < archiveDays;
    }

    return true;
  });

  if (filters.sortBy !== 'default') {
    result.sort((a, b) => compareTasksBySort(a, b, filters.sortBy, categories));
  }

  return result;
};
