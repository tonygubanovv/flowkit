import React from 'react';
import { UI } from '../../styles/Styles';
import { Icon } from './Icon';

interface ContextMenuSubmenuTriggerProps {
  icon: string;
  label: string;
  open: boolean;
  onOpen: () => void;
  containerRef?: React.Ref<HTMLDivElement>;
  submenuStyle: React.CSSProperties;
  submenuRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}

export function ContextMenuSubmenuTrigger({
  icon,
  label,
  open,
  onOpen,
  containerRef,
  submenuStyle,
  submenuRef,
  children,
}: ContextMenuSubmenuTriggerProps) {
  return (
    <div
      ref={containerRef}
      style={UI.kanban.menuDateWrap}
      onMouseEnter={onOpen}
    >
      <button
        type="button"
        className="fk-hover-subtle"
        style={UI.compose(UI.kanban.menuButton, UI.kanban.menuButtonActive(open), UI.app.menuItemSplit)}
      >
        <span style={UI.app.menuItemText}>
          <Icon name={icon} size={16} color="var(--text2)" />
          {label}
        </span>
        <Icon name="chevR" size={12} style={UI.layout.iconAuto} />
      </button>

      {open && (
        <div ref={submenuRef} style={submenuStyle}>
          {children}
        </div>
      )}
    </div>
  );
}
