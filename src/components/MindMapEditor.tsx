import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MindElixir, { MindElixirData, NodeObj, Topic } from 'mind-elixir';
import 'mind-elixir/style.css';
import { MindMap, MindMapNodeMeta, MindMapObject, Note, Project, Task } from '../types/Schemas';
import { getMindMapMeta, projectMindMapData, walkMindMap } from '../lib/MindMaps';
import { patchBoardSvg } from '../lib/MindMapSvg';
import { genId } from '../lib/Helpers';
import { MIND_MAP_CSS, MIND_MAP_STYLES as S, MIND_MAP_THEME } from '../styles/MindMapStyles';
import { MindMapObjects, MindMapTool } from './MindMapObjects';
import { createBoardLinkify } from './MindMapLinks';

export interface MindMapEditorHandle {
  addNode: (node?: NodeObj) => void;
  patchNode: (id: string, patch: Partial<NodeObj>) => void;
  flush: () => void;
  replaceData: (data: MindElixirData) => void;
  focus: () => void;
  editNode: (id?: string) => void;
  addSibling: () => void;
  toggleBranch: () => void;
  center: () => void;
  fit: () => void;
  resetZoom: () => void;
  setAllExpanded: (expanded: boolean) => void;
  setColor: (ids: string[], color: string | null) => void;
  removeNodes: (ids: string[]) => void;
  clearSelection: () => void;
  placeObject: (tool: MindMapTool, clientX: number, clientY: number) => void;
  copySelection: () => NodeObj[];
  pasteNodes: (nodes: NodeObj[]) => void;
  duplicateSelection: () => void;
  toCanvas: (clientX: number, clientY: number) => { x: number; y: number } | null;
  exportSvg: () => Promise<Blob | null>;
}

interface Props {
  map: MindMap;
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  objects: MindMapObject[];
  tool: MindMapTool;
  selectedObjectId: string | null;
  editingObjectId: string | null;
  onChange: (data: MindElixirData) => void;
  onUndo: () => void;
  onRedo: () => void;
  onObjectsChange: (objects: MindMapObject[]) => void;
  onSelect: (node: NodeObj | null) => void;
  onSelection: (nodes: NodeObj[]) => void;
  onSelectObject: (id: string | null) => void;
  onEditObject: (id: string | null) => void;
  onObjectMenu: (id: string, point: { x: number; y: number }) => void;
  onToolUse: () => void;
  onScaleChange: (percent: number) => void;
  onNodeMenu: (node: NodeObj, point: { x: number; y: number }) => void;
  onCanvasMenu: (point: { x: number; y: number }) => void;
  onOpenEntity: (entity: NonNullable<MindMapNodeMeta['entity']>) => void;
}

const cloneNode = (node: NodeObj): NodeObj =>
  JSON.parse(JSON.stringify(node, (key, value) => key === 'parent' ? undefined : value)) as NodeObj;

const reseedNode = (node: NodeObj): NodeObj => {
  const copy = cloneNode(node);
  const assign = (item: NodeObj) => {
    item.id = genId();
    item.children?.forEach(assign);
  };
  assign(copy);
  return copy;
};

const emitSelection = (mind: MindElixir, props: Props) => {
  const nodes = (mind.currentNodes || []).map((element) => ({ ...element.nodeObj }));
  props.onSelect(nodes.length === 1 ? nodes[0] : null);
  props.onSelection(nodes);
};

const findTopics = (mind: MindElixir, ids: string[]): Topic[] =>
  ids.filter((id) => mind.getObjById(id, mind.nodeData)).map((id) => mind.findEle(id));

const syncEntities = (mind: MindElixir, props: Props) => {
  const ids = mind.currentNodes.map((element) => element.nodeObj.id);
  mind.refresh(projectMindMapData(mind.getData(), props.tasks, props.notes, props.projects));
  mind.selectNodes(findTopics(mind, ids));
  emitSelection(mind, props);
};

const canvasPoint = (mind: MindElixir, clientX: number, clientY: number) => {
  const rect = mind.map.getBoundingClientRect();
  const scale = mind.map.offsetWidth ? rect.width / mind.map.offsetWidth : 1;
  return { x: Math.round((clientX - rect.left) / scale), y: Math.round((clientY - rect.top) / scale) };
};

const createObject = (tool: MindMapTool, point: { x: number; y: number }): MindMapObject => {
  const id = genId();
  if (tool === 'text') return { id, kind: 'text', x: point.x, y: point.y, text: '' };
  if (tool === 'comment') return { id, kind: 'comment', x: point.x, y: point.y, text: '' };
  return { id, kind: 'shape', shape: 'rect', x: point.x, y: point.y, w: 220, h: 130, text: '' };
};

const offsetInNodes = (element: HTMLElement, root: HTMLElement) => {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = element;
  while (current && current !== root) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return { x, y };
};

export const MindMapEditor = forwardRef<MindMapEditorHandle, Props>(function MindMapEditor(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<MindElixir | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const saveRef = useRef<() => void>(() => {});
  const flushRef = useRef<() => void>(() => {});
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(100);
  const [layerHost, setLayerHost] = useState<HTMLElement | null>(null);

  const reportScale = (percent: number) => {
    setScale(percent);
    latest.current.onScaleChange(percent);
  };

  const placeObject = (tool: MindMapTool, clientX: number, clientY: number) => {
    const mind = instance.current;
    if (!mind) return;
    const object = createObject(tool, canvasPoint(mind, clientX, clientY));
    latest.current.onObjectsChange([...(latest.current.objects || []), object]);
    latest.current.onSelectObject(object.id);
    if (object.kind !== 'shape') latest.current.onEditObject(object.id);
  };

  useImperativeHandle(ref, () => ({
    addNode: (node) => {
      const mind = instance.current;
      if (!mind) return;
      latest.current.onSelectObject(null);
      void mind.addChild(mind.currentNodes[0] || mind.findEle(mind.nodeData.id), node);
    },
    patchNode: (id, patch) => {
      const mind = instance.current;
      if (!mind) return;
      const element = mind.findEle(id);
      if (element) {
        const data = projectMindMapData({ nodeData: { ...element.nodeObj, ...patch } }, latest.current.tasks, latest.current.notes, latest.current.projects);
        void mind.reshapeNode(element, { ...patch, topic: data.nodeData.topic, tags: data.nodeData.tags });
      }
    },
    flush: () => flushRef.current(),
    replaceData: (data) => {
      const mind = instance.current;
      if (!mind) return;
      const ids = mind.currentNodes.map((element) => element.nodeObj.id);
      mind.refresh(projectMindMapData(structuredClone(data), latest.current.tasks, latest.current.notes, latest.current.projects));
      mind.selectNodes(findTopics(mind, ids));
      emitSelection(mind, latest.current);
    },
    focus: () => instance.current?.container.focus({ preventScroll: true }),
    editNode: (id) => {
      const mind = instance.current;
      const topic = id ? mind?.findEle(id) : mind?.currentNodes[0];
      if (!mind || !topic) return;
      const entity = getMindMapMeta(topic.nodeObj).entity;
      if (entity) latest.current.onOpenEntity(entity);
      else void mind.beginEdit(topic);
    },
    placeObject: (tool, clientX, clientY) => placeObject(tool, clientX, clientY),
    copySelection: () => {
      const mind = instance.current;
      if (!mind) return [];
      const selected = new Set(mind.currentNodes.map((element) => element.nodeObj));
      return mind.currentNodes
        .filter((element) => {
          if (element.nodeObj.id === mind.nodeData.id) return false;
          for (let parent = element.nodeObj.parent; parent; parent = parent.parent) {
            if (selected.has(parent)) return false;
          }
          return true;
        })
        .map((element) => cloneNode(element.nodeObj));
    },
    pasteNodes: (nodes) => {
      const mind = instance.current;
      if (!mind || !nodes.length) return;
      const target = mind.currentNodes.length === 1 ? mind.currentNodes[0] : mind.findEle(mind.nodeData.id);
      if (!target) return;
      mind.copyNodes(nodes.map((nodeObj) => ({ nodeObj } as Topic)), target);
      mind.container.focus({ preventScroll: true });
    },
    duplicateSelection: () => {
      const mind = instance.current;
      const source = mind?.currentNodes[0];
      if (!mind || !source) return;
      if (source.nodeObj.id === mind.nodeData.id) {
        void mind.addChild(source, reseedNode(source.nodeObj));
        return;
      }
      mind.insertSibling('after', source, reseedNode(source.nodeObj));
      mind.container.focus({ preventScroll: true });
    },
    addSibling: () => { void instance.current?.insertSibling('after'); },
    toggleBranch: () => {
      const mind = instance.current;
      const topic = mind?.currentNodes[0];
      if (mind && topic && topic.nodeObj.id !== mind.nodeData.id) mind.expandNode(topic);
    },
    center: () => { instance.current?.toCenter(); },
    fit: () => {
      const mind = instance.current;
      if (!mind) return;
      mind.scaleFit();
      reportScale(Math.round(mind.scaleVal * 100));
    },
    resetZoom: () => {
      const mind = instance.current;
      if (!mind) return;
      mind.scale(1);
      reportScale(100);
    },
    setAllExpanded: (expanded) => {
      const mind = instance.current;
      if (!mind) return;
      mind.nodeData.expanded = true;
      mind.nodeData.children?.forEach((child) => walkMindMap(child, (node) => {
        if (node.children?.length) node.expanded = expanded;
      }));
      mind.refresh();
      saveRef.current();
    },
    setColor: (ids, color) => {
      const mind = instance.current;
      if (!mind) return;
      const topics = findTopics(mind, ids);
      if (!topics.length) return;
      topics.forEach((topic) => {
        if (color) topic.nodeObj.branchColor = color;
        else delete topic.nodeObj.branchColor;
      });
      syncEntities(mind, latest.current);
      saveRef.current();
    },
    removeNodes: (ids) => {
      const mind = instance.current;
      if (!mind) return;
      const topics = findTopics(mind, ids.filter((id) => id !== mind.nodeData.id));
      if (topics.length) void mind.removeNodes(topics);
    },
    clearSelection: () => { instance.current?.clearSelection(); },
    toCanvas: (clientX, clientY) => {
      const mind = instance.current;
      return mind ? canvasPoint(mind, clientX, clientY) : null;
    },
    exportSvg: async () => {
      const mind = instance.current;
      if (!mind) return null;
      const current = mind.getData();
      const ids = mind.currentNodes.map((element) => element.nodeObj.id);
      const expanded = JSON.parse(JSON.stringify(current)) as MindElixirData;
      walkMindMap(expanded.nodeData, (node) => { if (node.children?.length) node.expanded = true; });
      mind.refresh(expanded);
      try {
        const blob = mind.exportSvg(true);
        const objects = latest.current.objects || [];
        if (!objects.length) return blob;
        const text = await blob.text();
        const nodes = mind.nodes;
        const mapRect = mind.map.getBoundingClientRect();
        const mapScale = mind.map.offsetWidth ? mapRect.width / mind.map.offsetWidth : 1;
        const tree = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
        let origin = { x: 0, y: 0 };
        let reference = false;
        nodes.querySelectorAll<HTMLElement>('me-tpc').forEach((element) => {
          const point = offsetInNodes(element, nodes);
          tree.minX = Math.min(tree.minX, point.x);
          tree.minY = Math.min(tree.minY, point.y);
          tree.maxX = Math.max(tree.maxX, point.x + element.offsetWidth);
          tree.maxY = Math.max(tree.maxY, point.y + element.offsetHeight);
          if (reference) return;
          reference = true;
          const rect = element.getBoundingClientRect();
          origin = { x: (rect.left - mapRect.left) / mapScale - point.x, y: (rect.top - mapRect.top) / mapScale - point.y };
        });
        if (!reference) { tree.minX = 0; tree.minY = 0; tree.maxX = 0; tree.maxY = 0; }
        return new Blob([patchBoardSvg(text, objects, origin, tree)], { type: 'image/svg+xml' });
      } finally {
        mind.refresh(current);
        mind.selectNodes(findTopics(mind, ids));
        emitSelection(mind, latest.current);
      }
    },
  }), []);

  useEffect(() => {
    if (!host.current) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: MindElixirData | null = null;
    const flush = () => {
      if (timer) clearTimeout(timer);
      if (pending) { const data = pending; pending = null; latest.current.onChange(data); }
    };
    flushRef.current = flush;
    const zoomByWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault();
        mind.move(-event.deltaX, 0);
        return;
      }
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 40
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? event.deltaY * mind.container.clientHeight
        : event.deltaY;
      const step = Math.max(-mind.scaleSensitivity, Math.min(mind.scaleSensitivity, -(unit / 10) * mind.scaleSensitivity));
      if (!step) return;
      event.preventDefault();
      mind.scale(mind.scaleVal + step, { x: event.clientX, y: event.clientY });
    };
    const mind: MindElixir = new MindElixir({
      el: host.current, theme: MIND_MAP_THEME, direction: 2, newTopicName: 'Новая мысль',
      contextMenu: false, toolBar: false,
      allowUndo: false, keypress: true, handleWheel: zoomByWheel, scaleMin: .2, scaleMax: 2,
      before: { beginEdit: (element) => {
        const entity = getMindMapMeta(element?.nodeObj || mind.currentNodes[0]?.nodeObj || mind.nodeData).entity;
        if (entity) latest.current.onOpenEntity(entity);
        return !entity;
      } },
    });
    instance.current = mind;
    try {
      mind.init(projectMindMapData(structuredClone(latest.current.map.data), latest.current.tasks, latest.current.notes, latest.current.projects));
      setLayerHost(mind.map);
      mind.move = (dx, dy) => {
        const matrix = new DOMMatrixReadOnly(mind.map.style.transform);
        mind.map.style.transform = `translate3d(${matrix.m41 + dx}px, ${matrix.m42 + dy}px, 0) scale(${mind.scaleVal})`;
        mind.bus.fire('move', { dx, dy });
        return true;
      };
      mind.selectNode(mind.findEle(mind.nodeData.id));
      emitSelection(mind, latest.current);
      const linkify = createBoardLinkify(mind.nodes, (topic) => { void mind.beginEdit(topic as Topic); }, (topic) => mind.selectNode(topic as Topic));
      linkify.refresh();
      mind.disposable.push(() => linkify.dispose());
      const save = (defer = false) => {
        pending = mind.getData();
        if (timer) clearTimeout(timer);
        if (defer) timer = setTimeout(flush, 300);
        else flush();
        emitSelection(mind, latest.current);
      };
      mind.undo = () => latest.current.onUndo();
      mind.redo = () => latest.current.onRedo();
      mind.bus.addListener('operation', (operation) => { if (operation.name !== 'beginEdit') save(); });
      mind.bus.addListener('expandNode', () => save());
      mind.bus.addListener('changeDirection', () => save());
      mind.bus.addListener('selectNodes', () => emitSelection(mind, latest.current));
      mind.bus.addListener('selectNewNode', () => emitSelection(mind, latest.current));
      mind.bus.addListener('unselectNodes', () => emitSelection(mind, latest.current));
      mind.bus.addListener('scale', (value) => reportScale(Math.round(value * 100)));
      mind.bus.addListener('updateArrowDelta', () => save(true));
      saveRef.current = save;
      const expandAll = (event: MouseEvent) => {
        if ((event.target as Element | null)?.tagName === 'ME-EPD' && (event.ctrlKey || event.metaKey)) save();
      };
      mind.container.addEventListener('click', expandAll);
      const pointerDown = (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        const tool = latest.current.tool;
        if (tool === 'select') {
          if (!target?.closest('.fk-mind-object')) latest.current.onSelectObject(null);
          return;
        }
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (target?.closest('.fk-mind-object')) return;
        event.preventDefault();
        event.stopPropagation();
        placeObject(tool, event.clientX, event.clientY);
        latest.current.onToolUse();
      };
      host.current?.addEventListener('mousedown', pointerDown, true);
      // Пока активен инструмент, движок не должен выделять узлы и двигать карту под курсором.
      const toolPointerDown = (event: PointerEvent) => {
        if (latest.current.tool === 'select') return;
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;
        event.stopPropagation();
      };
      host.current?.addEventListener('pointerdown', toolPointerDown, true);
      mind.disposable.push(() => host.current?.removeEventListener('mousedown', pointerDown, true));
      mind.disposable.push(() => host.current?.removeEventListener('pointerdown', toolPointerDown, true));
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
      setLayerHost(null);
    };
  }, [props.map.id]);

  useEffect(() => {
    const mind = instance.current;
    if (!mind) return;
    syncEntities(mind, props);
  }, [props.tasks, props.notes, props.projects]);

  const selectObject = (id: string | null) => {
    if (id) instance.current?.clearSelection();
    props.onSelectObject(id);
  };

  return <div className="fk-mind-map" data-mind-map data-tool={props.tool === 'select' ? undefined : props.tool} style={S.canvas}>
    <style>{MIND_MAP_CSS}</style>
    <div ref={host} style={S.host} aria-label="Полотно доски" onDoubleClickCapture={(event) => {
      const topic = event.target instanceof Element ? event.target.closest('me-tpc') as Topic | null : null;
      const entity = topic && getMindMapMeta(topic.nodeObj).entity;
      if (entity) { event.stopPropagation(); event.preventDefault(); latest.current.onOpenEntity(entity); }
    }} onContextMenuCapture={(event) => {
      const mind = instance.current;
      if (!mind || !(event.target instanceof Element)) return;
      if (event.target.closest('.fk-mind-object')) return;
      event.preventDefault();
      event.stopPropagation();
      const element = event.target;
      const topic = element.closest<HTMLElement>('me-tpc')
        ?? element.closest<HTMLElement>('me-epd')?.parentElement?.querySelector<HTMLElement>('me-tpc') ?? null;
      if (!topic) {
        latest.current.onCanvasMenu({ x: event.clientX, y: event.clientY });
        return;
      }
      if (!topic.classList.contains('selected')) mind.selectNode(topic as Topic);
      latest.current.onNodeMenu({ ...(topic as Topic).nodeObj }, { x: event.clientX, y: event.clientY });
    }} />
    {layerHost && createPortal(
      <MindMapObjects objects={props.objects} scale={scale / 100} selectedId={props.selectedObjectId} editingId={props.editingObjectId}
        onSelect={selectObject} onEdit={props.onEditObject} onCommit={props.onObjectsChange} onObjectMenu={props.onObjectMenu} />,
      layerHost)}
    {error ? <div role="alert" style={S.empty}>Не удалось открыть карту. Данные сохранены — выберите другую карту или обновите страницу.</div> : null}
  </div>;
});
