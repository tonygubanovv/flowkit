import React, { useEffect, useRef, useState } from 'react';
import { T } from '../../styles/Theme';
import { UI } from '../../styles/Styles';
import { getFirstDayOfMonth, shiftDate, todayStr } from '../../lib/Helpers';
import { MONTHS, WDAYS } from '../../lib/Constants';
import { ID } from '../../types/Schemas';
import { Icon } from '../ui/UiExports';

export const TIMES = Array.from({length: 48}, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

export const fontFamily = UI.fontFamily;
export const modalSurfaceBg = UI.modal.surfaceBg;
export const modalInnerBg = UI.modal.innerBg;
export const modalHoverBg = UI.modal.hoverBg;
export const wrapDesk: React.CSSProperties = UI.modal.overlay(false);
export const wrapMob: React.CSSProperties = UI.modal.overlay(true);
export const innerDesk: React.CSSProperties = UI.modal.shell(false);
export const noteInnerDesk: React.CSSProperties = UI.modal.noteShell();
export const innerMob: React.CSSProperties = UI.modal.shell(true);

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

// ─── Кастомный Mini Календарь ────────────────────────────────────────────────
interface MiniCalendarProps {
  value?: string | null;
  onChange: (date: string) => void;
}

export function MiniCalendar({ value, onChange }: MiniCalendarProps) {
  const [viewDate, setViewDate] = useState(value ? new Date(value + 'T12:00:00') : new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.deltaY) return;

    event.preventDefault();
    event.deltaY > 0 ? nextMonth() : prevMonth();
  };
  
  return (
    <div style={UI.modal.miniCalendarShell} onWheel={handleWheel}>
       <div style={UI.modal.miniCalendarHeader}>
         <button onClick={prevMonth} className="fk-hover-subtle" style={UI.control.button('ghost', 'sm', false, UI.modal.miniCalendarNavButton)}>
           <Icon name="chevL" size={16} />
         </button>
         <span style={UI.modal.miniCalendarTitle}>{MONTHS[month]} {year}</span>
         <button onClick={nextMonth} className="fk-hover-subtle" style={UI.control.button('ghost', 'sm', false, UI.modal.miniCalendarNavButton)}>
           <Icon name="chevR" size={16} />
         </button>
       </div>
       <div style={UI.modal.miniCalendarWeekGrid}>
         {WDAYS.map(d => <div key={d} style={UI.modal.miniCalendarWeekday}>{d}</div>)}
       </div>
       <div style={UI.modal.miniCalendarGrid}>
         {Array.from({ length: firstDay }).map((_, i) => <div key={`b-${i}`} />)}
         {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = value === dateStr;
            const isToday = todayStr() === dateStr;
            return (
              <button 
                key={d} onClick={() => onChange(dateStr)}
                style={UI.modal.miniCalendarDay(isSelected, isToday)}
                className={isSelected || isToday ? undefined : 'fk-hover-subtle'}
              >{d}</button>
            )
         })}
       </div>
    </div>
  );
}

// ─── Идеальные Чипы-Дропдауны ─────────────────────────────────────────────────
interface DropdownOption {
  id: ID | null;
  name: string;
  color?: string;
  icon?: string;
}

interface CustomDropdownProps {
  value: ID | null;
  options: DropdownOption[];
  onChange: (id: any) => void;
  icon?: React.ReactNode;
  color?: string;
  placeholder: string;
  iconOnly?: boolean;
  alignRight?: boolean;
  minWidth?: number;
  maxHeight?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  rootStyle?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
}

export function CustomDropdown({ value, options, onChange, icon, color, placeholder, iconOnly = false, alignRight, minWidth = 200, maxHeight = 260, open: controlledOpen, onOpenChange, rootStyle, buttonStyle }: CustomDropdownProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const open = controlledOpen ?? localOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) {
      setLocalOpen(next);
    }
    onOpenChange?.(next);
  };
  
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick); 
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options?.find((o) => o.id === value);

  return (
    <div ref={ref} style={{ ...UI.modal.relative, ...rootStyle }}>
      <button 
        onClick={() => setOpen(!open)} 
        style={UI.control.chipButton(open, selected ? T.text : T.text2, {
          ...(iconOnly ? { minWidth: 32, padding: 0 } : {}),
          ...buttonStyle,
        })}
        className={open ? undefined : 'fk-hover-border-accent'}
        title={selected ? selected.name : placeholder}
      >
        {icon && <span style={UI.modal.inlineIcon}>{icon}</span>}
        {selected?.icon ? <Icon name={selected.icon} size={13} color={selected.color || color || T.text2} /> : color ? <span style={UI.modal.dot(color)} /> : null}
        {!iconOnly && (
          <>
            <span style={UI.modal.truncate(140)}>
              {selected ? selected.name : placeholder}
            </span>
            <Icon name="chevD" size={12} color={T.muted} style={UI.modal.dropdownChevron(open)} />
          </>
        )}
      </button>

      {open && (
        <div style={UI.modal.dropdownMenu(alignRight, minWidth, maxHeight)}>
          {options?.map((o) => (
            <button 
              key={o.id} onClick={() => { onChange(o.id); setOpen(false); }}
              style={UI.control.menuItem(value === o.id)}
              className={value !== o.id ? 'fk-hover-subtle' : undefined}
            >
              {o.icon ? <Icon name={o.icon} size={14} color={o.color || T.text2} /> : o.color ? <span style={UI.modal.dot(o.color)} /> : null}
              <span style={UI.modal.truncate()}>{o.name}</span>
            </button>
          ))}
          {placeholder === 'Метка' && (
             <button 
              onClick={() => { onChange(null); setOpen(false); }}
              style={UI.modal.dropdownClearItem(!value)}
              className={value ? 'fk-hover-subtle fk-hover-text' : undefined}
             >
               <Icon name="x" size={14} />
               Без метки
             </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Умный Popover для Срока и Времени ────────────────────────────────────────
interface DateDropdownProps {
  date?: string | null;
  time?: string | null;
  onChange: (d: string) => void;
  onTimeChange: (t: string | null) => void;
  onClear: () => void;
  isSmartActive: boolean;
  dlLbl: string;
  dlColor: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DateDropdown({ date, time, onChange, onTimeChange, onClear, isSmartActive, dlLbl, dlColor, open: controlledOpen, onOpenChange }: DateDropdownProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const open = controlledOpen ?? localOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) {
      setLocalOpen(next);
    }
    onOpenChange?.(next);
  };
  
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick); 
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
return (
    <div ref={ref} style={UI.modal.relative}>
      <button 
        onClick={() => setOpen(!open)} 
        style={UI.control.chipButton(isSmartActive || open, isSmartActive ? T.accent : dlColor)} 
        className={!isSmartActive && !open ? 'fk-hover-border-accent' : undefined}
      >
        <Icon name="calendar" size={13} />
        {dlLbl}
      </button>

      {open && (
        <div style={UI.modal.datePopover}>
          <div style={UI.modal.quickGrid}>
            <button onClick={() => {onChange(shiftDate(0)); setOpen(false);}} className="fk-hover-subtle fk-hover-text" style={UI.control.button('subtle', 'md', false, UI.modal.quickDateButton)}>Сегодня</button>
            <button onClick={() => {onChange(shiftDate(1)); setOpen(false);}} className="fk-hover-subtle fk-hover-text" style={UI.control.button('subtle', 'md', false, UI.modal.quickDateButton)}>Завтра</button>
          </div>
          <MiniCalendar value={date} onChange={(d: string) => { onChange(d); setOpen(false); }} />
          <div style={UI.modal.timeRow}>
            <div style={UI.modal.timeCell}>
              <CustomDropdown 
                value={time || null}
                options={TIMES.map(t => ({ id: t, name: t }))}
                onChange={onTimeChange}
                placeholder="Время"
                minWidth={140}
                maxHeight={200}
                icon={<Icon name="calendar" size={14} color={T.muted} />}
              />
            </div>
            {(date || time) && (
              <button 
                onClick={() => { onClear(); setOpen(false); }} 
                style={UI.modal.clearDateButton()} 
                className="fk-hover-danger-soft"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task Modal ─────────────────────────────────────────────────────────────




