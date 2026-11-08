export interface BoardLinkSegment {
  text: string;
  href: string | null;
}

const FILE_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv', 'zip', 'rar', '7z', 'tar', 'gz', 'mp3', 'mp4', 'avi', 'mov', 'mkv', 'wav', 'js', 'ts', 'tsx', 'jsx', 'css', 'scss', 'html', 'json', 'xml', 'yml', 'yaml', 'exe', 'dll', 'iso', 'dmg', 'apk', 'deb', 'rpm', 'msi', 'bat', 'sh', 'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'c', 'cpp', 'h', 'hpp', 'lock', 'log', 'ini', 'cfg', 'conf', 'env']);

const LINK_RE = /(?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(?::\d{2,5})?(?:\/[^\s<>"']*)?/gi;

export const trimBoardLink = (value: string): string =>
  value.replace(/[.,;:!?…]+$/, '').replace(/\)+$/, (closing) => value.includes('(') ? closing : '');

export const boardLinkHref = (candidate: string): string | null => {
  const trimmed = trimBoardLink(candidate);
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const labels = url.hostname.split('.');
    if (labels.length < 2 || labels.some((label) => !label)) return null;
    const tld = labels[labels.length - 1].toLowerCase();
    if (!/^[a-z]{2,}$/.test(tld) || FILE_EXTENSIONS.has(tld)) return null;
    return url.href;
  } catch { return null; }
};

export const splitBoardLinks = (text: string): BoardLinkSegment[] => {
  const segments: BoardLinkSegment[] = [];
  let last = 0;
  LINK_RE.lastIndex = 0;
  for (let match = LINK_RE.exec(text); match; match = LINK_RE.exec(text)) {
    const before = match.index > 0 ? text[match.index - 1] : '';
    const href = /[@/.-]/.test(before) ? null : boardLinkHref(match[0]);
    if (!href) continue;
    const linkText = trimBoardLink(match[0]);
    if (match.index > last) segments.push({ text: text.slice(last, match.index), href: null });
    segments.push({ text: linkText, href });
    last = match.index + linkText.length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), href: null });
  return segments.length ? segments : [{ text, href: null }];
};