import React, { useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CHART_COLORS, T } from '../styles/Theme';
import { UI } from '../styles/Styles';
import { Category, Project, Task } from '../types/Schemas';
import { Btn, Icon, SI, Sparkline } from '../components/ui/UiExports';
import { MONTHS, WDAYS } from '../lib/Constants';
import { formatRuDate, getFirstDayOfMonth } from '../lib/Helpers';
import {
  FocusGroup,
  GroupBy,
  addDays,
  buildAnalyticsModel,
  getAnalyticsDateRange,
  isoDate,
  normalizeRange,
  parseIsoDate,
} from './analyticsModel';

interface AnalyticsProps {
  tasks: Task[];
  categories: Category[];
  projects: Project[];
  filterProj?: string | null;
}

type SelectOption = {
  val: string;
  lab: string;
};

type RosePoint = FocusGroup & {
  angle: number;
  ratio: number;
  point: { x: number; y: number };
  outerPoint: { x: number; y: number };
  labelPoint: { x: number; y: number };
};

function CustomSelect({
  value,
  options,
  onChange,
  icon,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.val === value) || options[0];

  return (
    <div style={UI.analytics.selectWrap}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fk-analytics-control"
        style={UI.analytics.selectButton(open)}
      >
        {icon && <Icon name={icon} size={14} color={T.muted} />}
        {selected.lab}
        <Icon name={open ? 'chevT' : 'chevD'} size={12} color={T.muted} />
      </button>

      {open && (
        <>
          <div style={UI.analytics.selectBackdrop} onClick={() => setOpen(false)} />

          <div style={UI.analytics.selectMenu}>
            {options.map((option) => {
              const active = option.val === value;

              return (
                <button
                  key={option.val}
                  type="button"
                  onClick={() => {
                    onChange(option.val);
                    setOpen(false);
                  }}
                  className="fk-analytics-option"
                  style={UI.analytics.selectOption(active)}
                >
                  {option.lab}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function RangeCalendar({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
}) {
  const initialDate = parseIsoDate(end || start);
  const [viewDate, setViewDate] = useState(initialDate);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = getFirstDayOfMonth(year, month);
  const today = isoDate(new Date());

  const pick = (date: string) => {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(date);
      setDraftEnd('');
      onChange({ start: date, end: date });
      return;
    }

    const next = normalizeRange(draftStart, date);
    setDraftStart(next.start);
    setDraftEnd(next.end);
    onChange(next);
  };

  const applyPreset = (days: number) => {
    const next = normalizeRange(addDays(today, -(days - 1)), today);
    setDraftStart(next.start);
    setDraftEnd(next.end);
    setViewDate(parseIsoDate(next.end));
    onChange(next);
  };

  const moveMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.deltaY) return;

    event.preventDefault();
    moveMonth(event.deltaY > 0 ? 1 : -1);
  };

  return (
    <div style={UI.analytics.rangePopover} onWheel={handleWheel}>
      <div style={UI.analytics.rangeQuickRow}>
        {[
          { label: '7 дней', days: 7 },
          { label: '14 дней', days: 14 },
          { label: '30 дней', days: 30 },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => applyPreset(item.days)}
            className="fk-hover-subtle fk-hover-text"
            style={UI.control.button('subtle', 'sm', false, UI.analytics.rangeQuickButton)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={UI.modal.miniCalendarHeader}>
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          className="fk-hover-subtle"
          style={UI.control.button('ghost', 'sm', false, UI.modal.miniCalendarNavButton)}
        >
          <Icon name="chevL" size={16} />
        </button>
        <span style={UI.modal.miniCalendarTitle}>{MONTHS[month]} {year}</span>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          className="fk-hover-subtle"
          style={UI.control.button('ghost', 'sm', false, UI.modal.miniCalendarNavButton)}
        >
          <Icon name="chevR" size={16} />
        </button>
      </div>

      <div style={UI.modal.miniCalendarWeekGrid}>
        {WDAYS.map((day) => <div key={day} style={UI.modal.miniCalendarWeekday}>{day}</div>)}
      </div>

      <div style={UI.modal.miniCalendarGrid}>
        {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} />)}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const selectedStart = date === draftStart;
          const selectedEnd = date === draftEnd;
          const inRange = !!draftStart && !!draftEnd && date > draftStart && date < draftEnd;
          const isToday = date === today;

          return (
            <button
              key={date}
              type="button"
              onClick={() => pick(date)}
              className={!selectedStart && !selectedEnd && !inRange ? 'fk-hover-subtle' : undefined}
              style={UI.analytics.rangeCalendarDay(selectedStart, selectedEnd, inRange, isToday)}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div style={UI.analytics.rangeFooter}>
        <span>{formatRuDate(draftStart)}</span>
        <span>—</span>
        <span>{formatRuDate(draftEnd || draftStart)}</span>
      </div>
    </div>
  );
}

function DateRangeSelect({
  mode,
  range,
  onModeChange,
  onRangeChange,
}: {
  mode: string;
  range: { start: string; end: string };
  onModeChange: (mode: string) => void;
  onRangeChange: (range: { start: string; end: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = mode === 'custom'
    ? `${formatRuDate(range.start)} — ${formatRuDate(range.end)}`
    : ({ '7': '7 дней', '14': '14 дней', '30': '30 дней', '90': '90 дней' } as Record<string, string>)[mode] || 'Период';

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectPreset = (nextMode: string) => {
    onModeChange(nextMode);
    if (nextMode !== 'custom') setOpen(false);
  };

  return (
    <div ref={ref} style={UI.analytics.rangeSelectWrap}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fk-analytics-control"
        style={UI.analytics.selectButton(open)}
      >
        <Icon name="calendar" size={14} color={T.muted} />
        {label}
        <Icon name={open ? 'chevT' : 'chevD'} size={12} color={T.muted} />
      </button>

      {open && (
        <div style={UI.analytics.rangeMenu}>
          <div style={UI.analytics.rangePresetGrid}>
            {[
              { val: '7', lab: '7 дней' },
              { val: '14', lab: '14 дней' },
              { val: '30', lab: '30 дней' },
              { val: '90', lab: '90 дней' },
              { val: 'custom', lab: 'Свой диапазон' },
            ].map((option) => (
              <button
                key={option.val}
                type="button"
                onClick={() => selectPreset(option.val)}
                className="fk-analytics-option"
                style={UI.analytics.selectOption(mode === option.val)}
              >
                {option.lab}
              </button>
            ))}
          </div>

          {mode === 'custom' && (
            <RangeCalendar start={range.start} end={range.end} onChange={onRangeChange} />
          )}
        </div>
      )}
    </div>
  );
}

function AnalyticsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div style={UI.analytics.tooltip}>
      {label && (
        <div style={UI.analytics.tooltipLabel}>
          {label}
        </div>
      )}

      <div style={UI.analytics.tooltipRows}>
        {payload.map((entry: any, index: number) => {
          const color = entry.color || entry.payload?.fill || T.accent;

          return (
            <div key={`${entry.name}-${index}`} style={UI.analytics.tooltipRow}>
              <div style={UI.analytics.tooltipName}>
                <span style={UI.analytics.colorDot(color)} />
                {entry.name}
              </div>

              <div style={UI.analytics.tooltipValue}>{entry.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const polarPoint = (cx: number, cy: number, radius: number, angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
};

const formatRoseLabel = (name: string, compact: boolean) => {
  const limit = compact ? 12 : 16;
  return name.length > limit ? `${name.slice(0, limit - 1)}…` : name;
};

function FocusRose({ items }: { items: FocusGroup[] }) {
  const manyItems = items.length > 8;
  const width = manyItems ? 480 : 400;
  const height = manyItems ? 420 : 360;
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = manyItems ? 132 : 112;
  const labelRadius = manyItems ? 188 : 156;
  const minRadius = 14;
  const slice = 360 / Math.max(items.length, 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!items.length) {
    return (
      <div style={UI.analytics.emptyState}>
        За выбранный период активности пока нет.
      </div>
    );
  }

  const maxDone = Math.max(...items.map((item) => item.done), 1);
  const growthReserve = Math.min(5, Math.max(3, Math.ceil(maxDone * 0.35)));
  const roseCapacity = maxDone + growthReserve;

  const points: RosePoint[] = items.map((item, index) => {
    const ratio = item.done > 0 ? item.done / roseCapacity : 0;
    const radius = minRadius + ratio * (outerRadius - minRadius);
    const angle = index * slice;

    return {
      ...item,
      angle,
      ratio,
      point: polarPoint(cx, cy, radius, angle),
      outerPoint: polarPoint(cx, cy, outerRadius, angle),
      labelPoint: polarPoint(cx, cy, labelRadius, angle),
    };
  });

  const valuePoints = points.map(({ point }) => `${point.x},${point.y}`).join(' ');
  return (
    <div style={UI.analytics.focusRoseWrap}>
      <div style={UI.analytics.focusRoseStage(width, height)}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Каркасная роза фокуса" style={UI.analytics.focusRoseSvg}>
          <polygon
            points={points.map(({ outerPoint }) => `${outerPoint.x},${outerPoint.y}`).join(' ')}
            fill="rgba(0,0,0,0.16)"
            stroke={T.border2}
            strokeOpacity="0.52"
            strokeWidth="1.25"
          />

          {[0.25, 0.5, 0.75, 1].map((step) => {
            const ringPoints = points
              .map((item) => {
                const point = polarPoint(cx, cy, outerRadius * step, item.angle);
                return `${point.x},${point.y}`;
              })
              .join(' ');

            return (
              <polygon
                key={step}
                points={ringPoints}
                fill={step === 0.25 ? 'rgba(255,255,255,0.018)' : 'none'}
                stroke={T.border2}
                strokeOpacity={step === 1 ? 0.5 : 0.3}
                strokeWidth={step === 1 ? 1.25 : 1}
              />
            );
          })}

          {points.map((item) => (
            <line
              key={`web-${item.name}`}
              x1={cx}
              y1={cy}
              x2={item.outerPoint.x}
              y2={item.outerPoint.y}
              stroke={T.border2}
              strokeOpacity="0.34"
              strokeWidth="1"
            />
          ))}

          {points.length > 2 ? (
            <>
              <polygon
                points={valuePoints}
                fill="rgba(0,0,0,0.22)"
                stroke={T.border2}
                strokeOpacity="0.72"
                strokeWidth="1"
                strokeLinejoin="miter"
              />
              <polygon
                points={valuePoints}
                fill="var(--accent)"
                fillOpacity="0.1"
                stroke="var(--accent)"
                strokeOpacity="0.95"
                strokeWidth="2.2"
                strokeLinejoin="miter"
              />
            </>
          ) : (
            points.map((item) => (
              <line
                key={`value-${item.name}`}
                x1={cx}
                y1={cy}
                x2={item.point.x}
                y2={item.point.y}
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="butt"
              />
            ))
          )}

          {points.map((item, index) => (
            <g
              key={item.name}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              tabIndex={0}
              style={{ cursor: 'default' }}
            >
              <line
                x1={cx}
                y1={cy}
                x2={item.labelPoint.x}
                y2={item.labelPoint.y}
                stroke="rgba(255,255,255,0.001)"
                strokeWidth={manyItems ? 28 : 34}
                strokeLinecap="round"
                pointerEvents="stroke"
              />
              <circle
                cx={item.point.x}
                cy={item.point.y}
                r={manyItems ? 16 : 20}
                fill="rgba(255,255,255,0.001)"
              />
              <circle
                cx={item.outerPoint.x}
                cy={item.outerPoint.y}
                r={manyItems ? 18 : 22}
                fill="rgba(255,255,255,0.001)"
              />
              <circle
                cx={item.point.x}
                cy={item.point.y}
                r={hoveredIndex === index ? 5 : 3.5}
                fill={T.bg}
                stroke="var(--accent)"
                strokeWidth={hoveredIndex === index ? 3 : 2}
              />
              <text
                x={item.labelPoint.x}
                y={item.labelPoint.y}
                textAnchor={item.labelPoint.x > cx + 12 ? 'start' : item.labelPoint.x < cx - 12 ? 'end' : 'middle'}
                dominantBaseline="middle"
                fill="none"
                stroke={T.bg}
                strokeWidth="5"
                strokeLinejoin="round"
                fontSize={manyItems ? 10 : 11}
                fontWeight="850"
              >
                {formatRoseLabel(item.name, manyItems)}
              </text>
              <text
                x={item.labelPoint.x}
                y={item.labelPoint.y}
                textAnchor={item.labelPoint.x > cx + 12 ? 'start' : item.labelPoint.x < cx - 12 ? 'end' : 'middle'}
                dominantBaseline="middle"
                fill={hoveredIndex === index ? 'var(--accent)' : T.text2}
                fontSize={manyItems ? 10 : 11}
                fontWeight="800"
              >
                {formatRoseLabel(item.name, manyItems)}
              </text>
            </g>
          ))}

          <circle cx={cx} cy={cy} r="7" fill={T.bg} stroke={T.border2} strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="3" fill="var(--accent)" />
        </svg>
      </div>
    </div>
  );
}

export function AnalyticsView({ tasks, categories, projects, filterProj }: AnalyticsProps) {
  const [periodMode, setPeriodMode] = useState('7');
  const [customRange, setCustomRange] = useState(() => {
    const end = isoDate(new Date());
    return { start: addDays(end, -6), end };
  });
  const [groupBy, setGroupBy] = useState<GroupBy>('category');

  const tableRef = useRef<HTMLTableElement>(null);

  const [copied, setCopied] = useState(false);
  const [plansText, setPlansText] = useState('');
  const [notesText, setNotesText] = useState('');

  const dateRange = useMemo(() => getAnalyticsDateRange(periodMode, customRange), [periodMode, customRange]);

  const {
    kpi,
    timelineData,
    roseData,
    yearlyActivity,
    reportWeeks,
  } = useMemo(() => buildAnalyticsModel({
    tasks,
    categories,
    projects,
    filterProj,
    groupBy,
    dateRange,
    uncategorizedColor: T.muted,
  }), [tasks, categories, projects, filterProj, groupBy, dateRange]);

  const copyTableToClipboard = () => {
    if (!tableRef.current) return;

    const clone = tableRef.current.cloneNode(true) as HTMLTableElement;
    const html = clone.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });

    navigator.clipboard.write([new window.ClipboardItem({ 'text/html': blob })]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const activeProjectName =
    filterProj && filterProj !== 'all' ? projects.find((project) => project.id === filterProj)?.name : null;
  const periodLabel = periodMode === 'custom'
    ? `${formatRuDate(dateRange.start)} — ${formatRuDate(dateRange.end)}`
    : ({ '7': 'За 7 дней', '14': 'За 14 дней', '30': 'За 30 дней', '90': 'За 90 дней' } as Record<string, string>)[periodMode] || 'Период';
  const dailyDone = timelineData.map((day) => day.done);
  const dailyCreated = timelineData.map((day) => day.created);
  const dailyNet = timelineData.map((day) => day.done - day.created);
  const cumulativeDone = timelineData.reduce<number[]>((acc, day) => {
    acc.push((acc.length ? acc[acc.length - 1] : 0) + day.done);

    return acc;
  }, []);

  const overviewCards = [
    {
      label: 'Готово',
      value: `${kpi.rate}%`,
      note: `${kpi.done} закрыто из ${kpi.done + kpi.process}`,
      series: cumulativeDone,
      color: CHART_COLORS.blue,
      tone: null as 'up' | 'down' | null,
    },
    {
      label: 'Закрыто',
      value: String(kpi.done),
      note: periodLabel.toLowerCase(),
      series: dailyDone,
      color: CHART_COLORS.teal,
      tone: null,
    },
    {
      label: 'Открыто',
      value: String(kpi.openNow),
      note: kpi.overdue > 0 ? `${kpi.overdue} просрочено` : 'без просрочки',
      series: dailyCreated,
      color: CHART_COLORS.amber,
      tone: kpi.overdue > 0 ? ('down' as const) : null,
    },
    {
      label: 'Темп',
      value: kpi.throughputDelta >= 0 ? `+${kpi.throughputDelta}` : String(kpi.throughputDelta),
      note: `закрыто ${kpi.done}, добавлено ${kpi.created}`,
      series: dailyNet,
      color: CHART_COLORS.pink,
      tone: null,
    },
  ];
  const compactActivity = yearlyActivity.days.length <= 45;

  const cardStyle = UI.analytics.card;

  return (
    <div style={UI.analytics.shell}>
      <div style={UI.analytics.header}>
        <div style={UI.analytics.summaryIntro}>
          <div style={UI.analytics.summaryEyebrow}>
            {activeProjectName ? activeProjectName : 'Все проекты'}
          </div>

          <div style={UI.analytics.summaryTitle}>
            {periodLabel}
          </div>
        </div>

        <div style={UI.analytics.toolbar}>
          <CustomSelect
            value={groupBy}
            onChange={(value) => setGroupBy(value as GroupBy)}
            options={[
              { val: 'category', lab: 'По категориям' },
              { val: 'project', lab: 'По проектам' },
            ]}
            icon="list"
          />

          <DateRangeSelect
            mode={periodMode}
            range={dateRange}
            onModeChange={setPeriodMode}
            onRangeChange={(range) => {
              setCustomRange(normalizeRange(range.start, range.end));
              setPeriodMode('custom');
            }}
          />
        </div>
      </div>

      <div style={UI.analytics.overviewGrid}>
        {overviewCards.map((item) => (
          <div key={item.label} style={UI.compose(cardStyle, UI.analytics.insightCard)}>
            <div style={UI.analytics.insightLabel}>{item.label}</div>

            <div
              style={
                item.tone
                  ? UI.compose(UI.analytics.insightValue, UI.analytics.insightDelta(item.tone === 'up'))
                  : UI.analytics.insightValue
              }
            >
              {item.value}
            </div>

            <div style={UI.analytics.insightFoot}>
              <div
                style={
                  item.tone === 'down'
                    ? UI.analytics.insightDelta(false)
                    : UI.analytics.insightNote
                }
              >
                {item.note}
              </div>

              <Sparkline points={item.series} color={item.color} width={84} height={24} />
            </div>
          </div>
        ))}
      </div>

      <div style={UI.analytics.chartGridMain}>
        <div style={UI.analytics.panel}>
          <div style={UI.analytics.panelHead}>
            <div style={UI.analytics.panelTitle}>Динамика задач</div>

            <div style={UI.analytics.legend}>
              <span style={UI.analytics.legendItem}>
                <span style={UI.analytics.colorDot(CHART_COLORS.blue)} />
                Закрыто
                <span style={UI.analytics.legendValue}>{kpi.done}</span>
              </span>

              <span style={UI.analytics.legendItem}>
                <span style={UI.analytics.colorDot(CHART_COLORS.amber)} />
                Новые
                <span style={UI.analytics.legendValue}>{kpi.created}</span>
              </span>
            </div>
          </div>

          <div style={UI.analytics.panelBody({ padding: '12px 10px 12px 12px' })}>
            <div style={UI.analytics.chartTall}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsDoneGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.26} />
                    <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke={T.border2} vertical={false} />
                <XAxis dataKey="name" stroke={T.text2} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke={T.text2} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<AnalyticsTooltip />} />

                <Area
                  name="Закрыто"
                  type="monotone"
                  dataKey="done"
                  stroke={CHART_COLORS.blue}
                  strokeWidth={2.5}
                  fill="url(#analyticsDoneGradient)"
                  activeDot={{
                    r: 5,
                    fill: CHART_COLORS.blue,
                    stroke: T.bg,
                    strokeWidth: 2,
                  }}
                />

                <Area
                  name="Новые"
                  type="monotone"
                  dataKey="created"
                  stroke={CHART_COLORS.amber}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={UI.analytics.panel}>
          <div style={UI.analytics.panelHead}>
            <div style={UI.analytics.panelTitle}>
              {groupBy === 'category' ? 'Фокус по категориям' : 'Фокус по проектам'}
            </div>
          </div>

          <div style={UI.analytics.panelBody()}>
            <FocusRose items={roseData} />
          </div>
        </div>
      </div>

      <div style={UI.analytics.panel}>
        <div style={UI.analytics.panelHead}>
          <div>
            <div style={UI.analytics.panelTitle}>Активность за период</div>
            <div style={UI.analytics.panelSub}>
              Создание и закрытие задач: {yearlyActivity.total} действий, {yearlyActivity.activeDays} активных дней
            </div>
          </div>

          <div style={UI.analytics.yearLegend}>
            <span>Меньше</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span key={level} style={UI.analytics.yearLegendCell(level)} />
            ))}
            <span>Больше</span>
          </div>
        </div>

        <div style={UI.analytics.panelBody({ gap: 0 })}>
        {compactActivity ? (
          <div style={UI.analytics.activityDaysGrid(yearlyActivity.days.length)}>
            {yearlyActivity.days.map((day) => (
              <div
                key={day.key}
                title={day.label}
                aria-label={day.label}
                style={UI.analytics.activityDay(day.level, day.count > 0)}
              >
                <span style={UI.analytics.activityDayWeekday}>{day.weekday}</span>
                <span style={UI.analytics.activityDayCell(day.level)} />
                <span style={UI.analytics.activityDayDate}>{day.day}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={UI.analytics.yearScroll}>
          <div style={UI.analytics.yearHeatmap(yearlyActivity.weeks.length)}>
          <div style={UI.analytics.yearMonths(yearlyActivity.weeks.length)}>
            <span />
            {yearlyActivity.weeks.map((week) => (
              <span key={week.key}>{week.month}</span>
            ))}
          </div>

          <div style={UI.analytics.yearBody(yearlyActivity.weeks.length)}>
            <div style={UI.analytics.yearWeekdays}>
              <span>Пн</span>
              <span />
              <span>Ср</span>
              <span />
              <span>Пт</span>
              <span />
              <span />
            </div>

            <div style={UI.analytics.yearGrid(yearlyActivity.weeks.length)}>
              {yearlyActivity.weeks.map((week) => (
                <div key={week.key} style={UI.analytics.yearWeek}>
                  {week.days.map((day) => (
                    <span
                      key={day.key}
                      title={day.label}
                      aria-label={day.label}
                      style={UI.analytics.yearCell(day.level, day.future)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          </div>
          </div>
        )}
        </div>
      </div>

      <div style={UI.analytics.panel}>
        <div style={UI.analytics.panelHead}>
          <div>
            <div style={UI.analytics.panelTitle}>Отчет для статуса</div>
            <div style={UI.analytics.panelSub}>
              Короткая версия, которую можно отправить дальше
            </div>
          </div>

          <Btn variant="primary" onClick={copyTableToClipboard} style={UI.analytics.copyButton} className="fk-analytics-primary">
            <Icon name={copied ? 'check' : 'copy'} size={18} />
            {copied ? 'Готово!' : 'Копировать таблицу'}
          </Btn>
        </div>

        <div style={UI.analytics.panelBody({ gap: 18 })}>
        <div style={UI.analytics.reportInputs}>
          <textarea
            value={plansText}
            onChange={(event) => setPlansText(event.target.value)}
            className="fk-analytics-field"
            style={SI(UI.analytics.reportTextarea)}
            placeholder="Планы: что делаем дальше, на чем держим фокус"
          />

          <textarea
            value={notesText}
            onChange={(event) => setNotesText(event.target.value)}
            className="fk-analytics-field"
            style={SI(UI.analytics.reportTextarea)}
            placeholder="Комментарий: риски, блокеры, следующий шаг"
          />
        </div>

        <div style={UI.analytics.tableShell}>
          <table
            ref={tableRef}
            style={UI.analytics.table}
          >
            <thead>
              <tr style={UI.analytics.tableHeadRow}>
                <th style={UI.analytics.tableCell}>Спринт</th>
                <th style={UI.analytics.tableCell}>Статус</th>
                <th style={UI.analytics.tableCell}>Планы</th>
                <th style={UI.analytics.tableCell}>Комментарий</th>
              </tr>
            </thead>

            <tbody>
              {reportWeeks.map((week, index) => (
                <tr key={week.key}>
                  <td style={UI.analytics.tableCell}>
                    {week.label}
                    {index === 0 && <div style={UI.analytics.tableHint}>{periodLabel}</div>}
                  </td>

                  <td style={UI.analytics.tableCell}>
                    <ul style={UI.analytics.tableList}>
                      {week.tasks.map((task) => (
                        <li key={task.id} style={UI.analytics.tableMuted}>
                          {task.title}
                        </li>
                      ))}
                      {!week.tasks.length && <li style={UI.analytics.tableMuted}>Закрытых задач за неделю нет</li>}
                    </ul>
                  </td>

                  <td style={UI.analytics.tableCell}>
                    {index === 0
                      ? (plansText || <span style={UI.analytics.tableMuted}>Вы заполняете планы вручную</span>)
                      : <span style={UI.analytics.tableMuted}>—</span>}
                  </td>

                  <td style={UI.analytics.tableCell}>
                    {index === 0
                      ? (notesText || <span style={UI.analytics.tableMuted}>Вы заполняете комментарий вручную</span>)
                      : <span style={UI.analytics.tableMuted}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}


