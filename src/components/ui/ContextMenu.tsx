import React, { useEffect, useRef, useState } from 'react';
import { T } from '../../styles/Theme';
import { UI } from '../../styles/Styles';
import { Icon } from './Icon';

interface ContextMenuItem {
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: () => void;
  children?: ContextMenuItem[];
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

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [onClose]);

  return (
    <div ref={ref} style={UI.menu.context(x, y)} onMouseLeave={() => setOpenChildIndex(null)}>
      {items.map((item, i) =>
        item === '---' ? (
          <div key={i} style={UI.menu.separator} />
        ) : (
          <div key={i} style={{ position: 'relative' }} onMouseEnter={() => setOpenChildIndex(item.children?.length ? i : null)}>
            <button
              onClick={() => {
                if (!item.children?.length) {
                  item.onClick();
                  onClose();
                }
              }}
              className={item.danger ? 'fk-hover-danger-soft' : 'fk-hover-subtle'}
              style={UI.compose(UI.menu.contextItem(item.danger), !!item.children?.length && UI.app.menuItemSplit)}
            >
              <span style={UI.app.menuItemText}>
                {item.icon && <Icon name={item.icon} size={15} color={item.danger ? T.danger : T.text2} />}
                {item.label}
              </span>
              {item.children?.length ? <Icon name="chevR" size={12} color={T.muted} /> : null}
            </button>

            {item.children?.length && openChildIndex === i && (
              <div style={UI.menu.subMenu} onMouseEnter={() => setOpenChildIndex(i)}>
                {item.children.map((child, childIndex) => (
                  <button
                    key={childIndex}
                    onClick={() => {
                      child.onClick();
                      onClose();
                    }}
                    className={child.danger ? 'fk-hover-danger-soft' : 'fk-hover-subtle'}
                    style={UI.menu.contextItem(child.danger)}
                  >
                    {child.icon && <Icon name={child.icon} size={15} color={child.danger ? T.danger : T.text2} />}
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
