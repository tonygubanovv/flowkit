import React, { useEffect, useRef } from 'react';
import { AI_CHAT_STYLES as styles, CHAT_BACKGROUND_CSS } from '../styles/AiChatStyles';

export function ChatBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = ref.current;
    const panel = layer?.parentElement;
    if (!layer || !panel) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (event.target instanceof Element && event.target.closest('[data-chat-message], button, input, textarea')) {
        leave();
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = panel.getBoundingClientRect();
        layer.style.setProperty('--chat-pointer-x', `${event.clientX - rect.left}px`);
        layer.style.setProperty('--chat-pointer-y', `${event.clientY - rect.top}px`);
        layer.style.setProperty('--chat-pointer-visible', '1');
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      layer.style.setProperty('--chat-pointer-visible', '0');
    };
    panel.addEventListener('pointermove', move);
    panel.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      panel.removeEventListener('pointermove', move);
      panel.removeEventListener('pointerleave', leave);
    };
  }, []);
  return <><style>{CHAT_BACKGROUND_CSS}</style><div ref={ref} className="fk-chat-dotfield" style={styles.backdrop} aria-hidden="true" /></>;
}
