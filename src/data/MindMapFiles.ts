import { MIND_MAP_FILE_LIMIT, MIND_MAP_TOTAL_LIMIT } from '../lib/MindMaps';

export const readMindMapFile = async (file: File, usedBytes: number): Promise<string> => {
  if (file.size > MIND_MAP_FILE_LIMIT) throw new Error('Максимальный размер файла — 5 МБ.');
  if (usedBytes + file.size > MIND_MAP_TOTAL_LIMIT) throw new Error('Вложения одной карты могут занимать до 20 МБ.');
  if (file.type === 'application/pdf') {
    const header = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
    if (header !== '%PDF-') throw new Error('Этот файл не является PDF.');
  } else if (['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
    const bitmap = await createImageBitmap(file);
    const tooLarge = bitmap.width * bitmap.height > 24000000;
    bitmap.close();
    if (tooLarge) throw new Error('Изображение слишком большое. Уменьшите его до 24 мегапикселей.');
  } else throw new Error('Поддерживаются PNG, JPEG, WebP, GIF и PDF.');
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Не удалось прочитать файл.'));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
    reader.readAsDataURL(file);
  });
};

export const mindMapPdfBlob = (dataUrl: string): Blob => {
  const bytes = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  return new Blob([Uint8Array.from(bytes, (character) => character.charCodeAt(0))], { type: 'application/pdf' });
};

const PNG_MAX_EDGE = 8000;

/** Mind Elixir writes the canvas background straight from its theme, so CSS variables survive into the exported file. */
const resolveSvgVars = (svg: string): string =>
  svg.split('var(--bg)').join(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff');

export const mindMapSvgBlob = async (svg: Blob): Promise<Blob> =>
  new Blob([resolveSvgVars(await svg.text())], { type: 'image/svg+xml' });

export const mindMapPngBlob = async (svg: Blob): Promise<Blob> => {
  const url = URL.createObjectURL(await mindMapSvgBlob(svg));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Не удалось собрать изображение доски.'));
      image.src = url;
    });
    const ratio = Math.min(2, PNG_MAX_EDGE / Math.max(image.width, image.height, 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * ratio);
    canvas.height = Math.round(image.height * ratio);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Не удалось собрать изображение доски.');
    context.scale(ratio, ratio);
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error('Не удалось сохранить PNG.')), 'image/png', 1));
  } finally { URL.revokeObjectURL(url); }
};

export const downloadMindMapFile = (name: string, blob: Blob): void => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
};

