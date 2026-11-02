import { openDB, IDBPDatabase } from 'idb';

// 1. Библиотека
import { AppData } from '../types/Schemas';

const DB_NAME = 'FlowKitDB';
const STORE_NAME = 'appData';
const DB_VERSION = 1;

// Старое имя базы до переименования проекта из Simple Tasks в FlowKit.
const MIGRATION_DB_NAME = 'SimpleTasksDB';

/**
 * Инициализация базы данных IndexedDB
 */
export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

/**
 * Получение всех данных приложения
 */
export const getStoredData = async (): Promise<AppData | null> => {
  const db = await initDB();
  const data = await db.get(STORE_NAME, 'current');
  return data ?? null;
};

/**
 * Однократное чтение из базы под старым именем, пока новая пуста.
 * Пустую базу не создаёт: там, где нет indexedDB.databases(), открытие прерывается в upgrade.
 */
export const getPreRenameData = async (): Promise<AppData | null> => {
  if (typeof indexedDB.databases === 'function') {
    const names = await indexedDB.databases();
    if (!names.some((entry) => entry.name === MIGRATION_DB_NAME)) return null;
  }

  try {
    const db = await openDB(MIGRATION_DB_NAME, DB_VERSION, {
      upgrade: (db, oldVersion) => {
        if (oldVersion === 0) {
          throw new Error('FlowKit: pre-rename database is absent');
        }
      },
    });
    const data = await db.get(STORE_NAME, 'current');
    db.close();
    return data ?? null;
  } catch {
    return null;
  }
};

/**
 * Сохранение состояния приложения
 */
export const setStoredData = async (data: AppData): Promise<void> => {
  const db = await initDB();
  await db.put(STORE_NAME, data, 'current');
};

