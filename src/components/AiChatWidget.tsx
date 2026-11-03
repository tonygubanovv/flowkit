import { ChatBackdrop } from './ChatBackdrop';
import { ChatHistoryMenu } from './ChatHistoryMenu';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { generateTaskChatResponse, getAiSettings, TaskChatMessage } from '../lib/AiTaskSuggestions';
import { AiChatSession, AppData, ID, Task } from '../types/Schemas';
import { UI } from '../styles/Styles';
import { AI_CHAT_STYLES as styles } from '../styles/AiChatStyles';
import { Btn, Icon, MarkdownText } from './ui/UiExports';

interface AiChatWidgetProps {
  data: AppData;
  session: AiChatSession;
  onSave: (session: AiChatSession) => void;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  activeView: string;
  onClose: () => void;
  isMobile?: boolean;
}

type ChatItem = TaskChatMessage & {
  id: string;
  pending?: boolean;
};

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;


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

export function AiChatWidget({ data, session, onSave, onSelectSession, onNewSession, activeView, onClose, isMobile }: AiChatWidgetProps) {
  const [messages, setMessages] = useState<ChatItem[]>(session.messages);
  const [draft, setDraft] = useState(session.draft);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextTaskIds, setContextTaskIds] = useState<ID[]>(session.contextTaskIds);
  const [mention, setMention] = useState<MentionState | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const aiSettings = useMemo(() => getAiSettings(data), [data]);

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const snapshot = useRef({ messages, draft, contextTaskIds });
  snapshot.current = { messages, draft, contextTaskIds };
  const [initialSignature] = useState(() => JSON.stringify({ messages: session.messages, draft: session.draft, contextTaskIds: session.contextTaskIds }));
  const lastSaved = useRef(initialSignature);
  const flushRef = useRef(() => {});
  flushRef.current = () => {
    const current = snapshot.current;
    const savedMessages = current.messages.filter((message) => !message.pending).map(({ id, role, content }) => ({ id, role, content }));
    const payload = { messages: savedMessages, draft: current.draft, contextTaskIds: current.contextTaskIds };
    const signature = JSON.stringify(payload);
    if (signature === lastSaved.current) return;
    lastSaved.current = signature;
    const firstQuestion = savedMessages.find((message) => message.role === 'user')?.content;
    onSaveRef.current({
      ...session, ...payload,
      title: firstQuestion ? firstQuestion.replace(/\s+/g, ' ').slice(0, 80)
        : current.draft.trim() ? `Черновик: ${current.draft.trim().replace(/\s+/g, ' ').slice(0, 65)}` : 'Новый разговор',
      updatedAt: new Date().toISOString(),
    });
  };
  useEffect(() => {
    const timer = window.setTimeout(() => flushRef.current(), 700);
    return () => window.clearTimeout(timer);
  }, [messages, draft, contextTaskIds]);
  useEffect(() => { flushRef.current(); }, [messages]);
  useEffect(() => () => flushRef.current(), []);

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
    if (!text || isLoading || !aiSettings.apiKey) return;

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

      if (controller.signal.aborted) return;
      setMessages((current) =>
        current.map((message) =>
          message.id === pendingMessage.id ? { ...message, content: answer, pending: false } : message,
        ),
      );
    } catch (caught) {
      if (controller.signal.aborted) return;
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
      <ChatBackdrop />
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <span style={styles.titleIcon}>
            <Icon name="spark" size={17} />
          </span>
          <div style={styles.titleBody}>
            <ChatHistoryMenu sessions={data.aiChats ?? []} activeId={session.id} title={session.title}
              onSelect={onSelectSession} onNew={onNewSession} />
            <div style={styles.subtitle}>
              {selectedTasks.length > 0 ? `Выбрано задач: ${selectedTasks.length}` : `Задач в контексте: ${data.tasks.length}`}
            </div>
          </div>
        </div>

        <Btn variant="ghost" onClick={onNewSession} title="Новый разговор" style={UI.control.iconButton(false, 30)}>
          <Icon name="plus" size={16} />
        </Btn>
        <Btn variant="ghost" onClick={onClose} title="Закрыть" style={UI.control.iconButton(false, 34)}>
          <Icon name="x" size={18} />
        </Btn>
      </div>

      <div ref={messagesRef} style={styles.messages}>
        {!hasMessages && (
          <div style={styles.empty}>
            <div style={styles.title}>С чего начнём?</div>
            <div>Помогу выбрать главное, найти блокеры и спланировать неделю.</div>
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
          onBlur={() => flushRef.current()}
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
          aria-label="Сообщение AI-помощнику"
          placeholder={aiSettings.apiKey ? 'Спроси по задачам…' : 'Добавь API-ключ Neurly в настройках'}
          disabled={isLoading}
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

        {!aiSettings.apiKey && <div style={styles.status('danger')}>В настройках не указан API-ключ Neurly.</div>}
        {error && <div role="alert" style={styles.status('danger')}>{error}</div>}
        {aiSettings.apiKey && <div style={styles.status()}>Ctrl / ⌘ + Enter — отправить · @ — выбрать задачу</div>}
      </form>
    </section>
  );
}
