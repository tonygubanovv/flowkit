import type { MindElixirData } from 'mind-elixir';
import type { MindMapObject } from '../types/Schemas';

export interface BoardSnapshot {
  data: MindElixirData;
  objects: MindMapObject[];
}

export interface BoardHistory {
  past: BoardSnapshot[];
  present: BoardSnapshot;
  future: BoardSnapshot[];
}

const HISTORY_LIMIT = 40;

export const createBoardHistory = (present: BoardSnapshot): BoardHistory => ({ past: [], present, future: [] });

export const recordBoardChange = (history: BoardHistory, next: BoardSnapshot): BoardHistory => {
  const sameData = history.present.data === next.data || JSON.stringify(history.present.data) === JSON.stringify(next.data);
  const sameObjects = history.present.objects === next.objects || JSON.stringify(history.present.objects) === JSON.stringify(next.objects);
  if (sameData && sameObjects) return history;
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: next, future: [] };
};

export const undoBoardChange = (history: BoardHistory): BoardHistory => {
  const previous = history.past[history.past.length - 1];
  return previous ? { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] } : history;
};

export const redoBoardChange = (history: BoardHistory): BoardHistory => {
  const next = history.future[0];
  return next ? { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: next, future: history.future.slice(1) } : history;
};
