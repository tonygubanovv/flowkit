import type { MindMapObject } from '../types/Schemas';
import { MIND_MAP_COMMENT_WIDTH } from './MindMaps';

const XML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);

const cssVar = (name: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const resolveColor = (value: string, property: 'color' | 'backgroundColor'): string => {
  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style[property] = value;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved || value;
};

let canvas: CanvasRenderingContext2D | null = null;

const measure = (text: string, font: string): number => {
  if (!canvas) canvas = document.createElement('canvas').getContext('2d');
  if (!canvas) return text.length * 7;
  canvas.font = font;
  return canvas.measureText(text).width;
};

const wrapLines = (text: string, maxWidth: number, font: string): string[] => {
  const lines: string[] = [];
  text.split('\n').forEach((paragraph) => {
    if (!paragraph.trim()) { lines.push(''); return; }
    let line = '';
    paragraph.split(/\s+/).forEach((word) => {
      if (!line) {
        if (measure(word, font) <= maxWidth) { line = word; return; }
        let chunk = '';
        for (const char of word) {
          if (chunk && measure(chunk + char, font) > maxWidth) { lines.push(chunk); chunk = char; }
          else chunk += char;
        }
        line = chunk;
        return;
      }
      const candidate = `${line} ${word}`;
      if (measure(candidate, font) <= maxWidth) { line = candidate; return; }
      lines.push(line);
      line = word;
    });
    if (line) lines.push(line);
  });
  return lines.length ? lines : [''];
};

interface Box { minX: number; minY: number; maxX: number; maxY: number }

export interface BoardObjectsSvg { markup: string; box: Box }

export const buildObjectsSvg = (objects: MindMapObject[], origin: { x: number; y: number }): BoardObjectsSvg => {
  const family = cssVar('--font-family', 'system-ui, sans-serif');
  const textColor = resolveColor(cssVar('--text', '#e8e8e8'), 'color');
  const card = resolveColor(cssVar('--card', '#1b1d21'), 'backgroundColor');
  const border = resolveColor(cssVar('--border', '#2c2f36'), 'backgroundColor');
  const accent = resolveColor(cssVar('--accent', '#4c8dff'), 'backgroundColor');
  const surface = resolveColor(cssVar('--card-act', '#23262c'), 'backgroundColor');

  const parts: string[] = [];
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const grow = (x: number, y: number, w: number, h: number) => {
    box.minX = Math.min(box.minX, x);
    box.minY = Math.min(box.minY, y);
    box.maxX = Math.max(box.maxX, x + w);
    box.maxY = Math.max(box.maxY, y + h);
  };

  objects.forEach((object) => {
    const x = Math.round(object.x - origin.x);
    const y = Math.round(object.y - origin.y);
    if (object.kind === 'shape') {
      const w = Math.round(object.w || 220);
      const h = Math.round(object.h || 130);
      const fill = object.color ? resolveColor(`color-mix(in srgb, ${object.color} 14%, ${surface})`, 'backgroundColor') : surface;
      const stroke = object.color || border;
      parts.push(object.shape === 'ellipse'
        ? `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`
        : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`);
      grow(x, y, w, h);
      return;
    }

    const size = object.kind === 'comment' ? 12 : (object.size || 15);
    const font = `${size}px ${family}`;
    const lineHeight = Math.round(size * (object.kind === 'comment' ? 1.45 : 1.4));
    const half = Math.round((lineHeight - size) / 2);

    if (object.kind === 'comment') {
      const pin = object.color || accent;
      parts.push(`<path d="M${x} ${y + 28} L${x} ${y + 14} A14 14 0 0 1 ${x + 14} ${y} A14 14 0 0 1 ${x + 28} ${y + 14} A14 14 0 0 1 ${x + 14} ${y + 28} Z" fill="${pin}"/>`);
      // Карточка на экране живёт в `width: max-content; max-width`, поэтому перенос считаем от той же ширины.
      const natural = Math.round(Math.max(0, ...object.text.split('\n').map((line) => measure(line, font)))) + 22;
      const width = Math.min(natural, MIND_MAP_COMMENT_WIDTH);
      const lines = wrapLines(object.text, width - 22, font);
      const height = lines.length * lineHeight + 18;
      const cardX = x + 34;
      parts.push(`<rect x="${cardX}" y="${y}" width="${width}" height="${height}" rx="8" fill="${card}" stroke="${border}" stroke-width="1"/>`);
      const textX = cardX + 11;
      const spans = lines.map((line, index) =>
        `<tspan x="${textX}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join('');
      parts.push(`<text x="${textX}" y="${y + 9 + half + size}" font-family="${escapeXml(family)}" font-size="${size}" fill="${textColor}">${spans}</text>`);
      grow(x, y, 34 + width, Math.max(28, height));
      return;
    }

    const lines = object.text.split('\n');
    const width = Math.round(Math.max(0, ...lines.map((line) => measure(line, font))));
    const spans = lines.map((line, index) =>
      `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join('');
    parts.push(`<text x="${x}" y="${y + 2 + half + size}" font-family="${escapeXml(family)}" font-size="${size}" fill="${object.color || textColor}">${spans}</text>`);
    grow(x, y, width, lines.length * lineHeight + 4);
  });

  if (!parts.length) return { markup: '', box: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
  return { markup: parts.join(''), box };
};

export const patchBoardSvg = (
  svg: string,
  objects: MindMapObject[],
  origin: { x: number; y: number },
  tree: Box,
): string => {
  if (!objects.length) return svg;
  const { markup, box } = buildObjectsSvg(objects, origin);
  if (!markup) return svg;

  const minX = Math.min(tree.minX, box.minX);
  const minY = Math.min(tree.minY, box.minY);
  const maxX = Math.max(tree.maxX, box.maxX);
  const maxY = Math.max(tree.maxY, box.maxY);
  const width = Math.ceil(maxX - minX) + 200;
  const height = Math.ceil(maxY - minY) + 200;
  const shiftX = 100 - Math.floor(minX);
  const shiftY = 100 - Math.floor(minY);

  let result = svg
    .replace(/(<svg\b[^>]*?)\sheight="[^"]*"/, `$1 height="${height}px"`)
    .replace(/(<svg\b[^>]*?)\swidth="[^"]*"/, `$1 width="${width}px"`);

  const background = result.indexOf('<rect');
  if (background >= 0) {
    const end = result.indexOf('>', background);
    const tag = result.slice(background, end)
      .replace(/width="[^"]*"/, `width="${width}"`)
      .replace(/height="[^"]*"/, `height="${height}"`);
    result = result.slice(0, background) + tag + result.slice(end);
  }

  // Движок сдвигает содержимое вложенным <svg x="100" y="100">; его смещение меняем, чтобы в кадр попали все объекты.
  const shifted = result.replace(/<svg x="100" y="100" overflow="visible">/, `<svg x="${shiftX}" y="${shiftY}" overflow="visible">`);
  result = shifted === result
    ? result.replace(/<g x="100" y="100" overflow="visible">/, `<g transform="translate(${shiftX},${shiftY})" overflow="visible">`)
    : shifted;

  const closing = result.lastIndexOf('</svg></svg>');
  if (closing >= 0) return result.slice(0, closing) + markup + result.slice(closing);
  const index = result.lastIndexOf('</g></svg>');
  if (index >= 0) return result.slice(0, index) + markup + result.slice(index);
  return result;
};
