import React from 'react';
import { splitBoardLinks } from '../lib/BoardLinks';

// Задержка отличает одиночный клик (открыть сайт) от двойного (править текст).
const OPEN_DELAY = 220;

export const createLinkOpener = () => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    open(href: string) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer = null; window.open(href, '_blank', 'noopener'); }, OPEN_DELAY);
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
};

interface LinkTextProps {
  text: string;
  onNavigate: (href: string) => void;
  onEdit?: () => void;
  blockClick?: () => boolean;
}

export function BoardLinkText({ text, onNavigate, onEdit, blockClick }: LinkTextProps) {
  const segments = splitBoardLinks(text);
  if (!segments.some((segment) => segment.href)) return <>{text}</>;
  return <>{segments.map((segment, index) => segment.href
    ? <a key={index} className="fk-board-link" href={segment.href} target="_blank" rel="noopener noreferrer"
      onClick={(event) => {
        if (blockClick?.()) { event.preventDefault(); event.stopPropagation(); return; }
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) { event.stopPropagation(); return; }
        event.preventDefault();
        event.stopPropagation();
        onNavigate(segment.href as string);
      }}
      onDoubleClick={(event) => { event.preventDefault(); event.stopPropagation(); onEdit?.(); }}>
      {segment.text}
    </a>
    : <React.Fragment key={index}>{segment.text}</React.Fragment>)}</>;
}

export const createBoardLinkify = (root: HTMLElement, onEdit: (topic: HTMLElement) => void, onSelect: (topic: HTMLElement) => void) => {
  const openers = new Map<HTMLElement, ReturnType<typeof createLinkOpener>>();
  const refresh = () => {
    root.querySelectorAll<HTMLElement>('me-tpc .text').forEach((element) => {
      const plain = element.textContent || '';
      const segments = splitBoardLinks(plain);
      const anchors = element.querySelectorAll('a.fk-board-link');
      if (!segments.some((segment) => segment.href)) {
        if (anchors.length) {
          openers.get(element)?.cancel();
          openers.delete(element);
          element.textContent = plain;
          delete element.dataset.linkText;
        }
        return;
      }
      if (anchors.length && element.dataset.linkText === plain) return;
      openers.get(element)?.cancel();
      const opener = createLinkOpener();
      openers.set(element, opener);
      element.textContent = '';
      segments.forEach((segment) => {
        if (!segment.href) { element.appendChild(document.createTextNode(segment.text)); return; }
        const anchor = document.createElement('a');
        anchor.className = 'fk-board-link';
        anchor.href = segment.href;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = segment.text;
        anchor.addEventListener('pointerdown', (event) => event.stopPropagation());
        anchor.addEventListener('click', (event) => {
          const topic = element.closest('me-tpc');
          if (topic) onSelect(topic as HTMLElement);
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) { event.stopPropagation(); return; }
          event.preventDefault();
          opener.open(segment.href as string);
        });
        anchor.addEventListener('dblclick', (event) => {
          event.preventDefault();
          event.stopPropagation();
          opener.cancel();
          const topic = element.closest('me-tpc');
          if (topic) onEdit(topic as HTMLElement);
        });
        element.appendChild(anchor);
      });
      element.dataset.linkText = plain;
    });
  };
  let scheduled = false;
  const onDragStart = (event: Event) => event.preventDefault();
  root.addEventListener('dragstart', onDragStart);
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; refresh(); });
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true });
  return {
    refresh,
    dispose() {
      observer.disconnect();
      root.removeEventListener('dragstart', onDragStart);
      openers.forEach((opener) => opener.cancel());
      openers.clear();
    },
  };
};