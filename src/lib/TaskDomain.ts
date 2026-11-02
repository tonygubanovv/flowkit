import { Category, Column, ID, Project, Task, TaskHistoryEvent, TaskHistoryEventType } from '../types/Schemas';
import { formatRuDate, genId, todayStr } from './Helpers';

export const isDoneTask = (task: Task, projects: Project[]) => {
  if (task.completed) return true;

  const project = projects.find((item) => item.id === task.projectId);
  return project?.columns.find((column) => column.id === task.columnId)?.isDone === true;
};

export const getProjectColumns = (projects: Project[], projectId: ID) => {
  return projects.find((project) => project.id === projectId)?.columns || [];
};

export const getCompletionDate = (nextTask: Task, previousTask: Task | undefined, columns: Column[]) => {
  const isNowDone = nextTask.completed || columns.find((column) => column.id === nextTask.columnId)?.isDone;
  const wasDone = previousTask
    ? previousTask.completed || columns.find((column) => column.id === previousTask.columnId)?.isDone
    : false;

  if (isNowDone && !wasDone) return todayStr();
  if (!isNowDone && wasDone) return null;

  return nextTask.completedAt;
};

export const getCompletedStateForColumnMove = (previousTask: Task, nextColumnId: ID, columns: Column[]) => {
  const targetIsDone = columns.find((column) => column.id === nextColumnId)?.isDone === true;
  const previousColumnIsDone = columns.find((column) => column.id === previousTask.columnId)?.isDone === true;

  if (targetIsDone) return true;
  if (previousColumnIsDone) return false;

  return previousTask.completed;
};

export const getDeletedTaskMessage = (task: Task) => {
  const title = task.title.trim();
  if (!title) return 'Задача удалена';

  const shortTitle = title.length > 24 ? `${title.slice(0, 24)}...` : title;
  return `«${shortTitle}» удалена`;
};

const cleanText = (value?: string | null) =>
  (value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const shortValue = (value?: string | null) => {
  const text = cleanText(value) || 'пусто';
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
};

export const makeHistoryEvent = (
  type: TaskHistoryEventType,
  label: string,
  options: Partial<Omit<TaskHistoryEvent, 'id' | 'type' | 'label' | 'at'>> = {},
  at = new Date().toISOString(),
): TaskHistoryEvent => ({
  id: genId(),
  type,
  label,
  at,
  ...options,
});

export const appendTaskHistory = (task: Task, events: TaskHistoryEvent[]) => {
  if (!events.length) return task;

  return {
    ...task,
    history: [...(task.history || []), ...events],
  };
};

export const getColumnName = (projects: Project[], projectId: ID, columnId?: ID | null) => {
  const project = projects.find((item) => item.id === projectId);
  return project?.columns.find((column) => column.id === columnId)?.name || 'Без статуса';
};

const getProjectName = (projects: Project[], projectId?: ID | null) =>
  projects.find((project) => project.id === projectId)?.name || 'Без проекта';

const getCategoryName = (categories: Category[], categoryId?: ID | null) =>
  categories.find((category) => category.id === categoryId)?.name || 'Без метки';

const formatDeadlineValue = (deadline?: string | null, time?: string | null) => {
  if (!deadline) return 'Без срока';
  return time ? `${formatRuDate(deadline)} ${time}` : formatRuDate(deadline);
};

export const buildTaskHistoryEvents = (
  previousTask: Task | undefined,
  nextTask: Task,
  projects: Project[],
  categories: Category[],
  at: string,
) => {
  if (!previousTask) {
    return [
      makeHistoryEvent('created', 'Задача создана', {
        details: nextTask.title ? `Название: ${shortValue(nextTask.title)}` : undefined,
      }, at),
    ];
  }

  const events: TaskHistoryEvent[] = [];

  if (previousTask.title !== nextTask.title) {
    events.push(makeHistoryEvent('updated', 'Название изменено', {
      from: shortValue(previousTask.title),
      to: shortValue(nextTask.title),
    }, at));
  }

  if (cleanText(previousTask.description) !== cleanText(nextTask.description)) {
    events.push(makeHistoryEvent('updated', 'Описание обновлено', undefined, at));
  }

  if (previousTask.projectId !== nextTask.projectId) {
    events.push(makeHistoryEvent('project_changed', 'Проект изменен', {
      from: getProjectName(projects, previousTask.projectId),
      to: getProjectName(projects, nextTask.projectId),
    }, at));
  }

  if (previousTask.columnId !== nextTask.columnId) {
    events.push(makeHistoryEvent('moved', 'Статус изменен', {
      from: getColumnName(projects, previousTask.projectId, previousTask.columnId),
      to: getColumnName(projects, nextTask.projectId, nextTask.columnId),
    }, at));
  }

  if (previousTask.categoryId !== nextTask.categoryId) {
    events.push(makeHistoryEvent('category_changed', 'Метка изменена', {
      from: getCategoryName(categories, previousTask.categoryId),
      to: getCategoryName(categories, nextTask.categoryId),
    }, at));
  }

  if (previousTask.deadline !== nextTask.deadline || previousTask.time !== nextTask.time) {
    events.push(makeHistoryEvent('deadline_changed', 'Срок изменен', {
      from: formatDeadlineValue(previousTask.deadline, previousTask.time),
      to: formatDeadlineValue(nextTask.deadline, nextTask.time),
    }, at));
  }

  if (previousTask.completed !== nextTask.completed) {
    events.push(makeHistoryEvent(nextTask.completed ? 'completed' : 'reopened', nextTask.completed ? 'Задача закрыта' : 'Задача переоткрыта', undefined, at));
  }

  const previousCommentIds = new Set((previousTask.comments || []).map((comment) => comment.id));
  const nextCommentIds = new Set((nextTask.comments || []).map((comment) => comment.id));
  const addedComments = (nextTask.comments || []).filter((comment) => !previousCommentIds.has(comment.id));
  const removedComments = (previousTask.comments || []).filter((comment) => !nextCommentIds.has(comment.id));

  if (addedComments.length) {
    events.push(makeHistoryEvent('comment_added', addedComments.length === 1 ? 'Комментарий добавлен' : `Добавлено комментариев: ${addedComments.length}`, {
      details: addedComments.length === 1 ? shortValue(addedComments[0].text) : undefined,
    }, at));
  }

  if (removedComments.length) {
    events.push(makeHistoryEvent('comment_removed', removedComments.length === 1 ? 'Комментарий удален' : `Удалено комментариев: ${removedComments.length}`, undefined, at));
  }

  return events;
};
