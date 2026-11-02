import { AppData, ID, Note, Project, Task, TaskHistoryEvent } from '../types/Schemas';
import { todayStr } from './Helpers';
import { compareTasksBySort, TaskSortBy } from './TaskFilters';
import {
  appendTaskHistory,
  buildTaskHistoryEvents,
  getColumnName,
  getCompletedStateForColumnMove,
  getCompletionDate,
  getProjectColumns,
  makeHistoryEvent,
} from './TaskDomain';
import { syncTaskLinks } from './TaskLinks';

export const upsertTask = (current: AppData, task: Task): AppData => {
  const columns = getProjectColumns(current.projects, task.projectId);
  const existingTask = current.tasks.find((item) => item.id === task.id);
  const now = new Date().toISOString();
  const completed =
    columns.find((column) => column.id === task.columnId)?.isDone === true
      ? true
      : existingTask && columns.find((column) => column.id === existingTask.columnId)?.isDone === true
        ? false
        : task.completed;

  const nextTask: Task = {
    ...task,
    completed,
    createdAt: existingTask?.createdAt || now,
    statusUpdatedAt: existingTask && existingTask.columnId !== task.columnId ? now : existingTask?.statusUpdatedAt || now,
    completedAt: getCompletionDate({ ...task, completed }, existingTask, columns),
  };
  const nextTaskWithHistory = appendTaskHistory(
    nextTask,
    buildTaskHistoryEvents(existingTask, nextTask, current.projects, current.categories, now),
  );

  if (existingTask) {
    const tasks = current.tasks.map((item) => (item.id === task.id ? nextTaskWithHistory : item));
    return {
      ...current,
      tasks: syncTaskLinks(tasks, nextTaskWithHistory),
    };
  }

  const nextTaskWithOrder = {
    ...nextTaskWithHistory,
    order: current.tasks.filter((item) => item.columnId === task.columnId).length,
  };

  return {
    ...current,
    tasks: syncTaskLinks([...current.tasks, nextTaskWithOrder], nextTaskWithOrder),
  };
};

export const markTaskDeleted = (task: Task): Task => {
  const deletedAt = new Date().toISOString();

  return appendTaskHistory(task, [
    makeHistoryEvent('deleted', 'Задача удалена', {
      details: task.completed ? 'Была закрыта перед удалением' : 'Была открыта перед удалением',
    }, deletedAt),
  ]);
};

export const removeTask = (current: AppData, id: ID): AppData => ({
  ...current,
  tasks: current.tasks
    .filter((item) => item.id !== id)
    .map((item) => ({ ...item, links: (item.links || []).filter((link) => link.taskId !== id) })),
});

export const restoreTask = (current: AppData, task: Task): AppData => ({
  ...current,
  tasks: [...current.tasks, task],
});

export const upsertNote = (current: AppData, note: Note): AppData => {
  const exists = current.notes.some((item) => item.id === note.id);

  return {
    ...current,
    notes: exists
      ? current.notes.map((item) => (item.id === note.id ? note : item))
      : [{ ...note, updatedAt: todayStr() }, ...current.notes],
  };
};

export const removeNote = (current: AppData, id: ID): AppData => ({
  ...current,
  notes: current.notes.filter((note) => note.id !== id),
});

export const reorderNotesInData = (
  current: AppData,
  dragId: ID,
  targetId: ID,
  side: 'before' | 'after',
): AppData => {
  const notes = [...current.notes];
  const dragIndex = notes.findIndex((note) => note.id === dragId);
  const targetIndex = notes.findIndex((note) => note.id === targetId);

  if (dragIndex < 0 || targetIndex < 0 || dragId === targetId) {
    return current;
  }

  const [draggedNote] = notes.splice(dragIndex, 1);
  const nextTargetIndex = notes.findIndex((note) => note.id === targetId);

  if (nextTargetIndex < 0) {
    return current;
  }

  const insertIndex = side === 'before' ? nextTargetIndex : nextTargetIndex + 1;
  notes.splice(insertIndex, 0, draggedNote);

  return {
    ...current,
    notes,
  };
};

export const moveTaskToColumnInData = (current: AppData, taskId: ID, columnId: ID): AppData => {
  const task = current.tasks.find((item) => item.id === taskId);
  if (!task) return current;
  if (task.columnId === columnId) return current;

  const columns = getProjectColumns(current.projects, task.projectId);
  const completed = getCompletedStateForColumnMove(task, columnId, columns);

  const nextTask: Task = {
    ...task,
    columnId,
    completed,
    statusUpdatedAt: task.columnId !== columnId ? new Date().toISOString() : task.statusUpdatedAt,
  };

  nextTask.completedAt = getCompletionDate(nextTask, task, columns);
  const movedAt = nextTask.statusUpdatedAt || new Date().toISOString();
  const nextTaskWithHistory = appendTaskHistory(nextTask, [
    makeHistoryEvent('moved', 'Статус изменен', {
      from: getColumnName(current.projects, task.projectId, task.columnId),
      to: getColumnName(current.projects, task.projectId, columnId),
    }, movedAt),
    ...(task.completed !== nextTask.completed
      ? [makeHistoryEvent(nextTask.completed ? 'completed' : 'reopened', nextTask.completed ? 'Задача закрыта' : 'Задача переоткрыта', undefined, movedAt)]
      : []),
  ]);

  return {
    ...current,
    tasks: current.tasks.map((item) => (item.id === taskId ? nextTaskWithHistory : item)),
  };
};

export const reorderTaskInData = (
  current: AppData,
  dragId: ID,
  targetId: ID,
  side: 'top' | 'bottom',
  targetColumnId: ID,
): AppData => {
  const dragTask = current.tasks.find((task) => task.id === dragId);
  if (!dragTask) return current;

  const otherTasks = current.tasks.filter((task) => task.id !== dragId);
  const columnTasks = otherTasks
    .filter((task) => task.columnId === targetColumnId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const targetIndex = columnTasks.findIndex((task) => task.id === targetId);
  const insertIndex = side === 'top' ? targetIndex : targetIndex + 1;
  const columns = getProjectColumns(current.projects, dragTask.projectId);
  const completed = getCompletedStateForColumnMove(dragTask, targetColumnId, columns);

  const nextDragTask: Task = {
    ...dragTask,
    columnId: targetColumnId,
    completed,
    statusUpdatedAt: dragTask.columnId !== targetColumnId ? new Date().toISOString() : dragTask.statusUpdatedAt,
  };

  nextDragTask.completedAt = getCompletionDate(nextDragTask, dragTask, columns);
  const movedAt = nextDragTask.statusUpdatedAt || new Date().toISOString();
  const reorderEvents: TaskHistoryEvent[] = dragTask.columnId !== targetColumnId
    ? [
        makeHistoryEvent('moved', 'Статус изменен', {
          from: getColumnName(current.projects, dragTask.projectId, dragTask.columnId),
          to: getColumnName(current.projects, dragTask.projectId, targetColumnId),
        }, movedAt),
      ]
    : [makeHistoryEvent('reordered', side === 'top' ? 'Поднята в дорожке' : 'Опущена в дорожке', undefined, movedAt)];

  if (dragTask.completed !== nextDragTask.completed) {
    reorderEvents.push(makeHistoryEvent(nextDragTask.completed ? 'completed' : 'reopened', nextDragTask.completed ? 'Задача закрыта' : 'Задача переоткрыта', undefined, movedAt));
  }

  const nextDragTaskWithHistory = appendTaskHistory(nextDragTask, reorderEvents);

  columnTasks.splice(insertIndex, 0, nextDragTaskWithHistory);
  columnTasks.forEach((task, index) => {
    task.order = index;
  });

  return {
    ...current,
    tasks: [...otherTasks.filter((task) => task.columnId !== targetColumnId), ...columnTasks],
  };
};

export const moveTaskToLaneEdgeInData = (current: AppData, taskId: ID, edge: 'top' | 'bottom'): AppData => {
  const task = current.tasks.find((item) => item.id === taskId);
  if (!task) return current;

  const columnTasks = current.tasks
    .filter((item) => item.columnId === task.columnId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const taskIndex = columnTasks.findIndex((item) => item.id === taskId);

  if (taskIndex < 0) return current;
  if ((edge === 'top' && taskIndex === 0) || (edge === 'bottom' && taskIndex === columnTasks.length - 1)) {
    return current;
  }

  const [movedTaskRaw] = columnTasks.splice(taskIndex, 1);
  const movedTask = appendTaskHistory(movedTaskRaw, [
    makeHistoryEvent('reordered', edge === 'top' ? 'Поднята в верх дорожки' : 'Опущена в низ дорожки'),
  ]);

  if (edge === 'top') {
    columnTasks.unshift(movedTask);
  } else {
    columnTasks.push(movedTask);
  }

  const orderedTasks = new Map<ID, Task>();
  columnTasks.forEach((item, index) => {
    orderedTasks.set(item.id, { ...item, order: index });
  });

  return {
    ...current,
    tasks: current.tasks.map((item) => orderedTasks.get(item.id) || item),
  };
};

export const applySortToProjectTasksInData = (
  current: AppData,
  projectId: ID,
  sortBy: TaskSortBy,
  categoryId: ID | null,
): AppData => {
  if (sortBy === 'default') return current;

  const project = current.projects.find((item) => item.id === projectId);
  if (!project) return current;

  const nextTasks = [...current.tasks];
  const taskIndexes = new Map<ID, number>();
  nextTasks.forEach((task, index) => taskIndexes.set(task.id, index));

  let changed = false;

  for (const column of project.columns) {
    const columnTasks = nextTasks
      .filter((task) => task.projectId === projectId && task.columnId === column.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (columnTasks.length < 2) continue;

    const matchingTasks = columnTasks
      .filter((task) => !categoryId || task.categoryId === categoryId)
      .sort((left, right) => {
        const compared = compareTasksBySort(left, right, sortBy, current.categories);
        if (compared !== 0) return compared;
        return (left.order ?? 0) - (right.order ?? 0);
      });

    if (matchingTasks.length < 2) continue;

    const matchingIds = new Set(matchingTasks.map((task) => task.id));
    let matchingIndex = 0;

    const reorderedColumn = columnTasks.map((task) =>
      matchingIds.has(task.id) ? matchingTasks[matchingIndex++] : task,
    );

    reorderedColumn.forEach((task, index) => {
      if ((task.order ?? 0) !== index) {
        changed = true;
      }

      const taskIndex = taskIndexes.get(task.id);
      if (taskIndex !== undefined) {
        nextTasks[taskIndex] = { ...task, order: index };
      }
    });
  }

  if (!changed) return current;

  return {
    ...current,
    tasks: nextTasks,
  };
};

export const toggleTaskInData = (current: AppData, id: ID): AppData => {
  const task = current.tasks.find((item) => item.id === id);
  if (!task) return current;

  const columns = getProjectColumns(current.projects, task.projectId);

  const nextTask: Task = {
    ...task,
    completed: !task.completed,
    statusUpdatedAt: new Date().toISOString(),
  };

  nextTask.completedAt = getCompletionDate(nextTask, task, columns);
  const nextTaskWithHistory = appendTaskHistory(nextTask, [
    makeHistoryEvent(nextTask.completed ? 'completed' : 'reopened', nextTask.completed ? 'Задача закрыта' : 'Задача переоткрыта', undefined, nextTask.statusUpdatedAt || new Date().toISOString()),
  ]);

  return {
    ...current,
    tasks: current.tasks.map((item) => (item.id === id ? nextTaskWithHistory : item)),
  };
};

export const upsertProject = (current: AppData, project: Project): AppData => ({
  ...current,
  projects: current.projects.map((item) => (item.id === project.id ? project : item)),
});

export const removeProject = (current: AppData, id: ID): AppData => ({
  ...current,
  projects: current.projects.filter((project) => project.id !== id),
  tasks: current.tasks
    .filter((task) => task.projectId !== id)
    .map((task) => ({
      ...task,
      links: (task.links || []).filter(
        (link) => current.tasks.find((linkedTask) => linkedTask.id === link.taskId)?.projectId !== id,
      ),
    })),
  projectsOrder: current.projectsOrder.filter((projectId) => projectId !== id),
});

export const renameProjectInData = (current: AppData, id: ID, name: string): AppData => ({
  ...current,
  projects: current.projects.map((project) => (project.id === id ? { ...project, name } : project)),
});

export const updateProjectColorInData = (current: AppData, id: ID, color: string): AppData => ({
  ...current,
  projects: current.projects.map((project) => (project.id === id ? { ...project, color } : project)),
});

export const addProject = (current: AppData, project: Project): AppData => ({
  ...current,
  projects: [...current.projects, project],
  projectsOrder: [...current.projectsOrder, project.id],
});

export const reorderProjects = (current: AppData, fromId: ID, toId: ID): AppData => {
  const order = [...current.projectsOrder];
  const fromIndex = order.indexOf(fromId);
  const toIndex = order.indexOf(toId);

  if (fromIndex < 0 || toIndex < 0) return current;

  const [movedProjectId] = order.splice(fromIndex, 1);
  order.splice(toIndex, 0, movedProjectId);

  return {
    ...current,
    projectsOrder: order,
  };
};
