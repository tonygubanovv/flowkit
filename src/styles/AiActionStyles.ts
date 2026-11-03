import { CSSProperties } from 'react';
import { UI } from './Styles';

export const AI_ACTION_STYLES = {
  trigger: (): CSSProperties => UI.control.button('subtle', 'md', false, UI.app.aiAction),
  menu: { ...UI.modal.popover({}), position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 210, padding: 6, zIndex: 1000 } as CSSProperties,
};
