import { Task } from '../types/Schemas';

export const searchTasks = (tasks: Task[], query: string): Task[] => {
  const normalized = query.trim().toLocaleLowerCase('ru');
  if (normalized.length < 2) return [];
  return tasks.filter((task) => {
    const description = (task.description || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ');
    return `${task.title} ${description}`.toLocaleLowerCase('ru').includes(normalized);
  });
};
