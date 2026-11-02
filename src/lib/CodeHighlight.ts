export const normalizeCodeLanguage = (language?: string | null) => {
  const clean = (language || '').trim().toLowerCase();
  return clean || 'text';
};
