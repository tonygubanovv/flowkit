
export type ID = string;

export interface Comment {
  id: ID;
  text: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: ID;
  text: string;
  completed: boolean;
}

export type TaskPriority = 'high' | 'standard' | 'low';

export type TaskLinkType = 'related' | 'blocks' | 'blocked_by';

export interface TaskLink {
  taskId: ID;
  type: TaskLinkType;
}

export type TaskHistoryEventType =
  | 'created'
  | 'updated'
  | 'moved'
  | 'deadline_changed'
  | 'completed'
  | 'reopened'
  | 'comment_added'
  | 'comment_removed'
  | 'deleted'
  | 'reordered'
  | 'project_changed'
  | 'category_changed';

export interface TaskHistoryEvent {
  id: ID;
  type: TaskHistoryEventType;
  at: string;
  label: string;
  details?: string;
  from?: string | null;
  to?: string | null;
}

export interface Task {
  id: ID;
  title: string;
  description: string;
  projectId: ID;
  columnId: ID;
  priority: TaskPriority;
  categoryId: ID | null;
  deadline: string | null;
  time: string | null;
  completed: boolean;
  completedAt?: string | null;
  order: number;
  comments?: Comment[];
  checklists?: ChecklistItem[];
  createdAt?: string;
  statusUpdatedAt?: string;
  history?: TaskHistoryEvent[];
  links?: TaskLink[];
}

export interface Column {
  id: ID;
  name: string;
  color: string;
  isDone?: boolean;
}

export interface Project {
  id: ID;
  name: string;
  color: string;
  columns: Column[];
}

export interface Category {
  id: ID;
  name: string;
  color: string;
}

export interface Note {
  id: ID;
  title: string;
  content: string;
  color: string;
  updatedAt: string;
}

export interface Profile {
  name: string;
  avatarEmoji: string;
  accentColor: string;
  backgroundPreset: string;
  showCompletedDefault: boolean;
  weekStartsMonday: boolean;
  archiveDays: number;
  aiApiKey?: string;
  aiModel?: string;
  aiUserInstructions?: string;
  aiTaskContext?: string;
}

export interface Hotkeys {
  newTask: string;
  today: string;
  allTasks: string;
  toggleDone: string;
  search: string;
}

export interface AiChatMessage {
  id: ID;
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatSession {
  id: ID;
  title: string;
  updatedAt: string;
  messages: AiChatMessage[];
  draft: string;
  contextTaskIds: ID[];
}

export interface AppData {
  aiChats?: AiChatSession[];
  projects: Project[];
  categories: Category[];
  tasks: Task[];
  notes: Note[];
  hotkeys: Hotkeys;
  profile: Profile;
  projectsOrder: ID[];
}
