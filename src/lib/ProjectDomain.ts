import { Project } from '../types/Schemas';
import { DEFAULT_PROJECT_COLORS } from '../styles/Theme';

export const prepareNewProject = (project: Project): Project => ({
  ...project,
  columns: project.columns.length ? project.columns : [
    { id: `${project.id}-todo`, name: 'К выполнению', color: DEFAULT_PROJECT_COLORS.todo },
    { id: `${project.id}-progress`, name: 'В процессе', color: DEFAULT_PROJECT_COLORS.progress },
    { id: `${project.id}-done`, name: 'Готово', color: DEFAULT_PROJECT_COLORS.done, isDone: true },
  ],
});
