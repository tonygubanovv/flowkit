import { isDoneTask } from '../../lib/TaskDomain';
﻿import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { T } from '../../styles/Theme';
import { UI } from '../../styles/Styles';
import { genId, relDate, dateStatus, extractSmartDate, buildHK, formatHK, formatRuDateTime } from '../../lib/Helpers';
import { PALETTE, AVATAR_EMOJIS } from '../../lib/Constants';
import { typographize } from '../../lib/Typograf';
import { DEFAULT_TASK_PRIORITY, getTaskPriorityIcon, normalizeTaskPriority, TASK_PRIORITY_OPTIONS } from '../../lib/TaskPriority';
import {
  generateTaskCompletionSuggestion,
  generateTaskRewriteSuggestion,
  generateTaskSuggestions,
  getAiSettings,
  TaskCompletionSuggestionDraft,
  TaskRewriteSuggestionDraft,
  TaskSuggestionDraft,
} from '../../lib/AiTaskSuggestions';
import { Task, Project, Category, Comment, Note, Column, Hotkeys, ID, Profile, TaskHistoryEvent, ChecklistItem, AppData, TaskLinkType } from '../../types/Schemas';
import { getTaskLinkLabel, TASK_LINK_OPTIONS } from '../../lib/TaskLinks';
import { Btn, Icon, ColorPick, Toggle, CatBadge, Check, DateBadge } from '../ui/UiExports';
import { RichEditor } from '../RichEditor';
import { CustomDropdown, DateDropdown, fontFamily, innerDesk, innerMob, modalHoverBg, modalInnerBg, noteInnerDesk, wrapDesk, wrapMob } from './Shared';
import { isCommentBlank, sanitizeCommentHtml } from './commentHtml';
interface TaskModalProps {
  task: Task;
  isNew: boolean;
  data: AppData;
  activeView: string;
  projects: Project[];
  categories: Category[];
  onSave: (t: Task) => void;
  onComplete?: (t: Task) => void;
  onDelete: (id: ID) => void;
  onCreateSuggestion?: (suggestion: TaskSuggestionDraft) => void;
  onDuplicate?: (() => void) | null;
  onOpenLinkedTask?: (taskId: ID, currentTask: Task) => void;
  onClose: () => void;
  isMobile?: boolean;
}

const historyIcon: Record<string, string> = {
  created: 'plus',
  updated: 'edit',
  moved: 'grid',
  deadline_changed: 'calendar',
  completed: 'check',
  reopened: 'undo',
  comment_added: 'message',
  comment_removed: 'message',
  deleted: 'trash',
  reordered: 'sort',
  project_changed: 'folder',
  category_changed: 'tag',
};

const formatHistoryDate = (value: string) => {
  return formatRuDateTime(value);
};

const formatHistoryValue = (value?: string | null) => {
  if (!value) return '';

  return value.replace(/\b(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}:\d{2}))?\b/g, (_match, year, month, day, time) => {
    const formatted = `${day}.${month}.${year}`;
    return time ? `${formatted} ${time}` : formatted;
  });
};

const dayDiffFromNow = (value?: string | null) => {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 864e5));
};

const countHistory = (events: TaskHistoryEvent[], type: string) => events.filter((event) => event.type === type).length;
const COMMENT_COLLAPSE_TEXT_LIMIT = 520;
const COMMENT_COLLAPSE_HTML_LIMIT = 1200;

const getCommentPlainText = (html: string) => {
  if (typeof document !== 'undefined') {
    const element = document.createElement('div');
    element.innerHTML = sanitizeCommentHtml(html);
    return element.textContent || '';
  }

  return html.replace(/<[^>]*>/g, ' ');
};

const shouldCollapseComment = (html: string) => {
  const plainText = getCommentPlainText(html).replace(/\s+/g, ' ').trim();
  const hasLargeMedia = /<img\b/i.test(html);
  const lineBreaks = (html.match(/<(p|li|br|ul|ol)\b/gi) || []).length;

  return plainText.length > COMMENT_COLLAPSE_TEXT_LIMIT || html.length > COMMENT_COLLAPSE_HTML_LIMIT || lineBreaks > 10 || hasLargeMedia;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const textToHtml = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, '<br>')}</p>`)
    .join('');

function CommentEditor({
  content,
  onChange,
  onSubmit,
}: {
  content: string;
  onChange: (html: string) => void;
  onSubmit: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File, editorInstance: Editor) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      editorInstance.chain().focus().setImage({ src: reader.result as string, alt: file.name }).run();
    };
    reader.readAsDataURL(file);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Underline,
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: 'Написать комментарий...' }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          onSubmit();
          return true;
        }

        return false;
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        const link = target.closest('a');
        if (!link) return false;

        if (event.ctrlKey || event.metaKey) {
          window.open(link.href, '_blank');
          return true;
        }

        event.preventDefault();
        return false;
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file && editor) {
              handleImageUpload(file, editor);
              event.preventDefault();
              return true;
            }
          }
        }

        const rawText = event.clipboardData?.getData('text/plain');
        const html = event.clipboardData?.getData('text/html');

        if (html && (html.includes('<a ') || html.includes('<p') || html.includes('<li') || html.includes('<ul') || html.includes('<ol'))) {
          return false;
        }

        if (!rawText || !editor) return false;

        let processed = rawText.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');

        processed = processed.replace(
          /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
          '<a href="$2">$1</a>',
        );
        processed = processed.replace(
          /([^.,;!?\n(]{1,100}?)\s*\((https?:\/\/[^\s)]+)\)/g,
          (_match, p1, p2) => `<a href="${p2}">${p1.trim()}</a>`,
        );

        const parts = processed.split(/(<a\b[^>]*>.*?<\/a>)/gi);
        for (let i = 0; i < parts.length; i++) {
          if (!parts[i].toLowerCase().startsWith('<a')) {
            parts[i] = parts[i].replace(/(https?:\/\/[^\s<>()]+)/g, '<a href="$1">$1</a>');
          }
        }
        processed = parts.join('');

        const htmlStr = processed
          .split(/\r?\n/)
          .map((line) => {
            const trimmed = line.trim();
            if (/^[-*]\s+/.test(trimmed)) {
              return `<ul><li>${trimmed.replace(/^[-*]\s+/, '')}</li></ul>`;
            }
            if (/^\d+\.\s+/.test(trimmed)) {
              return `<ol><li>${trimmed.replace(/^\d+\.\s+/, '')}</li></ol>`;
            }
            return trimmed ? `<p>${trimmed}</p>` : '<p><br></p>';
          })
          .join('');

        event.preventDefault();
        setTimeout(() => editor.commands.insertContent(htmlStr), 0);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const image = files.find((file) => file.type.startsWith('image/'));
        if (!image || !editor) return false;

        event.preventDefault();
        handleImageUpload(image, editor);
        return true;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) handleImageUpload(file, editor);
    e.target.value = '';
  };

  return (
    <div className="fk-comment-editor" style={UI.modal.commentInput}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={UI.layout.hidden}
      />
      <style>{`
        .fk-comment-editor {
          position: relative;
          flex: 1;
          min-height: 38px;
          padding: 8px 42px 8px 12px;
          border: 1px solid ${T.border};
          border-radius: 10px;
          background: transparent;
          cursor: text;
          box-sizing: border-box;
        }

        .fk-comment-editor:focus-within {
          border-color: ${T.accent};
        }

        .fk-comment-editor .ProseMirror {
          outline: none;
          min-height: 20px;
          color: ${T.text};
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.45;
          font-family: ${fontFamily};
          word-break: break-word;
        }

        .fk-comment-editor .ProseMirror p {
          margin: 0 0 0.35em;
        }

        .fk-comment-editor .ProseMirror p:last-child,
        .fk-comment-editor .ProseMirror ul:last-child,
        .fk-comment-editor .ProseMirror ol:last-child,
        .fk-comment-editor .ProseMirror li:last-child {
          margin-bottom: 0;
        }

        .fk-comment-editor .ProseMirror ul,
        .fk-comment-editor .ProseMirror ol {
          margin: 0 0 0.35em;
          padding-left: 20px;
        }

        .fk-comment-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${T.muted};
          pointer-events: none;
          height: 0;
        }

        .fk-comment-editor .ProseMirror strong,
        .fk-comment-editor .ProseMirror b {
          color: ${T.text};
          font-weight: 800;
        }

        .fk-comment-editor .ProseMirror a {
          color: ${T.accent};
          text-decoration: underline;
          text-underline-offset: 3px;
          font-weight: 500;
          opacity: 0.92;
          transition: opacity 0.12s ease;
          overflow-wrap: anywhere;
          cursor: pointer;
        }

        .fk-comment-editor .ProseMirror a:hover {
          opacity: 0.78;
        }

        .fk-comment-editor .ProseMirror img {
          display: block;
          max-width: 100%;
          max-height: 360px;
          height: auto;
          margin: 8px 0 2px;
          border: 1px solid ${T.border2};
          border-radius: 8px;
          object-fit: contain;
        }
      `}</style>
      <EditorContent editor={editor} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="fk-hover-subtle"
        title="Прикрепить скрин"
        style={UI.modal.commentAttachButton}
      >
        <Icon name="image" size={14} />
      </button>
    </div>
  );
}

export function TaskModal({
  task: init,
  isNew,
  data,
  activeView,
  projects,
  categories,
  onSave,
  onComplete,
  onDelete,
  onCreateSuggestion,
  onDuplicate,
  onOpenLinkedTask,
  onClose,
  isMobile,
}: TaskModalProps) {
  const [task, setTask] = useState<Task>({ ...init, priority: normalizeTaskPriority(init.priority) });
  const [isExiting, setIsExiting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [ignoredDateStr, setIgnoredDateStr] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<null | 'date' | 'project' | 'category' | 'priority' | 'status' | 'ai'>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [newLinkType, setNewLinkType] = useState<TaskLinkType>('related');
  const [dragChecklistItemId, setDragChecklistItemId] = useState<ID | null>(null);
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<ID>>(() => new Set());
  const [aiCompletion, setAiCompletion] = useState<TaskCompletionSuggestionDraft | null>(null);
  const [aiNextTask, setAiNextTask] = useState<TaskSuggestionDraft | null>(null);
  const [aiRewrite, setAiRewrite] = useState<TaskRewriteSuggestionDraft | null>(null);
  const [aiLoading, setAiLoading] = useState<null | 'completion' | 'next' | 'rewrite'>(null);
  const [aiError, setAiError] = useState('');
  const [aiStatus, setAiStatus] = useState('');

  const [mention, setMention] = useState<{ type: 'project' | 'category', query: string, start: number, end: number } | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);

  const set = (k: keyof Task, v: any) => setTask((t) => ({ ...t, [k]: v }));
  
  const prj = projects.find((p) => p.id === task.projectId);
  const statusOptions = prj?.columns || [];
  const isColDone = prj?.columns.find((c) => c.id === task.columnId)?.isDone === true;
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const checklistInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const exitTimerRef = useRef<number | null>(null);

  const finishWithMotion = (action: () => void) => {
    if (isExiting) return;
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(action, 150);
  };

  const smart = useMemo(() => {
    if (!task.title) return null;
    const res = extractSmartDate(task.title, true);
    if (res.date && res.date !== ignoredDateStr) return res;
    return null;
  }, [task.title, ignoredDateStr]);

  const priorityOptions = useMemo(
    () =>
      TASK_PRIORITY_OPTIONS.map((option) =>
        option.id === 'standard' ? { ...option, icon: 'flag' } : option,
      ),
    [],
  );

  const projectOptions = useMemo(
    () => projects.map((project) => ({ ...project, icon: 'folder' })),
    [projects],
  );

  const mentionOptions = useMemo(() => {
    if (!mention) return [];
    if (mention.type === 'project') {
      return projects.filter(p => p.name.toLowerCase().includes(mention.query));
    } else {
      return categories.filter(c => c.name.toLowerCase().includes(mention.query));
    }
  }, [mention, projects, categories]);

  useEffect(() => {
    setTask({ ...init, priority: normalizeTaskPriority(init.priority) });
    setNewComment('');
    setShowConfirmClose(false);
    setIgnoredDateStr(null);
    setActivePopover(null);
    setShowHistory(false);
    setPreviewImage(null);
    setNewChecklistText('');
    setShowLinkPicker(false);
    setLinkQuery('');
    setNewLinkType('related');
    setDragChecklistItemId(null);
    setExpandedCommentIds(new Set());
    setAiCompletion(null);
    setAiNextTask(null);
    setAiRewrite(null);
    setAiLoading(null);
    setAiError('');
    setAiStatus('');
    setIsExiting(false);
    setMention(null);
    setMentionIdx(0);
  }, [init.id]);

  useEffect(() => () => {
    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
  }, []);

  useEffect(() => { setMentionIdx(0); }, [mention?.query]);

  // Авторесайз заголовка
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [task.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    set('title', val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/(?:^|\s)([#@])([^\s]*)$/);

    if (match) {
      const type = match[1] === '#' ? 'project' : 'category';
      const query = match[2].toLowerCase();
      const start = match.index !== undefined ? (match[0].startsWith(' ') ? match.index + 1 : match.index) : 0;
      setMention({ type, query, start, end: cursor });
    } else {
      setMention(null);
    }
  };

  const applyMention = (item: Project | Category) => {
    if (!mention) return;
    const isProj = mention.type === 'project';
    const before = task.title.slice(0, mention.start);
    const after = task.title.slice(mention.end);
    
    const newTitle = (before + after).replace(/\s{2,}/g, ' ').trim();
    
    const updates: Partial<Task> = { title: newTitle };
    if (isProj) {
      updates.projectId = item.id;
      const p = item as Project;
      if (p.columns?.length > 0 && !task.columnId) updates.columnId = p.columns[0].id;
    } else {
      updates.categoryId = item.id;
    }
    
    setTask(t => ({ ...t, ...updates }));
    setMention(null);

    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.focus();
        titleRef.current.setSelectionRange(newTitle.length, newTitle.length);
      }
    }, 0);
  };

  const executeSave = (complete = false) => {
    const f = { ...task };
    let rawTitle = smart ? smart.cleanText : f.title;

    rawTitle = rawTitle.replace(/(^|\s)([#@])([^\s]+)(?=\s|$)/g, (match, space, type, tag) => {
      const searchStr = tag.toLowerCase();
      if (type === '#') {
         const proj = projects.find(p => p.name.toLowerCase().startsWith(searchStr));
         if (proj) {
           f.projectId = proj.id;
           if (proj.columns.length > 0 && !f.columnId) f.columnId = proj.columns[0].id;
           return space ? ' ' : '';
         }
      } else if (type === '@') {
         const cat = categories.find(c => c.name.toLowerCase().startsWith(searchStr));
         if (cat) {
           f.categoryId = cat.id;
           return space ? ' ' : '';
         }
      }
      return match;
    });

    f.title = typographize(rawTitle.trim());
    f.priority = normalizeTaskPriority(f.priority || DEFAULT_TASK_PRIORITY);
    f.description = typographize(f.description || '');
    f.comments = f.comments?.map((comment) => ({
      ...comment,
      text: typographize(comment.text),
    }));
    f.checklists = f.checklists
      ?.map((item) => ({
        ...item,
        text: typographize(item.text.trim()),
      }))
      .filter((item) => item.text);
    if (smart) {
      f.deadline = smart.date;
      f.time = smart.time;
    }
    if (f.title.trim()) finishWithMotion(() => complete && onComplete ? onComplete(f) : onSave(f));
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && mentionOptions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIdx(prev => (prev + 1) % mentionOptions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIdx(prev => (prev - 1 + mentionOptions.length) % mentionOptions.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        applyMention(mentionOptions[mentionIdx]);
        return;
      }
    if (e.key === 'Escape') {
        e.preventDefault();
        setMention(null);
        return;
      }
    }
    
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      executeSave();
    }
    
    if (e.code === 'Escape' && !mention) {
      if (activePopover) {
        setActivePopover(null);
        return;
      }
      if (smart && smart.date !== ignoredDateStr) { setIgnoredDateStr(smart.date); return; }
      handleSafeClose();
    }
  };

  const handleSafeClose = () => {
    const isChanged = JSON.stringify(task) !== JSON.stringify(init) || !isCommentBlank(newComment);
    if (isChanged && !showConfirmClose) setShowConfirmClose(true);
    else finishWithMotion(onClose);
  };

  const handleAddComment = () => {
    if (isCommentBlank(newComment)) return;
    const comment: Comment = {
      id: genId(),
      text: typographize(newComment.trim()),
      createdAt: new Date().toISOString()
    };
    set('comments', [...(task.comments || []), comment]);
    setNewComment('');
  };

  const checklistItems = task.checklists || [];
  const completedChecklistCount = checklistItems.filter((item) => item.completed).length;
  const taskLinks = task.links || [];
  const linkedTaskIds = new Set(taskLinks.map((link) => link.taskId));
  const availableLinkTasks = data.tasks
    .filter((candidate) => candidate.id !== task.id && !linkedTaskIds.has(candidate.id))
    .filter((candidate) => {
      const query = linkQuery.trim().toLowerCase();
      if (!query) return true;
      const projectName = projects.find((project) => project.id === candidate.projectId)?.name || '';
      return `${candidate.title} ${projectName}`.toLowerCase().includes(query);
    })
    .slice(0, 6);

  const addTaskLink = (taskId: ID) => {
    set('links', [...taskLinks, { taskId, type: newLinkType }]);
    setLinkQuery('');
    setShowLinkPicker(false);
  };

  const removeTaskLink = (taskId: ID) => {
    set('links', taskLinks.filter((link) => link.taskId !== taskId));
  };

  const addChecklistItems = (rawText = newChecklistText) => {
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*]\s+/, '').trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const nextItems: ChecklistItem[] = lines.map((line) => ({
      id: genId(),
      text: typographize(line),
      completed: false,
    }));

    set('checklists', [...checklistItems, ...nextItems]);
    setNewChecklistText('');
    window.requestAnimationFrame(() => checklistInputRef.current?.focus());
  };

  const updateChecklistItem = (id: ID, patch: Partial<ChecklistItem>) => {
    set('checklists', checklistItems.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const deleteChecklistItem = (id: ID) => {
    set('checklists', checklistItems.filter((item) => item.id !== id));
  };

  const reorderChecklistItem = (dragId: ID | null, targetId: ID) => {
    if (!dragId || dragId === targetId) return;

    const nextItems = [...checklistItems];
    const fromIndex = nextItems.findIndex((item) => item.id === dragId);
    const toIndex = nextItems.findIndex((item) => item.id === targetId);

    if (fromIndex < 0 || toIndex < 0) return;

    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);
    set('checklists', nextItems);
    setDragChecklistItemId(null);
  };

  const handleDeleteComment = (commentId: string) => {
    set('comments', (task.comments || []).filter(c => c.id !== commentId));
  };

  const handleCommentImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'IMG') return;

    const image = target as HTMLImageElement;
    if (!image.src) return;

    event.preventDefault();
    setPreviewImage({ src: image.src, alt: image.alt || 'Скриншот' });
  };

  const toggleCommentExpanded = (commentId: ID) => {
    setExpandedCommentIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleHistoryClick = () => {
    setShowHistory((current) => {
      const next = !current;
      if (next) {
        window.requestAnimationFrame(() => {
          historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return next;
    });
  };

  const clearAiState = () => {
    setAiCompletion(null);
    setAiNextTask(null);
    setAiRewrite(null);
    setAiError('');
    setAiStatus('');
    setAiLoading(null);
  };

  const buildAiData = (): AppData => {
    const normalizedTask = {
      ...task,
      priority: normalizeTaskPriority(task.priority),
    };
    const hasTask = data.tasks.some((item) => item.id === task.id);

    return {
      ...data,
      tasks: hasTask
        ? data.tasks.map((item) => (item.id === task.id ? normalizedTask : item))
        : [...data.tasks, normalizedTask],
    };
  };

  const runAiCompletion = async () => {
    const aiData = buildAiData();
    if (!getAiSettings(aiData).apiKey) {
      clearAiState();
      setAiError('В настройках не указан API key Neurly.');
      setActivePopover(null);
      return;
    }

    setActivePopover(null);
    setAiLoading('completion');
    setAiError('');
    setAiStatus('');
    setAiCompletion(null);
    setAiNextTask(null);
    setAiRewrite(null);

    try {
      const proposal = await generateTaskCompletionSuggestion({
        data: aiData,
        activeView,
        taskId: task.id,
        onProgress: (progress) => setAiStatus(progress.message),
      });
      setAiCompletion(proposal);
      setAiStatus('');
    } catch (error) {
      setAiCompletion(null);
      setAiError(error instanceof Error ? error.message : 'Не удалось подготовить дополнение.');
    } finally {
      setAiLoading(null);
    }
  };

  const runAiNextTask = async () => {
    const aiData = buildAiData();
    if (!getAiSettings(aiData).apiKey) {
      clearAiState();
      setAiError('В настройках не указан API key Neurly.');
      setActivePopover(null);
      return;
    }

    setActivePopover(null);
    setAiLoading('next');
    setAiError('');
    setAiStatus('');
    setAiCompletion(null);
    setAiNextTask(null);
    setAiRewrite(null);

    try {
      const suggestions = await generateTaskSuggestions({
        data: aiData,
        activeView,
        contextTaskIds: [task.id],
        countOverride: 1,
        force: true,
        promptOverride: [
          'Предложи одну новую задачу как следующий логический шаг после выбранной текущей задачи.',
          'Новая задача должна быть самостоятельной карточкой, не дублем и не простым переименованием текущей.',
          'Сделай ее маленькой, понятной и психологически легкой для закрытия: один конкретный результат, без ощущения большого проекта.',
          'Чек-лист добавляй только если без него задачу правда сложно закрыть; для простой одношаговой задачи верни пустой чек-лист.',
          'Опирайся только на текущую задачу и связанные с ней поля в переданном контексте.',
        ].join('\n'),
        onProgress: (progress) => setAiStatus(progress.message),
      });
      setAiNextTask(suggestions[0] || null);
      setAiStatus('');
      if (!suggestions[0]) {
        setAiError('Модель не вернула новую задачу.');
      }
    } catch (error) {
      setAiNextTask(null);
      setAiError(error instanceof Error ? error.message : 'Не удалось предложить следующую задачу.');
    } finally {
      setAiLoading(null);
    }
  };

  const runAiRewrite = async () => {
    const aiData = buildAiData();
    if (!getAiSettings(aiData).apiKey) {
      clearAiState();
      setAiError('В настройках не указан API key Neurly.');
      setActivePopover(null);
      return;
    }

    setActivePopover(null);
    setAiLoading('rewrite');
    setAiError('');
    setAiStatus('');
    setAiCompletion(null);
    setAiNextTask(null);
    setAiRewrite(null);

    try {
      const rewrite = await generateTaskRewriteSuggestion({
        data: aiData,
        activeView,
        taskId: task.id,
        onProgress: (progress) => setAiStatus(progress.message),
      });
      setAiRewrite(rewrite);
      setAiStatus('');
    } catch (error) {
      setAiRewrite(null);
      setAiError(error instanceof Error ? error.message : 'Не удалось переписать задачу.');
    } finally {
      setAiLoading(null);
    }
  };

  const acceptAiCompletion = () => {
    if (!aiCompletion) return;

    const existingChecklist = task.checklists || [];
    const existingTexts = new Set(existingChecklist.map((item) => item.text.trim().toLowerCase()).filter(Boolean));
    const nextChecklist = [
      ...existingChecklist,
      ...aiCompletion.checklist
        .filter((item) => !existingTexts.has(item.text.trim().toLowerCase()))
        .map((item) => ({ ...item, id: genId(), completed: false })),
    ];

    const additionHtml = aiCompletion.description ? textToHtml(aiCompletion.description) : '';
    setTask((current) => ({
      ...current,
      description: additionHtml
        ? [current.description || '', '<p><strong>AI-дополнение:</strong></p>', additionHtml].filter(Boolean).join('')
        : current.description,
      checklists: nextChecklist,
    }));
    clearAiState();
  };

  const acceptAiRewrite = () => {
    if (!aiRewrite) return;

    setTask((current) => {
      const currentChecklist = current.checklists || [];
      const rewrittenChecklist = aiRewrite.checklist.map((item, index) => ({
        id: currentChecklist[index]?.id || genId(),
        text: item.text,
        completed: currentChecklist[index]?.completed ?? false,
      }));

      return {
        ...current,
        title: aiRewrite.title,
        description: aiRewrite.description ? textToHtml(aiRewrite.description) : current.description,
        checklists: rewrittenChecklist,
      };
    });
    clearAiState();
  };

  const acceptAiNextTask = () => {
    if (!aiNextTask || !onCreateSuggestion) return;
    onCreateSuggestion(aiNextTask);
    clearAiState();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Enter') {
        e.preventDefault(); executeSave(); return;
      }
      if (e.code === 'Escape') {
        if (previewImage) {
          setPreviewImage(null);
          return;
        }
        if (activePopover) {
          setActivePopover(null);
          return;
        }
        if (smart && smart.date !== ignoredDateStr) { setIgnoredDateStr(smart.date); return; }
        handleSafeClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [task, init, newComment, smart, ignoredDateStr, showConfirmClose, activePopover, previewImage]);

  const dlLbl = smart
    ? (smart.time ? `${relDate(smart.date)} · ${smart.time}` : relDate(smart.date))
    : task.deadline
      ? (task.time ? `${relDate(task.deadline)} · ${task.time}` : relDate(task.deadline))
      : 'Срок';
  
  const statusKey = dateStatus(task.deadline, task.completed || isColDone) || 'future';
  const statusColors: Record<string, string> = { overdue: T.danger, today: T.warn, future: T.text, done: T.muted };
  const dlColor = smart ? T.accent : (task.deadline ? (statusColors[statusKey] || T.text2) : T.text2);
  const history = useMemo(() => [...(task.history || [])].sort((a, b) => b.at.localeCompare(a.at)), [task.history]);
  const imagePreviewPortal = previewImage && typeof document !== 'undefined'
    ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр скриншота"
          style={UI.modal.imagePreviewOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewImage(null);
          }}
        >
          <div style={UI.modal.imagePreviewTopbar}>
            <div style={UI.modal.imagePreviewTitle}>
              <Icon name="image" size={15} />
              <span>{previewImage.alt}</span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="fk-modal-close"
              title="Закрыть"
              style={UI.modal.imagePreviewClose}
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <div
            style={UI.modal.imagePreviewStage}
            onClick={(event) => {
              if (event.target === event.currentTarget) setPreviewImage(null);
            }}
          >
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              style={UI.modal.imagePreview}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>,
        document.body,
      )
    : null;
  const historyStats = useMemo(() => {
    const deadlineChanges = countHistory(history, 'deadline_changed');
    const moves = countHistory(history, 'moved') + countHistory(history, 'reordered');
    const commentChanges = countHistory(history, 'comment_added') + countHistory(history, 'comment_removed');
    const staleDays = dayDiffFromNow(task.statusUpdatedAt || task.createdAt);

    return [
      { label: 'Событий', value: history.length },
      { label: 'Сроки', value: deadlineChanges },
      { label: 'Движения', value: moves },
      { label: 'Без смены статуса', value: `${staleDays} д` },
      { label: 'Комментарии', value: commentChanges },
    ];
  }, [history, task.createdAt, task.statusUpdatedAt]);
  const aiActive = !!aiLoading || !!aiError || !!aiCompletion || !!aiNextTask || !!aiRewrite;
  const aiModeTitle =
    aiLoading === 'completion'
      ? 'AI дополняет задачу'
      : aiLoading === 'next'
        ? 'AI ищет следующий шаг'
        : aiLoading === 'rewrite'
          ? 'AI упрощает текст'
          : aiError
            ? 'AI не смог подготовить предложение'
            : aiCompletion
              ? 'Дополнение к описанию'
              : aiRewrite
                ? 'Проще и понятнее'
                : 'Следующая задача';
  const aiModeHint =
    aiLoading
      ? aiStatus || 'Подготовка...'
      : aiCompletion
        ? aiCompletion.summary
        : aiRewrite
          ? aiRewrite.summary
          : aiNextTask
            ? 'Новая карточка будет создана рядом с текущей задачей.'
            : '';

  return (
    <>
    <div
      className={`fk-modal-backdrop ${isExiting ? 'fk-modal-exit' : 'fk-modal-enter'}`}
      style={isMobile ? wrapMob : wrapDesk}
      onMouseDown={!isMobile ? e => e.target === e.currentTarget && handleSafeClose() : undefined}
    >
      <div className="fk-modal-panel" style={isMobile ? innerMob : innerDesk} onMouseDown={e => e.stopPropagation()}>
        <div style={UI.modal.header()}>
          <span style={UI.modal.headerLabel}>{isNew ? 'Новая задача' : 'Задача'}</span>
          <button onClick={handleSafeClose} className="fk-modal-close" style={UI.modal.closeButton}><Icon name="x" size={20}/></button>
        </div>

        <div style={UI.modal.body()}>
          
          <div style={UI.modal.relative}>
            {/* Заголовок не должен вылезать за контейнер */}
            <textarea 
              ref={titleRef} autoFocus={isNew} placeholder="Без названия..." value={task.title} rows={1}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              style={UI.modal.titleInput}
            />

            {mention && mentionOptions.length > 0 && (
              <div style={UI.modal.dropdownMenu(false, 220, 200)}>
                <div style={UI.modal.mentionLabel}>
                  {mention.type === 'project' ? 'Проекты' : 'Метки'}
                </div>
                {mentionOptions.map((opt, i) => (
                  <button
                    key={opt.id}
                    onClick={(e) => { e.preventDefault(); applyMention(opt); }}
                    style={UI.control.menuItem(mentionIdx === i)}
                    onMouseEnter={() => setMentionIdx(i)}
                  >
                    {opt.color && <span style={UI.modal.dot(opt.color)} />}
                    <span style={UI.modal.truncate()}>{opt.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={UI.modal.dividerRow(UI.modal.taskChipsRow)}>
            <DateDropdown 
              date={task.deadline} time={task.time} 
              onChange={v => set('deadline', v)} onTimeChange={v => set('time', v)} onClear={() => { set('deadline', null); set('time', null); }}
              isSmartActive={!!smart} dlLbl={dlLbl} dlColor={dlColor}
              open={activePopover === 'date'}
              onOpenChange={(open) => setActivePopover(open ? 'date' : null)}
            />

            <CustomDropdown 
              value={task.categoryId} options={categories} 
              onChange={val => set('categoryId', val)} 
              icon={<Icon name="tag" size={13} color={T.muted} />} 
              placeholder="Метка" alignRight 
              open={activePopover === 'category'}
              onOpenChange={(open) => setActivePopover(open ? 'category' : null)}
            />

            <CustomDropdown
              value={task.columnId}
              options={statusOptions}
              onChange={(val) => set('columnId', val)}
              color={statusOptions.find((column) => column.id === task.columnId)?.color || T.muted}
              placeholder="Статус"
              minWidth={220}
              open={activePopover === 'status'}
              onOpenChange={(open) => setActivePopover(open ? 'status' : null)}
            />

            <CustomDropdown
              value={task.priority}
              options={priorityOptions}
              onChange={(val) => set('priority', normalizeTaskPriority(val))}
              color={getTaskPriorityIcon(task.priority) ? priorityOptions.find((option) => option.id === task.priority)?.color : undefined}
              placeholder="Важность"
              iconOnly
              open={activePopover === 'priority'}
              onOpenChange={(open) => setActivePopover(open ? 'priority' : null)}
            />

            <CustomDropdown 
              value={task.projectId}
              options={projectOptions}
              onChange={val => { const p = projects.find(x => x.id === val); set('projectId', val); if (p?.columns.length) set('columnId', p.columns[0].id); }}
              color={prj?.color || T.muted}
              placeholder="Проект"
              iconOnly
              open={activePopover === 'project'}
              onOpenChange={(open) => setActivePopover(open ? 'project' : null)}
            />

            <div style={UI.modal.relative}>
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'ai' ? null : 'ai')}
                className={activePopover === 'ai' ? undefined : 'fk-hover-border-accent'}
                disabled={!!aiLoading}
                title="AI"
                style={UI.control.chipButton(
                  activePopover === 'ai',
                  activePopover === 'ai' ? T.text : T.text2,
                  {
                    minWidth: 52,
                    padding: '0 10px',
                    opacity: aiLoading ? 0.72 : 1,
                    cursor: aiLoading ? 'default' : 'pointer',
                  },
                )}
              >
                <Icon name="spark" size={14} color={activePopover === 'ai' ? T.accent : T.text2} />
                <span style={{ fontSize: 12.5, fontWeight: 850, fontFamily }}>AI</span>
                <Icon name="chevD" size={11} color={T.muted} style={UI.modal.dropdownChevron(activePopover === 'ai')} />
              </button>

              {activePopover === 'ai' && (
                <div style={UI.modal.dropdownMenu(true, 264, 260)}>
                  <button
                    type="button"
                    onClick={() => void runAiRewrite()}
                    className="fk-hover-subtle"
                    style={UI.control.menuItem(false)}
                  >
                    <Icon name="bolt" size={14} color={T.accent} />
                    <span style={UI.modal.truncate()}>Упростить текст</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void runAiCompletion()}
                    className="fk-hover-subtle"
                    style={UI.control.menuItem(false)}
                  >
                    <Icon name="spark" size={14} color={T.accent} />
                    <span style={UI.modal.truncate()}>Дополнить задачу</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void runAiNextTask()}
                    className="fk-hover-subtle"
                    style={UI.control.menuItem(false)}
                  >
                    <Icon name="plus" size={14} color={T.text2} />
                    <span style={UI.modal.truncate()}>Предложить следующую</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`fk-ai-stage ${aiActive ? 'fk-ai-stage-active' : ''}`}>
            <style>{`
              .fk-ai-stage {
                display: grid;
                min-width: 0;
                position: relative;
              }

              .fk-ai-original,
              .fk-ai-layer {
                grid-area: 1 / 1;
                min-width: 0;
              }

              .fk-ai-original {
                transition: opacity .28s ease, filter .28s ease, transform .28s ease;
              }

              .fk-ai-stage-active .fk-ai-original {
                opacity: .18;
                filter: blur(3px);
                transform: translateY(4px) scale(.99);
                pointer-events: none;
                user-select: none;
              }

              .fk-ai-layer {
                align-self: start;
                animation: fk-ai-layer-in .26s cubic-bezier(.2,.8,.2,1);
              }

              .fk-ai-surface {
                position: relative;
                overflow: hidden;
                min-height: 150px;
                padding: 14px;
                border: 1px solid ${aiError ? 'rgba(239, 68, 68, 0.34)' : 'color-mix(in srgb, var(--accent) 34%, var(--border2))'};
                border-radius: 12px;
                background:
                  linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.015)),
                  color-mix(in srgb, var(--card) 88%, transparent);
                box-shadow:
                  inset 0 0 0 1px rgba(255,255,255,.025),
                  0 14px 32px rgba(0,0,0,.22);
              }

              .fk-ai-surface::before {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                background: linear-gradient(115deg, transparent 0%, color-mix(in srgb, var(--accent) 18%, transparent) 44%, transparent 62%);
                transform: translateX(-120%);
                opacity: ${aiLoading ? 1 : 0};
                animation: fk-ai-scan 1.45s ease-in-out infinite;
              }

              .fk-ai-head {
                position: relative;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 12px;
              }

              .fk-ai-title {
                display: flex;
                align-items: center;
                gap: 8px;
                color: ${aiError ? T.danger : T.text};
                font-size: 13px;
                font-weight: 850;
                line-height: 1.35;
                font-family: ${fontFamily};
              }

              .fk-ai-hint {
                margin-top: 4px;
                color: ${T.muted};
                font-size: 12.5px;
                line-height: 1.45;
                font-weight: 600;
                font-family: ${fontFamily};
              }

              .fk-ai-pulse {
                width: 7px;
                height: 7px;
                border-radius: 999px;
                background: ${aiError ? T.danger : T.accent};
                box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 35%, transparent);
                animation: fk-ai-pulse 1.2s ease-in-out infinite;
              }

              .fk-ai-body {
                position: relative;
                display: grid;
                gap: 10px;
              }

              .fk-ai-text {
                color: ${T.text};
                font-size: 13.5px;
                line-height: 1.52;
                font-weight: 550;
                font-family: ${fontFamily};
                white-space: pre-wrap;
                word-break: break-word;
              }

              .fk-ai-muted {
                color: ${T.text2};
                font-size: 13px;
                line-height: 1.48;
                font-family: ${fontFamily};
                white-space: pre-wrap;
                word-break: break-word;
              }

              .fk-ai-title-text {
                color: ${T.text};
                font-size: 15px;
                font-weight: 850;
                line-height: 1.35;
                font-family: ${fontFamily};
                word-break: break-word;
              }

              .fk-ai-list {
                display: grid;
                gap: 6px;
                padding-top: 2px;
              }

              .fk-ai-list-row {
                display: grid;
                grid-template-columns: 18px minmax(0, 1fr);
                gap: 8px;
                align-items: start;
                color: ${T.text2};
                font-size: 13px;
                line-height: 1.45;
                font-family: ${fontFamily};
              }

              .fk-ai-actions {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                flex-wrap: wrap;
                margin-top: 2px;
              }

              .fk-ai-skeleton {
                display: grid;
                gap: 8px;
                padding-top: 4px;
              }

              .fk-ai-line {
                height: 10px;
                border-radius: 999px;
                background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.18), rgba(255,255,255,.08));
                background-size: 220% 100%;
                animation: fk-ai-line 1.25s ease-in-out infinite;
              }

              .fk-ai-line:nth-child(2) { width: 88%; animation-delay: .08s; }
              .fk-ai-line:nth-child(3) { width: 64%; animation-delay: .16s; }

              @keyframes fk-ai-layer-in {
                from { opacity: 0; transform: translateY(8px) scale(.985); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }

              @keyframes fk-ai-scan {
                0% { transform: translateX(-120%); }
                55%, 100% { transform: translateX(120%); }
              }

              @keyframes fk-ai-line {
                0% { background-position: 140% 0; opacity: .58; }
                50% { opacity: 1; }
                100% { background-position: -80% 0; opacity: .58; }
              }

              @keyframes fk-ai-pulse {
                0%, 100% { transform: scale(.86); box-shadow: 0 0 0 0 color-mix(in srgb, currentColor 30%, transparent); }
                50% { transform: scale(1); box-shadow: 0 0 0 7px color-mix(in srgb, currentColor 0%, transparent); }
              }
            `}</style>

            <div className="fk-ai-original">
              <RichEditor content={task.description || ''} onChange={html => set('description', html)} placeholder="Добавить описание..." />
            </div>

            {aiActive && (
              <div className="fk-ai-layer">
                <div className="fk-ai-surface">
                  <div className="fk-ai-head">
                    <div style={{ minWidth: 0 }}>
                      <div className="fk-ai-title">
                        <Icon name="spark" size={14} color={aiError ? T.danger : T.accent} />
                        <span>{aiModeTitle}</span>
                        {aiLoading && <span className="fk-ai-pulse" />}
                      </div>
                      {aiModeHint && <div className="fk-ai-hint">{aiModeHint}</div>}
                    </div>

                    {!aiLoading && (
                      <button
                        type="button"
                        onClick={clearAiState}
                        className="fk-hover-subtle"
                        title="Отклонить"
                        style={UI.modal.removeButton}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </div>

                  <div className="fk-ai-body">
                    {aiLoading && (
                      <div className="fk-ai-skeleton" aria-hidden="true">
                        <div className="fk-ai-line" />
                        <div className="fk-ai-line" />
                        <div className="fk-ai-line" />
                      </div>
                    )}

                    {aiError && <div className="fk-ai-muted" style={{ color: T.danger }}>{aiError}</div>}

                    {aiCompletion && !aiError && (
                      <>
                        {aiCompletion.description && <div className="fk-ai-text">{aiCompletion.description}</div>}
                        {aiCompletion.checklist.length > 0 && (
                          <div className="fk-ai-list">
                            {aiCompletion.checklist.map((item) => (
                              <div key={item.id} className="fk-ai-list-row">
                                <Icon name="check" size={13} color={T.accent} />
                                <span>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="fk-ai-actions">
                          <Btn variant="ghost" className="fk-modal-icon-danger" onClick={clearAiState}>
                            <Icon name="x" size={14} />
                            Отклонить
                          </Btn>
                          <Btn variant="primary" onClick={acceptAiCompletion}>
                            <Icon name="check" size={14} />
                            Принять
                          </Btn>
                        </div>
                      </>
                    )}

                    {aiRewrite && !aiError && (
                      <>
                        <div className="fk-ai-title-text">{aiRewrite.title}</div>
                        {aiRewrite.description && <div className="fk-ai-muted">{aiRewrite.description}</div>}
                        {aiRewrite.checklist.length > 0 && (
                          <div className="fk-ai-list">
                            {aiRewrite.checklist.map((item) => (
                              <div key={item.id} className="fk-ai-list-row">
                                <Icon name="check" size={13} color={T.accent} />
                                <span>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="fk-ai-actions">
                          <Btn variant="ghost" className="fk-modal-icon-danger" onClick={clearAiState}>
                            <Icon name="x" size={14} />
                            Отклонить
                          </Btn>
                          <Btn variant="primary" onClick={acceptAiRewrite}>
                            <Icon name="check" size={14} />
                            Принять
                          </Btn>
                        </div>
                      </>
                    )}

                    {aiNextTask && !aiError && (
                      <>
                        <div className="fk-ai-title-text">{aiNextTask.title}</div>
                        {aiNextTask.description && <div className="fk-ai-muted">{aiNextTask.description}</div>}
                        {aiNextTask.checklists.length > 0 && (
                          <div className="fk-ai-list">
                            {aiNextTask.checklists.map((item) => (
                              <div key={item.id} className="fk-ai-list-row">
                                <Icon name="check" size={13} color={T.accent} />
                                <span>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="fk-ai-actions">
                          <Btn variant="ghost" className="fk-modal-icon-danger" onClick={clearAiState}>
                            <Icon name="x" size={14} />
                            Отклонить
                          </Btn>
                          <Btn variant="primary" onClick={acceptAiNextTask} disabled={!onCreateSuggestion}>
                            <Icon name="plus" size={14} />
                            Создать
                          </Btn>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={UI.modal.section({ marginTop: 0, paddingTop: 18, gap: 12 })}>
            <style>{`
              .fk-linked-task-button:hover .fk-linked-task-title {
                color: ${T.accent} !important;
              }
            `}</style>
            <div style={UI.modal.commentMetaRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={UI.modal.sectionLabel}>Связанные задачи</div>
                {taskLinks.length > 0 && (
                  <span style={{ color: T.muted, fontSize: 12, fontWeight: 700, fontFamily }}>
                    {taskLinks.length}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowLinkPicker((current) => !current)}
                className="fk-hover-subtle"
                title={showLinkPicker ? 'Закрыть выбор' : 'Связать задачу'}
                aria-label={showLinkPicker ? 'Закрыть выбор связанной задачи' : 'Связать задачу'}
                style={UI.control.button('ghost', 'sm', false, { width: 28, minWidth: 28, height: 28, padding: 0 })}
              >
                <Icon name={showLinkPicker ? 'x' : 'plus'} size={14} />
              </button>
            </div>

            {taskLinks.length > 0 && (
              <div style={{ display: 'grid' }}>
                {taskLinks.map((link) => {
                  const linkedTask = data.tasks.find((candidate) => candidate.id === link.taskId);
                  if (!linkedTask) return null;
                  const linkedProject = projects.find((project) => project.id === linkedTask.projectId);
                  const linkedDone = Boolean(
                    linkedTask.completed || linkedProject?.columns.find((column) => column.id === linkedTask.columnId)?.isDone,
                  );
                  const relationIcon = link.type === 'blocks' ? 'bolt' : link.type === 'blocked_by' ? 'chevronsDown' : 'link';
                  const relationColor = link.type === 'blocks' ? T.accent : link.type === 'blocked_by' ? T.warn : T.muted;

                  return (
                    <div
                      key={link.taskId}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '22px minmax(0, 1fr) 26px',
                        alignItems: 'center',
                        gap: 6,
                        minHeight: 34,
                        padding: '2px 0',
                      }}
                    >
                      <span
                        title={getTaskLinkLabel(link.type)}
                        aria-label={getTaskLinkLabel(link.type)}
                        style={{ width: 22, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: relationColor }}
                      >
                        <Icon name={relationIcon} size={12} color="currentColor" />
                      </span>

                      <button
                        type="button"
                        onClick={() => onOpenLinkedTask && finishWithMotion(() => onOpenLinkedTask(link.taskId, task))}
                        className="fk-linked-task-button"
                        title={`Открыть задачу «${linkedTask.title}»`}
                        style={{
                          minWidth: 0,
                          display: 'grid',
                          gap: 2,
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          color: 'inherit',
                          textAlign: 'left',
                          cursor: onOpenLinkedTask ? 'pointer' : 'default',
                          fontFamily,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                          <span className="fk-linked-task-title" style={{ ...UI.modal.truncate(), color: linkedDone ? T.muted : T.text, fontSize: 13, fontWeight: 700, fontFamily, textDecoration: linkedDone ? 'line-through' : 'none', transition: 'color .14s ease' }}>
                            {linkedTask.title}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeTaskLink(link.taskId)}
                        className="fk-checklist-remove"
                        title="Убрать связь"
                        aria-label={`Убрать связь с задачей ${linkedTask.title}`}
                        style={{ ...UI.modal.removeButton, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Icon name="x" size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {showLinkPicker && (
              <div style={{ display: 'grid', gap: 8, padding: 10, border: `1px solid ${T.border2}`, borderRadius: 11, background: 'rgba(255,255,255,0.018)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '132px minmax(0, 1fr)', gap: 8 }}>
                  <select
                    value={newLinkType}
                    onChange={(event) => setNewLinkType(event.target.value as TaskLinkType)}
                    aria-label="Тип связи"
                    style={UI.control.input({ height: 38, padding: '0 10px', cursor: 'pointer' })}
                  >
                    {TASK_LINK_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                  <div style={{ position: 'relative' }}>
                    <Icon name="search" size={14} color={T.muted} style={{ position: 'absolute', left: 11, top: 12, pointerEvents: 'none' }} />
                    <input
                      autoFocus
                      value={linkQuery}
                      onChange={(event) => setLinkQuery(event.target.value)}
                      placeholder="Найти задачу..."
                      style={UI.control.input({ height: 38, paddingLeft: 34 })}
                    />
                  </div>
                </div>

                {availableLinkTasks.length > 0 ? (
                  <div style={{ display: 'grid', gap: 4, maxHeight: 210, overflowY: 'auto' }}>
                    {availableLinkTasks.map((candidate) => {
                      return (
                        <button
                          key={candidate.id}
                          type="button"
                          onClick={() => addTaskLink(candidate.id)}
                          className="fk-hover-subtle"
                          style={UI.control.menuItem(false, { minHeight: 38, padding: '7px 9px' })}
                        >
                          <Icon name="link" size={13} color={T.muted} />
                          <span style={{ ...UI.modal.truncate(), flex: 1, textAlign: 'left' }}>{candidate.title}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '8px 4px 2px', color: T.muted, fontSize: 12.5, fontWeight: 600, fontFamily }}>
                    {data.tasks.length <= 1 ? 'Сначала создайте ещё одну задачу.' : 'Подходящих задач не найдено.'}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={UI.modal.section({ marginTop: 0, paddingTop: 18 })}>
            <style>{`
              .fk-checklist-input::placeholder {
                color: ${T.muted};
              }

              .fk-checklist-text::placeholder {
                color: ${T.muted};
              }

              .fk-checklist-remove:hover {
                background: rgba(239, 68, 68, 0.12) !important;
                color: ${T.danger} !important;
                box-shadow: none !important;
              }
            `}</style>

            <div style={UI.modal.commentMetaRow}>
              <div style={UI.modal.sectionLabel}>
                Чек-лист {checklistItems.length > 0 ? `(${completedChecklistCount}/${checklistItems.length})` : ''}
              </div>
              {checklistItems.length > 0 && (
                <div style={{ color: T.muted, fontSize: 12, fontWeight: 700, fontFamily }}>
                  {Math.round((completedChecklistCount / checklistItems.length) * 100)}%
                </div>
              )}
            </div>

            {checklistItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => reorderChecklistItem(dragChecklistItemId, item.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 26px 1fr 28px',
                      alignItems: 'center',
                      gap: 8,
                      minHeight: 38,
                      padding: '2px 2px 2px 0',
                      borderRadius: 9,
                      opacity: dragChecklistItemId === item.id ? 0.55 : 1,
                    }}
                  >
                    <button
                      type="button"
                      draggable
                      onDragStart={() => setDragChecklistItemId(item.id)}
                      onDragEnd={() => setDragChecklistItemId(null)}
                      title="Перетащить"
                      style={{
                        width: 24,
                        height: 28,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignSelf: 'start',
                        marginTop: 1,
                        border: 'none',
                        borderRadius: 7,
                        background: 'transparent',
                        color: T.muted,
                        cursor: 'grab',
                      }}
                    >
                      <Icon name="grip" size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateChecklistItem(item.id, { completed: !item.completed })}
                      aria-label={item.completed ? 'Снять галочку' : 'Отметить выполненным'}
                      style={{
                        width: 22,
                        height: 22,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignSelf: 'start',
                        marginTop: 3,
                        border: `1px solid ${item.completed ? T.accent : T.border2}`,
                        borderRadius: 7,
                        background: item.completed ? T.accent : 'transparent',
                        color: item.completed ? 'var(--accent-text)' : 'transparent',
                        cursor: 'pointer',
                        boxShadow: item.completed ? `0 0 0 3px ${T.accentDim}` : 'none',
                      }}
                    >
                      <Icon name="check" size={14} />
                    </button>
                    <textarea
                      className="fk-checklist-text"
                      value={item.text}
                      onChange={(event) => updateChecklistItem(item.id, { text: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          checklistInputRef.current?.focus();
                        }
                      }}
                      placeholder="Пункт чек-листа"
                      style={{
                        width: '100%',
                        minWidth: 0,
                        height: 22,
                        minHeight: 22,
                        maxHeight: 22,
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        overflow: 'hidden',
                        background: 'transparent',
                        color: item.completed ? T.muted : T.text,
                        fontSize: 13.5,
                        fontWeight: 500,
                        lineHeight: '22px',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        textDecoration: item.completed ? 'line-through' : 'none',
                        opacity: item.completed ? 0.72 : 1,
                        padding: 0,
                        fontFamily,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => deleteChecklistItem(item.id)}
                      title="Удалить пункт"
                      className="fk-checklist-remove"
                      style={{
                        width: 28,
                        height: 28,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        alignSelf: 'start',
                        marginTop: 0,
                        padding: 0,
                        border: 'none',
                        borderRadius: 7,
                        background: 'transparent',
                        color: T.muted,
                        cursor: 'pointer',
                        transition: 'background .16s ease, color .16s ease',
                      }}
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={UI.modal.inlineForm(8)}>
              <input
                ref={checklistInputRef}
                className="fk-checklist-input"
                value={newChecklistText}
                onChange={(event) => setNewChecklistText(event.target.value)}
                onPaste={(event) => {
                  const text = event.clipboardData.getData('text/plain');
                  if (!text.includes('\n')) return;

                  event.preventDefault();
                  addChecklistItems(text);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addChecklistItems();
                  }
                }}
                placeholder="Добавить пункт..."
                style={UI.control.input({
                  flex: 1,
                  height: 38,
                  background: 'transparent',
                })}
              />
              <Btn
                variant="subtle"
                onClick={() => addChecklistItems()}
                disabled={!newChecklistText.trim()}
                style={UI.modal.commentSubmitButton}
              >
                <Icon name="plus" size={14} />
                Добавить
              </Btn>
            </div>
          </div>

          <div style={UI.modal.section()}>
            <style>{`
              .fk-comment-html {
                color: ${T.text2};
                font-size: 13.5px;
                line-height: 1.5;
                font-family: ${fontFamily};
                word-break: break-word;
              }

              .fk-comment-html p {
                margin: 0 0 0.45em;
              }

              .fk-comment-html p:last-child,
              .fk-comment-html ul:last-child,
              .fk-comment-html ol:last-child,
              .fk-comment-html li:last-child {
                margin-bottom: 0;
              }

              .fk-comment-html ul,
              .fk-comment-html ol {
                margin: 0 0 0.45em;
                padding-left: 20px;
              }

              .fk-comment-html strong,
              .fk-comment-html b {
                color: ${T.text};
                font-weight: 800;
              }

              .fk-comment-html a {
                color: ${T.accent};
                text-decoration: underline;
                text-underline-offset: 3px;
                font-weight: 500;
                opacity: 0.92;
                transition: opacity 0.12s ease;
                overflow-wrap: anywhere;
              }

              .fk-comment-html a:hover {
                opacity: 0.78;
              }

              .fk-comment-html img {
                display: block;
                max-width: 100%;
                max-height: 420px;
                height: auto;
                margin: 8px 0 2px;
                border: 1px solid ${T.border2};
                border-radius: 8px;
                object-fit: contain;
                cursor: zoom-in;
              }

              .fk-comment-collapse {
                position: relative;
                max-height: 112px;
                overflow: hidden;
              }

              .fk-comment-collapse::after {
                content: "";
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 28px;
                pointer-events: none;
                background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--card) 72%, transparent));
              }
            `}</style>
            <div style={UI.modal.sectionLabel}>
              Комментарии {task.comments && task.comments.length > 0 ? `(${task.comments.length})` : ''}
            </div>
            
            {task.comments && task.comments.length > 0 && (
              <div style={UI.modal.listStack()}>
                {task.comments.map(c => {
                  let dateStr = c.createdAt;
                  const isLongComment = shouldCollapseComment(c.text);
                  const isExpandedComment = expandedCommentIds.has(c.id);
                  try {
                    const d = new Date(c.createdAt);
                    if (!isNaN(d.getTime())) {
                      dateStr = formatRuDateTime(d);
                    }
                  } catch(e) { }

                  return (
                    <div key={c.id} style={UI.modal.commentRow}>
                      <div style={UI.modal.commentAvatar}>
                        <Icon name="message" size={14} />
                      </div>
                      <div style={UI.modal.commentBody}>
                        <div style={UI.modal.commentMetaRow}>
                          <div style={UI.modal.commentAuthorRow}>
                            <span style={UI.modal.commentAuthor}>Вы</span>
                            <span style={UI.modal.commentDate}>{dateStr}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteComment(c.id)}
                            title="Удалить комментарий"
                            style={UI.modal.removeButton}
                            className="fk-hover-danger-soft"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <div
                            className={`fk-comment-html ${isLongComment && !isExpandedComment ? 'fk-comment-collapse' : ''}`}
                            style={UI.modal.commentText}
                            onClick={handleCommentImageClick}
                            dangerouslySetInnerHTML={{ __html: sanitizeCommentHtml(c.text) }}
                          />
                          {isLongComment && (
                            <button
                              type="button"
                              onClick={() => toggleCommentExpanded(c.id)}
                              className="fk-hover-link"
                              style={{
                                marginTop: 6,
                                padding: 0,
                                border: 'none',
                                background: 'transparent',
                                color: T.text2,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily,
                                opacity: 0.86,
                              }}
                            >
                              {isExpandedComment ? 'свернуть' : 'показать полностью'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={UI.modal.inlineForm()}>
              <CommentEditor content={newComment} onChange={setNewComment} onSubmit={handleAddComment} />
              <Btn
                variant="subtle"
                onClick={handleAddComment}
                disabled={isCommentBlank(newComment)}
                style={UI.modal.commentSubmitButton}
              >
                Отправить
              </Btn>
            </div>
          </div>

          {showHistory && (
            <div
              ref={historyRef}
              style={UI.modal.section({
                marginTop: 4,
                paddingTop: 20,
                scrollMarginTop: 18,
              })}
            >
              <div style={UI.compose(UI.modal.commentMetaRow, { alignItems: 'flex-start', gap: 12 })}>
                <div>
                  <div style={UI.modal.sectionLabel}>История задачи</div>
                  <div style={{ marginTop: 5, color: T.muted, fontSize: 12.5, lineHeight: 1.45, fontFamily }}>
                    Постановка, текст, сроки, статус, комментарии и удаление через откат.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="fk-hover-subtle"
                  style={UI.control.button('ghost', 'sm')}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(116px, 1fr))',
                gap: 8,
              }}>
                {historyStats.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: '10px 12px',
                      border: `1px solid ${T.border2}`,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.035)',
                    }}
                  >
                    <div style={{ color: T.muted, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, fontFamily }}>{item.label}</div>
                    <div style={{ marginTop: 4, color: T.text, fontSize: 18, fontWeight: 850, fontFamily }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {history.length > 0 ? (
                <div style={UI.modal.listStack(12)}>
                  {history.map((event) => (
                    <div key={event.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 12 }}>
                      <div style={UI.modal.commentAvatar}>
                        <Icon name={historyIcon[event.type] || 'edit'} size={14} />
                      </div>
                      <div style={{ paddingBottom: 12, borderBottom: `1px solid ${T.border2}` }}>
                        <div style={UI.modal.commentMetaRow}>
                          <span style={UI.modal.commentAuthor}>{event.label}</span>
                          <span style={UI.modal.commentDate}>{formatHistoryDate(event.at)}</span>
                        </div>
                        {(event.from || event.to) && (
                          <div style={{ marginTop: 6, color: T.text2, fontSize: 13, lineHeight: 1.45, fontFamily }}>
                            {event.from && <span style={{ color: T.muted }}>{formatHistoryValue(event.from)}</span>}
                            {(event.from || event.to) && <span style={{ color: T.muted }}>{' -> '}</span>}
                            {event.to && <span>{formatHistoryValue(event.to)}</span>}
                          </div>
                        )}
                        {event.details && (
                          <div style={{ marginTop: 6, color: T.text2, fontSize: 13, lineHeight: 1.45, fontFamily, wordBreak: 'break-word' }}>
                            {formatHistoryValue(event.details)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: T.muted, fontSize: 13, lineHeight: 1.5, fontFamily }}>
                  История появится после первого сохранения задачи.
                </div>
              )}
            </div>
          )}
        </div>

        <div style={UI.modal.footer()}>
          {showConfirmClose ? (
            <><div style={UI.modal.confirmText}>Закрыть без сохранения?</div>
              <div style={UI.modal.actions(10)}><Btn variant="subtle" onClick={() => setShowConfirmClose(false)}>Назад</Btn><Btn variant="danger" onClick={() => finishWithMotion(onClose)}>Закрыть</Btn></div></>
          ) : (
            <><div style={UI.modal.actions(8)}>
                <Btn
                  variant={showHistory ? 'subtle' : 'ghost'}
                  className="fk-hover-subtle"
                  onClick={handleHistoryClick}
                  style={UI.settings.deleteButton}
                  title="История задачи"
                >
                  <Icon name="history" size={16}/>
                </Btn>
                {!isNew && onDuplicate && (
                  <Btn
                    variant="ghost"
                    className="fk-hover-subtle"
                    onClick={onDuplicate}
                    style={UI.settings.deleteButton}
                    title="Сделать копию"
                  >
                    <Icon name="copy" size={16}/>
                  </Btn>
                )}
                <Btn variant="ghost" className="fk-modal-icon-danger" onClick={() => finishWithMotion(() => onDelete(task.id))} style={UI.settings.deleteButton} title="Удалить задачу"><Icon name="trash" size={16}/></Btn>
              </div>
              <div style={UI.modal.actions()}>{!isNew && onComplete && !isDoneTask(task, projects) && <Btn variant="subtle" onClick={() => executeSave(true)}>Завершить</Btn>}<Btn variant="subtle" onClick={handleSafeClose}>Отмена</Btn><Btn variant="primary" onClick={() => executeSave()}>{isNew ? 'Создать' : 'Сохранить'}</Btn></div></>
          )}
        </div>

      </div>
    </div>
    {imagePreviewPortal}
    </>
  );
}

// ─── Note Modal ─────────────────────────────────────────────────────────────
