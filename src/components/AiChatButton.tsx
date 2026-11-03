import React from 'react';
import { Icon } from './ui/UiExports';
import { AI_ACTION_STYLES as styles } from '../styles/AiActionStyles';

export function AiChatButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  return <button type="button" aria-label="Открыть AI-чат" aria-expanded={open} onClick={onClick} style={styles.trigger()} className="fk-hover-subtle"><Icon name="spark" size={18} />AI</button>;
}
