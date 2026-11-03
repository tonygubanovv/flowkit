import React from 'react';
import { APP_STATUS_STYLES as styles } from '../styles/AppStatusStyles';
import { Btn } from './ui/Button';

export function AppStatus({ title, children, onRetry, embedded = false }: { title: string; embedded?: boolean; children?: React.ReactNode; onRetry?: () => void }) {
  return <main style={embedded ? styles.embedded : styles.page}><div style={styles.content}>
    <h1 style={styles.title}>{title}</h1>
    {children && <div style={styles.text}>{children}</div>}
    {onRetry && <div style={styles.actions}><Btn variant="subtle" onClick={onRetry}>Попробовать снова</Btn></div>}
  </div></main>;
}

export function StorageNotice({ onRetry, onExport }: { onRetry: () => void; onExport: () => void }) {
  return <div role="alert" style={styles.notice}>
    <span>Не удалось сохранить изменения. Они остаются в открытом приложении.</span>
    <Btn variant="subtle" size="sm" onClick={onRetry}>Повторить</Btn>
    <Btn variant="ghost" size="sm" onClick={onExport}>Скачать копию</Btn>
  </div>;
}
