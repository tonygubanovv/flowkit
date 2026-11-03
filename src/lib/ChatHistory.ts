import { AiChatMessage, AiChatSession, AppData } from '../types/Schemas';

export const createChatSession = (): AiChatSession => ({
  id: crypto.randomUUID(),
  title: 'Новый разговор',
  updatedAt: new Date().toISOString(),
  messages: [],
  draft: '',
  contextTaskIds: [],
});

export const saveChatSession = (data: AppData, session: AiChatSession): AppData => ({
  ...data,
  aiChats: [session, ...(data.aiChats ?? []).filter((item) => item.id !== session.id)]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
});

export const normalizeChatSessions = (value: unknown): AiChatSession[] => {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.flatMap((item: unknown): AiChatSession[] => {
    if (!item || typeof item !== 'object') return [];
    const session = item as Record<string, unknown>;
    if (typeof session.id !== 'string' || !session.id || ids.has(session.id)) return [];
    ids.add(session.id);
    const messages = Array.isArray(session.messages) ? session.messages.flatMap((entry: unknown): AiChatMessage[] => {
      if (!entry || typeof entry !== 'object') return [];
      const message = entry as Record<string, unknown>;
      if (typeof message.id !== 'string' || typeof message.content !== 'string'
        || (message.role !== 'user' && message.role !== 'assistant')) return [];
      return [{ id: message.id, role: message.role, content: message.content }];
    }) : [];
    return [{
      id: session.id,
      title: typeof session.title === 'string' ? session.title : 'Новый разговор',
      updatedAt: typeof session.updatedAt === 'string' && Number.isFinite(Date.parse(session.updatedAt))
        ? session.updatedAt : new Date(0).toISOString(),
      messages,
      draft: typeof session.draft === 'string' ? session.draft : '',
      contextTaskIds: Array.isArray(session.contextTaskIds)
        ? session.contextTaskIds.filter((id): id is string => typeof id === 'string') : [],
    }];
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};
