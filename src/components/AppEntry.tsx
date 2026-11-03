import { isUnsupportedDevice } from '../lib/DeviceSupport';
import React, { useEffect, useState } from 'react';
import App from '../App';
import { GLOBAL_STYLES } from '../styles/Styles';
import { AppStatus } from './AppStatus';

export function AppEntry() {
  const unsupported = isUnsupportedDevice({
    userAgent: navigator.userAgent, platform: navigator.platform, maxTouchPoints: navigator.maxTouchPoints,
    coarsePointer: matchMedia('(pointer: coarse)').matches, finePointer: matchMedia('(any-pointer: fine)').matches,
  });
  const [fontState, setFontState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [fontAttempt, setFontAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setFontState('loading');
    Promise.all([
      document.fonts.load('400 14px Onest', 'FlowKit Задачи'),
      document.fonts.load('700 14px Onest', 'FlowKit Задачи'),
    ]).then((faces) => {
      if (active) setFontState(faces.every((group) => group.length > 0) ? 'ready' : 'error');
    }).catch(() => { if (active) setFontState('error'); });
    return () => { active = false; };
  }, [fontAttempt]);
  const content = fontState === 'loading' ? <AppStatus title="Загрузка FlowKit…" />
    : fontState === 'error' ? <AppStatus title="Не удалось загрузить интерфейс" onRetry={() => setFontAttempt((attempt) => attempt + 1)}>Повторите загрузку страницы.</AppStatus>
    : unsupported ? <AppStatus title="FlowKit доступен на компьютере">Откройте FlowKit на ПК или ноутбуке. Версии для телефонов и планшетов не предусмотрены.</AppStatus>
    : <App />;
  return <><style>{GLOBAL_STYLES}</style>{content}</>;
}
