
export const genId = (): string => Math.random().toString(36).slice(2, 9);

// Строго локальная дата (YYYY-MM-DD) без учета UTC сдвигов
export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Сдвиг даты с фиксацией полдня для предотвращения багов при переходе на летнее/зимнее время
export const shiftDate = (days: number): string => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Экспорт для календаря
export const getFirstDayOfMonth = (year: number, month: number): number => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Возвращаем 0 для Пн, 6 для Вс
};

export function dateDiffDays(d1: string, d2: string): number {
  return Math.round((new Date(`${d2}T00:00:00`).getTime() - new Date(`${d1}T00:00:00`).getTime()) / 864e5);
}

export function relDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';

  const date = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const diffDays = Math.round((date.getTime() - today.getTime()) / 864e5);

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Завтра';

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });

  return formatter.format(date).replace(' г.', '');
}

export function formatRuDate(value: string | Date | null | undefined): string {
  if (!value) return '';

  const date = value instanceof Date
    ? value
    : new Date(value.includes('T') ? value : `${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatRuDateTime(value: string | Date | null | undefined): string {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return `${formatRuDate(date)}, ${date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export const dateStatus = (d?: string | null, isDone?: boolean): 'done' | 'overdue' | 'today' | 'future' | null => {
  if (!d) return null;
  if (isDone) return 'done';
  const t = todayStr();
  if (d < t) return 'overdue';
  if (d === t) return 'today';
  return 'future';
};

export interface SmartDateResult {
  cleanText: string;
  date: string | null;
  time: string | null;
}

const MONTHS_MAP: Record<string, number> = {
  'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
  'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
  'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'июн': 5, 'июл': 6, 'авг': 7, 'сен': 8, 'сент': 8, 'окт': 9, 'ноя': 10, 'дек': 11,
};

const DAY_PERIODS: Record<string, string> = {
  'утром': '09:00',
  'днем': '14:00',
  'днём': '14:00',
  'вечером': '19:00',
  'ночью': '22:00',
};

const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const normalizeCleanText = (value: string) =>
  value
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([#@])/g, ' $1')
    .trim();

const normalizeTime = (hours: number, minutes = 0): string | null => {
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const resolveDayMonth = (day: number, month: number, now: Date): Date => {
  const candidate = new Date(now.getFullYear(), month, day, 12, 0, 0, 0);

  if (candidate.getTime() < now.getTime() - 2592000000) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }

  return candidate;
};

// Смарт-парсинг NLP
export function extractSmartDate(text: string, matchEnd = false): SmartDateResult {
  let cleanText = text;
  let date: string | null = null;
  let time: string | null = null;
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const endBoundary = matchEnd ? '(?=\\s|$)' : '(?=\\s)';
  
  const relRegex = new RegExp(`(?:^|\\s)(до\\s+|к\\s+)?(сегодня|завтра|послезавтра)${endBoundary}`, 'i');
  const relMatch = cleanText.match(relRegex);
  
  if (relMatch) {
    const word = relMatch[2].toLowerCase();
    const d = new Date(now);
    if (word === 'завтра') d.setDate(d.getDate() + 1);
    if (word === 'послезавтра') d.setDate(d.getDate() + 2);
    date = fmtDate(d);
    cleanText = cleanText.replace(relMatch[0], ' ');
  }

  if (!date) {
    const textRegex = new RegExp(`(?:^|\\s)(до\\s+|к\\s+)?(\\d{1,2})\\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|янв|фев|мар|апр|май|июн|июл|авг|сен|сент|окт|ноя|дек)${endBoundary}`, 'i');
    const textMatch = cleanText.match(textRegex);
    
    if (textMatch) {
      const day = parseInt(textMatch[2], 10);
      const monthStr = textMatch[3].toLowerCase();
      const month = MONTHS_MAP[monthStr];
      const d = resolveDayMonth(day, month, now);
      date = fmtDate(d);
      cleanText = cleanText.replace(textMatch[0], ' ');
    }
  }

  if (!date) {
    const numericRegex = new RegExp(`(?:^|\\s)(до\\s+|к\\s+)?(\\d{1,2})\\.(\\d{1,2})(?:\\.(\\d{2,4}))?${endBoundary}`, 'i');
    const numericMatch = cleanText.match(numericRegex);

    if (numericMatch) {
      const day = parseInt(numericMatch[2], 10);
      const month = parseInt(numericMatch[3], 10) - 1;
      const yearValue = numericMatch[4] ? parseInt(numericMatch[4], 10) : null;
      const year = yearValue ? (yearValue < 100 ? 2000 + yearValue : yearValue) : now.getFullYear();
      const d = yearValue ? new Date(year, month, day, 12, 0, 0, 0) : resolveDayMonth(day, month, now);
      date = fmtDate(d);
      cleanText = cleanText.replace(numericMatch[0], ' ');
    }
  }

  const timeRegexes = [
    new RegExp(`(?:^|\\s)(?:(?:в|к|до)\\s*)?(\\d{1,2})(?::|\\.)(\\d{2})${endBoundary}`, 'i'),
    new RegExp(`(?:^|\\s)(?:в|к|до)\\s*(\\d{1,2})(?:\\s*час(?:а|ов)?)${endBoundary}`, 'i'),
    new RegExp(`(?:^|\\s)(?:в|к|до)\\s*(\\d{1,2})${endBoundary}`, 'i'),
  ];

  for (const regex of timeRegexes) {
    const timeMatch = cleanText.match(regex);
    if (!timeMatch) continue;

    const hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const normalized = normalizeTime(hours, minutes);

    if (normalized) {
      time = normalized;
      cleanText = cleanText.replace(timeMatch[0], ' ');
      break;
    }
  }

  if (!time) {
    const periodRegex = new RegExp(`(?:^|\\s)(утром|днем|днём|вечером|ночью)${endBoundary}`, 'i');
    const periodMatch = cleanText.match(periodRegex);
    if (periodMatch) {
      time = DAY_PERIODS[periodMatch[1].toLowerCase()] || null;
      cleanText = cleanText.replace(periodMatch[0], ' ');
    }
  }

  if (!date && time) {
    date = fmtDate(now);
  }

  return {
    cleanText: normalizeCleanText(cleanText),
    date,
    time,
  };
}

// Функции для хоткеев
export const buildHK = (e: KeyboardEvent): string => {
  const m = [];
  if (e.ctrlKey) m.push('Ctrl');
  if (e.metaKey) m.push('Cmd');
  if (e.altKey) m.push('Alt');
  if (e.shiftKey) m.push('Shift');
  m.push(e.code);
  return m.join('+');
};

export const formatHK = (hk: string): string => {
  if (!hk) return '';
  return hk
    .replace(/Key/g, '')
    .replace(/Digit/g, '')
    .replace('Space', 'Пробел')
    .replace('Slash', '/')
    .replace('Minus', '-')
    .replace('Equal', '=')
    .replace('BracketLeft', '[')
    .replace('BracketRight', ']')
    .replace('Backquote', '`');
};

export { playDoneSound } from '../components/ui/Sound';
