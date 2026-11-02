import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, Editor, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { CodeBlock } from "@tiptap/extension-code-block";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

import { FONT_FAMILY, RAW_COLORS, T, withAlpha } from "../styles/Theme";
import { UI } from "../styles/Styles";
import { CodeBlockWithCopy } from "./CodeBlockWithCopy";

const CodeBlockWithCopyExtension = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: "text",
        parseHTML: (element) =>
          element.getAttribute("data-language") ||
          element.querySelector("code")?.className?.replace(/^language-/, "") ||
          "text",
        renderHTML: (attributes) => ({
          "data-language": attributes.language || "text",
          class: `language-${attributes.language || "text"}`,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const language = HTMLAttributes["data-language"] || "text";
    return [
      "pre",
      { "data-language": language, class: "fk-code-output" },
      ["code", { class: `language-${language}` }, 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockWithCopy);
  },
});

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichEditor({
  content,
  onChange,
  placeholder = "Начни писать (поддерживается Markdown)...",
}: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const editorShellRef = useRef<HTMLDivElement>(null);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [tableSize, setTableSize] = useState({ rows: 3, cols: 3 });

  const handleImageUpload = (file: File, editorInstance: Editor) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      editorInstance.chain().focus().setImage({ src: reader.result as string }).run();
    };
    reader.readAsDataURL(file);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockWithCopyExtension,
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({ inline: true, allowBase64: true }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        const link = target.closest("a");
        if (!link) return false;

        if (event.ctrlKey || event.metaKey) {
          window.open(link.href, "_blank");
          return true;
        }

        event.preventDefault();
        return false;
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.indexOf("image") === 0) {
            const file = item.getAsFile();
            if (file && editor) {
              handleImageUpload(file, editor);
              event.preventDefault();
              return true;
            }
          }
        }

        const rawText = event.clipboardData?.getData("text/plain");
        const html = event.clipboardData?.getData("text/html");

        if (
          html &&
          (html.includes("<a ") || html.includes("<p") || html.includes("<li") || html.includes("<table"))
        ) {
          return false;
        }

        if (!rawText || !editor) return false;

        let processed = rawText.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");

        processed = processed.replace(
          /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
          '<a href="$2">$1</a>',
        );
        processed = processed.replace(
          /([^.,;!?\n(]{1,100}?)\s*\((https?:\/\/[^\s)]+)\)/g,
          (_match, p1, p2) => `<a href="${p2}">${p1.trim()}</a>`,
        );

        const parts = processed.split(/(<a\b[^>]*>.*?<\/a>)/gi);
        for (let i = 0; i < parts.length; i++) {
          if (!parts[i].toLowerCase().startsWith("<a")) {
            parts[i] = parts[i].replace(/(https?:\/\/[^\s<>()]+)/g, '<a href="$1">$1</a>');
          }
        }
        processed = parts.join("");

        const htmlStr = processed
          .split(/\r?\n/)
          .map((line) => {
            const trimmed = line.trim();
            if (/^([-*_])(?:\s*\1){2,}$/.test(trimmed)) return "<hr>";
            return trimmed ? `<p>${trimmed}</p>` : "<p><br></p>";
          })
          .join("");

        event.preventDefault();
        setTimeout(() => editor.commands.insertContent(htmlStr), 0);
        return true;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  useEffect(() => {
    if (!headingMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (headingMenuRef.current && !headingMenuRef.current.contains(event.target as Node)) {
        setHeadingMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [headingMenuOpen]);

  useEffect(() => {
    if (!tableMenuOpen) {
      setTableSize({ rows: 3, cols: 3 });
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setTableMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tableMenuOpen]);

  useEffect(() => {
    if (!editor) return;

    const syncTables = () => {
      const shell = editorShellRef.current;
      const content = shell?.querySelector(".ProseMirror");
      if (!content) return;

      const wrapperWidth = content.clientWidth;
      const tables = content.querySelectorAll("table");

      tables.forEach((table) => {
        const firstRow = table.querySelector("tr");
        const cols = firstRow ? firstRow.children.length : 0;
        const minTableWidth = Math.max(wrapperWidth, cols * 148);

        table.setAttribute("data-cols", String(cols));
        table.style.width = cols <= 3 ? "100%" : `${minTableWidth}px`;
      });
    };

    syncTables();
    const timeout = window.setTimeout(syncTables, 0);
    window.addEventListener("resize", syncTables);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", syncTables);
    };
  }, [editor, content]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Введи URL ссылки:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const inTable = editor.isActive("table");
  const canModifyTable = inTable && editor.isEditable;
  const activeHeading = editor.isActive("heading", { level: 1 })
    ? "H1"
    : editor.isActive("heading", { level: 2 })
      ? "H2"
      : editor.isActive("heading", { level: 3 })
        ? "H3"
        : "H";

  const runTableCommand = (action: () => boolean) => {
    action();
    editor.commands.focus();
    setTableMenuOpen(false);
  };

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    editor.commands.focus();
    setTableMenuOpen(false);
  };

  const setHeading = (level: 1 | 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
    setHeadingMenuOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) handleImageUpload(file, editor);
    if (e.target) e.target.value = "";
  };

  const LinkIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
  const ImageIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
  const ListIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
  const OrderedListIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
  const EraserIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  );
  const TableIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
    </svg>
  );
  const QuoteIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 11H6a4 4 0 0 1 4-4V5a6 6 0 0 0-6 6v7h6z" />
      <path d="M20 11h-4a4 4 0 0 1 4-4V5a6 6 0 0 0-6 6v7h6z" />
    </svg>
  );
  const CodeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </svg>
  );

  const tableButtonStyle = (active = false, disabled = false) =>
    UI.richEditor.button(active, disabled ? { opacity: 0.4, cursor: "default" } : undefined);

  const tableMenuItemStyle = (danger = false, disabled = false): React.CSSProperties => ({
    width: "100%",
    padding: "10px 12px",
    border: "none",
    borderRadius: 10,
    background: "transparent",
    color: disabled ? T.muted : danger ? T.danger : T.text,
    textAlign: "left",
    fontSize: 13,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1,
  });

  return (
    <div style={UI.richEditor.shell}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={UI.richEditor.hiddenInput}
      />

      <div style={UI.richEditor.toolbar}>
        <button className="fk-hover-subtle" onClick={() => editor.chain().focus().toggleBold().run()} style={UI.richEditor.button(editor.isActive("bold"))}>B</button>
        <button className="fk-hover-subtle" onClick={() => editor.chain().focus().toggleUnderline().run()} style={UI.richEditor.buttonUnderline(editor.isActive("underline"))}>U</button>
        <button className="fk-hover-subtle" onClick={() => editor.chain().focus().toggleStrike().run()} style={UI.richEditor.buttonStrike(editor.isActive("strike"))}>S</button>

        <div style={UI.richEditor.separator} />

        <div ref={headingMenuRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            type="button"
            className="fk-hover-subtle"
            onClick={() => setHeadingMenuOpen((open) => !open)}
            style={UI.richEditor.buttonHeading(editor.isActive("heading") || headingMenuOpen)}
            title="Заголовок"
          >
            {activeHeading}
          </button>
          {headingMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 50,
                width: 118,
                padding: 6,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                borderRadius: 10,
                border: `1px solid ${T.border2}`,
                background: withAlpha(T.card, "F5"),
                boxShadow: T.shadowLg,
                backdropFilter: "blur(14px)",
              }}
            >
              {([1, 2, 3] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setHeading(level)}
                  className="fk-hover-subtle"
                  style={{
                    width: "100%",
                    height: 30,
                    padding: "0 8px",
                    border: "none",
                    borderRadius: 7,
                    background: editor.isActive("heading", { level }) ? T.accentDim : "transparent",
                    color: editor.isActive("heading", { level }) ? T.accent : T.text2,
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  H{level}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={UI.richEditor.separator} />

        <button className="fk-hover-subtle" onClick={setLink} style={UI.richEditor.button(editor.isActive("link"))} title="Добавить ссылку"><LinkIcon /></button>
        <button className="fk-hover-subtle" onClick={triggerFileInput} style={UI.richEditor.button(false)} title="Загрузить картинку"><ImageIcon /></button>

        <div style={UI.richEditor.separator} />

        <button className="fk-hover-subtle" onClick={() => editor.chain().focus().toggleBulletList().run()} style={UI.richEditor.button(editor.isActive("bulletList"))}><ListIcon /></button>
        <button className="fk-hover-subtle" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={UI.richEditor.button(editor.isActive("orderedList"))}><OrderedListIcon /></button>

        <div style={UI.richEditor.separator} />

        <button className="fk-hover-subtle" onClick={() => editor.chain().focus().toggleBlockquote().run()} style={UI.richEditor.button(editor.isActive("blockquote"))} title="Цитата"><QuoteIcon /></button>
        <button className="fk-hover-subtle" onClick={() => editor.chain().focus().toggleCodeBlock({ language: "javascript" }).run()} style={UI.richEditor.button(editor.isActive("codeBlock"))} title="Блок кода"><CodeIcon /></button>

        <div style={UI.richEditor.separator} />

        <button className="fk-hover-subtle" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} style={UI.richEditor.button(false)} title="Очистить форматирование"><EraserIcon /></button>

        <div style={UI.richEditor.separator} />

        <div ref={tableMenuRef} style={{ position: "relative" }}>
          <button className="fk-hover-subtle" onClick={() => setTableMenuOpen((open) => !open)} style={tableButtonStyle(inTable || tableMenuOpen)} title="Таблица">
            <TableIcon />
          </button>

          {tableMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 50,
                width: 236,
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                borderRadius: 14,
                border: `1px solid ${T.border2}`,
                background: withAlpha(T.card, "F2"),
                boxShadow: T.shadowLg,
                backdropFilter: "blur(14px)",
              }}
            >
              <div
                style={{
                  padding: "8px 10px 10px",
                  borderRadius: 10,
                  background: withAlpha(T.bg, "55"),
                  border: `1px solid ${T.border}`,
                }}
              >
                <div style={{ color: T.text2, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  {tableSize.cols} × {tableSize.rows}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
                  {Array.from({ length: 36 }).map((_, index) => {
                    const col = (index % 6) + 1;
                    const row = Math.floor(index / 6) + 1;
                    const active = col <= tableSize.cols && row <= tableSize.rows;

                    return (
                      <button
                        key={`${row}-${col}`}
                        type="button"
                        onMouseEnter={() => setTableSize({ rows: row, cols: col })}
                        onFocus={() => setTableSize({ rows: row, cols: col })}
                        onClick={() => insertTable(row, col)}
                        style={{
                          width: 22,
                          height: 22,
                          padding: 0,
                          borderRadius: 6,
                          border: `1px solid ${active ? T.accent : T.border2}`,
                          background: active ? withAlpha(T.accent, "22") : "transparent",
                          cursor: "pointer",
                        }}
                        title={`${col} × ${row}`}
                      />
                    );
                  })}
                </div>
              </div>

              <button onClick={() => runTableCommand(() => editor.chain().focus().addColumnAfter().run())} style={tableMenuItemStyle(false, !canModifyTable)} className={canModifyTable ? "fk-hover-subtle" : undefined} disabled={!canModifyTable}>
                Добавить колонку
              </button>
              <button onClick={() => runTableCommand(() => editor.chain().focus().addRowAfter().run())} style={tableMenuItemStyle(false, !canModifyTable)} className={canModifyTable ? "fk-hover-subtle" : undefined} disabled={!canModifyTable}>
                Добавить строку
              </button>
              <button onClick={() => runTableCommand(() => editor.chain().focus().toggleHeaderColumn().run())} style={tableMenuItemStyle(false, !canModifyTable)} className={canModifyTable ? "fk-hover-subtle" : undefined} disabled={!canModifyTable}>
                Сделать главной колонку
              </button>
              <button onClick={() => runTableCommand(() => editor.chain().focus().toggleHeaderRow().run())} style={tableMenuItemStyle(false, !canModifyTable)} className={canModifyTable ? "fk-hover-subtle" : undefined} disabled={!canModifyTable}>
                Сделать главной строку
              </button>
              <button onClick={() => runTableCommand(() => editor.chain().focus().deleteColumn().run())} style={tableMenuItemStyle(false, !canModifyTable)} className={canModifyTable ? "fk-hover-subtle" : undefined} disabled={!canModifyTable}>
                Удалить колонку
              </button>
              <button onClick={() => runTableCommand(() => editor.chain().focus().deleteRow().run())} style={tableMenuItemStyle(false, !canModifyTable)} className={canModifyTable ? "fk-hover-subtle" : undefined} disabled={!canModifyTable}>
                Удалить строку
              </button>

              <div style={{ height: 1, margin: "2px 4px", background: T.border2 }} />

              <button onClick={() => runTableCommand(() => editor.chain().focus().deleteTable().run())} style={tableMenuItemStyle(true, !canModifyTable)} className={canModifyTable ? "fk-hover-subtle" : undefined} disabled={!canModifyTable}>
                Удалить таблицу
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={editorShellRef}
        style={UI.richEditor.editorShell}
        onClick={(e) => {
          if (e.target === e.currentTarget) editor.commands.focus("end");
        }}
      >
        <style>{`
          .ProseMirror {
            outline: none;
            line-height: 1.55;
            font-size: 14.5px;
            font-weight: 500;
            font-family: ${FONT_FAMILY};
            color: ${T.text};
            min-height: 24px;
          }

          .ProseMirror strong, .ProseMirror b { font-weight: 800; color: ${RAW_COLORS.white}; }
          .ProseMirror p { margin: 0 0 0.58em; }
          .ProseMirror p:last-child { margin-bottom: 0; }
          .ProseMirror p:has(> br:only-child) { min-height: 0.45em; margin-bottom: 0.35em; }
          .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { line-height: 1.2; font-weight: 800; color: ${T.text}; }
          .ProseMirror h1:first-child, .ProseMirror h2:first-child, .ProseMirror h3:first-child { margin-top: 0; }
          .ProseMirror h1 { font-size: 24px; margin: 1.15em 0 0.5em; }
          .ProseMirror h2 { font-size: 20px; margin: 1.05em 0 0.45em; }
          .ProseMirror h3 { font-size: 17px; margin: 0.95em 0 0.4em; }
          .ProseMirror hr { border: 0; border-top: 1px solid ${T.border2}; margin: 14px 0 16px; height: 0; }
          .ProseMirror hr.ProseMirror-selectednode { border-top-color: ${T.accent}; box-shadow: 0 1px 0 ${T.accentDim}; }
          .ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin: 0 0 0.65em; }
          .ProseMirror ul { list-style-type: disc; }
          .ProseMirror ol { list-style-type: decimal; }
          .ProseMirror li { margin-bottom: 0.3em; }
          .ProseMirror li:last-child { margin-bottom: 0; }
          .ProseMirror li p { margin-bottom: 0.25em; }
          .ProseMirror li p:last-child { margin-bottom: 0; }
          .ProseMirror blockquote {
            margin: 10px 0;
            padding: 9px 12px 9px 14px;
            border-left: 3px solid ${T.accent};
            border-radius: 0 8px 8px 0;
            background: color-mix(in srgb, ${T.accent} 10%, transparent);
            color: ${T.text2};
          }
          .ProseMirror blockquote p {
            margin: 0 0 0.4em;
          }
          .ProseMirror blockquote p:last-child {
            margin-bottom: 0;
          }
          .ProseMirror img { display: block; max-width: 100%; height: auto; border-radius: 8px; border: 1px solid ${T.border}; margin: 14px 0; }
          .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: ${T.muted}; pointer-events: none; height: 0; }

          .ProseMirror .tableWrapper {
            margin: 10px 0;
            overflow-x: auto;
            overflow-y: hidden;
            width: 100%;
            padding-bottom: 2px;
          }

          .ProseMirror table {
            width: 100%;
            min-width: 100%;
            border-collapse: collapse;
            table-layout: auto;
            border: 1px solid ${T.border2};
            border-radius: 8px;
            overflow: hidden;
            background: ${withAlpha(T.card, "C8")};
            font-size: 13px;
            line-height: 1.38;
          }

          .ProseMirror th,
          .ProseMirror td {
            position: relative;
            min-width: 112px;
            max-width: 320px;
            padding: 7px 9px;
            vertical-align: top;
            border: 1px solid ${T.border2};
            text-align: left;
            white-space: normal;
            word-break: normal;
            overflow-wrap: break-word;
          }

          .ProseMirror th {
            font-weight: 750;
            color: ${RAW_COLORS.white};
            background: ${withAlpha(T.accent, "12")};
          }

          .ProseMirror table[data-cols="1"] th,
          .ProseMirror table[data-cols="1"] td {
            width: 100%;
          }

          .ProseMirror table[data-cols="2"] th,
          .ProseMirror table[data-cols="2"] td {
            width: 50%;
          }

          .ProseMirror table[data-cols="3"] th,
          .ProseMirror table[data-cols="3"] td {
            width: 33.3333%;
          }

          .ProseMirror td p,
          .ProseMirror th p {
            margin: 0;
            line-height: inherit;
          }

          .ProseMirror .selectedCell::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: ${withAlpha(T.accent, "18")};
          }

          .ProseMirror .column-resize-handle {
            position: absolute;
            top: 0;
            right: -2px;
            bottom: -2px;
            width: 4px;
            background: ${T.accent};
            pointer-events: none;
          }

          .ProseMirror a {
            color: ${T.accent};
            text-decoration: underline;
            text-underline-offset: 3px;
            text-decoration-color: ${withAlpha(T.accent, "66")};
            font-weight: 500;
            opacity: 0.92;
            transition: opacity 0.12s ease;
            cursor: pointer;
            word-wrap: break-word;
            word-break: break-word;
          }
          .ProseMirror a:hover {
            opacity: 0.78;
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
