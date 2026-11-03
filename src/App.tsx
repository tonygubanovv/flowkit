import { AiActionsMenu } from './components/AiActionsMenu';
import { AppStatus, StorageNotice } from './components/AppStatus';
import { createChatSession, saveChatSession } from './lib/ChatHistory';
﻿import React, { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { AppData, Category, ID, Note, Project, Task } from './types/Schemas';
import { DEFAULT_ACCENT, updateTheme } from './styles/Theme';
import { DEFAULT_BACKGROUND_PRESET, UI, applyBackgroundPreset, normalizeBackgroundPreset } from './styles/Styles';
import { buildHK, genId, todayStr, playDoneSound } from './lib/Helpers';
import { TaskSuggestionDraft } from './lib/AiTaskSuggestions';

import { loadAppData, persistAppData, sanitizeAppDataForExport, readViewPreference, writeViewPreference } from './data/AppStorage';
import { makeDefaultData, normalizeImportedData } from './data/DefaultData';
import { getDeletedTaskMessage, isDoneTask } from './lib/TaskDomain';
import { DEFAULT_TASK_PRIORITY, normalizeTaskPriority, TASK_PRIORITY_OPTIONS } from './lib/TaskPriority';
import { getVisibleTasks } from './lib/TaskFilters';
import {
  addProject,
  applySortToProjectTasksInData,
  markTaskDeleted,
  moveTaskToColumnInData,
  moveTaskToLaneEdgeInData,
  removeNote,
  removeProject,
  removeTask,
  renameProjectInData,
  reorderNotesInData,
  reorderProjects,
  reorderTaskInData,
  restoreTask,
  toggleTaskInData,
  updateProjectColorInData,
  upsertNote,
  upsertProject,
  upsertTask,
} from './lib/AppReducers';

import { Btn, ContextMenu, Icon, Toast, playTaskDeleteSound, playTaskSaveSound } from './components/ui/UiExports';
import { Sidebar } from './components/Sidebar';
import { defaultFilters, FilterMenu, FilterState } from './components/FilterBar';
import { AiChatWidget } from './components/AiChatWidget';

const STORAGE_VIEW_KEY = 'flowkit-view';
const STORAGE_KANBAN_KEY = 'flowkit-last-project';

const GLOBAL_VIEWS = ['today', 'notes', 'analytics', 'calendar'];

const AnalyticsView = lazy(() => import('./views/Analytics').then((module) => ({ default: module.AnalyticsView })));
const CalendarView = lazy(() => import('./views/Calendar').then((module) => ({ default: module.CalendarView })));
const KanbanView = lazy(() => import('./views/Kanban').then((module) => ({ default: module.KanbanView })));
const ListView = lazy(() => import('./views/List').then((module) => ({ default: module.ListView })));
const NotesView = lazy(() => import('./views/Notes').then((module) => ({ default: module.NotesView })));

const TaskModal = lazy(() => import('./components/modals/TaskModal').then((module) => ({ default: module.TaskModal })));
const NoteModal = lazy(() => import('./components/modals/NoteModal').then((module) => ({ default: module.NoteModal })));
const ProjModal = lazy(() => import('./components/modals/ProjModal').then((module) => ({ default: module.ProjModal })));
const SettingsModal = lazy(() => import('./components/modals/SettingsModal').then((module) => ({ default: module.SettingsModal })));
const SearchModal = lazy(() => import('./components/modals/SearchModal').then((module) => ({ default: module.SearchModal })));
const TaskSuggestionModal = lazy(() =>
  import('./components/modals/TaskSuggestionModal').then((module) => ({ default: module.TaskSuggestionModal })),
);

type TaskContextMenu = {
  x: number;
  y: number;
  task: Task;
};

type NoteContextMenu = {
  x: number;
  y: number;
  note: Note;
};

type UndoState = {
  task: Task;
};

const useMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < breakpoint : false;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

const isTyping = () => {
  const activeElement = document.activeElement;

  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    (activeElement as HTMLElement | null)?.isContentEditable
  );
};

const AppProjectSelect = ({
  value,
  projects,
  onChange,
}: {
  value: string | null;
  projects: Project[];
  onChange: (value: string | null) => void;
}) => {
  const [open, setOpen] = useState(false);

  const selectedName = value ? projects.find((project) => project.id === value)?.name || 'Все проекты' : 'Все проекты';

  const close = () => setOpen(false);

  const selectProject = (projectId: string | null) => {
    onChange(projectId);
    close();
  };

  return (
    <div style={UI.app.popoverWrap(12)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fk-hover-subtle"
        style={UI.app.projectSelectTrigger(open, !!value)}
      >
        {selectedName}
        <Icon name={open ? 'chevT' : 'chevD'} size={12} color={'var(--muted)'} />
      </button>

      {open && (
        <>
          <div style={UI.app.backdrop} onClick={close} />

          <div style={UI.app.projectSelectMenu()}>
            <button
              type="button"
              onClick={() => selectProject(null)}
              className="fk-hover-subtle"
              style={UI.app.projectSelectItem(!value)}
            >
              Все проекты
            </button>

            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => selectProject(project.id)}
                className="fk-hover-subtle"
                style={UI.app.projectSelectItem(project.id === value)}
              >
                <span style={UI.app.projectDot(project.color)} />
                {project.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ProjectGearMenu = ({
  activeProject,
  showDone,
  setShowDone,
  onOpenProjectModal,
}: {
  activeProject?: Project;
  showDone: boolean;
  setShowDone: (value: boolean) => void;
  onOpenProjectModal: () => void;
}) => {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div style={UI.app.popoverWrap()}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={open ? undefined : 'fk-hover-subtle'}
        style={UI.app.headerIconButton(open)}
      >
        <Icon name="settings" size={20} />
      </button>

      {open && (
        <>
          <div style={UI.app.backdrop} onClick={close} />

          <div style={UI.app.gearMenuPopover()}>
            {activeProject && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onOpenProjectModal();
                    close();
                  }}
                  className="fk-hover-subtle"
                  style={UI.app.gearMenuItem()}
                >
                  <Icon name="edit" size={16} color={'var(--accent)'} />
                  Настроить колонки
                </button>

                <div style={UI.app.menuSeparator} />
              </>
            )}

            <div
              style={UI.app.menuLabel}
            >
              Задачи
            </div>

            <button
              type="button"
              onClick={() => {
                setShowDone(!showDone);
                close();
              }}
              className="fk-hover-subtle"
              style={UI.compose(UI.app.gearMenuItem(), UI.app.menuItemSplit)}
            >
              <span style={UI.app.menuItemText}>
                <Icon name="check" size={16} color={showDone ? 'var(--success)' : 'var(--muted)'} />
                Выполненные
              </span>

              <span
                style={UI.app.toggleBadge(showDone)}
              >
                {showDone ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<AppData>(makeDefaultData());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [themeVersion, setThemeVersion] = useState(0);

  const [activeView, setActiveView] = useState(() => readViewPreference(STORAGE_VIEW_KEY) || 'today');

  const [projectModal, setProjectModal] = useState<Project | null>(null);
  const [taskModal, setTaskModal] = useState<{ task: Task; isNew: boolean } | null>(null);
  const [noteModal, setNoteModal] = useState<{ note: Note; isNew: boolean } | null>(null);

  const [taskContextMenu, setTaskContextMenu] = useState<TaskContextMenu | null>(null);
  const [noteContextMenu, setNoteContextMenu] = useState<NoteContextMenu | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'ai'>('profile');
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newChat, setNewChat] = useState(createChatSession);

  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const isMobile = false;
  const isChatOverlay = useMobile(1100);

  const activeProject = useMemo(() => {
    return data.projects.find((project) => project.id === activeView);
  }, [data.projects, activeView]);

  const lastKanbanProjectId = useRef<string | null>(readViewPreference(STORAGE_KANBAN_KEY));
  useEffect(() => {
    if (activeProject) {
      lastKanbanProjectId.current = activeProject.id;
      writeViewPreference(STORAGE_KANBAN_KEY, activeProject.id);
    }
  }, [activeProject?.id]);

  const navigateFromSidebar = (view: string) => {
    if (view !== 'kanban') { setActiveView(view); return; }
    const remembered = data.projects.find((project) => project.id === lastKanbanProjectId.current);
    const firstId = data.projectsOrder.find((id) => data.projects.some((project) => project.id === id));
    const projectId = activeProject?.id ?? remembered?.id ?? firstId ?? data.projects[0]?.id;
    if (projectId) setActiveView(projectId);
  };

  const isGlobalView = GLOBAL_VIEWS.includes(activeView);
  const isNotesView = activeView === 'notes';
  const isAnalyticsView = activeView === 'analytics';
  const isCalendarView = activeView === 'calendar';

  useEffect(() => {
    writeViewPreference(STORAGE_VIEW_KEY, activeView);
  }, [activeView]);


  const themeAccent = data.profile?.accentColor || DEFAULT_ACCENT;
  const backgroundPreset = normalizeBackgroundPreset(data.profile?.backgroundPreset || DEFAULT_BACKGROUND_PRESET);

  useLayoutEffect(() => {
    if (isLoading) return;
    updateTheme(themeAccent);
    applyBackgroundPreset(backgroundPreset);
    setThemeVersion((current) => current + 1);
  }, [backgroundPreset, themeAccent, isLoading]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoadError(false);
      try {
        const storedData = await loadAppData();
        if (!mounted) return;
        setData(storedData);
        if (!GLOBAL_VIEWS.includes(activeView) && !storedData.projects.some((project) => project.id === activeView)) setActiveView('today');
        setShowDone(storedData.profile?.showCompletedDefault || false);
        setIsLoading(false);
      } catch {
        if (mounted) setLoadError(true);
      }
    };
    void loadData();
    return () => { mounted = false; };
  }, [loadAttempt]);

  useEffect(() => {
    if (isLoading) return;
    let current = true;
    persistAppData(data).then(() => { if (current) setSaveError(false); })
      .catch(() => { if (current) setSaveError(true); });
    return () => { current = false; };
  }, [data, isLoading, saveAttempt]);

  const openNewTask = useCallback(
    (columnId?: string, initialTitle = '') => {
      const project = activeProject || data.projects.find((item) => item.id === filterProjectId) || data.projects[0];
      const firstColumnId = project?.columns[0]?.id;

      if (!project) return;
      if (!firstColumnId) { setProjectModal(project); return; }

      setTaskModal({
        isNew: true,
        task: {
          id: genId(),
          title: initialTitle,
          projectId: project.id,
          columnId: columnId || firstColumnId,
          priority: DEFAULT_TASK_PRIORITY,
          categoryId: null,
          deadline: activeView === 'today' ? todayStr() : null,
          time: null,
          description: '',
          checklists: [],
          completed: false,
          order: 0,
          createdAt: new Date().toISOString(),
          statusUpdatedAt: new Date().toISOString(),
        },
      });
    },
    [activeProject, activeView, data.projects, filterProjectId],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const hotkey = buildHK(event);
      const hotkeys = data.hotkeys;

      if (isTyping() && !(event.ctrlKey || event.metaKey || event.altKey)) return;

      if (event.code === 'Escape') {
        setShowSearch(false);
        return;
      }

      if (hotkey === hotkeys.search) {
        event.preventDefault();
        setShowSearch(true);
        return;
      }

      if (hotkey === hotkeys.newTask) {
        event.preventDefault();
        openNewTask();
        return;
      }

      if (hotkey === hotkeys.today) {
        event.preventDefault();
        setActiveView('today');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data.hotkeys, openNewTask]);

  const filteredTasks = useMemo(() => {
    return getVisibleTasks({
      activeView,
      archiveDays: data.profile.archiveDays,
      categories: data.categories,
      filterProjectId,
      filters,
      isGlobalView,
      projects: data.projects,
      showDone,
      tasks: data.tasks,
    });
  }, [
    activeView,
    data.categories,
    data.profile.archiveDays,
    data.projects,
    data.tasks,
    filterProjectId,
    filters,
    isGlobalView,
    showDone,
  ]);

  const saveTask = useCallback((task: Task) => {
    setData((current) => upsertTask(current, task));
  }, []);

  const updateTaskPriority = useCallback((task: Task, priority: Task['priority']) => {
    saveTask({ ...task, priority });
  }, [saveTask]);

  const deleteTask = useCallback(
    (id: ID) => {
      const task = data.tasks.find((item) => item.id === id);
      if (!task) return;
      const deletedTask = markTaskDeleted(task);

      setData((current) => removeTask(current, id));

      setTaskModal(null);

      setUndoState({ task: deletedTask });
      playTaskDeleteSound();
    },
    [data.tasks],
  );

  const undoDelete = useCallback(() => {
    if (!undoState) return;

    setData((current) => restoreTask(current, undoState.task));

    setUndoState(null);
  }, [undoState]);

  const closeUndoToast = useCallback(() => {
    setUndoState(null);
  }, []);

  const saveNote = useCallback((note: Note) => {
    setData((current) => upsertNote(current, note));

    setNoteModal(null);
  }, []);

  const deleteNote = useCallback((id: ID) => {
    setData((current) => removeNote(current, id));

    setNoteModal(null);
  }, []);

  const reorderNotes = useCallback((dragId: ID, targetId: ID, side: 'before' | 'after') => {
    setData((current) => reorderNotesInData(current, dragId, targetId, side));
  }, []);

  const moveTaskToColumn = useCallback((taskId: ID, columnId: ID) => {
    setData((current) => moveTaskToColumnInData(current, taskId, columnId));
  }, []);

  const reorderTask = useCallback((dragId: ID, targetId: ID, side: 'top' | 'bottom', targetColumnId: ID) => {
    setData((current) => reorderTaskInData(current, dragId, targetId, side, targetColumnId));
  }, []);

  const moveTaskToLaneEdge = useCallback((taskId: ID, edge: 'top' | 'bottom') => {
    setData((current) => moveTaskToLaneEdgeInData(current, taskId, edge));
  }, []);

  const applyKanbanSort = useCallback(() => {
    if (isGlobalView || activeView === 'today' || filters.sortBy === 'default') return;

    setData((current) => applySortToProjectTasksInData(current, activeView, filters.sortBy, filters.categoryId));
  }, [activeView, filters.categoryId, filters.sortBy, isGlobalView]);

  const toggleTask = useCallback((id: ID) => {
    setData((current) => toggleTaskInData(current, id));
  }, []);

  const saveProject = useCallback((project: Project) => {
    setData((current) => upsertProject(current, project));

    setProjectModal(null);
  }, []);

  const deleteProject = useCallback(
    (id: ID) => {
      setData((current) => removeProject(current, id));

      if (activeView === id) {
        setActiveView('today');
      }
    },
    [activeView],
  );

  const renameProject = useCallback((id: ID, name: string) => {
    setData((current) => renameProjectInData(current, id, name));
  }, []);

  const updateProjectColor = useCallback((id: ID, color: string) => {
    setData((current) => updateProjectColorInData(current, id, color));
  }, []);

  const addNewProject = useCallback((project: Project) => {
    setData((current) => addProject(current, project));
    setActiveView(project.id);
  }, []);

  const reorderProjectIds = useCallback((fromId: ID, toId: ID) => {
    setData((current) => reorderProjects(current, fromId, toId));
  }, []);

  const openNewNote = useCallback(() => {
    setNoteModal({
      isNew: true,
      note: {
        id: genId(),
        title: '',
        content: '',
        color: data.profile?.accentColor || DEFAULT_ACCENT,
        updatedAt: todayStr(),
      },
    });
  }, [data.profile?.accentColor]);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(sanitizeAppDataForExport(data), null, 2)], {
      type: 'application/json',
    });

    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = 'flowkit-backup.json';
    link.click();

    URL.revokeObjectURL(link.href);
  }, [data]);

  const importData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (readerEvent) => {
      try {
        const importedData = normalizeImportedData(JSON.parse(readerEvent.target?.result as string));

        await persistAppData(importedData);
        setData(importedData);
        updateTheme(importedData.profile.accentColor);
        applyBackgroundPreset(normalizeBackgroundPreset(importedData.profile.backgroundPreset || DEFAULT_BACKGROUND_PRESET));
        setShowDone(importedData.profile.showCompletedDefault);
        setActiveView((currentView) => {
          if (GLOBAL_VIEWS.includes(currentView) || importedData.projects.some((project) => project.id === currentView)) {
            return currentView;
          }

          return 'today';
        });
        setShowSettings(false);
      } catch {
        alert('Не удалось импортировать JSON. Проверь файл резервной копии FlowKit.');
      } finally {
        input.value = '';
      }
    };

    reader.onerror = () => {
      alert('Не удалось прочитать файл.');
      input.value = '';
    };

    reader.readAsText(file);
  }, []);

  const openTask = (task: Task) => {
    setTaskModal({ task: { ...task, priority: normalizeTaskPriority(task.priority) }, isNew: false });
  };

  const duplicateTaskDraft = useCallback((task: Task) => {
    const now = new Date().toISOString();

    setTaskModal({
      isNew: true,
      task: {
        ...task,
        id: genId(),
        completed: false,
        completedAt: null,
        comments: [],
        checklists: (task.checklists || []).map((item) => ({
          ...item,
          id: genId(),
        })),
        history: [],
        createdAt: now,
        statusUpdatedAt: now,
      },
    });
  }, []);

  const createTaskFromSuggestion = useCallback((suggestion: TaskSuggestionDraft) => {
    const targetProject = data.projects.find((project) => project.id === suggestion.projectId) || data.projects[0];
    const targetColumnId =
      targetProject?.columns.find((column) => column.id === suggestion.columnId)?.id || targetProject?.columns[0]?.id;

    if (!targetProject || !targetColumnId) return;

    saveTask({
      id: genId(),
      title: suggestion.title,
      description: suggestion.description,
      projectId: targetProject.id,
      columnId: targetColumnId,
      priority: DEFAULT_TASK_PRIORITY,
      categoryId: suggestion.categoryId,
      deadline: suggestion.deadline,
      time: suggestion.time,
      checklists: suggestion.checklists,
      completed: false,
      order: 0,
      createdAt: new Date().toISOString(),
      statusUpdatedAt: new Date().toISOString(),
    });
  }, [data.projects, saveTask]);

  const openNote = (note: Note) => {
    setNoteModal({ note, isNew: false });
  };

  const titles: Record<string, string> = {
    today: 'Сегодня',
    notes: 'Заметки',
    analytics: 'Аналитика',
    calendar: 'Календарь',
  };

  const kanbanColumns = useMemo(() => {
    if (isGlobalView) return [];
    return (activeProject?.columns || []).map((column) => ({ ...column }));
  }, [activeProject?.columns, isGlobalView]);

  const mainTitle = activeProject ? activeProject.name : titles[activeView] || '';

  if (loadError) return <AppStatus title="Не удалось открыть данные" onRetry={() => setLoadAttempt((attempt) => attempt + 1)}>
    Данные не заменены и не удалены. Проверьте доступ к хранилищу браузера и повторите попытку.
  </AppStatus>;
  if (isLoading) return <AppStatus title="Загрузка FlowKit…" />;

  return (
    <div
      data-theme-version={themeVersion}
      style={UI.app.root}
    >

      {!isMobile && (
        <Sidebar
          data={data}
          activeView={activeView}
          setActiveView={navigateFromSidebar}
          onAddProject={addNewProject}
          onReorderProjects={reorderProjectIds}
          onDelProject={deleteProject}
          onRenameProject={renameProject}
          onProjectColorChange={updateProjectColor}
          onSettings={() => { setSettingsTab('profile'); setShowSettings(true); }}
          onSearch={() => setShowSearch(true)}
          isMobile={false}
          onClose={() => {}}
        />
      )}

      <div style={UI.app.content(isMobile)}>
        {saveError && <StorageNotice onRetry={() => setSaveAttempt((attempt) => attempt + 1)} onExport={exportData} />}
        <header style={UI.app.header(isMobile)}>
          <div style={UI.app.titleArea}>
            {isMobile && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                style={UI.app.mobileMenuButton()}
              >
                <Icon name="menu" size={24} />
              </button>
            )}

            <h1
              style={UI.app.title(isMobile)}
            >
              {mainTitle}

              {!isNotesView && !isAnalyticsView && !isCalendarView && (
                <ProjectGearMenu
                  activeProject={activeProject}
                  showDone={showDone}
                  setShowDone={setShowDone}
                  onOpenProjectModal={() => {
                    if (activeProject) setProjectModal(activeProject);
                  }}
                />
              )}
            </h1>

            {isGlobalView && (
              <AppProjectSelect value={filterProjectId} projects={data.projects} onChange={setFilterProjectId} />
            )}
          </div>

          <div style={UI.app.toolbar}>
            {!isNotesView && !isAnalyticsView && (
              <FilterMenu
                filters={filters}
                onChange={setFilters}
                categories={data.categories}
                onApplySort={!isCalendarView && !isNotesView && !isAnalyticsView && activeView !== 'today' ? applyKanbanSort : null}
              />
            )}

            <AiActionsMenu onChat={() => setShowAiChat(true)} onSuggest={() => setShowTaskSuggestions(true)} canSuggest={!isNotesView && !isAnalyticsView} />

            <Btn
              variant="primary"
              disabled={!isNotesView && data.projects.length === 0}
              title={!isNotesView && data.projects.length === 0 ? 'Сначала создайте проект' : undefined}
              onClick={isNotesView ? openNewNote : () => openNewTask()}
              style={UI.app.primaryAction}
            >
              <Icon name="plus" size={20} />
              {!isMobile && (isNotesView ? 'Заметка' : 'Задача')}
            </Btn>
          </div>
        </header>

        <main key={activeView} style={UI.app.main}>
          <Suspense fallback={<AppStatus title="Загрузка раздела…" embedded />}>
            {isAnalyticsView ? (
              <AnalyticsView
                tasks={data.tasks}
                categories={data.categories}
                projects={data.projects}
                filterProj={filterProjectId}
              />
            ) : isCalendarView ? (
              <CalendarView
                tasks={data.tasks}
                projects={data.projects}
                categories={data.categories}
                filterProjectId={filterProjectId}
                onTaskClick={openTask}
                onUpdateTask={saveTask}
                onDelete={deleteTask}
              />
            ) : isNotesView ? (
              <NotesView
                notes={data.notes}
                onEdit={openNote}
                onNoteCtx={(event, note) => setNoteContextMenu({ x: event.clientX, y: event.clientY, note })}
                onReorder={reorderNotes}
              />
            ) : activeView === 'today' ? (
              <ListView
                tasks={filteredTasks}
                projects={data.projects}
                categories={data.categories}
                showProject
                groupByDate
                onTaskClick={openTask}
                onTaskCtx={(event, task) => setTaskContextMenu({ x: event.clientX, y: event.clientY, task })}
              />
            ) : (
              <KanbanView
                columns={kanbanColumns}
                tasks={filteredTasks}
                categories={data.categories}
                projects={data.projects}
                showProject={isGlobalView}
                sortBy={filters.sortBy}
                onMoveToCol={moveTaskToColumn}
                onReorder={reorderTask}
                onMoveToLaneEdge={moveTaskToLaneEdge}
                onDelete={deleteTask}
                onToggle={toggleTask}
                onTaskClick={openTask}
                onSave={saveTask}
              />
            )}
          </Suspense>
        </main>
      </div>

      <Suspense fallback={null}>
        {taskModal && (
          <TaskModal
            key={taskModal.task.id}
            task={taskModal.task}
            isNew={taskModal.isNew}
            data={data}
            activeView={activeView}
            projects={data.projects}
            categories={data.categories}
            onSave={(task) => {
              saveTask(task);
              playTaskSaveSound();
              setTaskModal(null);
            }}
            onComplete={(task) => {
              setData((current) => {
                const updated = upsertTask(current, task);
                const saved = updated.tasks.find((item) => item.id === task.id);
                return saved && !isDoneTask(saved, updated.projects) ? toggleTaskInData(updated, task.id) : updated;
              });
              setTaskModal(null);
            }}
            onDelete={deleteTask}
            onCreateSuggestion={createTaskFromSuggestion}
            onDuplicate={() => duplicateTaskDraft(taskModal.task)}
            onOpenLinkedTask={(taskId, currentTask) => {
              const nextData = currentTask.title.trim() ? upsertTask(data, currentTask) : data;
              const linkedTask = nextData.tasks.find((item) => item.id === taskId);

              if (!linkedTask) return;

              setData(nextData);
              setTaskModal({ task: { ...linkedTask, priority: normalizeTaskPriority(linkedTask.priority) }, isNew: false });
            }}
            onClose={() => setTaskModal(null)}
            isMobile={isMobile}
          />
        )}

        {noteModal && (
          <NoteModal
            note={noteModal.note}
            isNew={noteModal.isNew}
            onSave={saveNote}
            onDelete={deleteNote}
            onClose={() => setNoteModal(null)}
            isMobile={isMobile}
          />
        )}

        {projectModal && (
          <ProjModal
            project={projectModal}
            onSave={saveProject}
            onClose={() => setProjectModal(null)}
            isMobile={isMobile}
          />
        )}

        {showSettings && (
          <SettingsModal
            data={data}
            initialTab={settingsTab}
            onSave={({ categories, profile, hotkeys }: { categories: Category[]; profile: AppData['profile']; hotkeys: AppData['hotkeys'] }) => {
              const nextProfile = {
                ...profile,
                accentColor: profile.accentColor || DEFAULT_ACCENT,
                backgroundPreset: normalizeBackgroundPreset(profile.backgroundPreset || DEFAULT_BACKGROUND_PRESET),
              };

              updateTheme(nextProfile.accentColor);

              setData((current) => ({
                ...current,
                categories,
                profile: nextProfile,
                hotkeys,
              }));
              setShowDone(nextProfile.showCompletedDefault);
              setShowSettings(false);
            }}
            onClose={() => setShowSettings(false)}
            onExport={exportData}
            onImport={importData}
            isMobile={isMobile}
          />
        )}

        {showSearch && (
          <SearchModal
            data={data}
            onClose={() => setShowSearch(false)}
            onSelect={openTask}
            isMobile={isMobile}
          />
        )}

        {showTaskSuggestions && (
          <TaskSuggestionModal
            data={data}
            activeView={activeView}
            onAccept={createTaskFromSuggestion}
            onClose={() => setShowTaskSuggestions(false)}
            isMobile={isMobile}
          />
        )}
      </Suspense>

      {showAiChat && (
        <AiChatWidget
          data={data}
          key={activeChatId ?? data.aiChats?.[0]?.id ?? newChat.id}
          session={(data.aiChats ?? []).find((chat) => chat.id === activeChatId) ?? (activeChatId === newChat.id ? newChat : data.aiChats?.[0] ?? newChat)}
          onSave={(session) => setData((current) => saveChatSession(current, session))}
          onSelectSession={setActiveChatId}
          onConfigure={() => { setSettingsTab('ai'); setShowSettings(true); }}
          onNewSession={() => {
            const empty = data.aiChats?.find((chat) => !chat.messages.length && !chat.draft.trim() && !chat.contextTaskIds.length);
            if (empty) { setActiveChatId(empty.id); return; }
            const session = createChatSession();
            setNewChat(session);
            setActiveChatId(session.id);
          }}
          activeView={activeView}
          onClose={() => setShowAiChat(false)}
          isMobile={isChatOverlay}
        />
      )}

      {taskContextMenu && (
        <ContextMenu
          x={taskContextMenu.x}
          y={taskContextMenu.y}
          onClose={() => setTaskContextMenu(null)}
          items={[
            {
              label: taskContextMenu.task.completed ? 'Отменить выполнение' : 'Выполнить',
              icon: 'check',
              onClick: () => {
                if (!taskContextMenu.task.completed) {
                  playDoneSound();
                }

                toggleTask(taskContextMenu.task.id);
                setTaskContextMenu(null);
              },
            },
            {
              label: 'Изменить',
              icon: 'edit',
              onClick: () => {
                openTask(taskContextMenu.task);
                setTaskContextMenu(null);
              },
            },
            {
              label: 'Приоритет',
              icon: 'flag',
              onClick: () => {},
              children: TASK_PRIORITY_OPTIONS.map((priority) => ({
                label: priority.name,
                icon: priority.icon,
                onClick: () => updateTaskPriority(taskContextMenu.task, priority.id),
              })),
            },
            '---',
            {
              label: 'Удалить',
              icon: 'trash',
              onClick: () => {
                deleteTask(taskContextMenu.task.id);
                setTaskContextMenu(null);
              },
            },
          ]}
        />
      )}

      {noteContextMenu && (
        <ContextMenu
          x={noteContextMenu.x}
          y={noteContextMenu.y}
          onClose={() => setNoteContextMenu(null)}
          items={[
            {
              label: 'Открыть',
              icon: 'edit',
              onClick: () => {
                openNote(noteContextMenu.note);
                setNoteContextMenu(null);
              },
            },
            {
              label: 'Удалить',
              icon: 'trash',
              onClick: () => {
                deleteNote(noteContextMenu.note.id);
                setNoteContextMenu(null);
              },
            },
          ]}
        />
      )}

      {undoState && (
        <Toast
          key={undoState.task.id}
          message={getDeletedTaskMessage(undoState.task)}
          onClose={closeUndoToast}
          onUndo={undoDelete}
          bottom={isMobile ? 80 : 28}
        />
      )}
    </div>
  );
}
