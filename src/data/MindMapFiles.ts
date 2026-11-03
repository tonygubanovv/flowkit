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
