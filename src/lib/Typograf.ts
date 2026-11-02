import Typograf from 'typograf';

const tp = new Typograf({ locale: ['ru', 'en-US'] });
const tpNbsp = new Typograf({ locale: ['ru', 'en-US'] });

tp.disableRule('ru/optalign/*'); // Убираем span-теги
tp.disableRule('common/html/*'); // Не трогаем разметку Tiptap
tp.setSetting('common/nbsp', 'char', ' '); // Вставляем неразрывный пробел символом

tpNbsp.disableRule('ru/optalign/*');
tpNbsp.disableRule('common/html/*');
tpNbsp.setSetting('common/nbsp', 'char', '\u00A0');

export const typographize = (text: string | null | undefined): string => {
  if (!text) return '';
  try {
    return tp.execute(text);
  } catch (e) {
    return text;
  }
};

export const typographizeWithNbsp = (text: string | null | undefined): string => {
  if (!text) return '';
  try {
    return tpNbsp.execute(text);
  } catch (e) {
    return text;
  }
};
