import { Category, Project, Task } from '../types/Schemas';
import { formatRuDate } from '../lib/Helpers';

export type GroupBy = 'category' | 'project';

export type FocusGroup = {
  name: string;
  color: string;
  done: number;
  process: number;
  total: number;
};

export type DateRange = {
  start: string;
  end: string;
};

export const isoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseIsoDate = (value: string) => new Date(`${value}T00:00:00`);

export const addDays = (value: string, days: number) => {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

const getWeekStart = (value: string) => {
  const date = parseIsoDate(value);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return isoDate(date);
};

const getWeekEnd = (value: string) => addDays(getWeekStart(value), 6);

const diffDaysInclusive = (start: string, end: string) => {
  const diff = Math.round((parseIsoDate(end).getTime() - parseIsoDate(start).getTime()) / 864e5);
  return Math.max(1, diff + 1);
};

export const normalizeRange = (start: string, end: string): DateRange => {
  return start <= end ? { start, end } : { start: end, end: start };
};

const dateKey = (value?: string | null) => value?.split('T')[0] || null;

const getTaskCreatedKey = (task: Task) =>
  dateKey(task.createdAt) || dateKey(task.statusUpdatedAt) || dateKey(task.deadline);

const isWithinRange = (value: string | null | undefined, start: string, end: string) => {
  const key = dateKey(value);
  return !!key && key >= start && key <= end;
};

const formatActivityDate = (date: Date) => formatRuDate(date);

const getGroupId = (task: Task, groupBy: GroupBy) => {
  return groupBy === 'category' ? task.categoryId : task.projectId;
};

const isTaskClosed = (task: Task, projects: Project[]) => {
  if (task.completed) return true;

  const project = projects.find((item) => item.id === task.projectId);
  return project?.columns.find((column) => column.id === task.columnId)?.isDone === true;
};

export const getAnalyticsDateRange = (periodMode: string, customRange: DateRange): DateRange => {
  if (periodMode === 'custom') return normalizeRange(customRange.start, customRange.end);

  const end = isoDate(new Date());
  return {
    start: addDays(end, -(Number(periodMode) - 1)),
    end,
  };
};

export const buildAnalyticsModel = ({
  tasks,
  categories,
  projects,
  filterProj,
  groupBy,
  dateRange,
  uncategorizedColor,
}: {
  tasks: Task[];
  categories: Category[];
  projects: Project[];
  filterProj?: string | null;
  groupBy: GroupBy;
  dateRange: DateRange;
  uncategorizedColor: string;
}) => {
  const filteredTasks = !filterProj || filterProj === 'all'
    ? tasks
    : tasks.filter((task) => task.projectId === filterProj);
  const periodDays = diffDaysInclusive(dateRange.start, dateRange.end);
  const current = new Date();
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);

  const cutoff = parseIsoDate(dateRange.start);
  const end = parseIsoDate(dateRange.end);
  const prevCutoff = parseIsoDate(dateRange.start);
  prevCutoff.setDate(prevCutoff.getDate() - periodDays);

  const cutoffDate = isoDate(cutoff);
  const endDate = isoDate(end);
  const prevCutoffDate = isoDate(prevCutoff);
  const today = isoDate(current);
  const tomorrow = isoDate(nextDay);
  const analyticsTasks = filteredTasks;

  const doneTasks = filteredTasks.filter((task) => {
    return isTaskClosed(task, projects) && isWithinRange(task.completedAt, cutoffDate, endDate);
  });

  const activeTasks = analyticsTasks.filter((task) => {
    const closed = isTaskClosed(task, projects);
    const recentlyCompleted = closed && isWithinRange(task.completedAt, cutoffDate, endDate);
    const recentlyCreated = !closed && isWithinRange(getTaskCreatedKey(task), cutoffDate, endDate);

    return recentlyCompleted || recentlyCreated;
  });

  const groups = groupBy === 'category' ? categories : projects;

  let totalDone = 0;
  let totalProcess = 0;
  let dueToday = 0;
  let dueTomorrow = 0;
  let later = 0;
  let overdue = 0;

  analyticsTasks.forEach((task) => {
    if (isTaskClosed(task, projects)) return;

    if (!task.deadline) {
      later += 1;
    } else if (task.deadline < today) {
      overdue += 1;
    } else if (task.deadline === today) {
      dueToday += 1;
    } else if (task.deadline === tomorrow) {
      dueTomorrow += 1;
    } else {
      later += 1;
    }
  });

  const currentDone = analyticsTasks.filter((task) => {
    return isTaskClosed(task, projects) && isWithinRange(task.completedAt, cutoffDate, endDate);
  }).length;

  const previousDone = analyticsTasks.filter((task) => {
    const completedDate = dateKey(task.completedAt);
    return isTaskClosed(task, projects) && !!completedDate && completedDate >= prevCutoffDate && completedDate < cutoffDate;
  }).length;

  const trend =
    previousDone === 0 ? (currentDone > 0 ? 100 : 0) : Math.round(((currentDone - previousDone) / previousDone) * 100);

  const groupData = groups
    .map((group) => {
      const groupTasks = activeTasks.filter((task) => getGroupId(task, groupBy) === group.id);
      const done = groupTasks.filter((task) => isTaskClosed(task, projects)).length;
      const process = groupTasks.filter((task) => !isTaskClosed(task, projects)).length;

      totalDone += done;
      totalProcess += process;

      return {
        name: group.name,
        color: group.color,
        done,
        process,
        total: done + process,
      };
    })
    .sort((a, b) => {
      if (b.done !== a.done) return b.done - a.done;

      return b.process - a.process;
    });

  const timelineData = Array.from({ length: periodDays }).map((_, index) => {
    const dateStr = addDays(cutoffDate, index);
    const date = parseIsoDate(dateStr);

    return {
      name: formatRuDate(date),
      done: analyticsTasks.filter((task) => isTaskClosed(task, projects) && dateKey(task.completedAt) === dateStr).length,
      created: analyticsTasks.filter((task) => !isTaskClosed(task, projects) && getTaskCreatedKey(task) === dateStr).length,
    };
  });

  const rate = totalDone + totalProcess > 0 ? Math.round((totalDone / (totalDone + totalProcess)) * 100) : 0;
  const topGroup = groupData.find((group) => group.total > 0) || null;
  const focus = topGroup?.name || 'Нет данных';
  const createdCount = timelineData.reduce((sum, item) => sum + item.created, 0);
  const throughputDelta = currentDone - createdCount;
  const openNow = analyticsTasks.filter((task) => !isTaskClosed(task, projects)).length;

  const periodActivityTasks = analyticsTasks.filter((task) => {
    const closed = isTaskClosed(task, projects);
    const completedInRange = closed && isWithinRange(task.completedAt, cutoffDate, endDate);
    const createdInRange = isWithinRange(getTaskCreatedKey(task), cutoffDate, endDate);

    return completedInRange || createdInRange;
  });

  const roseRows: FocusGroup[] = groups.map((group) => {
    const groupTasks = periodActivityTasks.filter((task) => getGroupId(task, groupBy) === group.id);
    const done = groupTasks.filter((task) => isTaskClosed(task, projects) && isWithinRange(task.completedAt, cutoffDate, endDate)).length;
    const process = groupTasks.length - done;

    return {
      name: group.name,
      color: group.color,
      done,
      process,
      total: groupTasks.length,
    };
  });

  if (groupBy === 'category') {
    const uncategorizedTasks = periodActivityTasks.filter((task) => !task.categoryId);

    if (uncategorizedTasks.length) {
      const done = uncategorizedTasks.filter((task) => isTaskClosed(task, projects) && isWithinRange(task.completedAt, cutoffDate, endDate)).length;

      roseRows.push({
        name: 'Без метки',
        color: uncategorizedColor,
        done,
        process: uncategorizedTasks.length - done,
        total: uncategorizedTasks.length,
      });
    }
  }

  const roseData = roseRows
    .filter((row) => row.total > 0)
    .sort((a, b) => {
      if (b.done !== a.done) return b.done - a.done;
      return b.process - a.process;
    });

  const activityMap = new Map<string, number>();

  filteredTasks.forEach((task) => {
    if (isWithinRange(getTaskCreatedKey(task), cutoffDate, endDate)) {
      const key = getTaskCreatedKey(task);
      if (key) activityMap.set(key, (activityMap.get(key) || 0) + 1);
    }

    if (isTaskClosed(task, projects) && isWithinRange(task.completedAt, cutoffDate, endDate)) {
      const key = dateKey(task.completedAt);
      if (key) activityMap.set(key, (activityMap.get(key) || 0) + 1);
    }
  });

  const todayDate = parseIsoDate(isoDate(new Date()));
  const rangeStart = parseIsoDate(cutoffDate);
  const rangeEnd = parseIsoDate(endDate);

  const heatmapStart = new Date(rangeStart);
  heatmapStart.setDate(heatmapStart.getDate() - ((heatmapStart.getDay() + 6) % 7));

  const heatmapEnd = new Date(rangeEnd);
  heatmapEnd.setDate(heatmapEnd.getDate() + (6 - ((heatmapEnd.getDay() + 6) % 7)));

  const weeks: {
    key: string;
    month?: string;
    days: {
      key: string;
      label: string;
      count: number;
      level: number;
      future: boolean;
    }[];
  }[] = [];
  const daysFlat: {
    key: string;
    label: string;
    weekday: string;
    day: string;
    count: number;
    level: number;
    future: boolean;
  }[] = [];

  const monthFormat = new Intl.DateTimeFormat('ru-RU', { month: 'short' });
  const weekdayFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
  const dayFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
  const cursor = new Date(heatmapStart);
  let previousMonth = -1;

  while (cursor <= heatmapEnd) {
    const days = [];
    const weekStart = new Date(cursor);
    const month = weekStart.getMonth();
    const showMonth = month !== previousMonth;

    if (showMonth) previousMonth = month;

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(cursor);
      const key = isoDate(date);
      const count = activityMap.get(key) || 0;
      const outsideRange = key < cutoffDate || key > endDate;
      const future = date > todayDate || outsideRange;
      const level = future ? 0 : count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4;
      const label = `${formatActivityDate(date)}: ${count} действий`;

      days.push({
        key,
        label: outsideRange ? formatActivityDate(date) : `${formatActivityDate(date)}: ${count} действий`,
        count,
        level,
        future,
      });

      if (!outsideRange) {
        daysFlat.push({
          key,
          label,
          weekday: weekdayFormat.format(date).replace('.', ''),
          day: dayFormat.format(date).replace('.', ''),
          count,
          level,
          future,
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push({
      key: isoDate(weekStart),
      month: showMonth ? monthFormat.format(weekStart).replace('.', '') : undefined,
      days,
    });
  }

  const total = Array.from(activityMap.values()).reduce((sum, count) => sum + count, 0);
  const activeDays = Array.from(activityMap.values()).filter((count) => count > 0).length;
  const yearlyActivity = { weeks, days: daysFlat, total, activeDays };

  const reportWeeks: Array<{
    key: string;
    start: string;
    end: string;
    label: string;
    tasks: Task[];
  }> = [];

  let weekCursor = getWeekStart(cutoffDate);
  const limit = getWeekEnd(endDate);

  while (weekCursor <= limit) {
    const weekStart = weekCursor;
    const weekEnd = addDays(weekStart, 6);
    const visibleStart = weekStart < cutoffDate ? cutoffDate : weekStart;
    const visibleEnd = weekEnd > endDate ? endDate : weekEnd;

    reportWeeks.push({
      key: weekStart,
      start: visibleStart,
      end: visibleEnd,
      label: `${formatRuDate(visibleStart)} - ${formatRuDate(visibleEnd)}`,
      tasks: doneTasks.filter((task) => {
        const completedAt = dateKey(task.completedAt);
        return !!completedAt && completedAt >= visibleStart && completedAt <= visibleEnd;
      }),
    });

    weekCursor = addDays(weekStart, 7);
  }

  return {
    filteredTasks,
    dateRange,
    periodDays,
    cutoffDate,
    endDate,
    prevCutoffDate,
    today,
    tomorrow,
    doneTasks,
    analyticsTasks,
    groupData,
    timelineData,
    roseData,
    yearlyActivity,
    reportWeeks,
    kpi: {
      done: currentDone,
      process: totalProcess,
      rate,
      later,
      trend,
      focus,
      overdue,
      created: createdCount,
      throughputDelta,
      openNow,
      dueToday,
      dueTomorrow,
    },
  };
};
