import { AppData } from '../types/Schemas';
import { getPreRenameData, getStoredData, setStoredData } from './Db';
import { makeDefaultData, normalizeImportedData } from './DefaultData';

// Ключ приложения до перехода на IndexedDB. Используется только для чтения при переносе.
const PRE_RENAME_STORAGE_KEY = 'st-v7';

export const sanitizeAppDataForExport = (data: AppData): AppData => {
  const profile: Record<string, unknown> = {
    ...data.profile,
    aiApiKey: '',
    aiUserInstructions: data.profile.aiUserInstructions || '',
    aiTaskContext: data.profile.aiTaskContext || '',
  };

  // Сохранённые данные могли нести тот же ключ под именем прежнего провайдера.
  delete profile.aiOpenRouterApiKey;

  return { ...data, profile: profile as unknown as AppData['profile'] };
};

const readPreRenameLocalStorage = (): AppData | null => {
  const raw = localStorage.getItem(PRE_RENAME_STORAGE_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppData;
  } catch {
    return null;
  }
};

export const loadAppData = async (): Promise<AppData> => {
  const storedData = (await getStoredData()) ?? (await getPreRenameData()) ?? readPreRenameLocalStorage();

  if (storedData) {
    const migrated = normalizeImportedData(storedData);

    await setStoredData(migrated);

    return migrated;
  }

  const defaults = makeDefaultData();

  await setStoredData(defaults);

  return defaults;
};

let pendingSave: Promise<void> = Promise.resolve();
export const persistAppData = (data: AppData): Promise<void> => {
  const nextSave = pendingSave.catch(() => {}).then(() => setStoredData(data));
  pendingSave = nextSave;
  return nextSave;
};

export const readViewPreference = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};

export const writeViewPreference = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch { /* Навигация работает и без localStorage. */ }
};
