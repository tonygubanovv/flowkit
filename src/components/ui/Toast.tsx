import React, { useEffect } from 'react';
import { UI } from '../../styles/Styles';
import { Btn } from './Button';
import { Icon } from './Icon';

interface ToastProps {
  message: string;
  onUndo: () => void;
  onClose: () => void;
  bottom?: number;
}

export function Toast({ message, onUndo, onClose, bottom = 24 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={UI.toast.shell(bottom)}>
      <Icon name="undo" size={18} color={'var(--muted)'} />
      <span style={UI.toast.message}>{message}</span>
      <Btn variant="ghost" size="sm" onClick={onUndo} style={UI.toast.undo}>
        Отменить
      </Btn>
    </div>
  );
}

