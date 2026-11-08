import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { T } from '../../styles/Theme';
import { UI } from '../../styles/Styles';
import { Icon } from './Icon';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  swatch?: string;
  active?: boolean;
  onClick?: () => void;
  children?: (ContextMenuItem | '---')[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: (ContextMenuItem | '---')[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [openChildIndex, setOpenChildIndex] = useState<number | null>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const [childPosition, setChildPosition] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x, y });

  useLayoutEffect(() => {
    const place = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const next = { x: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)), y: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)) };
      setPosition((current) => current.x === next.x && current.y === next.y ? current : next);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [x, y, items.length]);

  useLayoutEffect(() => {
    const child = childRef.current;
    const parent = child?.parentElement?.getBoundingClientRect();
    if (!child || !parent) return;
    const rect = child.getBoundingClientRect();
    const right = parent.right;
    const left = right + rect.width <= window.innerWidth - 8 ? right : parent.left - rect.width;
    setChildPosition({ x: Math.max(8, Math.min(left, window.innerWidth - rect.width - 8)) - parent.left,
      y: Math.max(8, Math.min(parent.top - 6, window.innerHeight - rect.height - 8)) - parent.top });
  }, [openChildIndex, position]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [onClose]);

  return (
    <div ref={ref} style={UI.menu.context(position.x, position.y)} onMouseLeave={() => setOpenChildIndex(null)}>
      {items.map((item, i) =>
        item === '---' ? (
          <div key={i} style={UI.menu.separator} />
        ) : (
          <div key={i} style={{ position: 'relative' }} onMouseEnter={() => setOpenChildIndex(item.children?.length ? i : null)}>
            <button
              disabled={item.disabled}
              onClick={() => {
                if (item.children?.length) setOpenChildIndex(i);
                else {
                  item.onClick?.();
                  onClose();
                }
              }}
              className={item.disabled ? undefined : item.danger ? 'fk-hover-danger-soft' : 'fk-hover-subtle'}
              style={UI.compose(UI.menu.contextItem(item.danger, item.disabled), !!item.children?.length && UI.app.menuItemSplit)}
            >
              <span style={UI.app.menuItemText}>
                {item.swatch ? <span style={UI.menu.contextSwatch(item.swatch, item.active)} />
                  : item.icon ? <Icon name={item.icon} size={15} color={item.danger ? T.danger : T.text2} /> : null}
                {item.label}
              </span>
              {item.children?.length ? <Icon name="chevR" size={12} color={T.muted} /> : null}
            </button>

            {item.children?.length && openChildIndex === i && (
              <div ref={childRef} style={{ ...UI.menu.subMenu, position: 'absolute', left: childPosition.x, top: childPosition.y, maxWidth: 'calc(100vw - 16px)', maxHeight: 'calc(100vh - 16px)', overflowY: 'auto' }} onMouseEnter={() => setOpenChildIndex(i)}>
                {item.children.map((child, childIndex) => child === '---' ? (
                  <div key={childIndex} style={UI.menu.separator} />
                ) : (
                  <button
                    key={childIndex}
                    disabled={child.disabled}
                    onClick={() => {
                      child.onClick?.();
                      onClose();
                    }}
                    className={child.disabled ? undefined : child.danger ? 'fk-hover-danger-soft' : 'fk-hover-subtle'}
                    style={UI.menu.contextItem(child.danger, child.disabled)}
                  >
                    {child.swatch ? <span style={UI.menu.contextSwatch(child.swatch, child.active)} />
                      : child.icon ? <Icon name={child.icon} size={15} color={child.danger ? T.danger : T.text2} /> : null}
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ),
      )}
    </div>
  );
}
