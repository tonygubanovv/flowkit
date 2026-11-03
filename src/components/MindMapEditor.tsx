import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import MindElixir, { MindElixirData, NodeObj, Topic } from 'mind-elixir';
import { ru } from 'mind-elixir/i18n';
import 'mind-elixir/style.css';
import { MindMap, MindMapNodeMeta, Note, Project, Task } from '../types/Schemas';
import { getMindMapMeta, projectMindMapData } from '../lib/MindMaps';
import { MIND_MAP_CSS, MIND_MAP_STYLES as S, MIND_MAP_THEME } from '../styles/MindMapStyles';

export interface MindMapEditorHandle {
  addNode: (node?: NodeObj) => void;
  patchNode: (id: string, patch: Partial<NodeObj>) => void;
  undo: () => void;
  redo: () => void;
  center: () => void;
  fit: () => void;
  zoom: (delta: number) => void;
}

export type MindMapNodeAction = 'task' | 'note' | 'link' | 'files';

interface Props {
  map: MindMap;
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  onChange: (data: MindElixirData) => void;
  onSelect: (node: NodeObj | null) => void;
  onNodeAction: (node: NodeObj, action: MindMapNodeAction, point: { x: number; y: number }) => void;
  onOpenEntity: (entity: NonNullable<MindMapNodeMeta['entity']>) => void;
}

const syncEntities = (mind: MindElixir, props: Props) => {
  const ids = mind.currentNodes.map((element) => element.nodeObj.id);
  mind.refresh(projectMindMapData(mind.getData(), props.tasks, props.notes, props.projects));
  const selected = ids.filter((id) => mind.getObjById(id, mind.nodeData)).map((id) => mind.findEle(id));
  if (selected.length) mind.selectNodes(selected);
  props.onSelect(selected.length === 1 ? { ...selected[0].nodeObj } : null);
};

export const MindMapEditor = forwardRef<MindMapEditorHandle, Props>(function MindMapEditor(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<MindElixir | null>(null);
  const pan = useRef<{ id: number; x: number; y: number } | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(100);

  useImperativeHandle(ref, () => ({
    addNode: (node) => { void instance.current?.addChild(undefined, node); },
    patchNode: (id, patch) => {
      const mind = instance.current;
      if (!mind) return;
      const element = mind.findEle(id);
      if (element) {
        const data = projectMindMapData({ nodeData: { ...element.nodeObj, ...patch } }, latest.current.tasks, latest.current.notes, latest.current.projects);
        void mind.reshapeNode(element, { ...patch, topic: data.nodeData.topic, tags: data.nodeData.tags });
      }
    },
    undo: () => { instance.current?.undo(); },
    redo: () => { instance.current?.redo(); },
    center: () => { instance.current?.toCenter(); },
    fit: () => { instance.current?.scaleFit(); },
    zoom: (delta) => {
      const mind = instance.current;
      if (mind) mind.scale(Math.max(.2, Math.min(2, mind.scaleVal + delta)));
    },
  }), []);

  useEffect(() => {
    if (!host.current) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: MindElixirData | null = null;
    const flush = () => {
      if (timer) clearTimeout(timer);
      if (pending) { latest.current.onChange(pending); pending = null; }
    };
    const requestAction = (action: MindMapNodeAction) => (event: MouseEvent) => {
      const node = mind.currentNodes[0]?.nodeObj || mind.nodeData;
      const menu = mind.container.querySelector<HTMLElement>('.context-menu');
      if (menu) menu.hidden = true;
      latest.current.onNodeAction({ ...node }, action, { x: event.clientX, y: event.clientY });
    };
    const mind: MindElixir = new MindElixir({
      el: host.current, theme: MIND_MAP_THEME, direction: 2, newTopicName: 'Новая мысль',
      contextMenu: { locale: { ...ru, addChild: 'Добавить ветвь', addSibling: 'Добавить соседний узел',
        link: 'Соединить узлы', linkBidirectional: 'Двусторонняя связь', summary: 'Объединить скобкой', clickTips: 'Выберите второй узел' }, focus: false, link: true, extend: [
        { name: 'Связать задачу', onclick: requestAction('task') },
        { name: 'Связать заметку', onclick: requestAction('note') },
        { name: 'Ссылка', onclick: requestAction('link') },
        { name: 'Изображение и PDF', onclick: requestAction('files') },
      ] }, toolBar: false,
      allowUndo: true, keypress: true, overflowHidden: true, scaleMin: .2, scaleMax: 2,
      before: { beginEdit: (element) => !getMindMapMeta(element?.nodeObj || mind.currentNodes[0]?.nodeObj || mind.nodeData).entity },
    });
    instance.current = mind;
    try {
      mind.init(projectMindMapData(latest.current.map.data, latest.current.tasks, latest.current.notes, latest.current.projects));
      mind.move = (dx, dy) => {
        const matrix = new DOMMatrixReadOnly(mind.map.style.transform);
        mind.map.style.transform = `translate3d(${matrix.m41 + dx}px, ${matrix.m42 + dy}px, 0) scale(${mind.scaleVal})`;
        mind.bus.fire('move', { dx, dy });
        return true;
      };
      mind.selectNode(mind.findEle(mind.nodeData.id));
      latest.current.onSelect({ ...mind.nodeData });
      const save = (defer = false) => {
        pending = mind.getData();
        if (timer) clearTimeout(timer);
        if (defer) timer = setTimeout(flush, 300);
        else flush();
        const selected = mind.currentNodes[0]?.nodeObj;
        latest.current.onSelect(selected ? { ...selected } : null);
      };
      const undo = mind.undo.bind(mind);
      const redo = mind.redo.bind(mind);
      mind.undo = () => { undo(); syncEntities(mind, latest.current); save(); };
      mind.redo = () => { redo(); syncEntities(mind, latest.current); save(); };
      mind.bus.addListener('operation', (operation) => { if (operation.name !== 'beginEdit') save(); });
      mind.bus.addListener('expandNode', () => save());
      mind.bus.addListener('changeDirection', () => save());
      mind.bus.addListener('selectNodes', (nodes) => latest.current.onSelect(nodes.length === 1 ? { ...nodes[0] } : null));
      mind.bus.addListener('selectNewNode', (node) => latest.current.onSelect({ ...node }));
      mind.bus.addListener('unselectNodes', () => latest.current.onSelect(null));
      mind.bus.addListener('scale', (value) => setScale(Math.round(value * 100)));
      mind.bus.addListener('updateArrowDelta', () => save(true));
    } catch {
      setError(true);
    }
    window.addEventListener('pagehide', flush);
    window.addEventListener('blur', flush);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('blur', flush);
      mind.destroy();
      instance.current = null;
    };
  }, [props.map.id]);

  useEffect(() => {
    const mind = instance.current;
    if (!mind) return;
    syncEntities(mind, props);
  }, [props.tasks, props.notes, props.projects]);

  return <div className="fk-mind-map" data-mind-map style={S.canvas}>
    <style>{MIND_MAP_CSS}</style>
    <div ref={host} style={S.host} aria-label="Полотно доски" onPointerDownCapture={(event) => {
      if (event.button !== 0 || !(event.target instanceof Element) || event.target.closest('me-tpc, me-epd, #input-box, .context-menu, .svg-label, .topiclinks, .summary')) return;
      event.preventDefault(); event.stopPropagation();
      pan.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMoveCapture={(event) => {
      const current = pan.current;
      if (!current || current.id !== event.pointerId) return;
      event.stopPropagation();
      instance.current?.move(event.clientX - current.x, event.clientY - current.y);
      pan.current = { id: current.id, x: event.clientX, y: event.clientY };
    }} onPointerUpCapture={(event) => {
      if (!pan.current || pan.current.id !== event.pointerId) return;
      event.stopPropagation(); pan.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }} onPointerCancelCapture={() => { pan.current = null; }} onClickCapture={(event) => {
      const topic = event.target instanceof Element ? event.target.closest('me-tpc') as Topic | null : null;
      const mind = instance.current;
      if (topic && mind && !mind.currentNodes.includes(topic) && !event.ctrlKey && !event.metaKey && !event.shiftKey) mind.selectNode(topic);
    }} onDoubleClickCapture={(event) => {
      const topic = event.target instanceof Element ? event.target.closest('me-tpc') as Topic | null : null;
      const entity = topic && getMindMapMeta(topic.nodeObj).entity;
      if (entity) { event.stopPropagation(); event.preventDefault(); latest.current.onOpenEntity(entity); }
      else if (topic) { event.stopPropagation(); event.preventDefault(); void instance.current?.beginEdit(topic); }
    }} onContextMenuCapture={(event) => {
      const mind = instance.current;
      const target = event.target;
      const topic = target instanceof Element ? target.closest<HTMLElement>('me-tpc') : null;
      if (!mind || !topic) return;
      event.preventDefault();
      event.stopPropagation();
      mind.selectNode(topic as Topic);
      const menuEvent = new MouseEvent('contextmenu', { clientX: event.clientX, clientY: event.clientY });
      Object.defineProperty(menuEvent, 'target', { value: topic });
      mind.bus.fire('showContextMenu', menuEvent);
    }} />
    {error ? <div role="alert" style={S.empty}>Не удалось открыть карту. Данные сохранены — выберите другую карту или обновите страницу.</div> :
      <div style={S.help}><span /><span>{scale}%</span></div>}
  </div>;
});
