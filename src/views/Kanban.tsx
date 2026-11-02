import autoAnimate from '@formkit/auto-animate';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { UI } from '../styles/Styles';
import { compareTasksBySort, TaskSortBy } from '../lib/TaskFilters';
import { Task, Column, Project, Category, ID } from '../types/Schemas';
import { ContextMenuSubmenuTrigger, Icon, playTaskDragStartSound, playTaskDropSound, playTaskSaveSound } from '../components/ui/UiExports';
import { TaskCard } from '../components/TaskCard';
import { todayStr, shiftDate, getFirstDayOfMonth, playDoneSound } from '../lib/Helpers';
import { MONTHS, WDAYS } from '../lib/Constants';
import { normalizeTaskPriority, TASK_PRIORITY_OPTIONS } from '../lib/TaskPriority';

interface KanbanProps {
  columns: Column[];
  tasks: Task[];
  categories: Category[];
  projects: Project[];
  showProject?: boolean;
  sortBy?: TaskSortBy;
  onMoveToCol: (tid: ID, cid: ID) => void;
  onReorder: (tid: ID, ttid: ID, s: 'top' | 'bottom', cid: ID) => void;
  onMoveToLaneEdge: (tid: ID, edge: 'top' | 'bottom') => void;
  onToggle: (id: ID) => void;
  onTaskClick: (t: Task) => void;
  onDelete: (id: ID) => void;
  onSave?: (t: Task) => void;
}

type KanbanContextMenuState = {
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  measured: boolean;
  origin: string;
  task: Task;
};

function MenuCalendar({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (date: string) => void;
}) {
  const [viewDate, setViewDate] = useState(value ? new Date(`${value}T12:00:00`) : new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = getFirstDayOfMonth(year, month);

  const moveMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.deltaY) return;

    event.preventDefault();
    moveMonth(event.deltaY > 0 ? 1 : -1);
  };

  return (
    <div style={UI.kanban.menuCalendar} onWheel={handleWheel}>
      <div style={UI.kanban.menuCalendarHeader}>
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          className="fk-hover-calendar-nav"
          style={UI.kanban.menuCalendarNav}
        >
          <Icon name="chevL" size={14} />
        </button>

        <div style={UI.kanban.menuCalendarTitle}>
          {MONTHS[month]} {year}
        </div>

        <button
          type="button"
          onClick={() => moveMonth(1)}
          className="fk-hover-calendar-nav"
          style={UI.kanban.menuCalendarNav}
        >
          <Icon name="chevR" size={14} />
        </button>
      </div>

      <div style={UI.kanban.menuCalendarWeekGrid}>
        {WDAYS.map((day) => (
          <div key={day} style={UI.kanban.menuCalendarWeekday}>
            {day}
          </div>
        ))}
      </div>

      <div style={UI.kanban.menuCalendarDayGrid}>
        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`blank-${index}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const isSelected = value === dateStr;
          const isToday = todayStr() === dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onChange(dateStr)}
              className={!isSelected && !isToday ? 'fk-hover-calendar-day' : undefined}
              style={UI.kanban.menuCalendarDay(isSelected, isToday)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function KanbanView({
  columns,
  tasks,
  categories,
  projects,
  showProject,
  sortBy = 'default',
  onMoveToCol,
  onReorder,
  onMoveToLaneEdge,
  onToggle,
  onTaskClick,
  onDelete,
  onSave,
}: KanbanProps) {
  const [ctxMenu, setCtxMenu] = useState<KanbanContextMenuState | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const dateWrapRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const animatedScrollersRef = useRef<WeakSet<HTMLDivElement>>(new WeakSet());
  const dragScrollRef = useRef<{ frame: number | null; scroller: HTMLElement | null; speed: number }>({
    frame: null,
    scroller: null,
    speed: 0,
  });
  const [calendarPlacement, setCalendarPlacement] = useState({ flipX: false, flipY: false });

  const [draggedId, setDraggedId] = useState<ID | null>(null);
  const [draggedCardHeight, setDraggedCardHeight] = useState(84);
  const [dropTarget, setDropTarget] = useState<{ id: ID; side: 'top' | 'bottom' } | null>(null);
  const [dropCol, setDropCol] = useState<ID | null>(null);

  const setColumnScrollerRef = (node: HTMLDivElement | null) => {
    if (!node || animatedScrollersRef.current.has(node)) return;

    animatedScrollersRef.current.add(node);
    autoAnimate(node, {
      duration: 180,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    });
  };

  const stopDragAutoScroll = () => {
    if (dragScrollRef.current.frame !== null) {
      cancelAnimationFrame(dragScrollRef.current.frame);
    }

    dragScrollRef.current = {
      frame: null,
      scroller: null,
      speed: 0,
    };
  };

  const runDragAutoScroll = () => {
    const state = dragScrollRef.current;

    if (!state.scroller || !state.speed) {
      stopDragAutoScroll();
      return;
    }

    state.scroller.scrollTop += state.speed;
    state.frame = requestAnimationFrame(runDragAutoScroll);
  };

  const updateDragAutoScroll = (event: React.DragEvent<HTMLElement>) => {
    if (!draggedId) {
      stopDragAutoScroll();
      return;
    }

    const current = event.currentTarget as HTMLElement;
    const scroller =
      current.dataset.kanbanScroller === 'true'
        ? current
        : (current.closest('[data-kanban-scroller="true"]') as HTMLElement | null) ||
          current.querySelector<HTMLElement>('[data-kanban-scroller="true"]');
    if (!scroller) {
      stopDragAutoScroll();
      return;
    }

    const rect = scroller.getBoundingClientRect();
    const threshold = 120;
    const topDistance = event.clientY - rect.top;
    const bottomDistance = rect.bottom - event.clientY;
    const maxSpeed = 14;
    let speed = 0;

    if (topDistance < threshold) {
      speed = -Math.max(2, ((threshold - Math.max(0, topDistance)) / threshold) * maxSpeed);
    } else if (bottomDistance < threshold) {
      speed = Math.max(2, ((threshold - Math.max(0, bottomDistance)) / threshold) * maxSpeed);
    }

    dragScrollRef.current.scroller = scroller;
    dragScrollRef.current.speed = speed;

    if (!speed) {
      stopDragAutoScroll();
      return;
    }

    if (dragScrollRef.current.frame === null) {
      dragScrollRef.current.frame = requestAnimationFrame(runDragAutoScroll);
    }
  };

  const updateTaskDate = (task: Task, date: string | null) => {
    if (onSave) {
      onSave({ ...task, deadline: date });
      playTaskSaveSound();
    }

    setCtxMenu(null);
    setShowCal(false);
    setShowPriority(false);
  };

  const updateTaskPriority = (task: Task, priority: Task['priority']) => {
    if (onSave) {
      onSave({ ...task, priority: normalizeTaskPriority(priority) });
      playTaskSaveSound();
    }

    setCtxMenu(null);
    setShowCal(false);
    setShowPriority(false);
  };

  const moveContextTaskToLaneEdge = (edge: 'top' | 'bottom') => {
    if (!ctxMenu) return;

    onMoveToLaneEdge(ctxMenu.task.id, edge);
    setCtxMenu(null);
    setShowCal(false);
    setShowPriority(false);
  };

  useLayoutEffect(() => {
    if (!ctxMenu || !menuRef.current) return;

    const margin = 12;
    const pointerGap = 24;
    const rect = menuRef.current.getBoundingClientRect();
    const nextX =
      ctxMenu.anchorX + pointerGap + rect.width + margin > window.innerWidth
        ? ctxMenu.anchorX - rect.width - pointerGap
        : ctxMenu.anchorX + pointerGap;
    const nextY =
      ctxMenu.anchorY + pointerGap + rect.height + margin > window.innerHeight
        ? ctxMenu.anchorY - rect.height - pointerGap
        : ctxMenu.anchorY + pointerGap;
    const originX = nextX < ctxMenu.anchorX ? 'right' : 'left';
    const originY = nextY < ctxMenu.anchorY ? 'bottom' : 'top';
    const clampedX = Math.max(margin, Math.min(nextX, window.innerWidth - rect.width - margin));
    const clampedY = Math.max(margin, Math.min(nextY, window.innerHeight - rect.height - margin));

    if (!ctxMenu.measured || clampedX !== ctxMenu.x || clampedY !== ctxMenu.y) {
      setCtxMenu((current) =>
        current
          ? {
              ...current,
              x: clampedX,
              y: clampedY,
              origin: `${originX} ${originY}`,
              measured: true,
            }
          : current,
      );
    }
  }, [ctxMenu, showCal]);

  useLayoutEffect(() => {
    if (!showCal || !dateWrapRef.current || !calendarRef.current) return;

    const margin = 12;
    const gap = 8;
    const triggerRect = dateWrapRef.current.getBoundingClientRect();
    const calendarRect = calendarRef.current.getBoundingClientRect();
    const flipX = triggerRect.right + gap + calendarRect.width + margin > window.innerWidth;
    const flipY = triggerRect.top + calendarRect.height + margin > window.innerHeight;

    setCalendarPlacement((current) =>
      current.flipX === flipX && current.flipY === flipY ? current : { flipX, flipY },
    );
  }, [showCal, ctxMenu]);

  return (
    <div
      style={UI.kanban.layout}
      onClick={() => {
        setCtxMenu(null);
        setShowCal(false);
        setShowPriority(false);
      }}
    >
      <div aria-hidden="true" style={UI.kanban.backgroundFill} />

      <style>{`
        @keyframes menuShow {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes subMenuShow {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes skeletonPop {
          0% {
            opacity: 0;
            transform: scaleY(0.98);
          }
          100% {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        .skeleton-anim {
          animation: skeletonPop 0.12s ease-out forwards;
        }

        .task-drag-hidden {
          pointer-events: none;
        }
      `}</style>

      {columns.map((col) => {
        const colTasks = tasks
          .filter((task) => task.columnId === col.id)
          .sort((a, b) => {
            if (sortBy !== 'default') {
              return compareTasksBySort(a, b, sortBy, categories);
            }

            return (a.order ?? 0) - (b.order ?? 0);
          });

        const isColActive = dropCol === col.id;

        return (
          <div
            key={col.id}
            style={UI.kanban.column}
            onDragOver={(event) => {
              event.preventDefault();
              updateDragAutoScroll(event);
            }}
            onDrop={(event) => {
              event.preventDefault();

              if (draggedId) {
                playTaskDropSound();

                if (dropTarget) {
                  onReorder(draggedId, dropTarget.id, dropTarget.side, col.id);
                } else {
                  onMoveToCol(draggedId, col.id);
                }
              }

              stopDragAutoScroll();
              setDraggedId(null);
              setDraggedCardHeight(84);
              setDropTarget(null);
              setDropCol(null);
            }}
          >
            <div
              style={UI.kanban.columnHeader}
            >
              <div
                style={UI.kanban.columnAccent(col.color)}
              />

              <span
                style={UI.kanban.columnTitle}
              >
                {col.name.toUpperCase()}
              </span>

              <span
                style={UI.kanban.columnCount}
              >
                {colTasks.length}
              </span>
            </div>

            <div
              data-kanban-scroller="true"
              ref={setColumnScrollerRef}
              style={UI.kanban.columnScroller}
              onDragOver={(event) => {
                event.preventDefault();
                updateDragAutoScroll(event);
              }}
              onWheel={(event) => {
                if (!draggedId) return;
                event.currentTarget.scrollTop += event.deltaY;
              }}
            >
              {colTasks.map((task) => {
                const isDraggedCard = draggedId === task.id;
                const isTarget = isColActive && dropTarget?.id === task.id;

                if (isDraggedCard) return null;

                return (
                  <React.Fragment key={task.id}>
                    {isTarget && dropTarget.side === 'top' && (
                      <div
                        className="skeleton-anim"
                        style={UI.compose(UI.kanban.skeleton, {
                          height: draggedCardHeight,
                          minHeight: draggedCardHeight,
                        })}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          updateDragAutoScroll(event);
                        }}
                      />
                    )}

                    <div
                      className={isDraggedCard ? 'task-drag-hidden' : ''}
                      draggable
                      onDragStart={(event) => {
                        playTaskDragStartSound();
                        setDraggedCardHeight(Math.max(72, Math.round(event.currentTarget.getBoundingClientRect().height)));
                        setTimeout(() => {
                          setDraggedId(task.id);
                          setDropCol(col.id);
                          setDropTarget(null);
                        }, 0);
                      }}
                      onDragEnd={() => {
                        stopDragAutoScroll();
                        setDraggedId(null);
                        setDraggedCardHeight(84);
                        setDropTarget(null);
                        setDropCol(null);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        updateDragAutoScroll(event);

                        if (isDraggedCard) return;

                        const rect = event.currentTarget.getBoundingClientRect();
                        const side = event.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';

                        if (dropCol !== col.id || dropTarget?.id !== task.id || dropTarget?.side !== side) {
                          setDropTarget({ id: task.id, side });
                          setDropCol(col.id);
                        }
                      }}
                    >
                      <TaskCard
                        task={task}
                        categories={categories}
                        projects={projects}
                        showProject={showProject}
                        isDragged={isDraggedCard}
                        isSelected={ctxMenu?.task.id === task.id}
                        onClick={() => onTaskClick(task)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setCtxMenu({
                            x: event.clientX,
                            y: event.clientY,
                            anchorX: event.clientX,
                            anchorY: event.clientY,
                            measured: false,
                            origin: 'left top',
                            task,
                          });
                        }}
                      />
                    </div>

                    {isTarget && dropTarget.side === 'bottom' && (
                      <div
                        className="skeleton-anim"
                        style={UI.compose(UI.kanban.skeleton, {
                          height: draggedCardHeight,
                          minHeight: draggedCardHeight,
                        })}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          updateDragAutoScroll(event);
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {isColActive && !dropTarget && (
                <div
                  className="skeleton-anim"
                  style={UI.compose(UI.kanban.skeleton, {
                    height: draggedCardHeight,
                    minHeight: draggedCardHeight,
                  })}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    updateDragAutoScroll(event);
                  }}
                />
              )}

              <div
                style={UI.kanban.dropFiller}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  updateDragAutoScroll(event);

                  if (dropTarget !== null || dropCol !== col.id) {
                    setDropTarget(null);
                    setDropCol(col.id);
                  }
                }}
              />
            </div>
          </div>
        );
      })}

      {ctxMenu && (
        <div
          ref={menuRef}
          style={UI.compose(
            UI.kanban.menuOverlay,
            UI.kanban.contextMenu(ctxMenu.x, ctxMenu.y),
            { transformOrigin: ctxMenu.origin },
            !ctxMenu.measured && UI.kanban.menuMeasuring,
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div style={UI.kanban.menuLabel}>{'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f'}</div>

          <button
            type="button"
            style={UI.kanban.menuButton}
            className="fk-hover-subtle"
            onMouseEnter={() => {
              setShowCal(false);
              setShowPriority(false);
            }}
            onClick={() => {
              if (!ctxMenu.task.completed) {
                playDoneSound();
              }

              onToggle(ctxMenu.task.id);
              setCtxMenu(null);
            }}
          >
            <Icon name="check" size={16} color={ctxMenu.task.completed ? 'var(--muted)' : 'var(--success)'} />
            {ctxMenu.task.completed ? '\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435' : '\u0412\u044b\u043f\u043e\u043b\u043d\u0438\u0442\u044c'}
          </button>

          <button
            type="button"
            style={UI.kanban.menuButton}
            className="fk-hover-subtle"
            onMouseEnter={() => {
              setShowCal(false);
              setShowPriority(false);
            }}
            onClick={() => {
              onTaskClick(ctxMenu.task);
              setCtxMenu(null);
            }}
          >
            <Icon name="edit" size={16} color="var(--text2)" />
            {'\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c'}
          </button>

          <div style={UI.kanban.menuSeparator} />

          <div style={UI.kanban.menuLabel}>{'\u041f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u0435'}</div>

          <button
            type="button"
            style={UI.kanban.menuButton}
            className="fk-hover-subtle"
            onMouseEnter={() => {
              setShowCal(false);
              setShowPriority(false);
            }}
            onClick={() => moveContextTaskToLaneEdge('top')}
          >
            <Icon name="chevD" size={16} color="var(--text2)" style={{ transform: 'rotate(180deg)' }} />
            {'\u0412\u0435\u0440\u0445 \u0434\u043e\u0440\u043e\u0436\u043a\u0438'}
          </button>

          <button
            type="button"
            style={UI.kanban.menuButton}
            className="fk-hover-subtle"
            onMouseEnter={() => {
              setShowCal(false);
              setShowPriority(false);
            }}
            onClick={() => moveContextTaskToLaneEdge('bottom')}
          >
            <Icon name="chevD" size={16} color="var(--text2)" />
            {'\u041d\u0438\u0437 \u0434\u043e\u0440\u043e\u0436\u043a\u0438'}
          </button>

          <div style={UI.kanban.menuSeparator} />

          <div style={UI.kanban.menuLabel}>{'\u041f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442'}</div>

          <ContextMenuSubmenuTrigger
            icon="bolt"
            label="Приоритет"
            open={showPriority}
            onOpen={() => {
              setShowCal(false);
              setShowPriority(true);
            }}
            submenuStyle={UI.compose(
              UI.kanban.submenu,
              UI.kanban.submenuPosition(false, false),
              { width: 220, padding: 8 },
            )}
          >
            {TASK_PRIORITY_OPTIONS.map((priority) => (
              <button
                key={priority.id}
                type="button"
                style={UI.kanban.menuButton}
                className="fk-hover-subtle"
                onClick={() => updateTaskPriority(ctxMenu.task, priority.id)}
              >
                {priority.icon ? <Icon name={priority.icon} size={14} color={priority.color} /> : <span style={{ width: 14 }} />}
                {priority.name}
              </button>
            ))}
          </ContextMenuSubmenuTrigger>

          <div style={UI.kanban.menuSeparator} />

          <div style={UI.kanban.menuLabel}>{'\u0421\u0440\u043e\u043a'}</div>

          <button
            type="button"
            style={UI.kanban.menuButton}
            className="fk-hover-subtle"
            onMouseEnter={() => {
              setShowCal(false);
              setShowPriority(false);
            }}
            onClick={() => updateTaskDate(ctxMenu.task, todayStr())}
          >
            <Icon name="sun" size={16} color="var(--text2)" />
            {'\u0421\u0435\u0433\u043e\u0434\u043d\u044f'}
          </button>

          <button
            type="button"
            style={UI.kanban.menuButton}
            className="fk-hover-subtle"
            onMouseEnter={() => {
              setShowCal(false);
              setShowPriority(false);
            }}
            onClick={() => updateTaskDate(ctxMenu.task, shiftDate(1))}
          >
            <Icon name="calendar" size={16} color="var(--text2)" />
            {'\u0417\u0430\u0432\u0442\u0440\u0430'}
          </button>

          <button
            type="button"
            style={UI.kanban.menuButton}
            className="fk-hover-subtle"
            onMouseEnter={() => {
              setShowCal(false);
              setShowPriority(false);
            }}
            onClick={() => updateTaskDate(ctxMenu.task, shiftDate(7))}
          >
            <Icon name="calendarWeek" size={16} color="var(--text2)" />
            {'\u0427\u0435\u0440\u0435\u0437 \u043d\u0435\u0434\u0435\u043b\u044e'}
          </button>

          <ContextMenuSubmenuTrigger
            icon="calendar"
            label="Выбрать дату..."
            open={showCal}
            onOpen={() => {
              setShowCal(true);
              setShowPriority(false);
            }}
            containerRef={dateWrapRef}
            submenuRef={calendarRef}
            submenuStyle={UI.compose(
              UI.kanban.submenu,
              UI.kanban.submenuPosition(calendarPlacement.flipY, calendarPlacement.flipX),
            )}
          >
            <MenuCalendar value={ctxMenu.task.deadline} onChange={(date) => updateTaskDate(ctxMenu.task, date)} />
          </ContextMenuSubmenuTrigger>

          <button
            type="button"
            style={UI.kanban.menuButton}
            className="fk-hover-subtle"
            onMouseEnter={() => {
              setShowCal(false);
              setShowPriority(false);
            }}
            onClick={() => updateTaskDate(ctxMenu.task, null)}
          >
            <Icon name="x" size={16} color="var(--muted)" />
            {'\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0441\u0440\u043e\u043a'}
          </button>

          <div style={UI.kanban.menuSeparator} />

          <button
            type="button"
            style={UI.compose(UI.kanban.menuButton, UI.kanban.dangerMenuButton)}
            className="fk-hover-danger-soft"
            onMouseEnter={() => {
              setShowCal(false);
              setShowPriority(false);
            }}
            onClick={() => {
              onDelete(ctxMenu.task.id);
              setCtxMenu(null);
            }}
          >
            <Icon name="trash" size={16} />
            {'\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0437\u0430\u0434\u0430\u0447\u0443'}
          </button>
        </div>
      )}
    </div>
  );
}


