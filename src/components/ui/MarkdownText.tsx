import React from 'react';
import { T } from '../../styles/Theme';
import { UI } from '../../styles/Styles';
import { typographizeWithNbsp } from '../../lib/Typograf';

export function MarkdownText({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');

  const renderInline = (content: string, lineIndex: number) => {
    const parts = content.split(/(`[^`]+`|\[.*?\]\(.*?\)|\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, partIndex) => {
      const key = `${lineIndex}-${partIndex}`;

      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={key} style={UI.markdown.inlineCode}>{part.slice(1, -1)}</code>;
      }

      if (part.startsWith('[') && part.includes('](')) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          return (
            <a key={key} href={match[2]} target="_blank" rel="noreferrer" className="fk-hover-link" style={UI.layout.textLink}>
              {typographizeWithNbsp(match[1])}
            </a>
          );
        }
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={key} style={UI.layout.strong}>{typographizeWithNbsp(part.slice(2, -2))}</strong>;
      }

      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={key}>{typographizeWithNbsp(part.slice(1, -1))}</em>;
      }

      return <span key={key}>{typographizeWithNbsp(part)}</span>;
    });
  };

  return (
    <div style={UI.markdown.shell}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={UI.markdown.blankLine} />;

        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          return (
            <div key={i} style={UI.markdown.heading(heading[1].length)}>
              {renderInline(heading[2], i)}
            </div>
          );
        }

        const unorderedList = trimmed.match(/^[-*•]\s+(.+)$/);
        const orderedList = trimmed.match(/^\d+[.)]\s+(.+)$/);

        if (unorderedList || orderedList) {
          return (
            <div key={i} style={UI.markdown.line(true)}>
              <span style={UI.layout.bullet}>{orderedList ? '•' : '•'}</span>
              <div style={UI.markdown.listContent}>{renderInline((unorderedList || orderedList)?.[1] || '', i)}</div>
            </div>
          );
        }

        return (
          <div key={i} style={UI.markdown.line(false)}>
            {renderInline(line, i)}
          </div>
        );
      })}
    </div>
  );
}

