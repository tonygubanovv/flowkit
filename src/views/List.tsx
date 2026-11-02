import React, { useState, useMemo } from 'react';

// 1. Библиотека
import { T } from '../styles/Theme'; 
import { UI } from '../styles/Styles';
import { Task, Project, Category, ID } from '../types/Schemas';

// 2. Компоненты
import { Check, CatBadge, DateBadge, Icon, ProgressBar } from '../components/ui/UiExports';

interface ListViewProps {
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  showProject: boolean;
  groupByDate: boolean;
  onTaskClick: (task: Task) => void;
  onTaskCtx: (e: React.MouseEvent, task: Task) => void;
  onToggle: (taskId: ID) => void;
}

export function ListView({ 
  tasks, 
  projects, 
  categories, 
  showProject, 
  groupByDate, 
  onTaskClick, 
  onTaskCtx, 
  onToggle 
}: ListViewProps) {
  const [showDone, setShowDone] = useState(false);

  const isTaskDone = (t: Task): boolean => {
    if (t.completed) return true;
    const proj = projects.find((p) => p.id === t.projectId);
    const col = proj?.columns.find((c) => c.id === t.columnId);
    return col?.isDone === true;
  };

  const { activeTasks, doneTasks, progress } = useMemo(() => {
    const active: Task[] = [];
    const done: Task[] = [];
    
    tasks.forEach(t => {
      if (isTaskDone(t)) done.push(t);
      else active.push(t);
    });

    const pct = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;
    
    return { activeTasks: active, doneTasks: done, progress: pct };
  }, [tasks, projects]);

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    
    if (groupByDate) {
      activeTasks.forEach((t) => {
        const p = projects.find((proj) => proj.id === t.projectId);
        const pName = p ? p.name : 'Входящие';
        if (!groups[pName]) groups[pName] = [];
        groups[pName].push(t);
      });
    } else {
      activeTasks.forEach((t) => {
        const p = projects.find((proj) => proj.id === t.projectId);
        const c = p?.columns.find((col) => col.id === t.columnId);
        const cName = c ? c.name : 'Без колонки';
        if (!groups[cName]) groups[cName] = [];
        groups[cName].push(t);
      });
    }
    return groups;
  }, [activeTasks, projects, groupByDate]);

  const renderRow = (task: Task) => {
    const cat = categories.find((c) => c.id === task.categoryId);
    const proj = projects.find((p) => p.id === task.projectId);
    const col = proj?.columns.find((c) => c.id === task.columnId);
    
    const isColDone = col?.isDone === true;
    const done = isTaskDone(task);
    const commentsCount = task.comments?.length || 0;
    const linksCount = task.links?.length || 0;

    return (
      <div
        key={task.id}
        onClick={() => onTaskClick(task)}
        onContextMenu={(e) => onTaskCtx(e, task)}
        className={!done ? 'fk-hover-subtle' : undefined}
        style={UI.list.row(done)}
      >
        <div 
          onClick={e => e.stopPropagation()} 
          style={UI.list.rowCheck(isColDone)}
        >
          <Check done={done} onToggle={() => {
            if (!isColDone) onToggle(task.id);
          }} />
        </div>
        
      <div style={UI.list.rowBody}>
          {/* Заголовок переносится и виден полностью */}
          <span style={UI.list.rowTitle(done)}>
            {task.title}
          </span>
          {task.description && (
            <span style={UI.list.rowDescription}>
              {task.description.replace(/<[^>]+>/g, ' ')}
            </span>
          )}
        </div>

      <div style={UI.list.rowMeta}>
          {cat && <CatBadge cat={cat} />}
          <DateBadge deadline={task.deadline} time={task.time} isDone={done} />
          {commentsCount > 0 && (
            <span title={`${commentsCount} комментариев`} style={UI.badge.meta()}>
              <Icon name="message" size={13} color="currentColor" />
              {commentsCount}
            </span>
          )}
          {linksCount > 0 && (
            <span title={`${linksCount} связанных задач`} style={UI.badge.meta()}>
              <Icon name="link" size={13} color="currentColor" />
              {linksCount}
            </span>
          )}
          {showProject && proj && !groupByDate && (
          <span style={UI.list.projectMeta}>
            <span style={UI.list.projectDot(proj.color)} />
               {proj.name}
             </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={UI.list.shell}>
      <div style={UI.list.content}>
        
        {groupByDate && tasks.length > 0 && (
          <div style={UI.list.progressPanel}>
        <div style={UI.list.progressHeader}>
          <span style={UI.list.progressTitle}>Прогресс дня</span>
          <span style={UI.list.progressValue(progress === 100)}>
                {doneTasks.length} из {tasks.length} выполнено
              </span>
            </div>
            <ProgressBar pct={progress} color={progress === 100 ? T.success : T.accent} done={progress === 100} />
          </div>
        )}

        {activeTasks.length === 0 && doneTasks.length === 0 && (
          <div style={UI.list.emptyState}>
            <Icon name="check" size={48} color={T.border2} />
            На сегодня нет задач. Отличный повод отдохнуть!
          </div>
        )}

        {Object.entries(grouped).map(([groupName, groupTasks]) => {
          const pColor = groupByDate ? projects.find((p) => p.name === groupName)?.color : null;
          return (
          <div key={groupName} style={UI.list.groupStack}>
              <div style={UI.list.groupTitle}>
              {pColor && <span style={UI.layout.dot(pColor, 10, 3)} />}
                {groupName}
                <span style={UI.list.groupCount}>
                  {groupTasks.length}
                </span>
              </div>
              <div style={UI.list.rowGroup}>
                {groupTasks.map(t => renderRow(t))}
              </div>
            </div>
          );
        })}

        {doneTasks.length > 0 && (
        <div style={UI.list.doneWrap}>
            <button 
              onClick={() => setShowDone(!showDone)} 
              className="fk-hover-subtle fk-hover-text"
              style={UI.list.doneToggle} 
            >
              <Icon name="chevD" size={16} style={UI.layout.chevron(showDone)} />
              Показать завершенные ({doneTasks.length})
            </button>
            {showDone && (
              <div style={UI.list.donePanel}>
                {doneTasks.map(t => renderRow(t))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


