const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const linkifyText = (value: string) =>
  value.replace(/(https?:\/\/[^\s<>()]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

const plainCommentToHtml = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => {
      const html = linkifyText(escapeHtml(line));
      return html.trim() ? `<p>${html}</p>` : '<p><br></p>';
    })
    .join('');

const stripCommentHtml = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

const hasCommentImage = (value: string) => /<img\b[^>]*\bsrc=(["'])[^"']+\1/i.test(value);

export const isCommentBlank = (value: string) => !hasCommentImage(value) && !stripCommentHtml(value);

export const sanitizeCommentHtml = (value: string) => {
  const html = looksLikeHtml(value) ? value : plainCommentToHtml(value);

  if (typeof document === 'undefined') {
    return html;
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'S', 'STRIKE', 'U', 'CODE', 'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'A', 'IMG']);

  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const element = child as HTMLElement;
      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
        element.remove();
        return;
      }

      if (!allowedTags.has(element.tagName)) {
        const fragment = document.createDocumentFragment();
        while (element.firstChild) fragment.appendChild(element.firstChild);
        element.replaceWith(fragment);
        walk(node);
        return;
      }

      const rawHref = element.tagName === 'A' ? element.getAttribute('href') || '' : '';
      const rawSrc = element.tagName === 'IMG' ? element.getAttribute('src') || '' : '';
      const rawAlt = element.tagName === 'IMG' ? element.getAttribute('alt') || '' : '';
      Array.from(element.attributes).forEach((attr) => element.removeAttribute(attr.name));

      if (element.tagName === 'A') {
        if (/^(https?:|mailto:|tel:)/i.test(rawHref)) {
          element.setAttribute('href', rawHref);
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noopener noreferrer');
        } else {
          const fragment = document.createDocumentFragment();
          while (element.firstChild) fragment.appendChild(element.firstChild);
          element.replaceWith(fragment);
          walk(node);
          return;
        }
      }

      if (element.tagName === 'IMG') {
        if (/^(data:image\/(?:png|jpe?g|gif|webp);base64,|https?:\/\/)/i.test(rawSrc)) {
          element.setAttribute('src', rawSrc);
          if (rawAlt) element.setAttribute('alt', rawAlt.slice(0, 160));
          element.setAttribute('loading', 'lazy');
        } else {
          element.remove();
          return;
        }
      }

      walk(element);
    });
  };

  walk(template.content);
  return template.innerHTML;
};
