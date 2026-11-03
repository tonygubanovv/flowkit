import { isUnsupportedDevice } from '../lib/DeviceSupport';
import React from 'react';
import App from '../App';
import { GLOBAL_STYLES } from '../styles/Styles';
import { AppStatus } from './AppStatus';

export function AppEntry() {
  const unsupported = isUnsupportedDevice({
    userAgent: navigator.userAgent, platform: navigator.platform, maxTouchPoints: navigator.maxTouchPoints,
    coarsePointer: matchMedia('(pointer: coarse)').matches, finePointer: matchMedia('(any-pointer: fine)').matches,
  });
  return <><style>{GLOBAL_STYLES}</style>{unsupported
    ? <AppStatus title="FlowKit доступен на компьютере">Откройте FlowKit на ПК или ноутбуке. Версии для телефонов и планшетов не предусмотрены.</AppStatus>
    : <App />}</>;
}
