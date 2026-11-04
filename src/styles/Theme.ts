export interface ThemeTokens {
  bg: string;
  surface: string;
  band: string;
  card: string;
  cardActive: string;
  cardHov: string;
  panelHead: string;
  border: string;
  border2: string;
  borderStrong: string;
  borderHover: string;
  inputBorder: string;
  accent: string;
  accentFill: string;
  accentText: string;
  accentDim: string;
  accentMid: string;
  text: string;
  text2: string;
  muted: string;
  subtle: string;
  danger: string;
  success: string;
  warn: string;
  shadow: string;
  shadowLg: string;
}

export const FONT_FAMILY = 'var(--font-family)';
export const FONT_MONO = 'var(--font-mono)';

export const RAW_COLORS = {
  white: '#ffffff',
  black: '#000000',
} as const;

export const BRAND_COLORS = {
  flowkit: '#7CFF5A',
  teal: '#2dd4bf',
  emerald: '#34d399',
  cyan: '#22d3ee',
  blue: '#60a5fa',
  indigo: '#818cf8',
  violet: '#a78bfa',
  fuchsia: '#e879f9',
  rose: '#fb7185',
  orange: '#fb923c',
  amber: '#fbbf24',
  lime: '#a3e635',
  slate: '#64748b',
  lavender: '#b4a7ff',
  idea: '#c084fc',
} as const;

export const SURFACE_COLORS = {
  bg: '#030303',
  surface: '#030303',
  band: '#000000',
  card: '#0F0F0F',
  cardActive: '#171717',
  cardHover: '#1F1F1F',
  panelHead: '#060606',
  projectTodo: '#37393b',
  projectDone: '#284034',
} as const;

export const TEXT_COLORS = {
  primary: '#f5f5f5',
  secondary: '#bfbfbf',
  muted: '#8e8e8e',
} as const;

export const STATE_COLORS = {
  danger: '#f55e57',
  success: '#1ea446',
} as const;

// Цвета серий графиков — фиксированный набор; акцент пользователя остаётся для кнопок и выделения.
export const CHART_COLORS = {
  blue: '#4290F0',
  amber: '#EEB720',
  pink: '#E8649D',
  violet: '#8D58EE',
  teal: '#50C3B6',
} as const;

export const ALPHA_COLORS = {
  borderSoft: '#222222',
  border: '#222222',
  inputBorder: '#2C2C2C',
  borderStrong: '#333333',
  inputBg: 'rgba(255,255,255,0.03)',
  subtle: 'rgba(227, 227, 227, 0.06)',
  subtleHover: 'rgba(255,255,255,0.08)',
  subtleSoft: 'rgba(255,255,255,0.05)',
  subtleSurface: 'rgba(255, 255, 255, 0.04)',
  subtleStrong: 'rgba(255, 255, 255, 0.055)',
  subtleCard: 'rgba(255,255,255,0.035)',
  borderCard: '#222222',
  borderCardStrong: '#222222',
  borderCardHover: '#2E2E2E',
  borderCardActive: '#2E2E2E',
  borderCardFocus: '#2E2E2E',
  borderHover: '#2E2E2E',
  overlay: 'rgba(0, 0, 0, 0.62)',
  overlayPanel: 'rgba(15, 15, 15, 0.88)',
  glassShadow: 'rgba(0, 0, 0, 0.4)',
  shadowSoft: 'rgba(0, 0, 0, 0.18)',
  shadowCard: 'rgba(0, 0, 0, 0.26)',
  shadowCardStrong: 'rgba(0, 0, 0, 0.28)',
  shadowCardHover: 'rgba(0, 0, 0, 0.36)',
  shadowCardActive: 'rgba(0, 0, 0, 0.42)',
  shadowDeep: 'rgba(0, 0, 0, 0.5)',
  shadowDeepest: 'rgba(0, 0, 0, 0.7)',
  dangerSoft: 'rgba(239, 68, 68, 0.1)',
} as const;

export const EFFECTS = {
  glassBase: SURFACE_COLORS.card,
  glassRim: 'inset 0 1px 0 rgba(255, 255, 255, 0.07)',
  glassShadow: `0 10px 30px ${ALPHA_COLORS.glassShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.07)`,
  shadow: `0 8px 24px ${ALPHA_COLORS.shadowDeep}`,
  shadowLg: `0 16px 48px ${ALPHA_COLORS.shadowDeepest}`,
  shadowInset: `inset 0 0 0 1px ${ALPHA_COLORS.borderCard}`,
  cardShadow: `0 6px 18px ${ALPHA_COLORS.shadowCardStrong}`,
  cardShadowHover: `0 12px 30px ${ALPHA_COLORS.shadowCardActive}, ${`inset 0 0 0 1px ${ALPHA_COLORS.borderCard}`}`,
  cardShadowFocus: `0 10px 28px ${ALPHA_COLORS.shadowCardStrong}`,
  popupShadow: `0 20px 50px ${ALPHA_COLORS.shadowDeep}`,
  modalShadow: `0 24px 48px ${ALPHA_COLORS.shadowDeep}`,
  popoverShadow: `0 15px 35px ${ALPHA_COLORS.glassShadow}`,
  thumbShadow: '0 1px 4px rgba(0,0,0,0.3)',
  taskGradient: 'var(--card)',
  taskGradientHover: 'var(--card-hov)',
  miniTaskGradient: 'var(--card)',
  miniTaskGradientHover: 'var(--card-hov)',
} as const;

export const DEFAULT_ACCENT: string = BRAND_COLORS.flowkit;

export const BRAND_MARK_VIEW_BOX = '0 0 256 256';

export const BRAND_MARK_PATHS = [
  'M87 34H210C227 34 235 49 225 62L201 87C197 91 191 94 184 94H55C38 94 32 79 44 66L70 41C75 36 80 34 87 34Z',
  'M62 107H181C195 107 202 102 210 101C223 100 230 113 220 126L203 143C198 149 191 151 183 151H61C50 151 45 155 38 160C28 166 15 158 17 146C18 141 21 137 26 131L45 114C50 109 55 107 62 107Z',
  'M61 170H188C207 170 216 186 203 200L184 219C179 224 173 226 165 226H38C19 226 12 209 26 195L44 177C49 172 55 170 61 170Z',
] as const;

export const FLOWKIT_ACCENT_VAR = `var(--flowkit-accent, ${DEFAULT_ACCENT})`;

export const ACCENT_PRESETS = [
  { name: 'Полночь', color: '#8b5cf6' },
  { name: 'Лес', color: '#2fca7a' },
  { name: 'Закат', color: '#ff7a45' },
  { name: 'Океан', color: '#14b8d4' },
  { name: 'Лаванда', color: '#c084fc' },
  { name: 'Уголь', color: '#94a3b8' },
] as const;

export const FILL_PRESETS = [
  { name: 'Бирюзовый', value: BRAND_COLORS.teal },
  { name: 'Зелёный', value: BRAND_COLORS.emerald },
  { name: 'Лаймовый', value: BRAND_COLORS.lime },
  { name: 'Янтарный', value: BRAND_COLORS.amber },
  { name: 'Оранжевый', value: BRAND_COLORS.orange },
  { name: 'Розовый', value: BRAND_COLORS.rose },
  { name: 'Фуксия', value: BRAND_COLORS.fuchsia },
  { name: 'Фиолетовый', value: BRAND_COLORS.violet },
  { name: 'Индиго', value: BRAND_COLORS.indigo },
  { name: 'Синий', value: BRAND_COLORS.blue },
  { name: 'Голубой', value: BRAND_COLORS.cyan },
  { name: 'Серый', value: BRAND_COLORS.slate },
] as const;

export const THEME_PALETTE: string[] = FILL_PRESETS.map((preset) => preset.value);

export const DEFAULT_PROJECT_COLORS = {
  work: DEFAULT_ACCENT,
  personal: BRAND_COLORS.lavender,
  todo: SURFACE_COLORS.projectTodo,
  progress: STATE_COLORS.success,
  done: SURFACE_COLORS.projectDone,
} as const;

export const DEFAULT_CATEGORY_COLORS = {
  urgent: STATE_COLORS.danger,
  idea: BRAND_COLORS.idea,
} as const;

export const normalizeHexColor = (value: string): string | null => {
  const clean = value.trim();
  const match = clean.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

  if (!match) return null;

  const hex = match[1].toLowerCase();
  const fullHex = hex.length === 3 ? hex.split('').map((char) => `${char}${char}`).join('') : hex;

  return `#${fullHex}`;
};

export const isHexColor = (value: string): boolean => normalizeHexColor(value) !== null;

export const isCssGradient = (value: string): boolean => /\b(?:linear|radial|conic)-gradient\(/i.test(value.trim());

export const getFillFallbackColor = (value: string, fallback = DEFAULT_ACCENT): string => {
  const normalized = normalizeHexColor(value);
  if (normalized) return normalized;

  const firstHex = value.match(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/);
  return firstHex ? normalizeHexColor(firstHex[0]) || fallback : fallback;
};

export const isValidFill = (value: string): boolean => {
  const clean = value.trim();
  return clean.length > 0 && (isHexColor(clean) || isCssGradient(clean));
};

export const readableTextOn = (color: string): string => {
  const normalized = normalizeHexColor(color) || getFillFallbackColor(color);
  if (!normalized) return RAW_COLORS.white;

  const hex = normalized.slice(1);
  const [r, g, b] = [0, 2, 4].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;

  return whiteContrast >= blackContrast ? RAW_COLORS.white : RAW_COLORS.black;
};

export const withAlpha = (color: string, alpha: string) => {
  const clean = color.trim();
  const normalized = normalizeHexColor(clean);
  return normalized ? `${normalized}${alpha}` : clean;
};

export const makeTokens = (accentColor = DEFAULT_ACCENT): ThemeTokens => {
  const accentFill = isValidFill(accentColor) ? accentColor.trim() : DEFAULT_ACCENT;
  const accent = getFillFallbackColor(accentFill, DEFAULT_ACCENT);

  return {
    bg: SURFACE_COLORS.bg,
    surface: SURFACE_COLORS.surface,
    band: SURFACE_COLORS.band,
    card: SURFACE_COLORS.card,
    cardActive: SURFACE_COLORS.cardActive,
    cardHov: SURFACE_COLORS.cardHover,
    panelHead: SURFACE_COLORS.panelHead,
    border: ALPHA_COLORS.borderSoft,
    border2: ALPHA_COLORS.border,
    borderStrong: ALPHA_COLORS.borderStrong,
    borderHover: ALPHA_COLORS.borderHover,
    inputBorder: ALPHA_COLORS.inputBorder,
    accent,
    accentFill,
    accentText: readableTextOn(accent),
    accentDim: withAlpha(accent, '15'),
    accentMid: withAlpha(accent, '35'),
    text: TEXT_COLORS.primary,
    text2: TEXT_COLORS.secondary,
    muted: TEXT_COLORS.muted,
    subtle: ALPHA_COLORS.subtle,
    danger: STATE_COLORS.danger,
    success: STATE_COLORS.success,
    warn: accent,
    shadow: EFFECTS.shadow,
    shadowLg: EFFECTS.shadowLg,
  };
};

export let T: ThemeTokens = makeTokens();

const setVar = (name: string, value: string) => {
  document.documentElement.style.setProperty(name, value, 'important');
};

let faviconBlobUrl: string | null = null;

const updateFavicon = () => {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  const paths = BRAND_MARK_PATHS.map((d) => `<path d="${d}"/>`).join('');
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${BRAND_MARK_VIEW_BOX}" role="img" aria-label="FlowKit">`
    + `<g fill="${T.accent}">${paths}</g></svg>`;

  if (faviconBlobUrl) URL.revokeObjectURL(faviconBlobUrl);
  faviconBlobUrl = URL.createObjectURL(new Blob([faviconSvg], { type: 'image/svg+xml' }));

  link.type = 'image/svg+xml';
  link.href = faviconBlobUrl;
};

export const updateTheme = (accentColor = DEFAULT_ACCENT): void => {
  T = makeTokens(accentColor);

  if (typeof document === 'undefined') return;

  setVar('--bg', T.bg);
  setVar('--surface', T.surface);
  setVar('--band', T.band);
  setVar('--card', T.card);
  setVar('--card-act', T.cardActive);
  setVar('--card-hov', T.cardHov);
  setVar('--panel-head', T.panelHead);
  setVar('--border', T.border);
  setVar('--border2', T.border2);
  setVar('--border-input', T.inputBorder);
  setVar('--border-strong', T.borderStrong);
  setVar('--border-hover', T.borderHover);
  setVar('--accent', T.accent);
  setVar('--accent-fill', T.accentFill);
  setVar('--accent-text', T.accentText);
  setVar('--accent-dim', T.accentDim);
  setVar('--accent-mid', T.accentMid);
  setVar('--text', T.text);
  setVar('--text2', T.text2);
  setVar('--muted', T.muted);
  setVar('--subtle', T.subtle);
  setVar('--danger', T.danger);
  setVar('--success', T.success);
  setVar('--warn', T.warn);
  setVar('--shadow', T.shadow);
  setVar('--shadow-lg', T.shadowLg);
  setVar('--color-white', RAW_COLORS.white);
  setVar('--color-black', RAW_COLORS.black);
  setVar('--flowkit-accent', T.accent);
  updateFavicon();
  document.documentElement.style.colorScheme = 'dark';
};

if (typeof document !== 'undefined') {
  updateTheme();
}
