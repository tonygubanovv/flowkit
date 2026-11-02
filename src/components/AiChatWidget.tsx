import React, { useEffect, useMemo, useRef, useState } from 'react';
import { generateTaskChatResponse, getAiSettings, TaskChatMessage } from '../lib/AiTaskSuggestions';
import { AppData, ID, Task } from '../types/Schemas';
import { UI, glass } from '../styles/Styles';
import { T } from '../styles/Theme';
import { Btn, Icon, MarkdownText } from './ui/UiExports';

interface AiChatWidgetProps {
  data: AppData;
  activeView: string;
  onClose: () => void;
  isMobile?: boolean;
}

type ChatItem = TaskChatMessage & {
  id: string;
  pending?: boolean;
};

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const styles = {
  shell: (mobile = false): React.CSSProperties => ({
    position: 'fixed',
    right: mobile ? 12 : 24,
    bottom: mobile ? 12 : 24,
    zIndex: 4200,
    width: mobile ? 'calc(100vw - 24px)' : 500,
    height: mobile ? 'min(680px, calc(100vh - 24px))' : 640,
    maxHeight: 'calc(100vh - 32px)',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    overflow: 'hidden',
    borderRadius: 16,
    border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border2))',
    boxShadow: '0 24px 70px rgba(0,0,0,.34)',
    ...glass('F2', 34),
  }),
  header: {
    height: 58,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '0 14px 0 16px',
    borderBottom: '1px solid var(--border2)',
  } as React.CSSProperties,
  titleWrap: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as React.CSSProperties,
  titleIcon: {
    width: 30,
    height: 30,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    borderRadius: 8,
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
  } as React.CSSProperties,
  title: {
    color: T.text,
    fontSize: 14,
    fontWeight: 850,
    lineHeight: 1.1,
    fontFamily: 'inherit',
  } as React.CSSProperties,
  subtitle: {
    marginTop: 3,
    color: T.muted,
    fontSize: 11.5,
    fontWeight: 650,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,
  messages: {
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 14,
    overflowY: 'auto',
  } as React.CSSProperties,
  empty: {
    margin: 'auto 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    color: T.text2,
    fontSize: 13,
    lineHeight: 1.45,
  } as React.CSSProperties,
  exampleGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  } as React.CSSProperties,
  example: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border2)',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.035)',
    color: T.text2,
    fontSize: 12.5,
    fontWeight: 650,
    textAlign: 'left',
    cursor: 'pointer',
  } as React.CSSProperties,
  row: (role: ChatItem['role']): React.CSSProperties => ({
    display: 'flex',
    justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
  }),
  bubble: (role: ChatItem['role'], pending = false): React.CSSProperties => ({
    maxWidth: role === 'user' ? '86%' : '94%',
    padding: role === 'user' ? '10px 12px' : '11px 12px',
    borderRadius: role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
    border: role === 'user' ? '1px solid transparent' : '1px solid var(--border2)',
    background: role === 'user' ? 'var(--accent-fill)' : 'rgba(255,255,255,0.045)',
    color: role === 'user' ? 'var(--accent-text)' : T.text,
    fontSize: 13,
    lineHeight: 1.45,
    opacity: pending ? 0.72 : 1,
    overflowWrap: 'anywhere',
  }),
  composer: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 10,
    padding: 14,
    borderTop: '1px solid var(--border2)',
    background: 'rgba(0,0,0,0.08)',
  } as React.CSSProperties,
  input: {
    minHeight: 42,
    maxHeight: 120,
    resize: 'none',
    lineHeight: 1.35,
  } as React.CSSProperties,
  sendButton: {
    width: 42,
    height: 42,
    padding: 0,
    borderRadius: 8,
  } as React.CSSProperties,
  status: (tone: 'danger' | 'muted' = 'muted'): React.CSSProperties => ({
    gridColumn: '1 / -1',
    marginTop: -2,
    color: tone === 'danger' ? T.danger : T.muted,
    fontSize: 11.5,
    lineHeight: 1.35,
  }),
  mentionMenu: {
    ...UI.modal.dropdownMenu(false, 240, 260),
    left: 14,
    right: 14,
    top: 'auto',
    bottom: 'calc(100% + 6px)',
    minWidth: 0,
  } as React.CSSProperties,
  mentionOption: {
    width: '100%',
    minWidth: 0,
  } as React.CSSProperties,
  mentionTitle: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  mentionProject: {
    marginLeft: 'auto',
    flexShrink: 0,
    color: T.muted,
    fontSize: 11.5,
    fontWeight: 700,
  } as React.CSSProperties,
  contextRow: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  } as React.CSSProperties,
  contextChip: {
    ...UI.taskSuggestion.taskBadge('accent'),
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    maxWidth: 240,
    padding: '5px 6px 5px 10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  contextChipText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  hint: {
    color: T.muted,
    fontSize: 12,
    lineHeight: 1.45,
  } as React.CSSProperties,
};

const EXAMPLES = [
  'Что сейчас самое важное по моим задачам?',
  'Где у меня зависшие задачи и что с ними делать?',
  'Разложи текущую неделю по приоритетам.',
];

const MAX_MENTION_OPTIONS = 30;

interface MentionState {
  query: string;
  start: number;
  end: number;
}

const detectMention = (value: string, cursor: number): MentionState | null => {
  const match = value.slice(0, cursor).match(/(?:^|\s)@([^\s@]*)$/);
  if (!match) return null;
  const query = match[1] ?? '';
  return { query: query.toLowerCase(), start: cursor - query.length - 1, end: cursor };
};

export function AiChatWidget({ data, activeView, onClose, isMobile }: AiChatWidgetProps) {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextTaskIds, setContextTaskIds] = useState<ID[]>([]);
  const [mention, setMention] = useState<MentionState | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const aiSettings = useMemo(() => getAiSettings(data), [data]);

  const projectNameById = useMemo(
    () => new Map(data.projects.map((project) => [project.id, project.name])),
    [data.projects],
  );

  const selectedTasks = useMemo(
    () =>
      contextTaskIds
        .map((id) => data.tasks.find((task) => task.id === id))
        .filter((task): task is Task => !!task),
    [contextTaskIds, data.tasks],
  );

  const mentionOptions = useMemo(() => {
    if (!mention) return [];
    const query = mention.query;
    return data.tasks
      .slice()
      .sort((a, b) => Number(a.completed) - Number(b.completed))
      .filter((task) => {
        if (!query) return true;
        const projectName = projectNameById.get(task.projectId) ?? '';
        return `${task.title} ${projectName}`.toLowerCase().includes(query);
      })
      .slice(0, MAX_MENTION_OPTIONS);
  }, [mention, data.tasks, projectNameById]);

  useEffect(() => { setMentionIdx(0); }, [mention?.query]);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const element = messagesRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [messages, isLoading]);

  const handleDraftChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    const cursor = event.target.selectionStart ?? value.length;
    setDraft(value);
    setMention(detectMention(value, cursor));
  };

  const attachTask = (task: Task) => {
    if (!mention) return;
    const caret = mention.start;
    setDraft(`${draft.slice(0, mention.start)}${draft.slice(mention.end)}`.replace(/ {2,}/g, ' '));
    setContextTaskIds((ids) => (ids.includes(task.id) ? ids : [...ids, task.id]));
    setMention(null);
    window.setTimeout(() => {
      const element = inputRef.current;
      if (!element) return;
      element.focus();
      element.setSelectionRange(caret, caret);
    }, 0);
  };

  const detachTask = (id: ID) => {
    setContextTaskIds((ids) => ids.filter((item) => item !== id));
  };

  const submit = async (textOverride?: string) => {
    const text = (textOverride ?? draft).trim();
    if (!text || isLoading) return;

    const userMessage: ChatItem = { id: makeId(), role: 'user', content: text };
    const pendingMessage: ChatItem = { id: makeId(), role: 'assistant', content: 'Думаю по задачам...', pending: true };
    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage, pendingMessage]);
    setDraft('');
    setMention(null);
    setError('');
    setIsLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const answer = await generateTaskChatResponse({
        data,
        activeView,
        prompt: text,
        history,
        contextTaskIds: selectedTasks.map((task) => task.id),
        signal: controller.signal,
      });

      setMessages((current) =>
        current.map((message) =>
          message.id === pendingMessage.id ? { ...message, content: answer, pending: false } : message,
        ),
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Не удалось получить ответ AI.';
      setMessages((current) => current.filter((item) => item.id !== pendingMessage.id));
      setError(message);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <section style={styles.shell(!!isMobile)} aria-label="AI-чат по задачам">
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <span style={styles.titleIcon}>
            <Icon name="spark" size={17} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={styles.title}>AI-чат</div>
            <div style={styles.subtitle}>
              {selectedTasks.length > 0 ? `Выбрано задач: ${selectedTasks.length}` : `${data.tasks.length} задач в контексте`}
            </div>
          </div>
        </div>

        <Btn variant="ghost" onClick={onClose} title="Закрыть" style={UI.control.iconButton(false, 34)}>
          <Icon name="x" size={18} />
        </Btn>
      </div>

      <div ref={messagesRef} style={styles.messages}>
        {!hasMessages && (
          <div style={styles.empty}>
            <div>Спроси что угодно по текущим задачам, проектам, статусам, срокам и блокерам.</div>
            <div style={styles.exampleGrid}>
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="fk-hover-subtle"
                  style={styles.example}
                  onClick={() => void submit(example)}
                  disabled={isLoading || !aiSettings.apiKey}
                >
                  {example}
                </button>
              ))}
            </div>
            <div style={styles.hint}>Напиши @, чтобы выбрать задачу — вопрос уйдёт в AI только по ней.</div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} style={styles.row(message.role)}>
            <div style={styles.bubble(message.role, message.pending)}>
              {message.role === 'assistant' ? <MarkdownText text={message.content} /> : message.content}
            </div>
          </div>
        ))}
      </div>

      <form
        style={styles.composer}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {selectedTasks.length > 0 && (
          <div style={styles.contextRow}>
            {selectedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => detachTask(task.id)}
                title="Убрать задачу из контекста"
                aria-label={`Убрать задачу «${task.title}» из контекста`}
                style={styles.contextChip}
              >
                <span style={styles.contextChipText}>@ {task.title}</span>
                <Icon name="x" size={12} />
              </button>
            ))}
            <button
              type="button"
              className="fk-hover-subtle"
              onClick={() => setContextTaskIds([])}
              style={UI.taskSuggestion.filterActionButton()}
            >
              Все задачи
            </button>
          </div>
        )}

        <textarea
          ref={inputRef}
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={(event) => {
            if (mention && mentionOptions.length > 0) {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const step = event.key === 'ArrowDown' ? 1 : -1;
                setMentionIdx((current) => (current + step + mentionOptions.length) % mentionOptions.length);
                return;
              }
              if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                attachTask(mentionOptions[Math.min(mentionIdx, mentionOptions.length - 1)]);
                return;
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                setMention(null);
                return;
              }
            }
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={aiSettings.apiKey ? 'Спроси по задачам...' : 'Добавь API key Neurly в настройках'}
          disabled={isLoading || !aiSettings.apiKey}
          style={UI.control.input({ ...styles.input, opacity: aiSettings.apiKey ? 1 : 0.62 })}
        />
        <Btn
          variant="primary"
          disabled={isLoading || !draft.trim() || !aiSettings.apiKey}
          style={styles.sendButton}
          title="Отправить"
        >
          <Icon name="chevR" size={20} />
        </Btn>

        {mention && mentionOptions.length > 0 && (
          <div
            style={styles.mentionMenu}
            role="listbox"
            aria-label="Задачи для контекста"
          >
            <div style={UI.modal.mentionLabel}>Задачи в контекст</div>
            {mentionOptions.map((task, index) => (
              <button
                key={task.id}
                type="button"
                role="option"
                aria-selected={mentionIdx === index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault();
                  attachTask(task);
                }}
                onMouseEnter={() => setMentionIdx(index)}
                style={UI.control.menuItem(mentionIdx === index, styles.mentionOption)}
              >
                <span style={styles.mentionTitle}>{task.title}</span>
                <span style={styles.mentionProject}>{projectNameById.get(task.projectId) ?? ''}</span>
              </button>
            ))}
          </div>
        )}

        {!aiSettings.apiKey && <div style={styles.status('danger')}>В настройках не указан API key Neurly.</div>}
        {error && <div style={styles.status('danger')}>{error}</div>}
      </form>
    </section>
  );
}
