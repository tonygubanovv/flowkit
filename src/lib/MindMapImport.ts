import type { NodeObj } from 'mind-elixir';
import type { MindMap } from '../types/Schemas';
import { normalizeMindMaps } from './MindMaps';

export function parseBoardMarkdown(text: string, maps: MindMap[], projectId: string | null): { map: MindMap; legacy: boolean } {
  const title = text.match(/^#\s+(.+)$/m)?.[1].trim();
  if (!title) throw new Error('В файле нет заголовка доски (# Название).');
  const marker = text.match(/<!--\s*flowkit-board-id:\s*(\S+)\s*-->/);
  const id = marker ? decodeURIComponent(marker[1]) : undefined;
  const matches = maps.filter((map) => map.title === title);
  if (!id && matches.length > 1) throw new Error('Найдено несколько досок с таким названием. Выгрузите нужную доску заново, чтобы получить ID.');
  const existing = id ? maps.find((map) => map.id === id) : matches[0];
  const stack: { indent: number; node: NodeObj }[] = [];
  let root: NodeObj | undefined;
  let count = 0;
  const oldNodes = new Map<string, NodeObj[]>();
  const collect = (node: NodeObj) => {
    const list = oldNodes.get(node.topic) || [];
    list.push(node); oldNodes.set(node.topic, list);
    node.children?.forEach(collect);
  };
  if (existing) collect(existing.data.nodeData);
  for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (/^##\s/.test(line)) break;
    const match = line.match(/^(\s*)[-*+]\s+(?:\[[ xX]\]\s+)?(.+)$/);
    if (!match) continue;
    if (++count > 5000) throw new Error('В доске больше 5000 ветвей.');
    const topic = match[2].trim();
    const old = oldNodes.get(topic)?.shift();
    const node: NodeObj = { ...old, id: old?.id || crypto.randomUUID(), topic, children: [] };
    const indent = match[1].replace(/\t/g, '  ').length;
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (stack.length > 80) throw new Error('Слишком много уровней вложенности.');
    if (stack.length) stack[stack.length - 1].node.children!.push(node);
    else if (root) throw new Error('В Markdown должен быть один корень доски.');
    else root = node;
    stack.push({ indent, node });
  }
  if (!root) throw new Error('В файле нет ветвей доски (списка с отступами).');
  const map = normalizeMindMaps([{ ...existing, id: id || existing?.id || crypto.randomUUID(), title,
    projectId: existing ? existing.projectId : projectId, updatedAt: new Date().toISOString(),
    data: { ...existing?.data, nodeData: root, direction: existing?.data.direction ?? 2 } }])[0];
  return { map, legacy: !id && !!existing };
}
