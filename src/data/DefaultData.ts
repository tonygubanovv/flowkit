import { normalizeChatSessions } from '../lib/ChatHistory';
import { normalizeMindMaps } from '../lib/MindMaps';
import { DEFAULT_ACCENT, DEFAULT_CATEGORY_COLORS, DEFAULT_PROJECT_COLORS } from '../styles/Theme';
import { DEFAULT_BACKGROUND_PRESET, normalizeBackgroundPreset } from '../styles/Styles';
import { normalizeTaskPriority } from '../lib/TaskPriority';
import { AppData, Category, ID, Note, Project, Task } from '../types/Schemas';
import { normalizeTaskLinks } from '../lib/TaskLinks';

export const makeDefaultData = (): AppData => {
  const workProjectId = 'p1';
  const personalProjectId = 'p2';

  const todoColumnId = 'c1';
  const progressColumnId = 'c2';
  const doneColumnId = 'c3';

  const personalTodoColumnId = 'c4';
  const personalDoneColumnId = 'c5';

  return {
    projects: [
      {
        id: workProjectId,
        name: 'Работа',
        color: DEFAULT_PROJECT_COLORS.work,
        columns: [
          { id: todoColumnId, name: 'К выполнению', color: DEFAULT_PROJECT_COLORS.todo },
          { id: progressColumnId, name: 'В процессе', color: DEFAULT_PROJECT_COLORS.progress },
          { id: doneColumnId, name: 'Готово', color: DEFAULT_PROJECT_COLORS.done, isDone: true },
        ],
      },
      {
        id: personalProjectId,
        name: 'Личное',
        color: DEFAULT_PROJECT_COLORS.personal,
        columns: [
          { id: personalTodoColumnId, name: 'К выполнению', color: DEFAULT_PROJECT_COLORS.todo },
          { id: personalDoneColumnId, name: 'Готово', color: DEFAULT_PROJECT_COLORS.done, isDone: true },
        ],
      },
    ],
    categories: [
      { id: 'cat1', name: 'Срочно', color: DEFAULT_CATEGORY_COLORS.urgent },
      { id: 'cat2', name: 'Идея', color: DEFAULT_CATEGORY_COLORS.idea },
    ],
    tasks: [],
    notes: [],
    hotkeys: {
      newTask: 'KeyN',
      today: 'KeyT',
      allTasks: 'KeyA',
      toggleDone: 'KeyD',
      search: 'Slash',
    },
    profile: {
      name: '',
      avatarEmoji: '🚀',
      accentColor: DEFAULT_ACCENT,
      backgroundPreset: DEFAULT_BACKGROUND_PRESET,
      showCompletedDefault: false,
      weekStartsMonday: true,
      archiveDays: 7,
      aiApiKey: '',
      aiModel: '',
      aiUserInstructions: '',
      aiTaskContext: '',
    },
    projectsOrder: [workProjectId, personalProjectId],
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Сохранённые данные и старые бэкапы могли содержать поле под именем прежнего провайдера.
const pickStoredApiKey = (profile: Record<string, unknown> | null): string => {
  const current = typeof profile?.aiApiKey === 'string' ? profile.aiApiKey.trim() : '';
  const renamed = typeof profile?.aiOpenRouterApiKey === 'string' ? profile.aiOpenRouterApiKey.trim() : '';

  return current || renamed;
};

export const normalizeImportedData = (value: unknown): AppData => {
  if (!isRecord(value)) {
    throw new Error('Invalid backup');
  }

  const defaults = makeDefaultData();

  if (!Array.isArray(value.projects) || !Array.isArray(value.categories) || !Array.isArray(value.tasks)) {
    throw new Error('Invalid backup');
  }

  const projects = value.projects as Project[];
  const categories = value.categories as Category[];
  const tasks = normalizeTaskLinks((value.tasks as Task[]).map((task) => ({
    ...task,
    priority: normalizeTaskPriority(task.priority),
  })));
  const notes = Array.isArray(value.notes) ? (value.notes as Note[]) : defaults.notes;
  const hotkeys = isRecord(value.hotkeys) ? { ...defaults.hotkeys, ...value.hotkeys } : defaults.hotkeys;
  const importedProfile = isRecord(value.profile) ? value.profile : null;
  const profile = isRecord(value.profile)
    ? {
        ...defaults.profile,
        ...value.profile,
        accentColor: typeof importedProfile?.accentColor === 'string' ? importedProfile.accentColor : DEFAULT_ACCENT,
        backgroundPreset: normalizeBackgroundPreset(
          typeof importedProfile?.backgroundPreset === 'string'
            ? importedProfile.backgroundPreset
            : DEFAULT_BACKGROUND_PRESET,
        ),
        aiApiKey: pickStoredApiKey(importedProfile),
      }
    : defaults.profile;

  const importedOrder = Array.isArray(value.projectsOrder)
    ? value.projectsOrder.filter((id): id is ID => typeof id === 'string')
    : [];
  const projectIds = new Set(projects.map((project) => project.id));
  const orderedIds = importedOrder.filter((id) => projectIds.has(id));
  const missingIds = projects.map((project) => project.id).filter((id) => !orderedIds.includes(id));

  return {
    ...defaults,
    projects,
    categories,
    tasks,
    notes,
    hotkeys,
    profile,
    projectsOrder: [...orderedIds, ...missingIds],
    aiChats: normalizeChatSessions(value.aiChats),
    mindMaps: normalizeMindMaps(value.mindMaps),
  };
};
