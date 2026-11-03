import React, { useEffect, useRef, useState } from 'react';

import { T } from '../styles/Theme';
import { UI } from '../styles/Styles';
import { Category } from '../types/Schemas';
import { getTaskPriorityMeta, TASK_PRIORITY_OPTIONS } from '../lib/TaskPriority';
import { TaskSortBy } from '../lib/TaskFilters';
import { Icon } from './ui/UiExports';

export interface FilterState {
  categoryId: string | null;
  priority: 'high' | 'standard' | 'low' | null;
  sortBy: TaskSortBy;
}

export const defaultFilters: FilterState = { categoryId: null, priority: null, sortBy: 'default' };

const sortOptions: Array<{ id: FilterState['sortBy']; label: string }> = [
  { id: 'default', label: 'По умолчанию' },
  { id: 'created', label: 'По дате создания' },
  { id: 'deadline', label: 'По дедлайну' },
  { id: 'priority', label: 'По приоритету' },
  { id: 'category', label: 'По категориям' },
];

export function FilterMenu({
  filters,
  onChange,
  categories,
  onApplySort,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  categories: Category[];
  onApplySort?: (() => void) | null;
}) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setShow(false);
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const activeCount = (filters.categoryId ? 1 : 0) + (filters.priority ? 1 : 0) + (filters.sortBy !== 'default' ? 1 : 0);

  return (
    <div ref={ref} style={UI.filter.wrap}>
      <button
        type="button"
        aria-label="Фильтры задач"
        aria-expanded={show}
        onClick={() => setShow(!show)}
        className="fk-hover-subtle fk-hover-border-accent"
        style={UI.app.headerIconButton(show)}
      >
        <Icon name="filter" size={20} />
        {activeCount > 0 && (
          <span
            style={UI.filter.counter}
          >
            {activeCount}
          </span>
        )}
      </button>

      {show && (
        <div
          style={UI.modal.popover(UI.filter.popover)}
        >
          <div>
            <div style={UI.filter.label}>Сортировка</div>
            <div style={UI.filter.sortList}>
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => set('sortBy', option.id)}
                  style={UI.filter.sortItem(filters.sortBy === option.id)}
                >
                  {filters.sortBy === option.id && (
                    <span style={UI.filter.activeDot()} />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {onApplySort && filters.sortBy !== 'default' && (
            <button
              type="button"
              onClick={() => {
                onApplySort();
                setShow(false);
              }}
              style={UI.filter.resetButton()}
            >
              Применить сортировку
            </button>
          )}

          <div>
            <div style={UI.filter.label}>Важность</div>
            <div style={UI.filter.categoryList}>
              <button type="button" className="fk-chip" onClick={() => set('priority', null)} style={UI.filter.chip(!filters.priority)}>
                Все
              </button>
              {TASK_PRIORITY_OPTIONS.map((priority) => {
                const meta = getTaskPriorityMeta(priority.id);
                const isActive = filters.priority === priority.id;

                return (
                  <button
                    key={priority.id}
                    type="button"
                    className="fk-chip"
                    onClick={() => set('priority', priority.id)}
                    style={UI.compose(
                      UI.filter.chip(isActive),
                      isActive
                        ? {
                            background: meta.activeBg,
                            border: `1px solid ${meta.activeBorder}`,
                            color: meta.activeText,
                          }
                        : null,
                    )}
                  >
                    {priority.icon ? <Icon name={priority.icon} size={13} color={isActive ? meta.activeText : (priority.iconColor || priority.color)} /> : null}
                    {priority.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={UI.filter.label}>Категории</div>
            <div style={UI.filter.categoryList}>
              <button type="button" className="fk-chip" onClick={() => set('categoryId', null)} style={UI.filter.chip(!filters.categoryId)}>
                Все
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="fk-chip"
                  onClick={() => set('categoryId', category.id)}
                  style={UI.filter.chip(filters.categoryId === category.id, category.color)}
                >
                  {filters.categoryId !== category.id && (
                    <span style={UI.filter.activeDot(category.color)} />
                  )}
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onChange(defaultFilters)}
              style={UI.filter.resetButton()}
            >
              Сбросить
            </button>
          )}
        </div>
      )}
    </div>
  );
}


