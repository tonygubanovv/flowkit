import type { MindElixirData, NodeObj } from 'mind-elixir';
import { AppData, MindMap, MindMapAttachment, MindMapNodeMeta, MindMapObject, Note, Project, Task } from '../types/Schemas';
import { isDoneTask } from './TaskDomain';

export const MIND_MAP_FILE_LIMIT = 5 * 1024 * 1024;
export const MIND_MAP_TOTAL_LIMIT = 20 * 1024 * 1024;
export const MIND_MAP_OBJECT_LIMIT = 300;
export const MIND_MAP_COMMENT_WIDTH = 320;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const rasterUrl = (value: unknown): value is string => typeof value === 'string' && /^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=\s]+$/i.test(value);
const finite = (value: unknown, fallback: number): number => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const normalizeMindMapUrl = (value: string): string | null => {
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};

export const normalizeMindMapColor = (value: unknown): string | null =>
  typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value : null;

export const getMindMapMeta = (node: NodeObj): MindMapNodeMeta => {
  if (!record(node.metadata)) return {};
  const meta = node.metadata;
  const entity = record(meta.entity) && (meta.entity.kind === 'task' || meta.entity.kind === 'note') && typeof meta.entity.id === 'string'
    ? { kind: meta.entity.kind, id: meta.entity.id } as NonNullable<MindMapNodeMeta['entity']> : undefined;
  const attachments: MindMapAttachment[] = Array.isArray(meta.attachments) ? meta.attachments.flatMap((item) => {
    if (!record(item) || typeof item.id !== 'string' || typeof item.name !== 'string' ||
      typeof item.dataUrl !== 'string' || !/^data:application\/pdf;base64,[a-z\d+/=\s]+$/i.test(item.dataUrl) ||
      typeof item.size !== 'number' || item.size < 0 || item.size > MIND_MAP_FILE_LIMIT || item.dataUrl.length > MIND_MAP_FILE_LIMIT * 1.4) return [];
    return [{ id: item.id, name: item.name.slice(0, 200), dataUrl: item.dataUrl, size: item.size }];
  }) : [];
  return { entity, attachments };
};

export const walkMindMap = (node: NodeObj, visit: (node: NodeObj) => void): void => {
  visit(node);
  node.children?.forEach((child) => walkMindMap(child, visit));
};

export const getMindMapBytes = (data: MindElixirData): number => {
  let size = 0;
  walkMindMap(data.nodeData, (node) => {
    size += (node.image?.url.length || 0) * 0.75;
    size += (getMindMapMeta(node).attachments || []).reduce((total, file) => total + file.dataUrl.length * 0.75, 0);
  });
  return size;
};

export const createMindMap = (id: string, rootId: string, projectId: string | null): MindMap => ({
  id, projectId, title: 'Новая доска', updatedAt: new Date().toISOString(),
  data: { nodeData: { id: rootId, topic: 'Главная идея', children: [] }, direction: 2 },
});

export const upsertMindMap = (current: AppData, map: MindMap): AppData => ({
  ...current,
  mindMaps: current.mindMaps?.some((item) => item.id === map.id)
    ? current.mindMaps.map((item) => item.id === map.id ? map : item)
    : [map, ...(current.mindMaps || [])],
});

export const removeMindMap = (current: AppData, id: string): AppData => ({
  ...current, mindMaps: (current.mindMaps || []).filter((map) => map.id !== id),
});

export const projectMindMapData = (data: MindElixirData, tasks: Task[], notes: Note[], projects: Project[]): MindElixirData => {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const noteById = new Map(notes.map((note) => [note.id, note]));
  const projectNode = (node: NodeObj): NodeObj => {
    const meta = getMindMapMeta(node);
    const entity = meta.entity;
    const task = entity?.kind === 'task' ? taskById.get(entity.id) : undefined;
    const note = entity?.kind === 'note' ? noteById.get(entity.id) : undefined;
    const tag = task ? (isDoneTask(task, projects) ? 'Выполнена' : 'Задача') : note ? 'Заметка' : entity ? 'Связь недоступна' : null;
    const fileTag = meta.attachments?.length ? `PDF · ${meta.attachments.length}` : null;
    return { ...node, topic: task?.title || note?.title || node.topic,
      tags: [tag, fileTag].filter((item): item is string => !!item), children: node.children?.map(projectNode) };
  };
  return { ...data, nodeData: projectNode(data.nodeData) };
};

const markdownCell = (value: string): string => value.replace(/[\r\n]+/g, ' ').trim();

export const mindMapToMarkdown = (map: MindMap, tasks: Task[], notes: Note[], projects: Project[]): string => {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const noteById = new Map(notes.map((note) => [note.id, note]));
  const line = (node: NodeObj, depth: number): string => {
    const meta = getMindMapMeta(node);
    const task = meta.entity?.kind === 'task' ? taskById.get(meta.entity.id) : undefined;
    const note = meta.entity?.kind === 'note' ? noteById.get(meta.entity.id) : undefined;
    const topic = markdownCell(node.topic);
    const text = node.hyperLink ? `[${topic}](${node.hyperLink})` : topic;
    const marks = [
      task ? null : note ? 'заметка' : meta.entity ? 'связь недоступна' : null,
      node.image ? 'картинка' : null,
      meta.attachments?.length ? `PDF: ${meta.attachments.map((file) => markdownCell(file.name)).join(', ')}` : null,
    ].filter((mark): mark is string => !!mark);
    const bullet = task ? (isDoneTask(task, projects) ? '- [x] ' : '- [ ] ') : '- ';
    return `${'  '.repeat(depth)}${bullet}${text}${marks.length ? ` — ${marks.join(' · ')}` : ''}\n${(node.children || []).map((child) => line(child, depth + 1)).join('')}`;
  };
  const project = projects.find((item) => item.id === map.projectId);
  const blocks = (map.objects || []).filter((item) => item.text.trim())
    .map((item) => `- ${markdownCell(item.text)}`).join('\n');
  return `# ${markdownCell(map.title)}\n\n${project ? `Проект: ${markdownCell(project.name)}\n\n` : ''}${line(map.data.nodeData, 0)}${blocks ? `\n## Заметки на доске\n\n${blocks}\n` : ''}`;
};

export const normalizeMindMapObjects = (value: unknown): MindMapObject[] => {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.slice(0, MIND_MAP_OBJECT_LIMIT).flatMap((raw) => {
    if (!record(raw) || typeof raw.id !== 'string' || ids.has(raw.id)) return [];
    if (raw.kind !== 'text' && raw.kind !== 'shape' && raw.kind !== 'comment') return [];
    ids.add(raw.id);
    const color = normalizeMindMapColor(raw.color);
    const object: MindMapObject = {
      id: raw.id,
      kind: raw.kind,
      x: Math.round(clamp(finite(raw.x, 0), -100000, 100000)),
      y: Math.round(clamp(finite(raw.y, 0), -100000, 100000)),
      text: typeof raw.text === 'string' ? raw.text.slice(0, 4000) : '',
    };
    if (raw.kind === 'shape') {
      object.shape = raw.shape === 'ellipse' ? 'ellipse' : 'rect';
      object.w = Math.round(clamp(finite(raw.w, 220), 40, 4000));
      object.h = Math.round(clamp(finite(raw.h, 130), 24, 4000));
    }
    if (color) object.color = color;
    if (typeof raw.size === 'number' && raw.size >= 10 && raw.size <= 96) object.size = Math.round(raw.size);
    return [object];
  });
};

export const normalizeMindMaps = (value: unknown): MindMap[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('Некорректные карты в резервной копии');
  const mapIds = new Set<string>();
  return value.map((entry) => {
    if (!record(entry) || typeof entry.id !== 'string' || mapIds.has(entry.id) || !record(entry.data)) throw new Error('Некорректная карта');
    mapIds.add(entry.id);
    const ids = new Set<string>();
    let count = 0;
    const cleanNode = (raw: unknown, depth = 0): NodeObj => {
      if (!record(raw) || typeof raw.id !== 'string' || typeof raw.topic !== 'string' || ids.has(raw.id) || depth > 80 || ++count > 5000) throw new Error('Некорректный узел карты');
      ids.add(raw.id);
      const node: NodeObj = { id: raw.id, topic: raw.topic.slice(0, 5000) };
      if (typeof raw.expanded === 'boolean') node.expanded = raw.expanded;
      if (raw.direction === 0 || raw.direction === 1) node.direction = raw.direction;
      if (Array.isArray(raw.children)) node.children = raw.children.map((child) => cleanNode(child, depth + 1));
      if (Array.isArray(raw.tags)) node.tags = raw.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 10);
      if (typeof raw.hyperLink === 'string') node.hyperLink = normalizeMindMapUrl(raw.hyperLink) || undefined;
      const branchColor = normalizeMindMapColor(raw.branchColor);
      if (branchColor) node.branchColor = branchColor;
      if (record(raw.image) && rasterUrl(raw.image.url) && raw.image.url.length <= MIND_MAP_FILE_LIMIT * 1.4) {
        node.image = { url: raw.image.url, width: 200, height: 140, fit: 'contain' };
      }
      node.metadata = getMindMapMeta({ ...node, metadata: raw.metadata });
      return node;
    };
    const nodeData = cleanNode(entry.data.nodeData);
    const data: MindElixirData = { nodeData, direction: [0, 1, 2, 3].includes(Number(entry.data.direction)) ? entry.data.direction as 0 | 1 | 2 | 3 : 2 };
    if (Array.isArray(entry.data.arrows)) data.arrows = entry.data.arrows.flatMap((arrow) => {
      if (!record(arrow) || typeof arrow.id !== 'string' || typeof arrow.from !== 'string' || typeof arrow.to !== 'string' || !ids.has(arrow.from) || !ids.has(arrow.to)) return [];
      const point = (value: unknown) => record(value) && typeof value.x === 'number' && typeof value.y === 'number' && Number.isFinite(value.x) && Number.isFinite(value.y) ? { x: value.x, y: value.y } : undefined;
      return [{ id: arrow.id, from: arrow.from, to: arrow.to, label: typeof arrow.label === 'string' ? arrow.label : '',
        bidirectional: arrow.bidirectional === true, delta1: point(arrow.delta1), delta2: point(arrow.delta2) }];
    });
    if (Array.isArray(entry.data.summaries)) data.summaries = entry.data.summaries.flatMap((summary) => {
      if (!record(summary) || typeof summary.id !== 'string' || typeof summary.parent !== 'string' || !ids.has(summary.parent) || !Number.isInteger(summary.start) || !Number.isInteger(summary.end)) return [];
      return [{ id: summary.id, parent: summary.parent, label: typeof summary.label === 'string' ? summary.label : '', start: Number(summary.start), end: Number(summary.end) }];
    });
    if (getMindMapBytes(data) > MIND_MAP_TOTAL_LIMIT) throw new Error('Вложения карты превышают 20 МБ');
    return { id: entry.id, title: typeof entry.title === 'string' ? entry.title : nodeData.topic,
      projectId: typeof entry.projectId === 'string' ? entry.projectId : null,
      updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : new Date().toISOString(), data,
      objects: normalizeMindMapObjects(entry.objects) };
  });
};
