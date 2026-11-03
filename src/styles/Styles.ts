import { CSSProperties } from 'react';
import { ALPHA_COLORS, EFFECTS, FONT_FAMILY, FONT_MONO, T, getFillFallbackColor, readableTextOn } from './Theme';

type Alpha = string | number;

const fontFamily = FONT_FAMILY;
const BUTTON_RADIUS = 8;
const fillColor = (value: string, fallback = T.accent) => getFillFallbackColor(value, fallback);

const normalizeAlpha = (alpha: Alpha) => {
  if (typeof alpha === 'number') {
    return Math.max(0, Math.min(1, alpha));
  }

  const value = alpha.trim();

  if (/^[0-9.]+$/.test(value)) {
    return Math.max(0, Math.min(1, Number(value)));
  }

  return value;
};

const frosted = (alpha: Alpha, blur: number): CSSProperties => {
  const opacity = normalizeAlpha(alpha);

  return {
    background:
      typeof opacity === 'number'
        ? `color-mix(in srgb, var(--card) ${Math.round(opacity * 100)}%, transparent)`
        : `${EFFECTS.glassBase}${opacity}`,
    backdropFilter: `blur(${blur}px) saturate(150%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(150%)`,
  };
};

export const glass = (alpha: Alpha = 0.72, blur = 20): CSSProperties => ({
  ...frosted(alpha, blur),
  border: '1px solid var(--border2)',
  boxShadow: EFFECTS.glassShadow,
});

const buttonBase: CSSProperties = {
  borderRadius: BUTTON_RADIUS,
  padding: '10px 20px',
  fontSize: 14,
  cursor: 'pointer',
  transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontFamily,
};

export type BackgroundPreset = {
  id: string;
  label: string;
  background: string;
  startSize: string;
  startPos: string;
  midSize: string;
  midPos: string;
  endSize: string;
  endPos: string;
  duration: string;
  preview: string;
};

export const DEFAULT_BACKGROUND_PRESET = 'flow';

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'flow',
    label: 'Поток',
    background: 'radial-gradient(96rem 74rem at 30% 14%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, color-mix(in srgb, var(--accent) 8%, transparent) 18%, color-mix(in srgb, var(--accent) 4%, transparent) 34%, transparent 74%), radial-gradient(92rem 74rem at 76% 18%, rgba(255,255,255,0.032) 0%, rgba(255,255,255,0.02) 20%, rgba(255,255,255,0.008) 36%, transparent 72%), radial-gradient(102rem 82rem at 48% 82%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, color-mix(in srgb, var(--accent) 5%, transparent) 20%, color-mix(in srgb, var(--accent) 2%, transparent) 38%, transparent 78%), linear-gradient(180deg, var(--bg), var(--bg) 62%)',
    startSize: '112% 112%, 106% 106%, 118% 118%, 100% 100%',
    startPos: '10% 8%, 88% 10%, 50% 84%, 0% 0%',
    midSize: '132% 132%, 120% 120%, 136% 136%, 100% 100%',
    midPos: '40% 24%, 60% 34%, 24% 62%, 0% 0%',
    endSize: '114% 114%, 116% 116%, 126% 126%, 100% 100%',
    endPos: '-10% 34%, 108% 0%, 78% 100%, 0% 0%',
    duration: '8s',
    preview: 'radial-gradient(circle at 34% 30%, rgba(62,209,191,0.28), transparent 42%), radial-gradient(circle at 70% 28%, rgba(255,255,255,0.08), transparent 32%), var(--bg)',
  },
  {
    id: 'orbit',
    label: 'Орбита',
    background: 'radial-gradient(88rem 68rem at 50% 14%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, color-mix(in srgb, var(--accent) 8%, transparent) 16%, transparent 72%), radial-gradient(92rem 72rem at 18% 76%, rgba(255,255,255,0.022) 0%, rgba(255,255,255,0.012) 22%, transparent 68%), radial-gradient(90rem 70rem at 82% 72%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, color-mix(in srgb, var(--accent) 4%, transparent) 20%, transparent 66%), linear-gradient(180deg, var(--bg), var(--bg) 68%)',
    startSize: '106% 106%, 114% 114%, 114% 114%, 100% 100%',
    startPos: '50% 8%, 16% 82%, 84% 78%, 0% 0%',
    midSize: '138% 138%, 130% 130%, 130% 130%, 100% 100%',
    midPos: '50% 24%, 6% 58%, 94% 56%, 0% 0%',
    endSize: '112% 112%, 120% 120%, 118% 118%, 100% 100%',
    endPos: '50% 0%, 28% 96%, 72% 92%, 0% 0%',
    duration: '6.5s',
    preview: 'radial-gradient(circle at 50% 18%, rgba(62,209,191,0.28), transparent 40%), radial-gradient(circle at 22% 76%, rgba(255,255,255,0.06), transparent 28%), radial-gradient(circle at 80% 72%, rgba(62,209,191,0.16), transparent 30%), var(--bg)',
  },
  {
    id: 'none',
    label: 'Без фона',
    background: 'none',
    startSize: '100% 100%',
    startPos: '0% 0%',
    midSize: '100% 100%',
    midPos: '0% 0%',
    endSize: '100% 100%',
    endPos: '0% 0%',
    duration: '0s',
    preview: 'var(--bg)',
  },
];

export const normalizeBackgroundPreset = (presetId?: string | null) =>
  BACKGROUND_PRESETS.some((item) => item.id === presetId) ? String(presetId) : DEFAULT_BACKGROUND_PRESET;
const pageAmbientBackground = 'var(--page-ambient-bg)';

const pageAmbientShell = (overrides?: CSSProperties): CSSProperties => ({
  background: pageAmbientBackground,
  backgroundSize: 'var(--page-ambient-size-0)',
  backgroundPosition: 'var(--page-ambient-pos-0)',
  animation: 'fk-page-ambient var(--page-ambient-duration) ease-in-out infinite alternate',
  ...overrides,
});

const setRootVar = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(name, value, 'important');
};

export const applyBackgroundPreset = (presetId = DEFAULT_BACKGROUND_PRESET) => {
  const preset = BACKGROUND_PRESETS.find((item) => item.id === normalizeBackgroundPreset(presetId)) || BACKGROUND_PRESETS[0];
  setRootVar('--page-ambient-bg', preset.background);
  setRootVar('--page-ambient-size-0', preset.startSize);
  setRootVar('--page-ambient-pos-0', preset.startPos);
  setRootVar('--page-ambient-size-50', preset.midSize);
  setRootVar('--page-ambient-pos-50', preset.midPos);
  setRootVar('--page-ambient-size-100', preset.endSize);
  setRootVar('--page-ambient-pos-100', preset.endPos);
  setRootVar('--page-ambient-duration', preset.duration);
};

if (typeof document !== 'undefined') {
  applyBackgroundPreset(DEFAULT_BACKGROUND_PRESET);
}

export const G = {
  kanbanLayout: pageAmbientShell({
    flex: 1,
    minWidth: 0,
    display: 'flex',
    height: '100%',
    minHeight: 0,
    gap: 16,
    padding: 24,
    position: 'relative',
    isolation: 'isolate',
    overflowX: 'auto',
    overflowY: 'hidden',
    fontFamily,
  }),

  btn: {
    primary: {
      ...buttonBase,
      background: 'var(--accent-fill)',
      color: 'var(--accent-text)',
      border: 'none',
      fontWeight: 700,
    } as CSSProperties,

    secondary: {
      ...buttonBase,
      background: 'var(--card)',
      color: 'var(--text)',
      border: '1px solid var(--border2)',
      fontWeight: 600,
    } as CSSProperties,

    ghost: {
      ...buttonBase,
      padding: '8px 12px',
      background: 'transparent',
      color: 'var(--text2)',
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      fontWeight: 600,
    } as CSSProperties,
  },

  menu: {
    overlay: {
      position: 'fixed',
      zIndex: 10000,
      minWidth: 240,
      padding: 8,
      borderRadius: 20,
      animation: 'menuShow 0.15s ease-out',
      ...glass(0.95, 30),
    } as CSSProperties,

    button: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: 'transparent',
      color: 'var(--text)',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background 0.2s ease',
      fontFamily,
    } as CSSProperties,

    danger: {
      color: 'var(--danger)',
    } as CSSProperties,

    sep: {
      height: 1,
      margin: '8px 12px',
      background: 'var(--border2)',
    } as CSSProperties,

    label: {
      padding: '10px 16px 4px',
      color: 'var(--text2)',
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    } as CSSProperties,

    subMenu: {
      position: 'absolute',
      left: 'calc(100% + 8px)',
      top: -8,
      width: 280,
      padding: 16,
      borderRadius: 20,
      boxShadow: 'var(--shadow-lg)',
      ...glass(0.98, 30),
    } as CSSProperties,
  },

  taskCard: {
    base: (projectColor = 'var(--accent)'): CSSProperties => ({
      ['--task-project-color' as string]: fillColor(projectColor),
      width: '100%',
      minWidth: 0,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      padding: '8px 10px',
      background: 'var(--card)',

      borderTop: '1px solid var(--border2)',
      borderRight: '1px solid var(--border2)',
      borderBottom: '1px solid var(--border2)',
      borderLeft: '3px solid var(--task-project-color)',

      borderRadius: 10,
      color: 'var(--text)',
      textAlign: 'left',
      cursor: 'grab',
      lineHeight: 1.3,
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.26)',
      transition:
        'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease',
      fontFamily,
    }),

    hover: (projectColor = 'var(--accent)'): CSSProperties => ({
      ['--task-project-color' as string]: fillColor(projectColor),
      background: 'var(--card-hov)',

      borderTopColor: 'var(--border2)',
      borderRightColor: 'var(--border2)',
      borderBottomColor: 'var(--border2)',
      borderLeftColor: 'var(--task-project-color)',

      boxShadow: '0 8px 22px rgba(0, 0, 0, 0.36), inset 0 0 0 1px color-mix(in srgb, var(--task-project-color) 38%, transparent)',
    }),

    title: {
      flex: 1,
      minWidth: 0,
      color: 'var(--text)',
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.35,
      overflowWrap: 'anywhere',
    } as CSSProperties,

    meta: {
      color: 'var(--muted)',
      fontSize: 11,
      fontWeight: 650,
      lineHeight: 1.3,
    } as CSSProperties,
  },

  calendar: {
    shell: {
      flex: 1,
      minHeight: 0,
      background: 'var(--surface)',
      border: '1px solid var(--border2)',
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
    } as CSSProperties,

    scroller: {
      width: '100%',
      height: '100%',
      overflowX: 'auto',
      overflowY: 'hidden',
      background: 'var(--border2)',
    } as CSSProperties,

    grid: {
      minWidth: 1120,
      height: '100%',
      display: 'grid',
      gridTemplateColumns: 'repeat(7, minmax(160px, 1fr))',
      gridTemplateRows: '44px repeat(6, minmax(0, 1fr))',
      gap: 1,
    } as CSSProperties,

    weekday: {
      position: 'sticky',
      top: 0,
      zIndex: 5,
      padding: '14px 10px',
      background: 'var(--surface)',
      textAlign: 'center',
      color: 'var(--text2)',
      fontSize: 11,
      fontWeight: 850,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      boxShadow: '0 1px 0 var(--border2)',
    } as CSSProperties,

    day: {
      minHeight: 132,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 10,
      background: 'var(--bg)',
      transition: 'background 0.16s ease',
    } as CSSProperties,

    emptyDay: {
      minHeight: 132,
      background: 'var(--bg)',
      opacity: 0.35,
    } as CSSProperties,
  },
};

type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md';
type DateTone = 'overdue' | 'today' | 'future' | 'done';

const buttonPadding: Record<ButtonSize, Record<ButtonVariant, string>> = {
  sm: {
    primary: '5px 12px',
    ghost: '4px 8px',
    subtle: '5px 10px',
    outline: '5px 10px',
    danger: '5px 10px',
  },
  md: {
    primary: '7px 16px',
    ghost: '6px 10px',
    subtle: '7px 14px',
    outline: '7px 14px',
    danger: '7px 14px',
  },
};

const buttonFontSize: Record<ButtonSize, number> = {
  sm: 12,
  md: 13,
};

const composeStyles = (...styles: Array<CSSProperties | false | null | undefined>): CSSProperties =>
  Object.assign({}, ...styles.filter(Boolean));

export const UI = {
  compose: composeStyles,
  fontFamily,

  layout: {
    relative: {
      position: 'relative',
    } as CSSProperties,

    relativeFlex: {
      position: 'relative',
      display: 'flex',
    } as CSSProperties,

    hidden: {
      display: 'none',
    } as CSSProperties,

    inlineIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    } as CSSProperties,

    blockIcon: {
      display: 'block',
      flexShrink: 0,
    } as CSSProperties,

    minContent: {
      minWidth: 0,
    } as CSSProperties,

    flexFill: {
      flex: 1,
    } as CSSProperties,

    row: (gap = 8, align: CSSProperties['alignItems'] = 'center', overrides?: CSSProperties): CSSProperties => ({
      display: 'flex',
      alignItems: align,
      gap,
      ...overrides,
    }),

    stack: (gap = 8, overrides?: CSSProperties): CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      gap,
      ...overrides,
    }),

    grid: (template: string, gap = 8, overrides?: CSSProperties): CSSProperties => ({
      display: 'grid',
      gridTemplateColumns: template,
      gap,
      ...overrides,
    }),

    dot: (color: string, size = 8, radius = 999, overrides?: CSSProperties): CSSProperties => ({
      width: size,
      height: size,
      borderRadius: radius,
      background: color,
      flexShrink: 0,
      ...overrides,
    }),

    textDim: (opacity = 0.8): CSSProperties => ({
      opacity,
    }),

    textLink: {
      color: T.accent,
      textDecoration: 'none',
      fontWeight: 500,
    } as CSSProperties,

    bullet: {
      color: T.accent,
      fontWeight: 700,
      marginTop: -2,
    } as CSSProperties,

    strong: {
      color: T.text,
      fontWeight: 600,
    } as CSSProperties,

    iconAuto: {
      marginLeft: 'auto',
      opacity: 0.5,
    } as CSSProperties,

    chevron: (open = false): CSSProperties => ({
      transform: open ? 'rotate(180deg)' : 'rotate(-90deg)',
      transition: 'transform 0.2s',
    }),
  },

  text: {
    body: {
      color: 'var(--text)',
      fontFamily,
    } as CSSProperties,

    muted: {
      color: 'var(--muted)',
      fontFamily,
    } as CSSProperties,

    label: {
      color: 'var(--text2)',
      fontSize: 12,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily,
    } as CSSProperties,

    modalTitle: {
      color: T.text,
      fontSize: 18,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    taskTitle: (done: boolean, compact = false): CSSProperties => ({
      color: done ? 'var(--muted)' : 'var(--text)',
      fontSize: compact ? 12 : 15,
      fontWeight: 600,
      lineHeight: compact ? 1.35 : 1.3,
      textDecoration: done ? 'line-through' : 'none',
      overflowWrap: compact ? 'anywhere' : undefined,
      whiteSpace: compact ? undefined : 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontFamily,
    }),

    clamp: (done = false): CSSProperties => ({
      color: 'var(--text2)',
      fontSize: 13.5,
      lineHeight: 1.5,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      opacity: done ? 0.6 : 1,
      fontFamily,
    }),
  },

  control: {
    input: (overrides?: CSSProperties): CSSProperties => ({
      width: '100%',
      padding: '9px 12px',
      borderRadius: 8,
      border: '1px solid var(--border2)',
      background: 'rgba(255,255,255,0.03)',
      color: T.text,
      fontSize: 14,
      outline: 'none',
      transition: 'border-color .15s',
      fontFamily,
      ...overrides,
    }),

    button: (variant: ButtonVariant = 'ghost', size: ButtonSize = 'md', disabled = false, overrides?: CSSProperties): CSSProperties => {
      const variants: Record<ButtonVariant, CSSProperties> = {
        primary: {
          background: 'var(--accent-fill)',
          color: 'var(--accent-text)',
          border: 'none',
        },
        ghost: {
          background: 'transparent',
          color: T.text2,
          border: 'none',
        },
        subtle: {
          background: 'rgba(255,255,255,0.05)',
          color: T.text2,
          border: 'none',
        },
        outline: {
          background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
          color: 'var(--text)',
          border: '1px solid color-mix(in srgb, var(--accent) 72%, var(--border2))',
        },
        danger: {
          background: 'transparent',
          color: T.danger,
          border: `1px solid ${T.danger}30`,
        },
      };

      return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        gap: 6,
        borderRadius: BUTTON_RADIUS,
        padding: buttonPadding[size][variant],
        color: variants[variant].color,
        background: variants[variant].background,
        border: variants[variant].border,
        fontSize: variant === 'danger' ? 13 : buttonFontSize[size],
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: 'translateY(0)',
        boxShadow:
          variant === 'primary'
            ? '0 10px 24px rgba(0,0,0,.18)'
            : variant === 'outline'
              ? 'inset 0 0 0 1px color-mix(in srgb, var(--accent) 12%, transparent), 0 0 0 rgba(0,0,0,0)'
              : '0 0 0 rgba(0,0,0,0)',
        transition: 'background .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease, filter .16s ease, transform .16s ease',
        fontFamily,
        ...overrides,
      };
    },

    buttonClass: (variant: ButtonVariant = 'ghost', extra?: string): string =>
      ['fk-btn', `fk-btn-${variant}`, extra].filter(Boolean).join(' '),

    iconButton: (active = false, size = 38, overrides?: CSSProperties): CSSProperties => ({
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      borderRadius: BUTTON_RADIUS,
      border: `1px solid ${active ? T.border2 : T.border}`,
      background: active ? ALPHA_COLORS.subtleStrong : 'transparent',
      color: T.text2,
      cursor: 'pointer',
      boxShadow: active ? '0 8px 20px rgba(0, 0, 0, 0.18)' : '0 0 0 rgba(0,0,0,0)',
      transform: 'translateY(0)',
      transition: 'background .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease, transform .16s ease',
      fontFamily,
      ...overrides,
    }),

    chipButton: (active = false, color?: string, overrides?: CSSProperties): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 32,
      padding: '4px 10px 4px 12px',
      borderRadius: BUTTON_RADIUS,
      border: `1px solid ${active ? T.accent : T.border}`,
      background: active ? T.subtle : 'transparent',
      color: color || T.text2,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: active ? '0 8px 18px rgba(0, 0, 0, 0.16)' : '0 0 0 rgba(0,0,0,0)',
      transform: 'translateY(0)',
      transition: 'background .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease, transform .16s ease',
      fontFamily,
      ...overrides,
    }),

    menuItem: (active = false, overrides?: CSSProperties): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: active ? T.accentDim : 'transparent',
      color: active ? T.accent : T.text,
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: 13.5,
      fontWeight: active ? 700 : 600,
      transform: 'translateY(0)',
      boxShadow: active ? '0 10px 22px rgba(0,0,0,.12)' : '0 0 0 rgba(0,0,0,0)',
      transition: 'background .14s ease, color .14s ease, box-shadow .14s ease, transform .14s ease',
      fontFamily: 'inherit',
      ...overrides,
    }),

    toggleTrack: (on: boolean): CSSProperties => ({
      width: 36,
      height: 20,
      position: 'relative',
      flexShrink: 0,
      borderRadius: 10,
      border: `1px solid ${on ? T.accent : 'var(--border2)'}`,
      background: on ? T.accent : 'rgba(255,255,255,0.1)',
      cursor: 'pointer',
      transition: 'background .2s',
    }),

    toggleThumb: (on: boolean): CSSProperties => ({
      position: 'absolute',
      top: 2,
      left: on ? 17 : 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,.3)',
      transition: 'left .18s',
    }),

    colorSwatch: (color: string, selected: boolean): CSSProperties => ({
      ['--swatch-color' as string]: fillColor(color),
      width: 22,
      height: 22,
      flexShrink: 0,
      borderRadius: 6,
      border: `2.5px solid ${selected ? '#000' : 'transparent'}`,
      background: color,
      cursor: 'pointer',
      boxShadow: selected ? '0 0 0 2px color-mix(in srgb, var(--swatch-color) 40%, transparent)' : '',
      transition: 'border .12s ease, box-shadow .16s ease, filter .16s ease',
    }),
  },

  form: {
    colorGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
    } as CSSProperties,

    fillPicker: (compact = false): CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? 8 : 10,
      width: '100%',
    }),

    fillPresetGrid: (compact = false): CSSProperties => ({
      display: 'flex',
      flexWrap: 'wrap',
      gap: compact ? 6 : 7,
    }),

    fillInputRow: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 44px',
      gap: 8,
      alignItems: 'center',
    } as CSSProperties,

    fillInput: (valid = true): CSSProperties => ({
      height: 36,
      width: '100%',
      minWidth: 0,
      padding: '0 10px',
      border: `1px solid ${valid ? 'var(--border2)' : 'var(--danger)'}`,
      borderRadius: BUTTON_RADIUS,
      background: 'rgba(255,255,255,0.035)',
      color: 'var(--text)',
      outline: 'none',
      fontSize: 12,
      fontWeight: 650,
      fontFamily: FONT_MONO,
    }),

    accentPicker: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      width: '100%',
      padding: 12,
      border: '1px solid var(--border2)',
      borderRadius: BUTTON_RADIUS,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.028))',
      boxShadow: 'inset 0 0 0 1px var(--border2)',
    } as CSSProperties,

    accentPresetGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 8,
    } as CSSProperties,

    accentPreset: (color: string, selected = false): CSSProperties => ({
      ['--preset-color' as string]: color,
      minHeight: 42,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      border: `1px solid ${selected ? color : 'var(--border2)'}`,
      borderRadius: BUTTON_RADIUS,
      background: selected ? `color-mix(in srgb, ${color} 18%, var(--surface))` : 'rgba(255,255,255,0.035)',
      color: selected ? 'var(--text)' : 'var(--text2)',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 700,
      textAlign: 'left',
      boxShadow: selected ? `0 0 0 1px ${color}35, 0 10px 22px rgba(0,0,0,.16)` : 'none',
      transition: 'background .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease',
      fontFamily,
    }),

    accentPresetSwatch: (color: string): CSSProperties => ({
      width: 16,
      height: 16,
      flexShrink: 0,
      borderRadius: 5,
      background: color,
      boxShadow: `0 0 0 3px ${color}22`,
    }),

    hexRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 44px',
      gap: 10,
      alignItems: 'end',
    } as CSSProperties,

    hexLabel: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      color: 'var(--text2)',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 0,
      fontFamily,
    } as CSSProperties,

    hexInput: (valid = true): CSSProperties => ({
      height: 42,
      width: '100%',
      padding: '0 12px',
      border: `1px solid ${valid ? 'var(--border2)' : 'var(--danger)'}`,
      borderRadius: BUTTON_RADIUS,
      background: 'rgba(255,255,255,0.035)',
      color: 'var(--text)',
      outline: 'none',
      fontSize: 14,
      fontWeight: 700,
      transition: 'background .16s ease, border-color .16s ease, box-shadow .16s ease',
      fontFamily: FONT_MONO,
    }),

    nativeColorInput: (color: string): CSSProperties => ({
      ['--native-color' as string]: fillColor(color),
      width: 44,
      height: 42,
      padding: 4,
      border: '1px solid var(--border2)',
      borderRadius: BUTTON_RADIUS,
      background: color,
      cursor: 'pointer',
      boxShadow: '0 0 0 1px color-mix(in srgb, var(--native-color) 18%, transparent)',
      transition: 'filter .16s ease, box-shadow .16s ease',
    }),
  },

  filter: {
    wrap: {
      position: 'relative',
      display: 'flex',
    } as CSSProperties,

    counter: {
      position: 'absolute',
      top: -5,
      right: -5,
      minWidth: 16,
      height: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      border: '2px solid var(--band)',
      background: 'var(--accent-fill)',
      color: 'var(--accent-text)',
      fontSize: 10,
      fontWeight: 900,
    } as CSSProperties,

    popover: {
      position: 'absolute',
      top: 'calc(100% + 10px)',
      right: 0,
      zIndex: 1000,
      width: 280,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      padding: 18,
    } as CSSProperties,

    label: {
      color: T.text2,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
      fontFamily,
    } as CSSProperties,

    sortList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    } as CSSProperties,

    activeDot: (color = T.accent): CSSProperties => ({
      width: 6,
      height: 6,
      borderRadius: 3,
      background: color,
      flexShrink: 0,
    }),

    sortItem: (active = false): CSSProperties =>
      UI.control.menuItem(active, { width: '100%' }),

    chip: (active = false, color?: string): CSSProperties =>
      UI.control.button('subtle', 'md', false, {
        ['--chip-color' as string]: color ? fillColor(color) : T.accent,
        padding: '7px 14px',
        borderRadius: BUTTON_RADIUS,
        color: active ? (color ? readableTextOn(color) : 'var(--accent-text)') : T.text2,
        background: active ? color || T.accent : T.subtle,
        border: `1px solid ${active ? 'transparent' : ALPHA_COLORS.subtleSoft}`,
        fontSize: 12.5,
        fontWeight: 700,
      }),

    categoryList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
    } as CSSProperties,

    resetButton: (): CSSProperties =>
      UI.control.button('danger', 'md', false, {
        background: ALPHA_COLORS.dangerSoft,
        padding: 8,
        fontWeight: 700,
      }),
  },

  taskSuggestion: {
    shell: (mobile = false): CSSProperties =>
      mobile
        ? {
            ...UI.modal.shell(true),
          }
        : {
            ...UI.modal.shell(false, {
              width: 620,
              maxWidth: 'calc(100vw - 28px)',
            }),
          },

    body: (mobile = false): CSSProperties => ({
      padding: mobile ? '14px 16px 18px' : '18px 24px 22px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      fontFamily,
    }),

    panel: (mobile = false): CSSProperties => ({
      padding: mobile ? 14 : 16,
      borderRadius: 12,
      border: `1px solid ${T.border}`,
      background: 'rgba(255,255,255,0.026)',
      boxShadow: 'none',
      fontFamily,
    }),

    composerPanel: {
      padding: 0,
      border: 'none',
      borderRadius: 0,
      background: 'transparent',
      boxShadow: 'none',
      fontFamily,
    } as CSSProperties,

    intro: {
      padding: '3px 0 0',
      color: T.text2,
      fontSize: 12.5,
      lineHeight: 1.45,
      fontFamily,
    } as CSSProperties,

    stack: {
      display: 'grid',
      gap: 16,
    } as CSSProperties,

    field: {
      display: 'grid',
      gap: 7,
    } as CSSProperties,

    label: {
      color: T.muted,
      fontSize: 11,
      fontWeight: 850,
      textTransform: 'uppercase',
      letterSpacing: 0,
      fontFamily,
    } as CSSProperties,

    promptInput: {
      minHeight: 88,
      maxHeight: 150,
      resize: 'none',
      lineHeight: 1.5,
      padding: '12px 14px',
      borderRadius: 10,
      background: 'rgba(255,255,255,0.026)',
    } as CSSProperties,

    textArea: {
      minHeight: 92,
      padding: '12px 14px',
      borderRadius: 12,
      resize: 'vertical',
      lineHeight: 1.55,
      background: 'rgba(255,255,255,0.035)',
    } as CSSProperties,

    titleInput: {
      fontSize: 15,
      fontWeight: 600,
      padding: '12px 14px',
      borderRadius: 12,
      background: 'rgba(255,255,255,0.035)',
    } as CSSProperties,

    compactGrid: (mobile = false): CSSProperties => ({
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : '116px',
      gap: 8,
    }),

    controlGrid: (mobile = false): CSSProperties => ({
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : '112px minmax(220px, 1fr)',
      gap: mobile ? 12 : 16,
      alignItems: 'end',
    }),

    contextToggleRow: {
      display: 'inline-flex',
      flexWrap: 'nowrap',
      gap: 4,
      width: 'fit-content',
      padding: 3,
      borderRadius: 10,
      border: `1px solid ${T.border2}`,
      background: 'rgba(255,255,255,0.022)',
    } as CSSProperties,

    contextToggle: (active = false): CSSProperties =>
      UI.control.button('ghost', 'md', false, {
        height: 30,
        minWidth: 92,
        padding: '0 11px',
        border: '1px solid transparent',
        background: active ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent',
        color: active ? T.accent : T.text2,
        whiteSpace: 'nowrap',
      }),

    contextPanel: {
      display: 'grid',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      border: `1px solid ${T.border}`,
      background: 'rgba(255,255,255,0.018)',
      minWidth: 0,
    } as CSSProperties,

    helper: {
      padding: 0,
      borderRadius: 0,
      border: 'none',
      background: 'transparent',
      color: T.muted,
      fontSize: 12.5,
      lineHeight: 1.45,
      fontFamily,
    } as CSSProperties,

    filterDropdownGrid: (mobile = false): CSSProperties => ({
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
      gap: 8,
      alignItems: 'stretch',
    }),

    filterDropdownCell: {
      minWidth: 0,
    } as CSSProperties,

    filterDropdownButton: {
      width: '100%',
      minHeight: 36,
      justifyContent: 'space-between',
      padding: '4px 10px 4px 11px',
    } as CSSProperties,

    searchBox: {
      position: 'relative',
      minWidth: 0,
    } as CSSProperties,

    searchIcon: {
      position: 'absolute',
      left: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
    } as CSSProperties,

    searchField: {
      height: 36,
      paddingLeft: 36,
      background: 'rgba(255,255,255,0.03)',
    } as CSSProperties,

    filterActions: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'space-between',
    } as CSSProperties,

    filterActionButton: (): CSSProperties =>
      UI.control.button('ghost', 'sm', false, {
        border: `1px solid ${T.border2}`,
        height: 30,
        padding: '0 10px',
      }),

    taskList: {
      maxHeight: 230,
      overflowY: 'auto',
      display: 'grid',
      gap: 6,
      padding: 0,
      borderRadius: 10,
    } as CSSProperties,

    taskRow: (selected = false): CSSProperties => ({
      display: 'grid',
      gridTemplateColumns: '16px minmax(0, 1fr)',
      gap: 12,
      alignItems: 'flex-start',
      width: '100%',
      padding: '11px 12px',
      borderRadius: 10,
      border: `1px solid ${selected ? T.accent : T.border2}`,
      background: selected ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'rgba(255,255,255,0.022)',
      color: T.text,
      textAlign: 'left',
      fontFamily,
    }),

    taskCheck: (selected = false): CSSProperties => ({
      width: 16,
      height: 16,
      borderRadius: 5,
      border: `1px solid ${selected ? T.accent : T.border2}`,
      background: selected ? T.accentFill : 'transparent',
      color: selected ? 'var(--accent-text)' : 'transparent',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),

    taskMeta: {
      minWidth: 0,
      display: 'grid',
      gap: 6,
    } as CSSProperties,

    taskTitle: {
      minWidth: 0,
      display: '-webkit-box',
      overflow: 'hidden',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      color: T.text,
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.35,
      fontFamily,
    } as CSSProperties,

    taskBadges: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      alignItems: 'center',
    } as CSSProperties,

    taskBadge: (tone: 'default' | 'accent' | 'muted' = 'default'): CSSProperties => ({
      padding: '2px 7px',
      borderRadius: 999,
      border: `1px solid ${tone === 'accent' ? `${T.accent}40` : T.border2}`,
      background: tone === 'accent' ? `${T.accent}18` : 'rgba(255,255,255,0.03)',
      color: tone === 'accent' ? T.accent : tone === 'muted' ? T.muted : T.text2,
      fontSize: 11,
      fontWeight: 700,
      fontFamily,
    }),

    toolbarMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    } as CSSProperties,

    toolbarActions: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      alignItems: 'center',
    } as CSSProperties,

    footerRow: {
      display: 'flex',
      flexWrap: 'nowrap',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingTop: 2,
      minWidth: 0,
    } as CSSProperties,

    footerMeta: {
      color: T.muted,
      fontSize: 12,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    infoBox: (tone: 'neutral' | 'danger' | 'warn' = 'neutral'): CSSProperties => ({
      padding: '14px 16px',
      borderRadius: 14,
      border: `1px solid ${T.border2}`,
      background:
        tone === 'danger'
          ? 'rgba(239, 68, 68, 0.08)'
          : tone === 'warn'
            ? 'rgba(245, 158, 11, 0.08)'
            : 'rgba(255,255,255,0.03)',
      color: T.text,
      lineHeight: 1.5,
      fontFamily,
    }),

    statusLine: (tone: 'neutral' | 'danger' = 'neutral'): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minHeight: 26,
      padding: '2px 0',
      color: tone === 'danger' ? T.danger : T.text2,
      fontSize: 12.5,
      fontWeight: 650,
      lineHeight: 1.4,
      fontFamily,
    }),

    progressMeta: {
      color: T.muted,
      fontSize: 12,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,
  },

  icon: {
    dot: (size: number, color: string, overrides?: CSSProperties): CSSProperties => ({
      width: size * 0.5,
      height: size * 0.5,
      display: 'inline-block',
      flexShrink: 0,
      borderRadius: '50%',
      background: color,
      ...overrides,
    }),

    svg: (overrides?: CSSProperties): CSSProperties => ({
      flexShrink: 0,
      ...overrides,
    }),
  },

  badge: {
    category: (color: string): CSSProperties => ({
      ['--category-color' as string]: fillColor(color),
      flexShrink: 0,
      padding: '2px 8px',
      borderRadius: 20,
      border: '1px solid color-mix(in srgb, var(--category-color) 25%, transparent)',
      background: 'color-mix(in srgb, var(--category-color) 14%, transparent)',
      color: 'var(--category-color)',
      fontSize: 11.5,
      fontWeight: 450,
      letterSpacing: 0.12,
      fontFamily,
    }),

    priority: (color: string, overrides?: CSSProperties): CSSProperties => ({
      flexShrink: 0,
      padding: '2px 8px',
      borderRadius: 20,
      border: `1px solid ${color}40`,
      background: `${color}18`,
      color,
      fontSize: 11.5,
      fontWeight: 500,
      letterSpacing: 0.08,
      fontFamily,
      ...overrides,
    }),

    date: (tone: DateTone): CSSProperties => {
      const color = { overdue: T.danger, today: T.warn, future: T.text2, done: T.muted }[tone];
      const bg = {
        overdue: `${T.danger}15`,
        today: `${T.warn}15`,
        future: 'rgba(255,255,255,0.05)',
        done: 'transparent',
      }[tone];
      const border = {
        overdue: `${T.danger}40`,
        today: `${T.warn}40`,
        future: 'rgba(255,255,255,0.1)',
        done: 'transparent',
      }[tone];

      return {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
        padding: '2px 6px',
        borderRadius: 6,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontSize: 11.5,
        fontWeight: tone === 'future' || tone === 'done' ? 400 : 500,
        fontFamily,
      };
    },

    meta: (active = false): CSSProperties => ({
      height: 22,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
      padding: '0 2px',
      color: 'var(--muted)',
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 1,
      opacity: active ? 1 : 0.9,
      transition: 'opacity 0.16s ease, color 0.16s ease',
      fontFamily,
    }),
  },

  feedback: {
    check: (done: boolean): CSSProperties => ({
      width: 18,
      height: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
      borderRadius: 5,
      border: `1.5px solid ${done ? T.success : 'var(--border2)'}`,
      background: done ? T.success : 'transparent',
      cursor: 'pointer',
      transition: 'all .18s',
    }),

    progressTrack: {
      height: 3,
      overflow: 'hidden',
      borderRadius: 1.5,
      background: 'rgba(255,255,255,0.05)',
    } as CSSProperties,

    progressBar: (pct: number, color = T.accent, done?: boolean): CSSProperties => ({
      height: '100%',
      width: `${pct}%`,
      borderRadius: 1.5,
      background: done ? T.success : color,
      transition: 'width .5s,background .4s',
    }),
  },

  card: {
    task: ({
      done,
      active,
      dragged,
      selected,
      base,
      hover,
      compact = false,
    }: {
      done: boolean;
      active: boolean;
      dragged?: boolean;
      selected?: boolean;
      base: CSSProperties;
      hover: CSSProperties;
      compact?: boolean;
    }): CSSProperties => {
      const borderColor = selected
        ? 'color-mix(in srgb, var(--accent) 54%, transparent)'
        : active
          ? 'var(--border-hover)'
          : 'var(--border2)';
      const boxShadow = selected
        ? '0 0 0 1px color-mix(in srgb, var(--accent) 42%, transparent), 0 8px 18px rgba(0, 0, 0, 0.12)'
        : active
          ? '0 7px 16px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.035)'
          : '0 2px 7px rgba(0, 0, 0, 0.1)';

      return {
        ...base,
        background: active ? hover.background : base.background,
        border: `1px solid ${borderColor}`,
        borderRadius: BUTTON_RADIUS,
        padding: compact ? '9px 10px' : '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? 9 : 13,
        cursor: dragged ? 'grabbing' : 'pointer',
        opacity: dragged ? 0.3 : done ? 0.5 : 1,
        boxShadow,
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease',
        fontFamily,
      };
    },

    panel: (overrides?: CSSProperties): CSSProperties => ({
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: BUTTON_RADIUS,
      boxShadow: T.shadow,
      ...overrides,
    }),

    taskCheck: {
      marginTop: 2,
      flexShrink: 0,
    } as CSSProperties,

    taskBody: {
      flex: 1,
      minWidth: 0,
    } as CSSProperties,

    taskTitle: (done: boolean, hasDescription = false, compact = false): CSSProperties => ({
      color: done ? 'var(--muted)' : 'var(--text)',
      fontSize: compact ? 12.5 : 14,
      fontWeight: 600,
      lineHeight: 1.3,
      textDecoration: done ? 'line-through' : 'none',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontFamily,
      marginBottom: compact ? 6 : hasDescription ? 6 : 8,
    }),

    taskDescription: (done: boolean): CSSProperties => ({
      color: 'var(--text2)',
      fontSize: 13,
      lineHeight: 1.45,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      opacity: done ? 0.6 : 1,
      fontFamily,
      marginBottom: 8,
    }),

    taskMetaRow: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
    } as CSSProperties,

    taskMetaRowCompact: (compact = false): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: compact ? 6 : 8,
    }),

    taskProjectMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: 'var(--text2)',
      fontSize: 12,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,
  },

  modal: {
    overlay: (mobile = false): CSSProperties =>
      mobile
        ? {
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg)',
          }
        : {
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '8vh 20px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.62)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          },

    shell: (mobile = false, overrides?: CSSProperties): CSSProperties =>
      mobile
        ? {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            overflowY: 'auto',
            background: String(glass(0.94, 26).background),
            fontFamily,
            ...overrides,
          }
        : {
            ...glass(0.94, 26),
            width: 600,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'visible',
            borderRadius: BUTTON_RADIUS,
            border: '1px solid var(--border2)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
            fontFamily,
            ...overrides,
          },

    noteShell: (): CSSProperties =>
      UI.modal.shell(false, {
        width: 860,
        maxWidth: 'calc(100vw - 40px)',
      }),

    innerBg: String(glass('05', 25).background),
    surfaceBg: String(glass('08', 25).background),
    hoverBg: 'rgba(255, 255, 255, 0.055)',
    popover: (overrides?: CSSProperties): CSSProperties => ({
      ...frosted(0.9, 26),
      border: `1px solid ${T.border2}`,
      borderRadius: 10,
      boxShadow: T.shadowLg,
      fontFamily,
      ...overrides,
    }),

    header: (border = false, overrides?: CSSProperties): CSSProperties => ({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px 8px 32px',
      borderBottom: border ? `1px solid ${T.border2}` : undefined,
      fontFamily,
      ...overrides,
    }),

    headerLabel: {
      color: T.muted,
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
      fontFamily,
    } as CSSProperties,

    closeButton: {
      width: 32,
      height: 32,
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: 'transparent',
      color: T.text2,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily,
    } as CSSProperties,

    body: (overrides?: CSSProperties): CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '0 32px 32px',
      fontFamily,
      ...overrides,
    }),

    titleInput: {
      width: '100%',
      border: 'none',
      outline: 'none',
      boxShadow: 'none',
      resize: 'none',
      overflow: 'hidden',
      background: 'transparent',
      color: T.text,
      fontSize: 26,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    dividerRow: (overrides?: CSSProperties): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      paddingBottom: 16,
      borderBottom: `1px solid ${T.border2}`,
      fontFamily,
      ...overrides,
    }),

    noteColorRow: {
      justifyContent: 'flex-end',
      paddingBottom: 10,
      marginTop: -10,
      position: 'relative',
    } as CSSProperties,

    taskChipsRow: {
      flexWrap: 'wrap',
      gap: 8,
    } as CSSProperties,

    footer: (overrides?: CSSProperties): CSSProperties => ({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 32px',
      borderTop: `1px solid ${T.border2}`,
      borderRadius: '0 0 22px 22px',
      background: String(glass('05', 25).background),
      fontFamily,
      ...overrides,
    }),

    confirmText: {
      color: T.danger,
      fontSize: 14,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    actions: (gap = 12): CSSProperties => ({
      display: 'flex',
      gap,
    }),

    colorButton: (color: string): CSSProperties => ({
      ['--button-color' as string]: fillColor(color),
      width: 26,
      height: 26,
      flexShrink: 0,
      borderRadius: 13,
      border: `1px solid ${T.border2}`,
      background: color,
      boxShadow: '0 0 0 4px color-mix(in srgb, var(--button-color) 10%, transparent)',
      cursor: 'pointer',
    }),

    colorPopover: {
      position: 'absolute',
      top: 34,
      right: 0,
      zIndex: 5,
      padding: 10,
      borderRadius: 14,
      border: `1px solid ${T.border2}`,
      ...frosted(0.9, 26),
      boxShadow: T.shadowLg,
    } as CSSProperties,

    section: (overrides?: CSSProperties): CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      marginTop: 8,
      paddingTop: 24,
      borderTop: `1px solid ${T.border2}`,
      fontFamily,
      ...overrides,
    }),

    sectionLabel: {
      color: T.text2,
      fontSize: 12,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily,
    } as CSSProperties,

    mentionLabel: {
      color: T.text2,
      fontSize: 12,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      padding: '4px 8px',
      marginBottom: 4,
      fontFamily,
    } as CSSProperties,

    listStack: (gap = 16): CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      gap,
    }),

    commentRow: {
      display: 'flex',
      gap: 12,
    } as CSSProperties,

    commentAvatar: {
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      border: `1px solid ${T.border2}`,
      borderRadius: 16,
      background: String(glass('05', 25).background),
      color: T.muted,
    } as CSSProperties,

    commentBody: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      marginTop: 4,
    } as CSSProperties,

    commentMetaRow: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as CSSProperties,

    commentAuthorRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    } as CSSProperties,

    commentAuthor: {
      color: T.text,
      fontSize: 13,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    commentDate: {
      color: T.muted,
      fontSize: 11,
      fontFamily,
    } as CSSProperties,

    commentText: {
      color: T.text2,
      fontSize: 13.5,
      lineHeight: 1.5,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      fontFamily,
    } as CSSProperties,

    removeButton: {
      display: 'flex',
      padding: 2,
      border: 'none',
      borderRadius: 4,
      background: 'none',
      color: T.muted,
      cursor: 'pointer',
      transition: 'all 0.1s',
    } as CSSProperties,

    inlineForm: (gap = 10): CSSProperties => ({
      display: 'flex',
      alignItems: 'flex-start',
      gap,
      marginTop: 8,
    }),

    commentInput: {
      flex: 1,
      borderRadius: 10,
      background: 'transparent',
    } as CSSProperties,

    commentAttachButton: {
      position: 'absolute',
      top: 5,
      right: 6,
      width: 28,
      height: 28,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      border: 'none',
      borderRadius: 7,
      background: 'transparent',
      color: T.muted,
      cursor: 'pointer',
      transition: 'background .16s ease, color .16s ease',
    } as CSSProperties,

    commentSubmitButton: {
      height: 38,
      minHeight: 38,
      alignSelf: 'flex-start',
      flexShrink: 0,
      whiteSpace: 'nowrap',
    } as CSSProperties,

    imagePreviewOverlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 12000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: '72px 28px 28px',
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      cursor: 'zoom-out',
    } as CSSProperties,

    imagePreviewTopbar: {
      position: 'fixed',
      top: 18,
      left: '50%',
      zIndex: 12001,
      width: 'min(760px, calc(100vw - 36px))',
      minHeight: 44,
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 38px',
      alignItems: 'center',
      gap: 10,
      padding: '0 6px 0 14px',
      border: `1px solid ${T.border2}`,
      borderRadius: 12,
      background: String(glass('10', 25).background),
      boxShadow: T.shadowLg,
      transform: 'translateX(-50%)',
      cursor: 'default',
    } as CSSProperties,

    imagePreviewTitle: {
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: T.text2,
      fontSize: 12.5,
      fontWeight: 750,
      fontFamily,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    } as CSSProperties,

    imagePreviewStage: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'zoom-out',
    } as CSSProperties,

    imagePreview: {
      display: 'block',
      maxWidth: 'calc(100vw - 56px)',
      maxHeight: 'calc(100vh - 112px)',
      width: 'auto',
      height: 'auto',
      objectFit: 'contain',
      borderRadius: BUTTON_RADIUS,
      border: `1px solid ${T.border2}`,
      background: T.bg,
      boxShadow: '0 24px 80px rgba(0, 0, 0, 0.72)',
      cursor: 'default',
    } as CSSProperties,

    imagePreviewClose: {
      width: 38,
      height: 38,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${T.border2}`,
      borderRadius: BUTTON_RADIUS,
      background: String(glass('10', 25).background),
      color: T.text,
      boxShadow: T.shadowLg,
      cursor: 'pointer',
    } as CSSProperties,

    searchShell: (mobile = false, inner: CSSProperties): CSSProperties => ({
      ...inner,
      maxHeight: mobile ? undefined : '80vh',
      overflow: mobile ? undefined : 'hidden',
    }),

    searchOverlay: (base: CSSProperties): CSSProperties => ({
      ...base,
      paddingTop: '12vh',
    }),

    searchHeader: (hasResults: boolean): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '16px 20px',
      borderBottom: hasResults ? `1px solid ${T.border}` : 'none',
      fontFamily,
    }),

    searchInput: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: T.text,
      fontSize: 16,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    shortcutBadge: {
      padding: '4px 8px',
      borderRadius: 6,
      background: 'rgba(255, 255, 255, 0.055)',
      color: T.muted,
      fontSize: 12,
      fontWeight: 800,
      fontFamily,
    } as CSSProperties,

    searchResults: {
      overflowY: 'auto',
    } as CSSProperties,

    searchResult: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 20px',
      border: 'none',
      borderBottom: `1px solid ${T.border2}`,
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background .16s ease, border-color .16s ease, transform .16s ease',
      fontFamily,
    } as CSSProperties,

    searchResultBody: {
      flex: 1,
      minWidth: 0,
    } as CSSProperties,

    searchResultTitle: (done = false): CSSProperties => ({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: T.text,
      fontSize: 14.5,
      fontWeight: 600,
      textDecoration: done ? 'line-through' : 'none',
      fontFamily,
    }),

    searchResultMeta: {
      color: T.text2,
      fontSize: 12,
      fontWeight: 500,
      fontFamily,
    } as CSSProperties,

    relative: {
      position: 'relative',
    } as CSSProperties,

    inlineIcon: {
      display: 'flex',
    } as CSSProperties,

    dot: (color: string, size = 8, radius = 3): CSSProperties => ({
      width: size,
      height: size,
      borderRadius: radius,
      background: color,
      flexShrink: 0,
    }),

    truncate: (maxWidth?: number): CSSProperties => ({
      maxWidth,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),

    miniCalendarShell: {
      fontFamily,
    } as CSSProperties,

    miniCalendarHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    } as CSSProperties,

    miniCalendarNavButton: {
      padding: 4,
      borderRadius: BUTTON_RADIUS,
    } as CSSProperties,

    miniCalendarTitle: {
      color: T.text,
      fontSize: 13,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    miniCalendarWeekGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: 4,
      textAlign: 'center',
      marginBottom: 8,
    } as CSSProperties,

    miniCalendarGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: 4,
    } as CSSProperties,

    miniCalendarWeekday: {
      color: T.muted,
      fontSize: 11,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    miniCalendarDay: (selected = false, today = false): CSSProperties => ({
      height: 28,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: 0,
      border: 'none',
      borderRadius: 8,
      background: selected ? T.accentFill : today ? T.accentDim : 'transparent',
      color: selected ? '#fff' : today ? T.accent : T.text,
      cursor: 'pointer',
      fontSize: 12.5,
      fontWeight: selected || today ? 800 : 600,
      transition: 'background .16s ease, color .16s ease, transform .16s ease, box-shadow .16s ease',
      fontFamily,
    }),

    dropdownChevron: (open = false): CSSProperties => ({
      marginLeft: 4,
      transform: open ? 'rotate(180deg)' : 'none',
      transition: 'transform 0.2s',
    }),

    dropdownMenu: (alignRight = false, minWidth = 200, maxHeight = 260): CSSProperties => ({
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: alignRight ? 'auto' : 0,
      right: alignRight ? 0 : 'auto',
      zIndex: 12000,
      minWidth,
      maxHeight,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: 8,
      overflowY: 'auto',
      ...frosted(0.9, 26),
      border: `1px solid ${T.border2}`,
      borderRadius: 12,
      boxShadow: T.shadowLg,
      fontFamily,
    }),

    dropdownClearItem: (active = false): CSSProperties =>
      UI.control.menuItem(active, {
        marginTop: 4,
        borderTop: `1px solid ${T.border2}`,
        paddingTop: 10,
        color: active ? T.accent : T.text2,
      }),

    datePopover: {
      position: 'absolute',
      top: 'calc(100% + 6px)',
      left: 0,
      zIndex: 12000,
      width: 280,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: 16,
      ...frosted(0.9, 26),
      border: `1px solid ${T.border2}`,
      borderRadius: 16,
      boxShadow: T.shadowLg,
      fontFamily,
    } as CSSProperties,

    quickGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
    } as CSSProperties,

    quickDateButton: {
      flex: 1,
      padding: '8px 0',
      border: `1px solid ${T.border2}`,
      borderRadius: BUTTON_RADIUS,
      background: String(glass('05', 25).background),
      color: T.text,
      fontWeight: 700,
      transition: 'background .16s ease, border-color .16s ease, transform .16s ease, box-shadow .16s ease',
    } as CSSProperties,

    timeRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as CSSProperties,

    timeCell: {
      flex: 1,
    } as CSSProperties,

    clearDateButton: (): CSSProperties =>
      UI.control.button('ghost', 'md', false, {
        color: T.danger,
        fontSize: 13.5,
        fontWeight: 700,
        padding: '6px 12px',
      }),
  },

  settings: {
    shell: (base: CSSProperties, mobile = false): CSSProperties => ({
      ...base,
      width: mobile ? undefined : 540,
    }),

    header: {
      borderBottom: `1px solid ${T.border2}`,
    } as CSSProperties,

    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 28px 0',
      fontFamily,
    } as CSSProperties,

    title: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      color: T.text,
      fontSize: 18,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    avatarText: {
      fontSize: 24,
    } as CSSProperties,

    tabBar: {
      display: 'flex',
      gap: 8,
      padding: '20px 28px 0',
    } as CSSProperties,

    tab: (active = false): CSSProperties => ({
      padding: '10px 8px',
      border: 'none',
      borderBottom: `3px solid ${active ? T.accent : 'transparent'}`,
      background: 'transparent',
      color: active ? T.accent : T.muted,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      fontFamily,
    }),

    body: {
      padding: 28,
      fontFamily,
    } as CSSProperties,

    stack: (gap = 12): CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      gap,
    }),

    label: (marginBottom = 12): CSSProperties => ({
      marginBottom,
      color: T.text2,
      fontSize: 12,
      fontWeight: 700,
      fontFamily,
    }),

    avatarGrid: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
    } as CSSProperties,

    presetGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 10,
    } as CSSProperties,

    avatarButton: (selected = false): CSSProperties => ({
      width: 40,
      height: 40,
      borderRadius: BUTTON_RADIUS,
      border: `2px solid ${selected ? T.accent : T.border}`,
      background: selected ? T.accentDim : T.subtle,
      cursor: 'pointer',
      fontSize: 20,
      transition: 'all 0.1s',
      fontFamily,
    }),

    presetButton: (selected = false): CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 8,
      borderRadius: 12,
      border: `1px solid ${selected ? T.accent : T.border2}`,
      background: selected ? T.accentDim : String(glass('05', 25).background),
      color: T.text,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease',
      boxShadow: selected ? `0 0 0 1px ${T.accentMid}` : 'none',
      fontFamily,
    }),

    presetPreview: (background: string): CSSProperties => ({
      width: '100%',
      aspectRatio: '1.45 / 1',
      borderRadius: 10,
      border: `1px solid ${T.border2}`,
      background,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
    }),

    presetLabel: {
      color: T.text,
      fontSize: 12,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    row: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      border: `1px solid ${T.border2}`,
      borderRadius: 12,
      background: String(glass('05', 25).background),
      fontFamily,
    } as CSSProperties,

    rowLabel: {
      color: T.text,
      fontSize: 14,
      fontWeight: 500,
      fontFamily,
    } as CSSProperties,

    keyButton: (recording = false): CSSProperties => ({
      padding: '4px 12px',
      border: `1px solid ${T.border2}`,
      borderRadius: BUTTON_RADIUS,
      background: recording ? T.accent : T.bg,
      color: T.text,
      cursor: 'pointer',
      fontFamily: FONT_MONO,
      fontWeight: 700,
    }),

    editRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 14px',
      border: `1px solid ${T.border2}`,
      borderRadius: 12,
      background: String(glass('05', 25).background),
      fontFamily,
    } as CSSProperties,

    fillEditor: {
      width: 214,
      flexShrink: 0,
    } as CSSProperties,

    colorInput: {
      width: 26,
      height: 26,
      border: 'none',
      background: 'none',
      cursor: 'pointer',
    } as CSSProperties,

    inlineInput: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'none',
      color: T.text,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    textInput: {
      borderRadius: BUTTON_RADIUS,
    } as CSSProperties,

    textInputFlex: {
      flex: 1,
      borderRadius: BUTTON_RADIUS,
    } as CSSProperties,

    deleteButton: {
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: 'none',
      color: T.muted,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily,
    } as CSSProperties,

    dataButton: {
      display: 'flex',
      gap: 12,
      padding: '14px 18px',
      border: `1px solid ${T.border2}`,
      borderRadius: BUTTON_RADIUS,
      background: String(glass('05', 25).background),
      color: T.text,
      cursor: 'pointer',
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      padding: '20px 28px',
      borderTop: `1px solid ${T.border2}`,
      fontFamily,
    } as CSSProperties,

    savePreviewButton: (color: string): CSSProperties => ({
      background: color,
      color: readableTextOn(color),
      boxShadow: `0 10px 24px rgba(0,0,0,.18), 0 0 0 1px ${color}55`,
    }),
  },

  projectModal: {
    shell: (base: CSSProperties, mobile = false): CSSProperties => ({
      ...base,
      width: mobile ? undefined : 460,
    }),

    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 24px',
      borderBottom: `1px solid ${T.border2}`,
      fontFamily,
    } as CSSProperties,

    title: {
      color: T.text,
      fontSize: 16,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    body: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      padding: 24,
      fontFamily,
    } as CSSProperties,

    columns: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    } as CSSProperties,

    columnCard: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '12px 14px',
      border: `1px solid ${T.border2}`,
      borderRadius: 12,
      background: String(glass('05', 25).background),
      fontFamily,
    } as CSSProperties,

    columnRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as CSSProperties,

    fillEditor: {
      width: 190,
      flexShrink: 0,
    } as CSSProperties,

    columnInput: {
      flex: 1,
      border: 'none',
      background: 'none',
      color: T.text,
      fontSize: 14,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    doneLabel: (done = false): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginLeft: 36,
      color: done ? T.success : T.text2,
      cursor: 'pointer',
      fontSize: 12.5,
      fontWeight: 500,
      fontFamily,
    }),

    addRow: {
      display: 'flex',
      gap: 10,
    } as CSSProperties,

    addInput: {
      flex: 1,
      borderRadius: 10,
    } as CSSProperties,

    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      padding: '16px 24px',
      borderTop: `1px solid ${T.border2}`,
      fontFamily,
    } as CSSProperties,
  },

  richEditor: {
    shell: {
      display: 'flex',
      flexDirection: 'column',
    } as CSSProperties,

    hiddenInput: {
      display: 'none',
    } as CSSProperties,

    toolbar: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'nowrap',
      gap: 4,
      marginBottom: 12,
      maxWidth: '100%',
      overflow: 'visible',
    } as CSSProperties,

    button: (active = false, overrides?: CSSProperties): CSSProperties => ({
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      padding: 0,
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: active ? T.accentDim : 'transparent',
      color: active ? T.accent : T.text2,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 700,
      transition: 'all 0.1s',
      fontFamily,
      ...overrides,
    }),

    buttonUnderline: (active = false): CSSProperties =>
      UI.richEditor.button(active, { textDecoration: 'underline' }),

    buttonStrike: (active = false): CSSProperties =>
      UI.richEditor.button(active, { textDecoration: 'line-through' }),

    buttonHeading: (active = false): CSSProperties =>
      UI.richEditor.button(active, { width: 34 }),

    separator: {
      width: 1,
      height: 14,
      margin: '0 6px',
      background: T.border2,
      opacity: 0.6,
    } as CSSProperties,

    editorShell: {
      cursor: 'text',
      background: 'transparent',
    } as CSSProperties,
  },

  app: {
    root: {
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      outline: 'none',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily,
    } as CSSProperties,

    loading: {
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    } as CSSProperties,

    loadingIcon: {
      animation: 'spin 2s linear infinite',
      opacity: 0.5,
    } as CSSProperties,

    popoverWrap: (offset = 0): CSSProperties => ({
      position: 'relative',
      marginLeft: offset,
    }),

    projectSelectTrigger: (open = false, hasValue = false): CSSProperties =>
      UI.control.chipButton(open, hasValue ? 'var(--accent)' : 'var(--text)', {
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        minHeight: 36,
        padding: '6px 12px',
        background: open ? 'var(--card-act)' : 'var(--card)',
        border: `1px solid ${open ? 'var(--border-hover)' : 'var(--border-input)'}`,
        borderRadius: BUTTON_RADIUS,
        fontWeight: 600,
        boxShadow: EFFECTS.glassRim,
      }),

    projectSelectMenu: (): CSSProperties =>
      UI.modal.popover({
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        zIndex: 100,
        minWidth: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: 6,
        borderRadius: 16,
        ...glass('F5', 30),
      }),

    projectSelectItem: (active = false): CSSProperties =>
      UI.control.menuItem(active, {
        width: '100%',
        padding: '10px 12px',
        borderRadius: BUTTON_RADIUS,
        color: active ? 'var(--accent)' : 'var(--text)',
        fontSize: 13,
        fontWeight: active ? 800 : 600,
      }),

    backdrop: {
      position: 'fixed',
      inset: 0,
      zIndex: 90,
    } as CSSProperties,

    projectDot: (color: string): CSSProperties => ({
      ['--project-color' as string]: fillColor(color),
      width: 8,
      height: 8,
      flexShrink: 0,
      borderRadius: 999,
      background: color,
      boxShadow: '0 0 8px color-mix(in srgb, var(--project-color) 25%, transparent)',
    }),

    menuSeparator: {
      height: 1,
      margin: '6px 10px',
      background: 'var(--border2)',
    } as CSSProperties,

    gearMenuPopover: (): CSSProperties =>
      UI.modal.popover({
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        zIndex: 100,
        minWidth: 220,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: 6,
        borderRadius: 16,
        ...glass('F2', 40),
      }),

    gearMenuItem: (): CSSProperties =>
      UI.control.menuItem(false, {
        width: '100%',
        padding: '12px 14px',
        borderRadius: 10,
        color: 'var(--text)',
        fontSize: 13,
      }),

    menuLabel: {
      padding: '8px 14px 4px',
      color: 'var(--muted)',
      fontSize: 10,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontFamily,
    } as CSSProperties,

    menuItemSplit: {
      justifyContent: 'space-between',
    } as CSSProperties,

    menuItemText: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    } as CSSProperties,

    toggleBadge: (on = false): CSSProperties => ({
      padding: '2px 6px',
      borderRadius: 6,
      background: on ? 'var(--accent-dim)' : 'var(--subtle)',
      color: on ? 'var(--accent)' : 'var(--muted)',
      fontSize: 10,
      fontWeight: 800,
    }),

    content: (mobile = false): CSSProperties => ({
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      paddingBottom: mobile ? 64 : 0,
    }),

    header: (mobile = false): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexShrink: 0,
      minHeight: mobile ? 56 : 57,
      padding: mobile ? '10px 16px' : '10px 24px',
      boxSizing: 'border-box',
      borderBottom: '1px solid var(--border-strong)',
      background: 'var(--band)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)',
    }),

    titleArea: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    } as CSSProperties,

    title: (mobile = false): CSSProperties => ({
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: 'var(--text)',
      fontSize: mobile ? 18 : 20,
      fontWeight: 600,
      letterSpacing: '-0.4px',
      whiteSpace: 'nowrap',
      fontFamily,
    }),

    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    } as CSSProperties,

    mobileMenuButton: (): CSSProperties =>
      UI.control.button('ghost', 'md', false, {
        padding: 0,
        background: 'none',
        color: 'var(--muted)',
      }),

    headerIconButton: (active = false): CSSProperties =>
      UI.control.iconButton(active, 36, {
        border: `1px solid ${active ? 'var(--border-hover)' : 'var(--border-input)'}`,
        background: active ? 'var(--card-act)' : 'var(--card)',
        boxShadow: active ? EFFECTS.glassRim : 'none',
      }),

    primaryAction: {
      height: 36,
      padding: '0 16px',
      borderRadius: BUTTON_RADIUS,
      fontWeight: 700,
    } as CSSProperties,

    aiAction: {
      height: 36,
      padding: '0 14px',
      borderRadius: BUTTON_RADIUS,
      fontWeight: 600,
      minWidth: 62,
      background: 'var(--card)',
      border: '1px solid var(--border-input)',
      color: 'var(--text2)',
      boxShadow: 'none',
    } as CSSProperties,

    main: {
      flex: 1,
      display: 'flex',
      minHeight: 0,
      overflow: 'hidden',
      background: 'var(--bg)',
    } as CSSProperties,
  },

  menu: {
    context: (x: number, y: number): CSSProperties => ({
      position: 'fixed',
      top: y,
      left: x,
      zIndex: 500,
      minWidth: 170,
      padding: 5,
      borderRadius: 10,
      border: '1px solid var(--border2)',
      background: `${T.card}E6`,
      backdropFilter: 'blur(25px) saturate(180%)',
      boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
      fontFamily,
    }),

    contextItem: (danger = false): CSSProperties => ({
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      padding: '8px 10px',
      border: 'none',
      borderRadius: 7,
      background: 'transparent',
      color: danger ? T.danger : T.text,
      cursor: 'pointer',
      fontSize: 13.5,
      fontWeight: 500,
      textAlign: 'left',
      transition: 'background .1s',
      fontFamily: 'inherit',
    }),

    separator: {
      height: 1,
      margin: '4px 0',
      background: 'var(--border2)',
    } as CSSProperties,

    subMenu: {
      position: 'absolute',
      left: 'calc(100% + 8px)',
      top: -6,
      minWidth: 190,
      padding: 5,
      borderRadius: 10,
      border: '1px solid var(--border2)',
      background: `${T.card}F2`,
      backdropFilter: 'blur(25px) saturate(180%)',
      boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
      fontFamily,
      zIndex: 520,
    } as CSSProperties,
  },

  toast: {
    shell: (bottom: number): CSSProperties => ({
      position: 'fixed',
      bottom,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 2000,
      width: 'min(calc(100vw - 32px), 520px)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px 10px 14px',
      borderRadius: 14,
      border: '1px solid var(--border2)',
      background: ALPHA_COLORS.overlayPanel,
      backdropFilter: 'blur(18px) saturate(150%)',
      WebkitBackdropFilter: 'blur(18px) saturate(150%)',
      boxShadow: 'var(--shadow-lg)',
      color: 'var(--text)',
      fontSize: 14,
      fontWeight: 600,
      animation: 'toastIn .2s ease',
      fontFamily,
    }),

    message: {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontFamily: 'inherit',
    } as CSSProperties,

    action: {
      flexShrink: 0,
      color: 'var(--accent)',
      fontWeight: 700,
    } as CSSProperties,

    undo: {
      flexShrink: 0,
      color: 'var(--accent)',
      fontWeight: 700,
    } as CSSProperties,
  },

  markdown: {
    shell: {
      color: 'inherit',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontSize: 13,
      lineHeight: 1.48,
      wordBreak: 'break-word',
      fontFamily,
    } as CSSProperties,

    blankLine: {
      height: 2,
    } as CSSProperties,

    line: (isList = false): CSSProperties => ({
      display: isList ? 'flex' : 'block',
      alignItems: 'flex-start',
      gap: 7,
      minWidth: 0,
    }),

    heading: (level = 2): CSSProperties => ({
      marginTop: level === 1 ? 2 : 4,
      marginBottom: 1,
      color: T.text,
      fontSize: level === 1 ? 14 : level === 2 ? 13.5 : 13,
      fontWeight: 700,
      lineHeight: 1.3,
    }),

    listContent: {
      minWidth: 0,
      flex: 1,
    } as CSSProperties,

    inlineCode: {
      padding: '1px 4px',
      borderRadius: 4,
      background: 'rgba(255,255,255,0.07)',
      color: T.text,
      fontFamily: FONT_MONO,
      fontSize: '0.92em',
    } as CSSProperties,
  },

  calendarPicker: {
    shell: {
      background: `${T.card}CC`,
      backdropFilter: 'blur(20px) saturate(160%)',
      border: '1px solid var(--border2)',
      borderRadius: 14,
      padding: 18,
      width: 272,
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      fontFamily,
    } as CSSProperties,

    shortcutButton: {
      flex: 1,
      padding: '5px 3px',
      borderRadius: 7,
      fontSize: 11,
    } as CSSProperties,

    dayButton: (selected = false, today = false, past = false): CSSProperties => ({
      aspectRatio: '1',
      padding: 0,
      borderRadius: 7,
      fontSize: 12.5,
      fontWeight: selected || today ? 600 : 500,
      background: selected ? T.accentFill : today ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: selected ? '#fff' : today ? T.accent : past ? T.muted : T.text,
    }),

    timeInput: {
      flex: 1,
      padding: '6px 9px',
      border: '1px solid var(--border2)',
      background: 'rgba(255,255,255,0.05)',
      fontSize: 13,
      fontFamily: 'inherit',
    } as CSSProperties,

    quickRow: {
      display: 'flex',
      gap: 5,
      marginBottom: 14,
    } as CSSProperties,

    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    } as CSSProperties,

    title: {
      color: T.text,
      fontSize: 13,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    weekGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      gap: 1,
      marginBottom: 4,
    } as CSSProperties,

    dayGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      gap: 2,
    } as CSSProperties,

    weekday: {
      padding: '2px 0',
      color: T.muted,
      textAlign: 'center',
      fontSize: 10.5,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    timeRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      paddingTop: 12,
      borderTop: '1px solid var(--border2)',
    } as CSSProperties,

    timeLabel: {
      flexShrink: 0,
      color: T.muted,
      fontSize: 12,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    clearButton: {
      color: T.muted,
      flexShrink: 0,
      whiteSpace: 'nowrap',
    } as CSSProperties,
  },

  sidebar: {
    shell: {
      width: 234,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
      padding: '14px 13px',
      borderRight: `1px solid ${ALPHA_COLORS.borderStrong}`,
      background: 'var(--surface)',
      fontFamily,
    } as CSSProperties,

    collapsedShell: {
      width: 64,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      padding: '14px 0',
      borderRight: `1px solid ${ALPHA_COLORS.borderStrong}`,
      background: 'var(--surface)',
      fontFamily,
    } as CSSProperties,

    brandBar: {
      padding: '2px 11px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as CSSProperties,

    brandText: {
      color: 'var(--text)',
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: '-0.3px',
      userSelect: 'none',
      fontFamily,
    } as CSSProperties,

    logoSvg: {
      display: 'block',
      flexShrink: 0,
    } as CSSProperties,

    collapsedActiveDot: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      background: 'var(--accent-fill)',
      boxShadow: '0 0 0 2px var(--surface)',
    } as CSSProperties,

    collapsedDangerDot: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      background: 'var(--danger)',
      border: '2px solid var(--surface)',
    } as CSSProperties,

    spacer: {
      flex: 1,
    } as CSSProperties,

    brandIdentity: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    } as CSSProperties,

    navList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      marginBottom: 22,
    } as CSSProperties,

    navLabel: {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    } as CSSProperties,

    badge: {
      minWidth: 18,
      padding: '1px 6px',
      borderRadius: 999,
      background: 'var(--card-hov)',
      border: `1px solid ${ALPHA_COLORS.borderCard}`,
      color: 'var(--text2)',
      fontSize: 11,
      fontWeight: 600,
      lineHeight: '15px',
      textAlign: 'center',
      boxSizing: 'border-box',
    } as CSSProperties,

    collapsedLogoButton: (): CSSProperties =>
      UI.control.button('ghost', 'md', false, { padding: 0, marginBottom: 14 }),

    collapsedExpandButton: (): CSSProperties =>
      UI.control.button('ghost', 'md', false, { padding: 8, color: 'var(--muted)' }),

    collapseToggleButton: (): CSSProperties =>
      UI.control.button('ghost', 'sm', false, {
        color: 'var(--muted)',
        background: 'none',
        padding: '6px 11px',
        gap: 10,
        width: '100%',
        justifyContent: 'flex-start',
        fontSize: 13,
        fontWeight: 500,
      }),

    projectList: {
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    } as CSSProperties,

    renameInput: {
      flex: 1,
      padding: '6px 11px',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: 'var(--text)',
      fontSize: 13,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    projectDot: (color: string): CSSProperties => ({
      width: 10,
      height: 10,
      flexShrink: 0,
      borderRadius: 3,
      background: color,
    }),

    activeProjectDot: (color: string, active = false): CSSProperties => ({
      ['--project-color' as string]: fillColor(color),
      width: 10,
      height: 10,
      flexShrink: 0,
      borderRadius: 3,
      background: color,
      boxShadow: active ? '0 0 12px color-mix(in srgb, var(--project-color) 50%, transparent)' : 'none',
    }),

    projectColorTrigger: (color: string, active = false, hover = false): CSSProperties => ({
      ['--project-color' as string]: fillColor(color),
      width: 14,
      height: 14,
      marginLeft: 11,
      borderRadius: 4,
      border: `1px solid ${active || hover ? 'var(--project-color)' : 'transparent'}`,
      background: color,
      boxShadow: 'none',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'opacity .14s ease',
      opacity: active || hover ? 1 : 0.75,
      fontFamily,
    }),

    projectName: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.25,
    } as CSSProperties,

    projectNameState: (active = false): CSSProperties => ({
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: 13,
      fontWeight: active ? 600 : 500,
      lineHeight: 1.25,
    }),

    projectCount: (visible = false): CSSProperties => ({
      color: 'var(--muted)',
      fontSize: 11,
      fontWeight: 600,
      opacity: visible ? 0.9 : 0.65,
      transition: 'opacity 0.14s ease',
    }),

    addActions: {
      display: 'flex',
      gap: 10,
    } as CSSProperties,

    addInput: (): CSSProperties => UI.control.input({ fontSize: 14 }),

    flexButton: (strong = false): CSSProperties => ({
      flex: 1,
      fontWeight: strong ? 800 : undefined,
    }),

    footer: {
      marginTop: 10,
      paddingTop: 12,
      borderTop: `1px solid ${T.border}`,
    } as CSSProperties,

    collapseRow: {
      marginTop: 2,
    } as CSSProperties,

    navItem: (active: boolean, hover = false, overrides?: CSSProperties): CSSProperties => ({
      width: '100%',
      minHeight: 32,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 11px',
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: active ? 'var(--card-act)' : hover ? 'var(--card-hov)' : 'transparent',
      color: active || hover ? 'var(--text)' : 'var(--muted)',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: 13,
      fontWeight: active ? 600 : 500,
      boxShadow: 'none',
      transition: 'background .14s ease, color .14s ease',
      fontFamily,
      ...overrides,
    }),

    collapsedNavItem: (active: boolean, hover = false): CSSProperties => ({
      width: 40,
      height: 32,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: active ? 'var(--card-act)' : hover ? 'var(--card-hov)' : 'transparent',
      cursor: 'pointer',
      boxShadow: 'none',
      transition: 'background .14s ease',
      fontFamily,
    }),

    projectRow: (active: boolean, over: boolean, hover = false): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      marginBottom: 2,
      borderRadius: BUTTON_RADIUS,
      background: active ? 'var(--card-act)' : hover || over ? 'var(--card-hov)' : 'transparent',
      boxShadow: 'none',
      transition: 'background .14s ease',
      fontFamily,
    }),

    projectButton: (active: boolean, hover = false): CSSProperties => ({
      flex: 1,
      minWidth: 0,
      minHeight: 32,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 11px',
      border: 'none',
      background: 'transparent',
      color: active || hover ? 'var(--text)' : 'var(--muted)',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: 13,
      fontWeight: active ? 600 : 500,
      transition: 'color .14s ease',
      fontFamily,
    }),

    sectionLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      padding: '6px 11px',
      marginBottom: 4,
      border: 'none',
      background: 'transparent',
      color: 'var(--muted)',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily,
    } as CSSProperties,

    addPanel: {
      marginTop: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 12,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      background: 'var(--card)',
      boxShadow: EFFECTS.glassRim,
      fontFamily,
    } as CSSProperties,

    colorPanel: {
      margin: '0 0 10px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: 12,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      background: 'var(--card)',
      boxShadow: EFFECTS.glassRim,
      animation: 'menuShow .16s ease-out',
      fontFamily,
    } as CSSProperties,

    colorPanelHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      color: 'var(--text2)',
      fontSize: 12,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    colorPanelClose: {
      width: 26,
      height: 26,
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: 'transparent',
      color: 'var(--muted)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background .16s ease, color .16s ease',
      fontFamily,
    } as CSSProperties,

    projectColorInput: (color: string): CSSProperties => ({
      width: '100%',
      height: 34,
      padding: 3,
      border: `1px solid ${T.border2}`,
      borderRadius: BUTTON_RADIUS,
      background: color,
      cursor: 'pointer',
      fontFamily,
    }),

    addZone: {
      minHeight: 58,
      paddingTop: 4,
    } as CSSProperties,

    addTrigger: (): CSSProperties =>
      UI.sidebar.navItem(false, false, {
        color: 'var(--muted)',
        fontWeight: 500,
        opacity: 1,
      }),
  },

    list: {
    shell: {
      flex: 1,
      width: '100%',
      minWidth: 0,
      height: '100%',
      overflowY: 'auto',
      padding: 24,
      fontFamily,
      ...pageAmbientShell(),
    } as CSSProperties,

    content: {
      maxWidth: 860,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    } as CSSProperties,

    progressPanel: {
      padding: '16px 20px',
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      background: T.card,
      boxShadow: T.shadow,
    } as CSSProperties,

    row: (done: boolean): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 16px',
      borderBottom: `1px solid ${T.border}`,
      background: done ? T.surface : T.card,
      cursor: 'pointer',
      opacity: done ? 0.6 : 1,
      transition: 'background .15s ease, color .15s ease',
      fontFamily,
    }),

    rowCheck: (disabled = false): CSSProperties => ({
      marginTop: 2,
      opacity: disabled ? 0.3 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }),

    rowTitle: (done: boolean): CSSProperties => ({
      color: done ? T.muted : T.text,
      fontSize: 14.5,
      fontWeight: 600,
      lineHeight: 1.4,
      textDecoration: done ? 'line-through' : 'none',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      fontFamily,
    }),

    rowDescription: {
      color: T.text2,
      fontSize: 13,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontFamily,
    } as CSSProperties,

    rowBody: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    } as CSSProperties,

    rowMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
    } as CSSProperties,

    projectMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: T.text2,
      fontSize: 12,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    projectDot: (color: string): CSSProperties => ({
      width: 8,
      height: 8,
      borderRadius: 3,
      background: color,
      flexShrink: 0,
    }),

    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    } as CSSProperties,

    progressTitle: {
      color: T.text,
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: -0.3,
      fontFamily,
    } as CSSProperties,

    progressValue: (done = false): CSSProperties => ({
      color: done ? T.success : T.muted,
      fontSize: 13.5,
      fontWeight: 700,
      fontFamily,
    }),

    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      padding: '60px 0',
      color: T.muted,
      fontSize: 15,
      fontWeight: 500,
      textAlign: 'center',
      fontFamily,
    } as CSSProperties,

    groupTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 10,
      marginBottom: 12,
      borderBottom: `2px solid ${T.border}`,
      color: T.text,
      fontSize: 13,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily,
    } as CSSProperties,

    groupStack: {
      display: 'flex',
      flexDirection: 'column',
    } as CSSProperties,

    doneWrap: {
      marginTop: 8,
      paddingBottom: 40,
    } as CSSProperties,

    groupCount: {
      padding: '2px 8px',
      borderRadius: 10,
      background: T.card,
      color: T.muted,
      fontSize: 11.5,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    rowGroup: {
      overflow: 'hidden',
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      background: T.card,
      boxShadow: T.shadow,
    } as CSSProperties,

    doneToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginLeft: -12,
      padding: '8px 12px',
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: 'transparent',
      color: T.muted,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 700,
      transition: 'background .16s ease, color .16s ease, transform .16s ease',
      fontFamily: 'inherit',
    } as CSSProperties,

    donePanel: {
      marginTop: 12,
      overflow: 'hidden',
      border: `1px dashed ${T.border2}`,
      borderRadius: 12,
      background: 'transparent',
    } as CSSProperties,
  },

  notes: {
    shell: {
      height: '100%',
      overflowY: 'auto',
      padding: 24,
      paddingBottom: 100,
      fontFamily,
      ...pageAmbientShell(),
    } as CSSProperties,

    topbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 18,
    } as CSSProperties,

    topbarTitleWrap: {
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    } as CSSProperties,

    topbarCount: {
      color: 'var(--text)',
      fontSize: 18,
      fontWeight: 800,
      letterSpacing: '-0.3px',
      fontFamily,
    } as CSSProperties,

    topbarHint: {
      color: 'var(--muted)',
      fontSize: 12.5,
      lineHeight: 1.45,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    boardShell: {
      padding: 0,
      borderRadius: 0,
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
    } as CSSProperties,

    emptyShell: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      fontFamily,
      ...pageAmbientShell(),
    } as CSSProperties,

    emptyPanel: (surface: CSSProperties): CSSProperties => ({
      ...surface,
      width: 360,
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      padding: 30,
      border: '1px solid var(--border2)',
      borderRadius: 24,
      background: surface.background,
      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.28)',
      textAlign: 'center',
      fontFamily,
    }),

    emptyIcon: {
      width: 70,
      height: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--border2)',
      borderRadius: 22,
      background: 'rgba(255,255,255,0.035)',
      color: 'var(--muted)',
    } as CSSProperties,

    emptyTitle: {
      color: 'var(--text)',
      fontSize: 18,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    emptyText: {
      color: 'var(--text2)',
      fontSize: 13.5,
      lineHeight: 1.55,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    card: (surface: CSSProperties): CSSProperties => ({
      ...surface,
      minHeight: 148,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'relative',
      overflow: 'hidden',
      padding: '18px 18px 14px',
      borderRadius: 20,
      border: '1px solid var(--border2)',
      background: surface.background,
      color: 'var(--text)',
      cursor: 'pointer',
      userSelect: 'none',
      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.28)',
      transition: 'background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease',
      fontFamily,
    }),

    title: {
      minWidth: 0,
      color: 'var(--text)',
      fontSize: 16,
      lineHeight: 1.35,
      fontWeight: 700,
      wordBreak: 'break-word',
      fontFamily,
    } as CSSProperties,

    headerRow: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    } as CSSProperties,

    headerMain: {
      minWidth: 0,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      flex: 1,
    } as CSSProperties,

    footerText: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    } as CSSProperties,

    menuButton: (visible: boolean): CSSProperties => ({
      width: 28,
      minWidth: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -4,
      marginRight: -4,
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: 'transparent',
      color: 'var(--muted)',
      cursor: 'pointer',
      opacity: visible ? 1 : 0,
      transition: 'background 0.15s ease, color 0.15s ease, opacity 0.15s ease',
    }),

    dragHandle: {
      width: 28,
      minWidth: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -4,
      marginLeft: -4,
      border: 'none',
      borderRadius: BUTTON_RADIUS,
      background: 'transparent',
      color: 'var(--muted)',
      cursor: 'grab',
      opacity: 0.58,
      transition: 'background 0.15s ease, color 0.15s ease, opacity 0.15s ease',
    } as CSSProperties,

    preview: (lineClamp: number): CSSProperties => ({
      color: 'var(--text2)',
      fontSize: 13.5,
      lineHeight: 1.58,
      fontWeight: 500,
      display: '-webkit-box',
      WebkitLineClamp: lineClamp,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      wordBreak: 'break-word',
      fontFamily,
    }),

    emptyPreview: {
      color: 'var(--muted)',
      fontSize: 13.5,
      fontWeight: 500,
      fontStyle: 'italic',
      opacity: 0.78,
      fontFamily,
    } as CSSProperties,

    footer: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 'auto',
      paddingTop: 10,
      color: 'var(--muted)',
      fontSize: 11.5,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    dragPreview: {
      position: 'fixed',
      top: -9999,
      left: -9999,
      padding: '10px 12px',
      borderRadius: 12,
      background: `${T.card}F0`,
      border: '1px solid var(--border2)',
      color: 'var(--text)',
      fontSize: 12,
      fontWeight: 700,
      boxShadow: 'var(--shadow)',
      pointerEvents: 'none',
      fontFamily,
    } as CSSProperties,
  },

  calendar: {
    shell: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: 32,
      color: 'var(--text)',
      fontFamily,
      ...pageAmbientShell(),
    } as CSSProperties,

    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 20,
      marginBottom: 24,
      flexShrink: 0,
    } as CSSProperties,

    title: {
      margin: 0,
      color: 'var(--text)',
      fontSize: 28,
      lineHeight: 1.1,
      fontWeight: 700,
      letterSpacing: '-0.6px',
      fontFamily,
    } as CSSProperties,

    subtitle: {
      marginTop: 8,
      color: 'var(--text2)',
      fontSize: 13,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    titleWrap: {
      minWidth: 0,
    } as CSSProperties,

    titleYear: {
      color: 'var(--text2)',
      fontWeight: 550,
    } as CSSProperties,

    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexShrink: 0,
    } as CSSProperties,

    navButton: {
      width: 40,
      minWidth: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--border2)',
      borderRadius: BUTTON_RADIUS,
      background: 'var(--card)',
      color: 'var(--text)',
      cursor: 'pointer',
      transition: 'background 0.16s ease, border-color 0.16s ease',
      fontFamily,
    } as CSSProperties,

    todayButton: {
      height: 40,
      padding: '0 16px',
      border: '1px solid var(--border2)',
      borderRadius: BUTTON_RADIUS,
      background: 'var(--card)',
      color: 'var(--text)',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 750,
      transition: 'background 0.16s ease, border-color 0.16s ease',
      fontFamily,
    } as CSSProperties,

    board: {
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      border: '1px solid var(--border2)',
      borderRadius: 24,
      background: 'var(--surface)',
      boxShadow: '0 18px 46px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255,255,255,0.04)',
    } as CSSProperties,

    scroller: {
      width: '100%',
      height: '100%',
      overflowX: 'auto',
      overflowY: 'hidden',
      background: 'transparent',
    } as CSSProperties,

    grid: {
      minWidth: 980,
      height: '100%',
      display: 'grid',
      gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))',
      gridTemplateRows: 'auto repeat(2, minmax(0, 1fr))',
      gap: 1,
    } as CSSProperties,

    weekday: {
      padding: '14px 10px',
      background: 'color-mix(in srgb, var(--surface) 88%, var(--bg))',
      color: 'var(--text2)',
      textAlign: 'center',
      fontSize: 11,
      fontWeight: 850,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      boxShadow: '0 1px 0 var(--border2)',
      fontFamily,
    } as CSSProperties,

    emptyDay: {
      minHeight: 0,
      background: 'rgba(255,255,255,0.018)',
      opacity: 0.7,
    } as CSSProperties,

    day: (dragOver = false): CSSProperties => ({
      minHeight: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 10,
      background: dragOver
        ? 'color-mix(in srgb, var(--accent) 12%, rgba(255,255,255,0.035))'
        : 'linear-gradient(180deg, rgba(255,255,255,0.032), rgba(255,255,255,0.012))',
      boxShadow: dragOver ? 'inset 0 0 0 1px color-mix(in srgb, var(--accent) 42%, transparent)' : 'inset 0 1px 0 rgba(255,255,255,0.02)',
      transition: 'background 0.16s ease, box-shadow 0.16s ease',
      fontFamily,
    }),

    dayNumber: (today = false): CSSProperties => ({
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 9,
      background: today ? 'var(--accent-fill)' : 'transparent',
      color: today ? 'var(--accent-text)' : 'var(--text2)',
      fontSize: 13,
      fontWeight: 900,
      fontFamily,
    }),

    count: {
      minWidth: 22,
      height: 22,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      padding: '0 7px',
      border: '1px solid var(--border2)',
      borderRadius: 999,
      background: 'var(--card)',
      color: 'var(--text2)',
      fontSize: 11,
      fontWeight: 800,
      fontFamily,
    } as CSSProperties,

    dayHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexShrink: 0,
    } as CSSProperties,

    taskList: {
      minHeight: 0,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      overflowY: 'auto',
      paddingRight: 4,
      paddingBottom: 4,
      overscrollBehavior: 'contain',
    } as CSSProperties,

    miniTaskTitle: {
      color: 'var(--text)',
      fontSize: 12,
      lineHeight: 1.35,
      fontWeight: 600,
      flex: 1,
      minWidth: 0,
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: 2,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      wordBreak: 'break-word',
      fontFamily,
    } as CSSProperties,

    miniTaskDot: (color: string): CSSProperties => ({
      width: 8,
      height: 8,
      marginTop: 4,
      borderRadius: 999,
      background: color,
      flexShrink: 0,
      boxShadow: `0 0 10px ${color}45`,
    }),

    miniTask: (_projectColor: string, dragged = false): CSSProperties => ({
      width: '100%',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 8,
      padding: '10px 12px',
      border: '1px solid var(--border2)',
      borderRadius: 14,
      background: EFFECTS.miniTaskGradient,
      color: 'var(--text)',
      cursor: dragged ? 'grabbing' : 'grab',
      opacity: dragged ? 0.45 : 1,
      textAlign: 'left',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
      transition: 'background 0.14s ease, border-color 0.14s ease, opacity 0.14s ease, box-shadow 0.14s ease',
      fontFamily,
    }),

    miniTaskHover: {
      background: EFFECTS.miniTaskGradientHover,
      borderColor: 'var(--border-hover)',
    },

    dropPlaceholder: {
      minHeight: 38,
      border: '1px dashed color-mix(in srgb, var(--accent) 34%, var(--border2))',
      borderRadius: 12,
      background: 'color-mix(in srgb, var(--accent) 10%, rgba(255,255,255,0.03))',
      opacity: 0.9,
    } as CSSProperties,
  },

  analytics: {
    shell: {
      flex: 1,
      width: '100%',
      minWidth: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      padding: 28,
      overflowY: 'auto',
      color: T.text,
      fontFamily,
      ...pageAmbientShell(),
    } as CSSProperties,

    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 20,
    } as CSSProperties,

    summaryIntro: {
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flex: '1 1 360px',
    } as CSSProperties,

    summaryEyebrow: {
      color: T.muted,
      fontSize: 12,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontFamily,
    } as CSSProperties,

    summaryTitle: {
      color: T.text,
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: 0,
      fontFamily,
    } as CSSProperties,

    summaryText: {
      maxWidth: 760,
      color: T.text2,
      fontSize: 14,
      lineHeight: 1.6,
      fontFamily,
    } as CSSProperties,

    titleRow: {
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      color: T.text,
      fontSize: 26,
      fontWeight: 800,
      letterSpacing: 0,
      fontFamily,
    } as CSSProperties,

    projectCrumb: {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: T.muted,
      fontSize: 22,
      fontFamily,
    } as CSSProperties,

    toolbar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      flexShrink: 0,
    } as CSSProperties,

    card: {
      ...glass('08', 25),
      padding: 20,
      borderRadius: 12,
      border: '1px solid var(--border2)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      color: T.text,
      fontFamily,
    } as CSSProperties,

    panel: {
      ...glass('08', 25),
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRadius: 12,
      border: '1px solid var(--border2)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      color: T.text,
      fontFamily,
    } as CSSProperties,

    panelHead: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexShrink: 0,
      minHeight: 46,
      padding: '9px 16px',
      boxSizing: 'border-box',
      background: 'var(--panel-head)',
      borderBottom: '1px solid var(--border2)',
    } as CSSProperties,

    panelTitle: {
      color: 'var(--text)',
      fontSize: 15,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    panelSub: {
      marginTop: 2,
      color: T.muted,
      fontSize: 12,
      lineHeight: 1.4,
      fontFamily,
    } as CSSProperties,

    panelBody: (overrides?: CSSProperties): CSSProperties => ({
      minWidth: 0,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      ...overrides,
    }),

    legend: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flexWrap: 'wrap',
    } as CSSProperties,

    legendItem: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: T.muted,
      fontSize: 12,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    legendValue: {
      color: 'var(--text)',
      fontWeight: 700,
    } as CSSProperties,

    innerSurface: (overrides?: CSSProperties): CSSProperties => ({
      background: String(glass('05', 25).background),
      border: `1px solid ${T.border2}`,
      borderRadius: 16,
      ...overrides,
    }),

    titleIcon: (color = T.accent): CSSProperties => ({
      width: 48,
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color,
      flexShrink: 0,
    }),

    selectWrap: {
      position: 'relative',
    } as CSSProperties,

    selectButton: (open = false): CSSProperties => ({
      height: 40,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 16px',
      background: open ? String(glass('08', 25).background) : String(glass('05', 25).background),
      border: `1px solid ${T.border2}`,
      borderRadius: 14,
      color: T.text,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      outline: 'none',
      boxShadow: open ? '0 10px 24px rgba(0,0,0,.14)' : '0 0 0 rgba(0,0,0,0)',
      transition: 'background 0.16s ease, box-shadow 0.16s ease, color 0.16s ease',
      fontFamily,
    }),

    selectBackdrop: {
      position: 'fixed',
      inset: 0,
      zIndex: 90,
    } as CSSProperties,

    selectMenu: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      zIndex: 100,
      minWidth: 220,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      padding: 6,
      borderRadius: 18,
      boxShadow: T.shadowLg,
      animation: 'menuShow 0.15s ease-out',
      ...glass('F5', 30),
      fontFamily,
    } as CSSProperties,

    selectOption: (active = false): CSSProperties => ({
      padding: '12px 14px',
      background: active ? String(glass('05', 25).background) : 'transparent',
      border: 'none',
      borderRadius: 12,
      color: active ? T.accent : T.text,
      fontSize: 13.5,
      fontWeight: active ? 800 : 600,
      textAlign: 'left',
      cursor: 'pointer',
      boxShadow: active ? 'inset 0 0 0 1px var(--border2)' : 'none',
      transition: 'background 0.12s ease, color 0.12s ease, box-shadow 0.12s ease',
      fontFamily,
    }),

    rangeSelectWrap: {
      position: 'relative',
    } as CSSProperties,

    rangeMenu: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      zIndex: 13000,
      width: 308,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 10,
      borderRadius: 18,
      boxShadow: T.shadowLg,
      animation: 'menuShow 0.15s ease-out',
      ...glass('F5', 30),
      fontFamily,
    } as CSSProperties,

    rangePresetGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 4,
    } as CSSProperties,

    rangePopover: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 10,
      border: `1px solid ${T.border2}`,
      borderRadius: 14,
      background: String(glass('04', 20).background),
      fontFamily,
    } as CSSProperties,

    rangeQuickRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8,
    } as CSSProperties,

    rangeQuickButton: {
      padding: '7px 0',
      border: `1px solid ${T.border2}`,
      borderRadius: BUTTON_RADIUS,
      background: String(glass('05', 25).background),
      color: T.text,
      fontWeight: 750,
    } as CSSProperties,

    rangeCalendarDay: (start = false, end = false, range = false, today = false): CSSProperties => ({
      height: 28,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      border: 'none',
      borderRadius: start || end ? 8 : range ? 6 : 8,
      background: start || end ? 'var(--accent)' : range ? 'var(--accent-dim)' : today ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: start || end ? 'var(--accent-text)' : range ? 'var(--accent)' : today ? 'var(--accent)' : T.text,
      cursor: 'pointer',
      fontSize: 12.5,
      fontWeight: start || end || today ? 800 : 600,
      transition: 'background .16s ease, color .16s ease, box-shadow .16s ease',
      fontFamily,
    }),

    rangeFooter: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '8px 10px 0',
      borderTop: `1px solid ${T.border2}`,
      color: T.text2,
      fontSize: 12,
      fontWeight: 750,
      fontFamily,
    } as CSSProperties,

    tooltip: {
      minWidth: 170,
      padding: '14px 18px',
      borderRadius: 16,
      border: `1px solid ${T.border2}`,
      boxShadow: T.shadowLg,
      zIndex: 1000,
      ...glass('F2', 20),
      fontFamily,
    } as CSSProperties,

    tooltipLabel: {
      marginBottom: 10,
      color: T.muted,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontFamily,
    } as CSSProperties,

    tooltipRows: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    } as CSSProperties,

    tooltipRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
    } as CSSProperties,

    tooltipName: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: T.text,
      fontSize: 13,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    colorDot: (color: string, size = 8): CSSProperties => ({
      width: size,
      height: size,
      borderRadius: 999,
      background: color,
      flexShrink: 0,
    }),

    tooltipValue: {
      color: T.text,
      fontSize: 14,
      fontWeight: 800,
      fontFamily,
    } as CSSProperties,

    kpiGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 20,
    } as CSSProperties,

    overviewGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
      gap: 12,
    } as CSSProperties,

    overviewCard: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 18,
    } as CSSProperties,

    overviewBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      width: 'fit-content',
      padding: '10px 14px',
      borderRadius: 999,
      background: String(glass('05', 25).background),
      border: `1px solid ${T.border2}`,
      color: T.text,
      fontSize: 12,
      fontWeight: 800,
      fontFamily,
    } as CSSProperties,

    overviewMetricRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 16,
    } as CSSProperties,

    overviewLabel: {
      marginBottom: 6,
      color: T.muted,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontFamily,
    } as CSSProperties,

    overviewValue: {
      color: T.text,
      fontSize: 28,
      fontWeight: 800,
      lineHeight: 1.05,
      fontFamily,
    } as CSSProperties,

    insightCard: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      justifyContent: 'space-between',
      minHeight: 116,
      padding: '14px 16px',
      boxSizing: 'border-box',
    } as CSSProperties,

    insightLabel: {
      color: T.muted,
      fontSize: 12,
      fontWeight: 600,
      fontFamily,
    } as CSSProperties,

    insightValue: {
      color: 'var(--text)',
      fontSize: 28,
      fontWeight: 700,
      lineHeight: 1.05,
      letterSpacing: '-1px',
      fontFamily,
    } as CSSProperties,

    insightFoot: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
    } as CSSProperties,

    insightDelta: (positive: boolean): CSSProperties => ({
      color: positive ? 'var(--success)' : 'var(--danger)',
      fontSize: 12,
      fontWeight: 700,
      fontFamily,
    }),

    insightNote: {
      color: T.muted,
      fontSize: 12,
      lineHeight: 1.4,
      fontFamily,
    } as CSSProperties,

    kpiCard: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '18px 22px',
    } as CSSProperties,

    kpiText: {
      minWidth: 0,
    } as CSSProperties,

    kpiLabel: {
      marginBottom: 4,
      color: T.muted,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily,
    } as CSSProperties,

    kpiValue: {
      color: T.text,
      fontSize: 26,
      fontWeight: 800,
      lineHeight: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontFamily,
    } as CSSProperties,

    kpiSub: {
      marginTop: 6,
      color: T.text2,
      fontSize: 11,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    chartGridMain: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 20,
    } as CSSProperties,

    chartGridCompact: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 20,
    } as CSSProperties,

    attentionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 20,
    } as CSSProperties,

    attentionCard: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
    } as CSSProperties,

    attentionList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    } as CSSProperties,

    attentionItem: {
      display: 'grid',
      gridTemplateColumns: '28px minmax(0, 1fr)',
      gap: 12,
      alignItems: 'flex-start',
      color: T.text2,
      fontSize: 14,
      lineHeight: 1.55,
      fontFamily,
    } as CSSProperties,

    attentionIndex: {
      width: 28,
      height: 28,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      background: String(glass('05', 25).background),
      border: `1px solid ${T.border2}`,
      color: T.accent,
      fontSize: 12,
      fontWeight: 800,
      fontFamily,
    } as CSSProperties,

    deadlineList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    } as CSSProperties,

    deadlineItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 14,
      padding: '12px 14px',
      borderRadius: 14,
      background: String(glass('05', 25).background),
      border: `1px solid ${T.border2}`,
      fontFamily,
    } as CSSProperties,

    deadlineTitle: {
      color: T.text,
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily,
    } as CSSProperties,

    deadlineMeta: {
      flexShrink: 0,
      color: T.muted,
      fontSize: 12,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    emptyState: {
      padding: '18px 0',
      color: T.muted,
      fontSize: 13,
      lineHeight: 1.5,
      fontFamily,
    } as CSSProperties,

    chartTall: {
      width: '100%',
      height: 260,
    } as CSSProperties,

    chartShort: {
      height: 240,
    } as CSSProperties,

    sectionTitle: (compact = false): CSSProperties => ({
      color: T.text,
      fontSize: 16,
      fontWeight: 700,
      marginBottom: compact ? 20 : 24,
      fontFamily,
    }),

    focusRoseWrap: {
      minHeight: 392,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as CSSProperties,

    focusRoseStage: (width: number, height: number): CSSProperties => ({
      position: 'relative',
      width,
      height,
      maxWidth: '100%',
    }),

    focusRoseSvg: {
      maxWidth: '100%',
      height: 'auto',
      overflow: 'visible',
      display: 'block',
    } as CSSProperties,

    groupFocusList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    } as CSSProperties,

    groupFocusItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    } as CSSProperties,

    groupFocusTop: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    } as CSSProperties,

    groupFocusName: {
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: T.text,
      fontSize: 13,
      fontWeight: 800,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontFamily,
    } as CSSProperties,

    groupFocusMeta: {
      flexShrink: 0,
      color: T.text2,
      fontSize: 12,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    groupFocusTrack: {
      height: 7,
      borderRadius: 999,
      overflow: 'hidden',
      background: String(glass('05', 25).background),
      border: `1px solid ${T.border2}`,
    } as CSSProperties,

    groupFocusBar: (width: number, color: string): CSSProperties => ({
      width: `${Math.max(width, 6)}%`,
      height: '100%',
      background: color,
      borderRadius: 999,
      transition: 'width 0.5s ease',
    }),

    yearCard: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    } as CSSProperties,

    yearHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
    } as CSSProperties,

    yearSubtitle: {
      marginTop: -12,
      color: T.text2,
      fontSize: 13,
      lineHeight: 1.45,
      fontFamily,
    } as CSSProperties,

    yearLegend: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: T.muted,
      fontSize: 11,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    activityDaysGrid: (days: number): CSSProperties => ({
      display: 'grid',
      gridTemplateColumns: days <= 14 ? `repeat(${Math.max(1, days)}, minmax(52px, 1fr))` : 'repeat(auto-fit, minmax(52px, 1fr))',
      gap: 10,
      width: '100%',
    }),

    activityDay: (level: number, active = false): CSSProperties => ({
      minWidth: 0,
      minHeight: 78,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      justifyItems: 'center',
      alignItems: 'center',
      gap: 7,
      padding: '10px 8px',
      borderRadius: 14,
      background: active ? 'color-mix(in srgb, var(--accent) 9%, transparent)' : String(glass('04', 25).background),
      border: `1px solid ${active ? 'color-mix(in srgb, var(--accent) 28%, transparent)' : T.border2}`,
      boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.035)' : 'none',
      transition: 'background .16s ease, border-color .16s ease, box-shadow .16s ease',
      fontFamily,
      ['--activity-level' as string]: String(level),
    }),

    activityDayWeekday: {
      color: T.muted,
      fontSize: 10,
      fontWeight: 800,
      textTransform: 'capitalize',
      lineHeight: 1,
      fontFamily,
    } as CSSProperties,

    activityDayCell: (level: number): CSSProperties => ({
      width: 22,
      height: 22,
      borderRadius: 7,
      background: [
        String(glass('05', 25).background),
        'color-mix(in srgb, var(--accent) 28%, transparent)',
        'color-mix(in srgb, var(--accent) 46%, transparent)',
        'color-mix(in srgb, var(--accent) 68%, transparent)',
        T.accent,
      ][level],
      border: `1px solid ${level === 0 ? T.border2 : T.border}`,
    }),

    activityDayDate: {
      color: T.text2,
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.1,
      textAlign: 'center',
      whiteSpace: 'nowrap',
      fontFamily,
    } as CSSProperties,

    yearScroll: {
      width: '100%',
      overflowX: 'auto',
      paddingBottom: 4,
    } as CSSProperties,

    yearHeatmap: (weeks: number): CSSProperties => ({
      width: 'max-content',
      minWidth: weeks >= 24 ? 770 : 'auto',
    }),

    yearMonths: (weeks: number): CSSProperties => ({
      display: 'grid',
      gridTemplateColumns: `28px repeat(${Math.max(1, weeks)}, 12px)`,
      gap: 3,
      marginBottom: 7,
      color: T.muted,
      fontSize: 10,
      fontWeight: 800,
      textTransform: 'capitalize',
      fontFamily,
    }),

    yearBody: (weeks: number): CSSProperties => ({
      display: 'grid',
      gridTemplateColumns: `28px ${Math.max(1, weeks) * 15 - 3}px`,
      gap: 3,
    }),

    yearWeekdays: {
      display: 'grid',
      gridTemplateRows: 'repeat(7, 12px)',
      gap: 3,
      color: T.muted,
      fontSize: 10,
      fontWeight: 800,
      lineHeight: '12px',
      fontFamily,
    } as CSSProperties,

    yearGrid: (weeks: number): CSSProperties => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.max(1, weeks)}, 12px)`,
      gap: 3,
    }),

    yearWeek: {
      display: 'grid',
      gridTemplateRows: 'repeat(7, 12px)',
      gap: 3,
    } as CSSProperties,

    yearCell: (level: number, future = false): CSSProperties => {
      const colors = [
        String(glass('05', 25).background),
        'color-mix(in srgb, var(--accent) 24%, transparent)',
        'color-mix(in srgb, var(--accent) 42%, transparent)',
        'color-mix(in srgb, var(--accent) 66%, transparent)',
        T.accent,
      ];

      return {
        width: 12,
        height: 12,
        display: 'block',
        borderRadius: 3,
        background: future ? 'transparent' : colors[level] || colors[0],
        border: future ? '1px solid transparent' : `1px solid ${level === 0 ? T.border2 : T.border}`,
      };
    },

    yearLegendCell: (level: number): CSSProperties => ({
      width: 10,
      height: 10,
      display: 'inline-block',
      borderRadius: 3,
      background: [
        String(glass('05', 25).background),
        'color-mix(in srgb, var(--accent) 24%, transparent)',
        'color-mix(in srgb, var(--accent) 42%, transparent)',
        'color-mix(in srgb, var(--accent) 66%, transparent)',
        T.accent,
      ][level],
      border: `1px solid ${level === 0 ? T.border2 : T.border}`,
    }),

    urgencyList: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    } as CSSProperties,

    metricHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 6,
      color: T.text2,
      fontSize: 12,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    metricValue: (color: string): CSSProperties => ({
      color,
    }),

    metricTrack: {
      height: 6,
      background: String(glass('05', 25).background),
      borderRadius: 10,
      overflow: 'hidden',
    } as CSSProperties,

    metricBar: (width: number, color: string): CSSProperties => ({
      width: `${width}%`,
      height: '100%',
      background: color,
      transition: 'width 0.8s ease',
    }),

    reportCard: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    } as CSSProperties,

    reportHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 18,
    } as CSSProperties,

    reportTitle: {
      color: T.text,
      fontSize: 18,
      fontWeight: 700,
      fontFamily,
    } as CSSProperties,

    reportSubtitle: {
      marginTop: 4,
      color: T.text2,
      fontSize: 13,
      fontFamily,
    } as CSSProperties,

    reportInputs: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 16,
    } as CSSProperties,

    reportTextarea: {
      minHeight: 100,
      padding: 16,
      background: String(glass('05', 25).background),
      border: `1px solid ${T.border2}`,
      borderRadius: 16,
      color: T.text,
      transition: 'background 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease',
    } as CSSProperties,

    copyButton: {
      padding: '12px 20px',
    } as CSSProperties,

    tableShell: {
      overflowX: 'auto',
      background: String(glass('05', 25).background),
      border: `1px solid ${T.border2}`,
      padding: 16,
      borderRadius: 16,
    } as CSSProperties,

    table: {
      width: '100%',
      borderCollapse: 'collapse',
      color: T.text,
      fontSize: 14,
      border: `1px solid ${T.border2}`,
      fontFamily,
    } as CSSProperties,

    tableHeadRow: {
      background: String(glass('08', 25).background),
    } as CSSProperties,

    tableCell: {
      border: `1px solid ${T.border2}`,
      padding: 12,
      textAlign: 'left',
      verticalAlign: 'top',
    } as CSSProperties,

    tableList: {
      margin: 0,
      paddingLeft: 16,
    } as CSSProperties,

    tableMuted: {
      color: T.text2,
    } as CSSProperties,

    tableHint: {
      marginTop: 8,
      color: T.muted,
      fontSize: 12,
      fontFamily,
    } as CSSProperties,

    groupLine: {
      marginBottom: 10,
      color: T.text2,
    } as CSSProperties,

    groupName: {
      color: T.text,
    } as CSSProperties,
  },

  kanban: {
    layout: G.kanbanLayout,
    backgroundFill: pageAmbientShell({
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      backgroundColor: 'var(--bg)',
    }),
    menuCalendar: {
      width: 260,
      color: 'var(--text)',
      fontFamily,
    } as CSSProperties,
    menuCalendarHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14,
    } as CSSProperties,
    menuCalendarNav: {
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--border2)',
      borderRadius: BUTTON_RADIUS,
      background: 'rgba(255, 255, 255, 0.04)',
      color: 'var(--text2)',
      cursor: 'pointer',
    } as CSSProperties,
    menuCalendarTitle: {
      flex: 1,
      color: 'var(--text)',
      textAlign: 'center',
      fontSize: 13,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      fontFamily,
    } as CSSProperties,
    menuCalendarWeekGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: 4,
      marginBottom: 6,
      textAlign: 'center',
    } as CSSProperties,
    menuCalendarDayGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: 4,
    } as CSSProperties,
    menuCalendarWeekday: {
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--muted)',
      fontSize: 10,
      fontWeight: 800,
      textTransform: 'uppercase',
      fontFamily,
    } as CSSProperties,
    menuCalendarDay: (selected = false, today = false): CSSProperties => ({
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid transparent',
      borderRadius: BUTTON_RADIUS,
      background: selected ? 'var(--accent-fill)' : today ? 'var(--accent-dim)' : 'transparent',
      color: selected ? 'var(--accent-text)' : today ? 'var(--accent)' : 'var(--text2)',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: selected || today ? 850 : 650,
      transition: 'background 0.12s ease, color 0.12s ease',
      fontFamily,
    }),
    contextMenu: (x: number, y: number): CSSProperties => ({
      top: y,
      left: x,
    }),
    menuDateWrap: {
      position: 'relative',
    } as CSSProperties,
    menuButtonActive: (active = false): CSSProperties => ({
      background: active ? 'var(--subtle)' : 'transparent',
    }),
    submenuPosition: (flipY = false, flipX = false): CSSProperties => ({
      top: flipY ? 'auto' : 0,
      bottom: flipY ? 0 : 'auto',
      left: flipX ? 'auto' : 'calc(100% + 8px)',
      right: flipX ? 'calc(100% + 8px)' : 'auto',
    }),
    dangerMenuButton: {
      color: 'var(--danger)',
    } as CSSProperties,
    menuButton: {
      ...G.menu.button,
      color: 'var(--text)',
    } as CSSProperties,
    menuLabel: {
      ...G.menu.label,
      color: 'var(--muted)',
    } as CSSProperties,
    menuSeparator: {
      ...G.menu.sep,
      background: 'var(--border2)',
    } as CSSProperties,
    menuOverlay: {
      ...G.menu.overlay,
      background: `${T.card}F5`,
      border: '1px solid var(--border2)',
      boxShadow: 'var(--shadow-lg)',
    } as CSSProperties,
    menuMeasuring: {
      opacity: 0,
      pointerEvents: 'none',
      animation: 'none',
    } as CSSProperties,
    submenu: {
      ...G.menu.subMenu,
      width: 296,
      padding: 16,
      background: `${T.card}FA`,
      border: '1px solid var(--border2)',
      boxShadow: 'var(--shadow-lg)',
      animation: 'subMenuShow 0.15s ease-out',
    } as CSSProperties,
    skeleton: {
      width: '100%',
      height: 84,
      minHeight: 84,
      flexShrink: 0,
      borderRadius: 20,
      background: 'rgba(255, 255, 255, 0.04)',
      border: '1px dashed var(--border2)',
    } as CSSProperties,
    column: {
      minWidth: 280,
      flex: 1,
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    } as CSSProperties,
    columnHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 4px 16px',
    } as CSSProperties,
    columnAccent: (color: string): CSSProperties => ({
      width: 4,
      height: 18,
      borderRadius: 2,
      background: color,
    }),
    columnTitle: {
      color: 'var(--text)',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: 0.8,
    } as CSSProperties,
    columnCount: {
      marginLeft: 'auto',
      color: 'var(--muted)',
      fontSize: 12,
      fontWeight: 700,
    } as CSSProperties,
    columnScroller: {
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: '4px 8px 24px',
    } as CSSProperties,
    dropFiller: {
      minHeight: 24,
      flex: 1,
    } as CSSProperties,
  },
};


export const GLOBAL_STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap');

        @keyframes fk-page-ambient {
          0% {
            background-position: var(--page-ambient-pos-0);
            background-size: var(--page-ambient-size-0);
          }
          50% {
            background-position: var(--page-ambient-pos-50);
            background-size: var(--page-ambient-size-50);
          }
          100% {
            background-position: var(--page-ambient-pos-100);
            background-size: var(--page-ambient-size-100);
          }
        }

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body, button, input, select, textarea {
          font-family: var(--font-family);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        button,
        a,
        input,
        textarea,
        select {
          transition: background-color .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease, filter .16s ease;
        }

        button:focus-visible,
        a:focus-visible {
          outline: 2px solid var(--border-strong);
          outline-offset: 2px;
        }

        input:hover,
        textarea:hover,
        select:hover {
          border-color: var(--border-hover);
        }

        input:focus,
        textarea:focus,
        select:focus {
          outline: none;
          box-shadow: none;
        }

        input:focus-visible,
        textarea:focus-visible,
        select:focus-visible {
          box-shadow: inset 0 -1px 0 var(--border-strong);
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-thumb {
          background: var(--border2);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes menuShow {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        @keyframes fk-view-enter {
          from {
            opacity: 0;
            transform: translateY(5px) scale(0.997);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fk-modal-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fk-modal-panel-in {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.975);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fk-modal-backdrop-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes fk-modal-panel-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(7px) scale(0.982);
          }
        }

        .fk-view-transition {
          transform-origin: 50% 10%;
          animation: fk-view-enter 220ms cubic-bezier(.22, .8, .2, 1);
        }

        .fk-modal-backdrop.fk-modal-enter {
          animation: fk-modal-backdrop-in 120ms ease-out both;
        }

        .fk-modal-backdrop.fk-modal-enter .fk-modal-panel {
          transform-origin: 50% 18%;
          animation: fk-modal-panel-in 190ms cubic-bezier(.16, .84, .24, 1) both;
        }

        .fk-modal-backdrop.fk-modal-exit {
          pointer-events: none;
          animation: fk-modal-backdrop-out 150ms ease-in both;
        }

        .fk-modal-backdrop.fk-modal-exit .fk-modal-panel {
          transform-origin: 50% 18%;
          animation: fk-modal-panel-out 150ms cubic-bezier(.4, 0, 1, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .fk-view-transition,
          .fk-modal-backdrop,
          .fk-modal-panel {
            animation-duration: 1ms !important;
            animation-delay: 0ms !important;
          }
        }


        .fk-btn-primary { background: var(--accent-fill); color: var(--accent-text); }
        .fk-btn-primary svg { stroke: currentColor !important; color: currentColor !important; }
        .fk-btn-primary svg * { stroke: currentColor !important; }
        .fk-btn-primary:hover:not(:disabled) { filter: brightness(1.12) saturate(1.04) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 12px 26px rgba(0,0,0,.45) !important; }
        .fk-btn-ghost:hover:not(:disabled) { background: var(--card-hov) !important; color: var(--text) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 0 0 1px var(--border-hover) !important; }
        .fk-btn-subtle:hover:not(:disabled) { background: var(--card-hov) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 0 0 1px var(--border-hover) !important; color: var(--text) !important; }
        .fk-btn-outline:hover:not(:disabled) { background: color-mix(in srgb, var(--accent) 14%, transparent) !important; color: var(--text) !important; border-color: color-mix(in srgb, var(--accent) 92%, white 8%) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 0 0 1px color-mix(in srgb, var(--accent) 24%, transparent) !important; }
        .fk-btn-danger:hover:not(:disabled) { background: ${ALPHA_COLORS.dangerSoft} !important; border-color: rgba(239, 68, 68, 0.3) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.06) !important; }

        .fk-sidebar-add-zone:hover .fk-sidebar-add-trigger,
        .fk-sidebar-add-zone:focus-within .fk-sidebar-add-trigger {
          opacity: 1 !important;
          transform: translateY(0) !important;
          pointer-events: auto !important;
        }
        .fk-modal-close:hover { background: ${ALPHA_COLORS.subtleHover} !important; color: var(--text) !important; box-shadow: 0 10px 24px rgba(0,0,0,.14) !important; }
        .fk-modal-icon-danger:hover { background: ${ALPHA_COLORS.dangerSoft} !important; color: var(--danger) !important; box-shadow: 0 10px 24px rgba(0,0,0,.14) !important; }
        .fk-settings-tab:hover { color: var(--text) !important; background: ${ALPHA_COLORS.subtleSurface} !important; }
        .fk-settings-avatar:hover { background: ${ALPHA_COLORS.subtleHover} !important; border-color: var(--accent) !important; box-shadow: 0 10px 22px rgba(0,0,0,.14) !important; }
        .fk-settings-key:hover { background: ${ALPHA_COLORS.subtleHover} !important; border-color: var(--accent) !important; color: var(--text) !important; box-shadow: 0 10px 22px rgba(0,0,0,.14) !important; }
        .fk-settings-data-btn:hover { background: ${ALPHA_COLORS.subtleHover} !important; border-color: var(--accent) !important; box-shadow: 0 10px 24px rgba(0,0,0,.16) !important; }
        .fk-settings-save-preview:hover:not(:disabled) { filter: brightness(1.07) saturate(1.06) !important; box-shadow: 0 14px 30px rgba(0,0,0,.26), 0 0 0 1px color-mix(in srgb, currentColor 8%, transparent) !important; }
        .fk-accent-preset:hover { border-color: var(--preset-color) !important; background: color-mix(in srgb, var(--preset-color) 16%, var(--card-hov)) !important; color: var(--text) !important; box-shadow: 0 10px 22px rgba(0,0,0,.16), 0 0 0 1px color-mix(in srgb, var(--preset-color) 28%, transparent) !important; }
        .fk-color-swatch:hover,
        .fk-native-color:hover { filter: brightness(1.08) saturate(1.05) !important; box-shadow: 0 10px 22px rgba(0,0,0,.18) !important; }
        .fk-hex-input:hover { border-color: var(--border-hover) !important; }
        .fk-hex-input:focus { background: ${ALPHA_COLORS.subtleCard} !important; box-shadow: none !important; }
        .fk-chip:hover:not(:disabled) { filter: brightness(1.14) saturate(1.05) !important; box-shadow: 0 0 0 1px var(--border-hover), inset 0 1px 0 rgba(255,255,255,.06) !important; }
        .fk-hover-subtle:hover { background: var(--card-hov) !important; color: var(--text) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.05) !important; }
        .fk-hover-surface:hover { background: var(--card-hov) !important; color: var(--text) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 0 0 1px var(--border-hover) !important; }
        .fk-hover-border-accent:hover { background: color-mix(in srgb, var(--accent) 12%, var(--card-hov)) !important; border-color: var(--accent) !important; color: var(--text) !important; box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 24%, transparent), inset 0 1px 0 rgba(255,255,255,.06) !important; }
        .fk-hover-text:hover { color: var(--text) !important; }
        .fk-hover-calendar-nav:hover { background: var(--card-hov) !important; color: var(--text) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 0 0 1px var(--border-hover) !important; }
        .fk-hover-calendar-day:hover { background: ${ALPHA_COLORS.subtle} !important; color: var(--text) !important; box-shadow: inset 0 0 0 1px var(--border) !important; }
        .fk-hover-danger-soft:hover { background: ${ALPHA_COLORS.dangerSoft} !important; color: var(--danger) !important; box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.28) !important; }
        .fk-hover-mini-task:hover { background: ${EFFECTS.miniTaskGradientHover} !important; border-color: ${ALPHA_COLORS.borderCardHover} !important; box-shadow: 0 10px 22px rgba(0,0,0,.2) !important; }
        .fk-hover-link { transition: opacity 0.12s ease; }
        .fk-hover-link:hover { text-decoration: underline !important; opacity: 0.78 !important; }

        .fk-analytics-control:hover {
          background: ${ALPHA_COLORS.subtleSurface} !important;
          color: var(--text) !important;
          box-shadow: 0 10px 24px rgba(0,0,0,.14) !important;
        }

        .fk-analytics-option:hover {
          background: ${ALPHA_COLORS.subtle} !important;
          color: var(--text) !important;
          box-shadow: inset 0 0 0 1px var(--border-hover) !important;
        }

        .fk-analytics-primary:hover:not(:disabled) {
          filter: none !important;
          box-shadow: 0 12px 28px rgba(0,0,0,.22) !important;
        }

        .fk-analytics-field:hover,
        .fk-analytics-field:focus {
          background: ${ALPHA_COLORS.subtleCard} !important;
          border-color: ${ALPHA_COLORS.borderCardStrong} !important;
          box-shadow: 0 8px 20px rgba(0,0,0,.14) !important;
        }

        }`;
