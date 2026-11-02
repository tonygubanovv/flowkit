import React, { useMemo, useState } from 'react';
import { AppData } from '../../types/Schemas';
import {
  generateTaskSuggestions,
  getAiSettings,
  TaskSuggestionDraft,
  TaskSuggestionProgress,
} from '../../lib/AiTaskSuggestions';
import { T } from '../../styles/Theme';
import { UI } from '../../styles/Styles';
import { dateStatus, relDate } from '../../lib/Helpers';
import { Btn, Icon } from '../ui/UiExports';
import { CustomDropdown, DateDropdown, wrapDesk, wrapMob } from './Shared';

interface TaskSuggestionModalProps {
  data: AppData;
  activeView: string;
  onAccept: (suggestion: TaskSuggestionDraft) => void;
  onClose: () => void;
  isMobile?: boolean;
}

const getTaskSortDate = (task: AppData['tasks'][number]) =>
  task.statusUpdatedAt || task.completedAt || task.createdAt || '';

export function TaskSuggestionModal({ data, activeView, onAccept, onClose, isMobile }: TaskSuggestionModalProps) {
  const [suggestions, setSuggestions] = useState<TaskSuggestionDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeDateSuggestionId, setActiveDateSuggestionId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [contextMode, setContextMode] = useState<'all' | 'selected'>('all');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [taskProjectFilter, setTaskProjectFilter] = useState<string | null>(null);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string | null>(null);
  const [requestedCount, setRequestedCount] = useState(1);
  const [progress, setProgress] = useState<TaskSuggestionProgress | null>(null);

  const aiSettings = useMemo(() => getAiSettings(data), [data]);

  const projectOptions = useMemo(
    () => data.projects.map((project) => ({ id: project.id, name: project.name, color: project.color })),
    [data.projects],
  );

  const categoryOptions = useMemo(
    () => [{ id: null, name: 'Без метки' }, ...data.categories.map((category) => ({ id: category.id, name: category.name, color: category.color }))],
    [data.categories],
  );

  const taskProjectOptions = useMemo(
    () => [{ id: null, name: 'Все проекты' }, ...data.projects.map((project) => ({ id: project.id, name: project.name, color: project.color }))],
    [data.projects],
  );

  const taskCategoryOptions = useMemo(
    () => [{ id: null, name: 'Все категории' }, ...data.categories.map((category) => ({ id: category.id, name: category.name, color: category.color }))],
    [data.categories],
  );

  const taskOptions = useMemo(
    () =>
      [...data.tasks]
        .sort((left, right) => getTaskSortDate(right).localeCompare(getTaskSortDate(left)))
        .map((task) => {
          const project = data.projects.find((item) => item.id === task.projectId);
          const column = project?.columns.find((item) => item.id === task.columnId);
          const category = data.categories.find((item) => item.id === task.categoryId);
          const isClosed = task.completed || !!column?.isDone;

          return {
            id: String(task.id),
            title: task.title,
            projectId: task.projectId,
            projectName: project?.name || 'Без проекта',
            columnName: column?.name || 'Без статуса',
            categoryId: task.categoryId,
            categoryName: category?.name || 'Без категории',
            categoryColor: category?.color || T.muted,
            isClosed,
            searchText: [
              task.title,
              task.description || '',
              project?.name || '',
              column?.name || '',
              category?.name || '',
            ]
              .join(' ')
              .toLowerCase(),
          };
        })
        .filter((task) => {
          if (taskStatusFilter === 'open' && task.isClosed) return false;
          if (taskStatusFilter === 'closed' && !task.isClosed) return false;
          if (taskProjectFilter && task.projectId !== taskProjectFilter) return false;
          if (taskCategoryFilter !== null && task.categoryId !== taskCategoryFilter) return false;
          if (taskSearch.trim()) {
            return task.searchText.includes(taskSearch.trim().toLowerCase());
          }
          return true;
        })
        .slice(0, 160),
    [data.categories, data.projects, data.tasks, taskCategoryFilter, taskProjectFilter, taskSearch, taskStatusFilter],
  );

  const canGenerate =
    !!aiSettings.apiKey &&
    !!prompt.trim() &&
    (contextMode === 'all' || selectedTaskIds.length > 0) &&
    !isLoading;

  const toggleSelectedTask = (taskId: string) => {
    setSelectedTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  };

  const resetControls = () => {
    setPrompt('');
    setContextMode('all');
    setSelectedTaskIds([]);
    setTaskSearch('');
    setTaskStatusFilter('all');
    setTaskProjectFilter(null);
    setTaskCategoryFilter(null);
    setRequestedCount(1);
  };

  const runGeneration = async (force = false) => {
    if (!prompt.trim()) {
      setError('Заполните поле промпта перед генерацией.');
      return;
    }

    setIsLoading(true);
    setError('');
    setProgress(null);

    try {
      const nextSuggestions = await generateTaskSuggestions({
        data,
        activeView,
        promptOverride: prompt,
        contextTaskIds: contextMode === 'selected' ? selectedTaskIds : null,
        countOverride: requestedCount,
        force,
        onProgress: (nextProgress) => {
          setProgress(nextProgress);
        },
      });

      setSuggestions(nextSuggestions);

      if (nextSuggestions.length === 0) {
        setError('Модель не вернула валидных задач. Попробуйте изменить промпт или контекст и запустить еще раз.');
      }
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Не удалось сгенерировать задачи.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSuggestion = (id: string, patch: Partial<TaskSuggestionDraft>) => {
    setSuggestions((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeSuggestion = (id: string) => {
    setSuggestions((current) => current.filter((item) => item.id !== id));
  };

  const acceptSuggestion = (suggestion: TaskSuggestionDraft) => {
    onAccept(suggestion);
    removeSuggestion(suggestion.id);
  };

  const acceptAll = () => {
    suggestions.forEach(onAccept);
    setSuggestions([]);
  };

  return (
    <div
      style={isMobile ? wrapMob : wrapDesk}
      onMouseDown={!isMobile ? (event) => event.target === event.currentTarget && onClose() : undefined}
    >
      <div style={UI.taskSuggestion.shell(!!isMobile)} onMouseDown={(event) => event.stopPropagation()}>
        <div style={UI.modal.header(true, { padding: isMobile ? '14px 16px 12px' : '18px 24px 14px' })}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.text, fontSize: 18, fontWeight: 850 }}>
              <Icon name="spark" size={18} color={T.accent} />
              <span>AI-задачи</span>
            </div>
          </div>
          <button onClick={onClose} className="fk-modal-close" style={UI.modal.closeButton}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={UI.taskSuggestion.body(!!isMobile)}>
          <div style={UI.taskSuggestion.composerPanel}>
            <div style={UI.taskSuggestion.stack}>
              <div style={UI.taskSuggestion.field}>
                <div style={UI.taskSuggestion.label}>ПРОМПТ</div>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder=""
                  style={UI.control.input(UI.taskSuggestion.promptInput)}
                />
              </div>

              <div style={UI.taskSuggestion.controlGrid(!!isMobile)}>
                <div style={UI.taskSuggestion.field}>
                  <div style={UI.taskSuggestion.label}>КОЛИЧЕСТВО</div>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={requestedCount}
                    onChange={(event) => setRequestedCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))}
                    style={UI.control.input({
                      background: 'rgba(255,255,255,0.035)',
                      height: 36,
                    })}
                  />
                </div>

                <div style={UI.taskSuggestion.field}>
                  <div style={UI.taskSuggestion.label}>КОНТЕКСТ</div>

                  <div style={UI.taskSuggestion.contextToggleRow}>
                    <button
                      type="button"
                      onClick={() => setContextMode('all')}
                      className={contextMode === 'all' ? undefined : 'fk-hover-subtle'}
                      style={UI.taskSuggestion.contextToggle(contextMode === 'all')}
                    >
                      Все задачи
                    </button>
                    <button
                      type="button"
                      onClick={() => setContextMode('selected')}
                      className={contextMode === 'selected' ? undefined : 'fk-hover-subtle'}
                      style={UI.taskSuggestion.contextToggle(contextMode === 'selected')}
                    >
                      Выбранные
                    </button>
                  </div>

                </div>
              </div>

              {contextMode === 'selected' && (
                <div style={UI.taskSuggestion.contextPanel}>
                  <div style={UI.taskSuggestion.searchBox}>
                    <Icon name="search" size={15} color={T.muted} style={UI.taskSuggestion.searchIcon} />
                    <input
                      value={taskSearch}
                      onChange={(event) => setTaskSearch(event.target.value)}
                      placeholder="Поиск по задачам"
                      style={UI.control.input(UI.taskSuggestion.searchField)}
                    />
                  </div>

                  <div style={UI.taskSuggestion.filterDropdownGrid(!!isMobile)}>
                    <CustomDropdown
                      value={taskStatusFilter}
                      options={[
                        { id: 'all', name: 'Все статусы' },
                        { id: 'open', name: 'Только открытые' },
                        { id: 'closed', name: 'Только закрытые' },
                      ]}
                      onChange={(value: 'all' | 'open' | 'closed') => setTaskStatusFilter(value)}
                      placeholder="Статус"
                      icon={<Icon name="check" size={14} color={T.muted} />}
                      minWidth={160}
                      rootStyle={UI.taskSuggestion.filterDropdownCell}
                      buttonStyle={UI.taskSuggestion.filterDropdownButton}
                    />

                    <CustomDropdown
                      value={taskProjectFilter}
                      options={taskProjectOptions}
                      onChange={(value: string | null) => setTaskProjectFilter(value)}
                      placeholder="Проект"
                      icon={<Icon name="folder" size={14} color={T.muted} />}
                      minWidth={160}
                      rootStyle={UI.taskSuggestion.filterDropdownCell}
                      buttonStyle={UI.taskSuggestion.filterDropdownButton}
                    />

                    <CustomDropdown
                      value={taskCategoryFilter}
                      options={taskCategoryOptions}
                      onChange={(value: string | null) => setTaskCategoryFilter(value)}
                      placeholder="Категория"
                      icon={<Icon name="tag" size={14} color={T.muted} />}
                      minWidth={160}
                      rootStyle={UI.taskSuggestion.filterDropdownCell}
                      buttonStyle={UI.taskSuggestion.filterDropdownButton}
                    />
                  </div>

                  <div style={UI.taskSuggestion.filterActions}>
                    <div style={UI.taskSuggestion.toolbarMeta}>
                      <span style={UI.taskSuggestion.taskBadge('muted')}>В списке: {taskOptions.length}</span>
                      <span style={UI.taskSuggestion.taskBadge(selectedTaskIds.length > 0 ? 'accent' : 'muted')}>
                        Выбрано: {selectedTaskIds.length}
                      </span>
                    </div>

                    <div style={UI.taskSuggestion.toolbarActions}>
                      <button
                        type="button"
                        onClick={() => setSelectedTaskIds(taskOptions.map((task) => task.id))}
                        className="fk-hover-subtle"
                        style={UI.taskSuggestion.filterActionButton()}
                      >
                        Выбрать все
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTaskIds([])}
                        className="fk-hover-subtle"
                        style={UI.taskSuggestion.filterActionButton()}
                      >
                        Очистить
                      </button>
                    </div>
                  </div>

                  <div style={UI.taskSuggestion.taskList}>
                    {taskOptions.map((task) => {
                      const isSelected = selectedTaskIds.includes(task.id);

                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => toggleSelectedTask(task.id)}
                          className={isSelected ? undefined : 'fk-hover-subtle'}
                          style={UI.taskSuggestion.taskRow(isSelected)}
                        >
                          <span style={UI.taskSuggestion.taskCheck(isSelected)}>
                            <Icon name="check" size={12} />
                          </span>

                          <span style={UI.taskSuggestion.taskMeta}>
                            <span style={UI.taskSuggestion.taskTitle}>{task.title}</span>
                            <span style={UI.taskSuggestion.taskBadges}>
                              <span style={UI.taskSuggestion.taskBadge('default')}>{task.projectName}</span>
                              <span style={UI.taskSuggestion.taskBadge(task.isClosed ? 'muted' : 'accent')}>
                                {task.isClosed ? 'Закрыта' : task.columnName}
                              </span>
                              {task.categoryId ? (
                                <span style={UI.badge.category(task.categoryColor)}>{task.categoryName}</span>
                              ) : (
                                <span style={UI.taskSuggestion.taskBadge('muted')}>Без категории</span>
                              )}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={UI.taskSuggestion.footerRow}>
                <Btn
                  variant="subtle"
                  onClick={resetControls}
                  style={{ height: 36, padding: '0 14px', whiteSpace: 'nowrap' }}
                >
                  Сбросить
                </Btn>
                <Btn
                  variant="primary"
                  onClick={() => void runGeneration(true)}
                  disabled={!canGenerate}
                  style={{ height: 36, minWidth: 140, padding: '0 16px', whiteSpace: 'nowrap' }}
                >
                  <Icon name="spark" size={14} />
                  {isLoading ? 'Генерация' : 'Сгенерировать'}
                </Btn>
              </div>
            </div>
          </div>

          {!aiSettings.apiKey && (
            <div style={UI.taskSuggestion.statusLine('danger')}>
              <Icon name="warning" size={14} color={T.danger} />
              В настройках не указан API key Neurly.
            </div>
          )}

          {isLoading && progress && (
            <div style={UI.taskSuggestion.statusLine('neutral')}>
              <Icon name="spark" size={14} color={T.accent} />
              <span>{progress.message}</span>
              <span style={UI.taskSuggestion.progressMeta}>{progress.elapsedMs} мс</span>
            </div>
          )}

          {error && (
            <div style={{ ...UI.taskSuggestion.statusLine('danger'), whiteSpace: 'pre-wrap' }}>
              <Icon name="warning" size={14} color={T.danger} />
              <span>{error}</span>
            </div>
          )}

          {suggestions.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="primary" onClick={acceptAll} disabled={suggestions.length === 0 || isLoading}>
                Принять все
              </Btn>
            </div>
          )}

          {suggestions.map((suggestion, index) => {
            const project = data.projects.find((item) => item.id === suggestion.projectId) || data.projects[0];
            const columnOptions = (project?.columns || []).map((column) => ({
              id: column.id,
              name: column.name,
              color: column.color,
            }));
            const suggestionDateLabel = suggestion.deadline
              ? suggestion.time
                ? `${relDate(suggestion.deadline)} · ${suggestion.time}`
                : relDate(suggestion.deadline)
              : 'Срок';
            const suggestionDateStatus = dateStatus(suggestion.deadline, false) || 'future';
            const suggestionDateColor =
              !suggestion.deadline
                ? T.text2
                : ({
                    overdue: T.danger,
                    today: T.warn,
                    future: T.text,
                    done: T.muted,
                  }[suggestionDateStatus] || T.text2);

            return (
              <div key={suggestion.id} style={UI.taskSuggestion.panel(!!isMobile)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                      color: T.accent,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ color: T.text2, fontSize: 12.5 }}>Новая карточка</div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  <input
                    value={suggestion.title}
                    onChange={(event) => updateSuggestion(suggestion.id, { title: event.target.value })}
                    placeholder={'\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a \u0437\u0430\u0434\u0430\u0447\u0438'}
                    style={UI.control.input(UI.taskSuggestion.titleInput)}
                  />

                  <textarea
                    value={suggestion.description}
                    onChange={(event) => updateSuggestion(suggestion.id, { description: event.target.value })}
                    placeholder={'\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435'}
                    style={UI.control.input(UI.taskSuggestion.textArea)}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                    <CustomDropdown
                      value={suggestion.projectId}
                      options={projectOptions}
                      onChange={(projectId: string) => {
                        const nextProject = data.projects.find((item) => item.id === projectId) || data.projects[0];
                        updateSuggestion(suggestion.id, {
                          projectId,
                          columnId: nextProject?.columns[0]?.id || '',
                        });
                      }}
                      placeholder="Проект"
                      icon={<Icon name="folder" size={14} color={T.muted} />}
                    />

                    <CustomDropdown
                      value={suggestion.columnId}
                      options={columnOptions}
                      onChange={(columnId: string) => updateSuggestion(suggestion.id, { columnId })}
                      placeholder="Статус"
                      icon={<Icon name="grid" size={14} color={T.muted} />}
                    />

                    <CustomDropdown
                      value={suggestion.categoryId}
                      options={categoryOptions}
                      onChange={(categoryId: string | null) => updateSuggestion(suggestion.id, { categoryId })}
                      placeholder="Метка"
                      icon={<Icon name="tag" size={14} color={T.muted} />}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '2px 0 4px' }}>
                      <DateDropdown
                        date={suggestion.deadline}
                        time={suggestion.time}
                        onChange={(deadline) => updateSuggestion(suggestion.id, { deadline })}
                        onTimeChange={(time) => updateSuggestion(suggestion.id, { time })}
                        onClear={() => updateSuggestion(suggestion.id, { deadline: null, time: null })}
                        isSmartActive={false}
                        dlLbl={suggestionDateLabel}
                        dlColor={suggestionDateColor}
                        open={activeDateSuggestionId === suggestion.id}
                        onOpenChange={(open) => setActiveDateSuggestionId(open ? suggestion.id : null)}
                      />
                    </div>
                  </div>

                  {suggestion.checklists.length > 0 && (
                    <textarea
                      value={suggestion.checklists.map((item) => item.text).join('\n')}
                      onChange={(event) =>
                        updateSuggestion(suggestion.id, {
                          checklists: event.target.value
                            .split(/\r?\n/)
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((text, itemIndex) => ({
                              id: `${suggestion.id}-check-${itemIndex}`,
                              text,
                              completed: false,
                            })),
                        })
                      }
                      placeholder={'\u0427\u0435\u043a-\u043b\u0438\u0441\u0442, \u043f\u043e \u043e\u0434\u043d\u043e\u043c\u0443 \u043f\u0443\u043d\u043a\u0442\u0443 \u043d\u0430 \u0441\u0442\u0440\u043e\u043a\u0443'}
                      style={UI.control.input(UI.taskSuggestion.textArea)}
                    />
                  )}
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Btn variant="ghost" className="fk-modal-icon-danger" onClick={() => removeSuggestion(suggestion.id)}>
                    <Icon name="x" size={14} />
                    Отклонить
                  </Btn>
                  <Btn variant="primary" onClick={() => acceptSuggestion(suggestion)} disabled={!suggestion.title.trim()}>
                    <Icon name="plus" size={14} />
                    Принять
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
