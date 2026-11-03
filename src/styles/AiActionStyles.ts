import { CSSProperties } from 'react';
import { UI } from './Styles';

export const AI_ACTION_STYLES = {
  trigger: (): CSSProperties => UI.control.button('subtle', 'md', false, UI.app.aiAction),
};
