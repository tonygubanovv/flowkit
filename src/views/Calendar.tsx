import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Task, Project, Category, ID } from '../types/Schemas';
import { MONTHS, WDAYS } from '../lib/Constants';
import { getFirstDayOfMonth, shiftDate, todayStr } from '../lib/Helpers';
import { UI } from '../styles/Styles';
import { ContextMenuSubmenuTrigger, DateBadge, Icon, PriorityBadge, playTaskDragStartSound, playTaskDropSound, playTaskSaveSound } from '../components/ui/UiExports';
import { normalizeTaskPriority, TASK_PRIORITY_OPTIONS } from '../lib/TaskPriority';

interface CalendarProps {
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  filterProjectId?: string | null;
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDelete: (taskId: ID) => void;
}

type CalendarDay = {
  key: string;
  day: number;
  dateStr: string;
};

type CalendarContextMenuState = {
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  measured: boolean;
  origin: string;
  task: Task;
};

const CALENDAR_VISIBLE_WEEKS = 2;
const CALENDAR_VISIBLE_DAYS = CALENDAR_VISIBLE_WEEKS * 7;

const toDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const toNoon = (date: Date) => {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = toNoon(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date: Date) => {
  const next = toNoon(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  return next;
};

const formatRangeDate = (date: Date, withYear = false) =>
  date
    .toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      ...(withYear ? { year: 'numeric' as const } : {}),
    })
    .replace(' г.', '');

const formatCalendarRange = (start: Date, end: Date) => {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.getDate()} - ${formatRangeDate(end, true)}`;
  }

  if (sameYear) {
    return `${formatRangeDate(start)} - ${formatRangeDate(end, true)}`;
  }

  return `${formatRangeDate(start, true)} - ${formatRangeDate(end, true)}`;
};

const getTaskProject = (task: Task, projects: Project[]) => {
  return projects.find((project) => project.id === task.projectId);
};

const isTaskDone = (task: Task, projects: Project[]) => {
  if (task.completed) return true;

  const project = getTaskProject(task, projects);
  return project?.columns.find((column) => column.id === task.columnId)?.isDone === true;
};

const NavButton = ({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="fk-hover-subtle"
    style={UI.calendar.navButton}
  >
    <Icon name={icon} size={20} />
  </button>
);

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

export function CalendarView({
  tasks,
  projects,
  categories,
  filterProjectId = null,
  onTaskClick,
  onUpdateTask,
  onDelete,
}: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<ID | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CalendarContextMenuState | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [calendarPlacement, setCalendarPlacement] = useState({ flipX: false, flipY: false });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const dateWrapRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const wheelStateRef = useRef({ delta: 0, lockedUntil: 0 });

  const viewStart = useMemo(() => startOfWeek(viewDate), [viewDate]);
  const viewEnd = useMemo(() => addDays(viewStart, CALENDAR_VISIBLE_DAYS - 1), [viewStart]);
  const rangeLabel = useMemo(() => formatCalendarRange(viewStart, viewEnd), [viewStart, viewEnd]);

  const days = useMemo<CalendarDay[]>(() => {
    return Array.from({ length: CALENDAR_VISIBLE_DAYS }, (_, index) => {
      const date = addDays(viewStart, index);
      return {
        key: toDateKey(date),
        day: date.getDate(),
        dateStr: toDateKey(date),
      };
    });
  }, [viewStart]);

  const visibleTasks = useMemo(() => {
    const startKey = toDateKey(viewStart);
    const endKey = toDateKey(viewEnd);

    return tasks.filter((task) => {
      return Boolean(
        task.deadline &&
          task.deadline >= startKey &&
          task.deadline <= endKey &&
          !isTaskDone(task, projects) &&
          (!filterProjectId || task.projectId === filterProjectId),
      );
    });
  }, [tasks, projects, viewStart, viewEnd, filterProjectId]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();

    visibleTasks.forEach((task) => {
      if (!task.deadline) return;

      const list = map.get(task.deadline) || [];
      list.push(task);
      map.set(task.deadline, list);
    });

    return map;
  }, [visibleTasks]);

  const shiftWeeks = (weeks: number) => {
    setViewDate((current) => addDays(current, weeks * 7));
  };

  const prevWeek = () => {
    shiftWeeks(-1);
  };

  const nextWeek = () => {
    shiftWeeks(1);
  };

  const goToday = () => {
    setViewDate(new Date());
  };

  const handleBoardWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.deltaY) return;

    event.preventDefault();
    event.stopPropagation();

    const state = wheelStateRef.current;
    const now = Date.now();

    if (now < state.lockedUntil) return;

    if (state.delta !== 0 && Math.sign(state.delta) !== Math.sign(event.deltaY)) {
      state.delta = 0;
    }

    state.delta += event.deltaY;

    if (Math.abs(state.delta) < 40) return;

    shiftWeeks(state.delta > 0 ? 1 : -1);
    state.delta = 0;
    state.lockedUntil = now + 180;
  };

  const handleTaskListWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    const maxScrollTop = node.scrollHeight - node.clientHeight;

    if (maxScrollTop <= 0) return;

    const scrollingDown = event.deltaY > 0;
    const scrollingUp = event.deltaY < 0;
    const canScrollDown = scrollingDown && node.scrollTop < maxScrollTop;
    const canScrollUp = scrollingUp && node.scrollTop > 0;

    if (canScrollDown || canScrollUp) {
      event.stopPropagation();
    }
  };

  const handleDragStart = (event: React.DragEvent, taskId: ID) => {
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = 'move';
    playTaskDragStartSound();
  };

  const handleDrop = (event: React.DragEvent, dateStr: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedTaskId) {
      setDragOverDate(null);
      return;
    }

    const task = tasks.find((item) => item.id === draggedTaskId);

    if (task && task.deadline !== dateStr) {
      onUpdateTask({ ...task, deadline: dateStr });
      playTaskDropSound();
      playTaskSaveSound();
    }

    setDraggedTaskId(null);
    setDragOverDate(null);
  };

  const updateTaskDate = (task: Task, date: string | null) => {
    onUpdateTask({ ...task, deadline: date });
    playTaskSaveSound();
    setCtxMenu(null);
    setShowCal(false);
    setShowPriority(false);
  };

  const updateTaskPriority = (task: Task, priority: Task['priority']) => {
    onUpdateTask({ ...task, priority: normalizeTaskPriority(priority) });
    playTaskSaveSound();
    setCtxMenu(null);
    setShowCal(false);
    setShowPriority(false);
  };

  useLayoutEffect(() => {
    if (!ctxMenu || !menuRef.current) return;

    const margin = 12;
    const rect = menuRef.current.getBoundingClientRect();
    const nextX =
      ctxMenu.anchorX + rect.width + margin > window.innerWidth
        ? ctxMenu.anchorX - rect.width
        : ctxMenu.anchorX;
    const nextY =
      ctxMenu.anchorY + rect.height + margin > window.innerHeight
        ? ctxMenu.anchorY - rect.height
        : ctxMenu.anchorY;
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
      style={UI.calendar.shell}
      onClick={() => {
        setCtxMenu(null);
        setShowCal(false);
        setShowPriority(false);
      }}
    >
      <div style={UI.calendar.header}>
        <div style={UI.calendar.titleWrap}>
          <h2 style={UI.calendar.title}>{rangeLabel}</h2>

          <div style={UI.calendar.subtitle}>
            2 недели, активных задач: {visibleTasks.length}
          </div>
        </div>

        <div style={UI.calendar.toolbar}>
          <button
            type="button"
            onClick={goToday}
            className="fk-hover-subtle"
            style={UI.calendar.todayButton}
          >
            Сегодня
          </button>

          <NavButton icon="chevL" label="Предыдущая неделя" onClick={prevWeek} />
          <NavButton icon="chevR" label="Следующая неделя" onClick={nextWeek} />
        </div>
      </div>

      <div style={UI.calendar.board} onWheel={handleBoardWheel}>
        <div style={UI.calendar.scroller}>
          <div style={UI.calendar.grid}>
            {WDAYS.map((day) => (
              <div
                key={day}
                style={UI.calendar.weekday}
              >
                {day}
              </div>
            ))}

            {days.map((day) => {
              const dayTasks = tasksByDate.get(day.dateStr) || [];
              const isToday = day.dateStr === todayStr();
              const isDragOver = dragOverDate === day.dateStr;

              return (
                <div
                  key={day.key}
                  onDrop={(event) => handleDrop(event, day.dateStr)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (dragOverDate !== day.dateStr) {
                      setDragOverDate(day.dateStr);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverDate === day.dateStr) {
                      setDragOverDate(null);
                    }
                  }}
                  style={UI.calendar.day(isDragOver)}
                >
                  <div style={UI.calendar.dayHeader}>
                    <div style={UI.calendar.dayNumber(isToday)}>
                      {day.day}
                    </div>

                    {dayTasks.length > 0 && (
                      <span style={UI.calendar.count}>
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div style={UI.calendar.taskList} onWheel={handleTaskListWheel}>
                    {dayTasks.map((task) => {
                      const isDragged = draggedTaskId === task.id;
                      const category = categories.find((item) => item.id === task.categoryId);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(event) => handleDragStart(event, task.id)}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverDate(null);
                          }}
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
                          className={!isDragged ? 'fk-hover-mini-task' : undefined}
                          style={UI.calendar.miniTask(task.projectId || '', isDragged)}
                        >
                          <div style={UI.calendar.miniTaskTitle}>{task.title}</div>

                          <div style={UI.card.taskMetaRowCompact(true)}>
                            {category && <span style={UI.badge.category(category.color)}>{category.name}</span>}
                            <PriorityBadge priority={task.priority} />
                            <DateBadge deadline={task.deadline} time={task.time} />
                            {(task.comments?.length || 0) > 0 && (
                              <span style={UI.badge.meta(false)}>
                                <Icon name="message" size={12} color="currentColor" />
                                {task.comments?.length || 0}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {isDragOver &&
                      draggedTaskId &&
                      !dayTasks.find((task) => task.id === draggedTaskId) && (
                        <div style={UI.calendar.dropPlaceholder} />
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
              onTaskClick(ctxMenu.task);
              setCtxMenu(null);
            }}
          >
            <Icon name="edit" size={16} color="var(--text2)" />
            {'\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c'}
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
