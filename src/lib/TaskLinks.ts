import { ID, Task, TaskLink, TaskLinkType } from '../types/Schemas';

export const TASK_LINK_OPTIONS: Array<{ id: TaskLinkType; name: string }> = [
  { id: 'related', name: 'Связана с' },
  { id: 'blocked_by', name: 'Зависит от' },
  { id: 'blocks', name: 'Блокирует' },
];

export const getTaskLinkLabel = (type: TaskLinkType) =>
  TASK_LINK_OPTIONS.find((option) => option.id === type)?.name || 'Связана с';

export const getReverseTaskLinkType = (type: TaskLinkType): TaskLinkType => {
  if (type === 'blocks') return 'blocked_by';
  if (type === 'blocked_by') return 'blocks';
  return 'related';
};

export const cleanTaskLinks = (links: TaskLink[] | undefined, selfId: ID, validIds: Set<ID>): TaskLink[] => {
  const seen = new Set<ID>();

  return (links || []).filter((link) => {
    if (!link || link.taskId === selfId || !validIds.has(link.taskId) || seen.has(link.taskId)) return false;
    if (!TASK_LINK_OPTIONS.some((option) => option.id === link.type)) return false;
    seen.add(link.taskId);
    return true;
  });
};

export const syncTaskLinks = (tasks: Task[], sourceTask: Task): Task[] => {
  const validIds = new Set(tasks.map((task) => task.id));
  const sourceLinks = cleanTaskLinks(sourceTask.links, sourceTask.id, validIds);
  const relationByTaskId = new Map(sourceLinks.map((link) => [link.taskId, link.type]));

  return tasks.map((task) => {
    if (task.id === sourceTask.id) return { ...sourceTask, links: sourceLinks };

    const linksWithoutSource = (task.links || []).filter((link) => link.taskId !== sourceTask.id);
    const relationType = relationByTaskId.get(task.id);

    return {
      ...task,
      links: relationType
        ? [...linksWithoutSource, { taskId: sourceTask.id, type: getReverseTaskLinkType(relationType) }]
        : linksWithoutSource,
    };
  });
};

export const normalizeTaskLinks = (tasks: Task[]): Task[] => {
  const validIds = new Set(tasks.map((task) => task.id));
  const cleaned = tasks.map((task) => ({ ...task, links: cleanTaskLinks(task.links, task.id, validIds) }));
  const byId = new Map(cleaned.map((task) => [task.id, task]));
  const relationMaps = new Map<ID, Map<ID, TaskLinkType>>(
    cleaned.map((task) => [task.id, new Map<ID, TaskLinkType>()]),
  );
  const processedPairs = new Set<string>();

  for (const task of cleaned) {
    for (const link of task.links || []) {
      const pairKey = [task.id, link.taskId].sort().join('\u0000');
      if (processedPairs.has(pairKey) || !byId.has(link.taskId)) continue;
      processedPairs.add(pairKey);

      relationMaps.get(task.id)?.set(link.taskId, link.type);
      relationMaps.get(link.taskId)?.set(task.id, getReverseTaskLinkType(link.type));
    }
  }

  return cleaned.map((task) => ({
    ...task,
    links: Array.from(relationMaps.get(task.id)?.entries() || []).map(([taskId, type]) => ({ taskId, type })),
  }));
};
