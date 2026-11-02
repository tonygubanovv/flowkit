import React from 'react';
import { RAW_COLORS, T } from '../../styles/Theme';
import { UI } from '../../styles/Styles';
import { relDate, dateStatus } from '../../lib/Helpers';
import { getTaskPriorityMeta } from '../../lib/TaskPriority';
import { Category, TaskPriority } from '../../types/Schemas';
import { Icon } from './Icon';
import { playDoneSound } from './Sound';

interface CatBadgeProps {
  cat?: Category | null;
}

export function CatBadge({ cat }: CatBadgeProps) {
  if (!cat) return null;
  return <span style={UI.badge.category(cat.color)}>{cat.name}</span>;
}

interface PriorityBadgeProps {
  priority?: TaskPriority;
}

function PriorityGlyph({ priority, meta }: { priority: TaskPriority; meta: ReturnType<typeof getTaskPriorityMeta> }) {
  if (priority === 'high') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" style={{ display: 'block' }}>
        <circle cx="10" cy="10" r="9.5" fill={meta.badgeBg} stroke={meta.badgeBorder} />
        <path d="M11.2 3.1L6.3 9h3.2l-1 7 5.2-6h-3l1.5-6.9Z" fill={meta.iconColor || meta.color} />
      </svg>
    );
  }

  if (priority === 'low') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" style={{ display: 'block' }}>
        <circle cx="10" cy="10" r="9.5" fill={meta.badgeBg} stroke={meta.badgeBorder} />
        <path d="M5.5 6.1L10 10.6L14.5 6.1L15.6 7.2L10 12.8L4.4 7.2L5.5 6.1Z" fill={meta.iconColor || meta.color} />
        <path d="M5.5 9.2L10 13.7L14.5 9.2L15.6 10.3L10 15.9L4.4 10.3L5.5 9.2Z" fill={meta.iconColor || meta.color} />
      </svg>
    );
  }

  return null;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const meta = getTaskPriorityMeta(priority);
  const isRound = priority === 'high' || priority === 'low';
  if (!isRound || !priority) return null;

  return (
    <span title={meta.name} aria-label={meta.name} style={{ display: 'inline-flex', lineHeight: 0, flexShrink: 0 }}>
      <PriorityGlyph priority={priority} meta={meta} />
    </span>
  );
}

interface DateBadgeProps {
  deadline?: string | null;
  time?: string | null;
  isDone?: boolean;
}

export function DateBadge({ deadline, time, isDone }: DateBadgeProps) {
  if (!deadline) return null;
  const s = dateStatus(deadline, isDone) as 'overdue' | 'today' | 'future' | 'done';
  return (
    <span style={UI.badge.date(s)}>
      {s === 'overdue' && <Icon name="warning" size={12} color={T.danger} />}
        {relDate(deadline)}{time && <span style={UI.layout.textDim()}>· {time}</span>}
    </span>
  );
}

interface CheckProps {
  done: boolean;
  onToggle: () => void;
}

export function Check({ done, onToggle }: CheckProps) {
  return (
    <button onClick={e => { 
        e.stopPropagation(); 
        if (!done) playDoneSound(); 
        onToggle(); 
      }}
      style={UI.feedback.check(done)}>
      {done && <Icon name="check" size={12} color={RAW_COLORS.white} />}
    </button>
  );
}

interface ProgressBarProps {
  pct: number;
  color?: string;
  done?: boolean;
}

export function ProgressBar({ pct, color = T.accent, done }: ProgressBarProps) {
  return (
    <div style={UI.feedback.progressTrack}>
      <div style={UI.feedback.progressBar(pct, color, done)} />
    </div>
  );
}
