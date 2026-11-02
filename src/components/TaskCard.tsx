import React, { memo, useState } from 'react';
import { UI, glass } from '../styles/Styles';
import { Task, Category, Project } from '../types/Schemas';
import { Check, CatBadge, DateBadge, Icon, PriorityBadge } from './ui/UiExports';
import { typographizeWithNbsp } from '../lib/Typograf';

interface TaskCardProps {
  task: Task;
  categories: Category[];
  projects: Project[];
  showProject?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onToggle?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  isDragged?: boolean;
  isSelected?: boolean;
  compact?: boolean;
}

const stripHtml = (value?: string | null) => {
  return value
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const TaskCard = memo(
  ({
    task,
    categories,
    projects,
    showProject,
    onClick,
    onToggle,
    onDragStart,
    onDragEnd,
    onContextMenu,
    isDragged,
    isSelected,
    compact = false,
  }: TaskCardProps) => {
    const [hovered, setHovered] = useState(false);

    const project = projects.find((item) => item.id === task.projectId);
    const category = categories.find((item) => item.id === task.categoryId);

    const isVisualDone = Boolean(
      task.completed || project?.columns.find((column) => column.id === task.columnId)?.isDone,
    );

    const displayTitle = typographizeWithNbsp(task.title);
    const cleanDesc = typographizeWithNbsp(stripHtml(task.description));
    const commentsCount = task.comments?.length || 0;
    const linksCount = task.links?.length || 0;
    const baseGlass = glass(isVisualDone ? '05' : '08', 25);
    const hoverGlass: React.CSSProperties = { background: 'var(--card-hov)' };

    const isActiveHover = hovered && !isDragged;

    return (
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={UI.card.task({
          done: isVisualDone,
          active: isActiveHover,
          dragged: isDragged,
          selected: isSelected,
          base: baseGlass,
          hover: hoverGlass,
          compact,
        })}
      >
        <div style={UI.card.taskCheck}>
          <Check done={isVisualDone} onToggle={() => onToggle?.()} />
        </div>

        <div style={UI.card.taskBody}>
          <div
            style={UI.card.taskTitle(isVisualDone, !!cleanDesc, compact)}
          >
            {displayTitle}
          </div>

          {cleanDesc && !compact && (
            <div
              style={UI.card.taskDescription(isVisualDone)}
            >
              {cleanDesc}
            </div>
          )}

          <div
            style={UI.card.taskMetaRowCompact(compact)}
          >
            {category && <CatBadge cat={category} />}

            <PriorityBadge priority={task.priority} />

            <DateBadge deadline={task.deadline} time={task.time} isDone={isVisualDone} />

            {commentsCount > 0 && (
              <span
                title={`${commentsCount} комментариев`}
                style={UI.badge.meta(isActiveHover)}
              >
                <Icon name="message" size={13} color="currentColor" />
                {commentsCount}
              </span>
            )}

            {linksCount > 0 && (
              <span title={`${linksCount} связанных задач`} style={UI.badge.meta(isActiveHover)}>
                <Icon name="link" size={13} color="currentColor" />
                {linksCount}
              </span>
            )}

            {showProject && project && (
              <span
                style={UI.card.taskProjectMeta}
              >
                <span
                  style={UI.layout.dot(project.color, 8, 3)}
                />
                {project.name}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);


