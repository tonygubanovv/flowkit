import React, { useState } from 'react';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { normalizeCodeLanguage } from '../lib/CodeHighlight';
import { T } from '../styles/Theme';

const languages = ['text', 'javascript', 'typescript', 'tsx', 'python', 'html', 'css', 'json', 'bash', 'sql'];

export function CodeBlockWithCopy({ node, updateAttributes }: NodeViewProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const language = normalizeCodeLanguage(node.attrs.language);
  const code = node.textContent || '';

  const copyCode = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <NodeViewWrapper className={`fk-code-block ${collapsed ? 'fk-code-block-collapsed' : ''}`} data-language={language}>
      <div className="fk-code-toolbar" contentEditable={false}>
        <select
          className="fk-code-language"
          value={language}
          onChange={(event) => updateAttributes({ language: event.target.value })}
          title="Язык кода"
        >
          {languages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="fk-code-actions">
          <button
            type="button"
            className="fk-code-icon-button"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? 'Развернуть код' : 'Свернуть код'}
            aria-label={collapsed ? 'Развернуть код' : 'Свернуть код'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? <path d="m6 9 6 6 6-6" /> : <path d="m18 15-6-6-6 6" />}
            </svg>
          </button>
          <button
            type="button"
            className={`fk-code-icon-button ${copied ? 'fk-code-icon-button-done' : ''}`}
            onClick={copyCode}
            title={copied ? 'Скопировано' : 'Копировать код'}
            aria-label={copied ? 'Скопировано' : 'Копировать код'}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <pre className="fk-code-pre">
        <NodeViewContent className="fk-code-content" />
      </pre>

      <style>{`
        .fk-code-block {
          margin: 12px 0;
          overflow: hidden;
          border: 1px solid ${T.border2};
          border-left: 3px solid color-mix(in srgb, ${T.accent} 82%, transparent);
          border-radius: 8px;
          background: color-mix(in srgb, var(--bg) 86%, transparent);
          box-shadow: 0 8px 20px rgba(0,0,0,0.14);
        }

        .fk-code-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          height: 34px;
          padding: 5px 6px 5px 10px;
          border-bottom: 1px solid ${T.border};
          background: rgba(255,255,255,0.035);
        }

        .fk-code-actions {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex: 0 0 auto;
        }

        .fk-code-language {
          width: 118px;
          height: 24px;
          padding: 0 6px;
          border: 1px solid ${T.border};
          border-radius: 7px;
          outline: none;
          background: rgba(255,255,255,0.035);
          color: ${T.text2};
          font-size: 11px;
          font-weight: 750;
          font-family: var(--font-family);
        }

        .fk-code-icon-button {
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          padding: 0;
          border: 1px solid ${T.border};
          border-radius: 7px;
          background: transparent;
          color: ${T.text2};
          cursor: pointer;
        }

        .fk-code-icon-button:hover,
        .fk-code-language:hover {
          border-color: ${T.border2};
          color: ${T.text};
          background: rgba(255,255,255,0.065);
        }

        .fk-code-icon-button-done {
          color: ${T.accent};
          border-color: color-mix(in srgb, ${T.accent} 52%, transparent);
          background: color-mix(in srgb, ${T.accent} 10%, transparent);
        }

        .fk-code-pre {
          margin: 0;
          min-height: 46px;
          max-height: 340px;
          overflow: auto;
          padding: 12px 13px;
          background: transparent;
          color: #dde3ec;
          font-size: 12.5px;
          line-height: 1.55;
          tab-size: 2;
          white-space: pre-wrap;
          word-break: normal;
          overflow-wrap: anywhere;
          font-family: var(--font-mono);
        }

        .fk-code-content {
          display: block;
          min-height: 20px;
          outline: none;
          white-space: pre-wrap;
          font: inherit;
          line-height: inherit;
          tab-size: inherit;
          color: inherit;
          caret-color: ${T.text};
        }

        .fk-code-block-collapsed .fk-code-pre {
          max-height: 76px;
          overflow: hidden;
        }
      `}</style>
    </NodeViewWrapper>
  );
}
