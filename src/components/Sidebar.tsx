import React, { useState, useRef } from 'react';
import { UI } from '../styles/Styles';
import { todayStr, genId } from '../lib/Helpers';
import { isDoneTask } from '../lib/TaskDomain';
import { PALETTE } from '../lib/Constants';
import { Project, AppData, ID } from '../types/Schemas';
import { Icon, ContextMenu, Btn, FillPicker, Logo } from './ui/UiExports';

interface SidebarProps {
  data: AppData;
  activeView: string;
  setActiveView: (v: string) => void;
  onAddProject: (project: Project) => void;
  onReorderProjects: (fromId: ID, toId: ID) => void;
  onDelProject: (id: ID) => void;
  onRenameProject: (id: ID, n: string) => void;
  onProjectColorChange: (id: ID, color: string) => void;
  onSettings: () => void;
  isMobile: boolean;
  onClose: () => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

const NoteIcon = ({
  size = 20,
  color = 'currentColor',
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={UI.sidebar.logoSvg}
  >
    <path
      d="M7 3.75H13.75L18.25 8.25V19A1.75 1.75 0 0 1 16.5 20.75H7A1.75 1.75 0 0 1 5.25 19V5.5A1.75 1.75 0 0 1 7 3.75Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M13.5 3.75V8.5H18.25" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8.5 11.25H15.25" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8.5 14.75H14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export function Sidebar({
  data,
  activeView,
  setActiveView,
  onAddProject,
  onReorderProjects,
  onDelProject,
  onRenameProject,
  onProjectColorChange,
  onSettings,
  isMobile,
  onClose,
  collapsed,
  setCollapsed,
}: SidebarProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [hov, setHov] = useState<ID | null>(null);
  const [navHover, setNavHover] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<ID | null>(null);
  const [editingColorId, setEditingColorId] = useState<ID | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; proj: Project } | null>(null);
  const dragProj = useRef<ID | null>(null);
  const [projDragOver, setProjDragOver] = useState<ID | null>(null);

  const todayCnt = data.tasks.filter(
    (task) => !isDoneTask(task, data.projects) && task.deadline && task.deadline <= todayStr(),
  ).length;

  const submitRename = (id: ID) => {
    if (renameVal.trim()) {
      onRenameProject(id, renameVal.trim());
    }
    setRenamingId(null);
  };

  const doAdd = () => {
    if (!name.trim()) return;

    onAddProject({
      id: genId(),
      name: name.trim(),
      color,
      columns: [],
    });

    setName('');
    setColor(PALETTE[0]);
    setAdding(false);

    if (isMobile) onClose();
  };

  const navItems = [
    { id: 'today', lbl: 'Сегодня', icon: 'sun', badge: todayCnt },
    { id: 'calendar', lbl: 'Календарь', icon: 'calendar' },
    { id: 'notes', lbl: 'Заметки', icon: 'note' },
    { id: 'analytics', lbl: 'Аналитика', icon: 'stats' },
  ];

  const renderNavIcon = (item: { id: string; icon: string }, isActive: boolean, size = 18) => {
    const color = isActive ? 'var(--text)' : 'var(--muted)';

    if (item.id === 'notes') {
      return <NoteIcon size={size} color={color} />;
    }

    return <Icon name={item.icon} size={size} color={color} />;
  };

  if (collapsed && !isMobile) {
    return (
      <div style={UI.sidebar.collapsedShell}>
        <button
          onClick={() => setCollapsed(false)}
          style={UI.sidebar.collapsedLogoButton()}
        >
          <Logo size={36} />
        </button>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            onMouseEnter={() => setNavHover(item.id)}
            onMouseLeave={() => setNavHover(null)}
            title={item.lbl}
            style={UI.sidebar.collapsedNavItem(activeView === item.id, navHover === item.id)}
          >
            {renderNavIcon(item, activeView === item.id, 20)}

            {item.id === 'today' && (item.badge || 0) > 0 && (
              <span style={UI.sidebar.collapsedDangerDot} />
            )}
          </button>
        ))}

        <div style={UI.sidebar.spacer} />

        <button
          onClick={() => setCollapsed(false)}
          style={UI.sidebar.collapsedExpandButton()}
        >
          <Icon name="expand" size={20} />
        </button>
      </div>
    );
  }

  return (
    <div style={UI.sidebar.shell}>
      <div style={UI.sidebar.brandBar}>
        <div style={UI.sidebar.brandIdentity}>
          <Logo size={28} />
          <div
            style={UI.sidebar.brandText}
          >
            FlowKit
          </div>
        </div>
      </div>

      <div style={UI.sidebar.navList}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id);
              if (isMobile) onClose();
            }}
            onMouseEnter={() => setNavHover(item.id)}
            onMouseLeave={() => setNavHover(null)}
            style={UI.sidebar.navItem(activeView === item.id, navHover === item.id)}
          >
            {renderNavIcon(item, activeView === item.id, 18)}

            <span style={UI.sidebar.navLabel}>{item.lbl}</span>

            {item.id === 'today' && (item.badge || 0) > 0 && (
              <span
                style={UI.sidebar.badge}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setProjectsOpen((open) => !open)}
        style={UI.sidebar.sectionLabel}
        aria-expanded={projectsOpen}
      >
        <Icon name={projectsOpen ? 'chevD' : 'chevR'} size={13} color="var(--muted)" />
        Проекты
      </button>

      {projectsOpen && (
        <div style={UI.sidebar.projectList}>
          {(data.projectsOrder || data.projects.map((project) => project.id)).map((pid: ID) => {
            const project = data.projects.find((item) => item.id === pid);
            if (!project) return null;

            const total = data.tasks.filter((task) => task.projectId === project.id).length;
            const done = data.tasks.filter(
              (task) => task.projectId === project.id && isDoneTask(task, data.projects),
            ).length;

            const isActive = activeView === project.id;
            const isOver = projDragOver === project.id && dragProj.current !== project.id;

            return (
              <React.Fragment key={project.id}>
                <div
                  draggable
                  onDragStart={() => {
                    dragProj.current = project.id;
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setProjDragOver(project.id);
                  }}
                  onDragLeave={() => setProjDragOver(null)}
                  onDrop={() => {
                    if (dragProj.current && dragProj.current !== project.id) {
                      onReorderProjects(dragProj.current, project.id);
                    }
                    setProjDragOver(null);
                  }}
                  onMouseEnter={() => setHov(project.id)}
                  onMouseLeave={() => setHov(null)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY, proj: project });
                  }}
                  style={UI.sidebar.projectRow(isActive, isOver, hov === project.id)}
                >
                  {renamingId === project.id ? (
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename(project.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onBlur={() => submitRename(project.id)}
                      style={UI.sidebar.renameInput}
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditingColorId((current) => (current === project.id ? null : project.id));
                        }}
                        style={UI.sidebar.projectColorTrigger(project.color, isActive, editingColorId === project.id || hov === project.id)}
                        aria-label={`Изменить цвет проекта ${project.name}`}
                      />
                      <button
                        onClick={() => {
                          setActiveView(project.id);
                          if (isMobile) onClose();
                        }}
                        onDoubleClick={() => {
                          setRenamingId(project.id);
                          setRenameVal(project.name);
                        }}
                        style={UI.sidebar.projectButton(isActive, hov === project.id)}
                      >
                        <span style={UI.sidebar.projectNameState(isActive)}>
                          {project.name}
                        </span>
                        <span style={UI.sidebar.projectCount(hov === project.id || isActive)}>
                          {done}/{total}
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {editingColorId === project.id && (
                  <div style={UI.sidebar.colorPanel}>
                    <div style={UI.sidebar.colorPanelHeader}>
                      <span>Цвет проекта</span>
                      <button
                        type="button"
                        onClick={() => setEditingColorId(null)}
                        className="fk-modal-close"
                        style={UI.sidebar.colorPanelClose}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                    <FillPicker value={project.color} onChange={(nextColor) => onProjectColorChange(project.id, nextColor)} compact />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {adding ? (
            <div
              style={UI.sidebar.addPanel}
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') doAdd();
                  if (e.key === 'Escape') setAdding(false);
                }}
                placeholder="Название..."
                style={UI.sidebar.addInput()}
              />
              <FillPicker value={color} onChange={setColor} compact />
              <div style={UI.sidebar.addActions}>
                <Btn variant="subtle" size="sm" onClick={() => setAdding(false)} style={UI.sidebar.flexButton()}>
                  Отмена
                </Btn>
                <Btn variant="primary" size="sm" onClick={doAdd} style={UI.sidebar.flexButton(true)}>
                  Создать
                </Btn>
              </div>
            </div>
          ) : (
            <div className="fk-sidebar-add-zone" style={UI.sidebar.addZone}>
              <button
                className="fk-sidebar-add-trigger"
                onClick={() => setAdding(true)}
                style={UI.sidebar.addTrigger()}
              >
                <Icon name="plus" size={20} /> Новый проект
              </button>
            </div>
          )}
        </div>
      )}

      {!projectsOpen && <div style={UI.sidebar.spacer} />}

      <div style={UI.sidebar.footer}>
        <button
          onClick={onSettings}
          onMouseEnter={() => setNavHover('settings')}
          onMouseLeave={() => setNavHover(null)}
          style={UI.sidebar.navItem(activeView === 'settings', navHover === 'settings')}
        >
          <Icon name="settings" size={18} color={activeView === 'settings' ? 'var(--text)' : 'var(--muted)'} />
          Настройки
        </button>

        {!isMobile && (
          <div style={UI.sidebar.collapseRow}>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              style={UI.sidebar.collapseToggleButton()}
            >
              <Icon name="collapse" size={16} />
              Свернуть панель
            </button>
          </div>
        )}
      </div>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            {
              icon: 'edit',
              label: 'Переименовать',
              onClick: () => {
                setRenamingId(ctxMenu.proj.id);
                setRenameVal(ctxMenu.proj.name);
                setCtxMenu(null);
              },
            },
            {
              icon: 'dot',
              label: 'Цвет проекта',
              onClick: () => {
                setEditingColorId(ctxMenu.proj.id);
                setCtxMenu(null);
              },
            },
            '---',
            {
              icon: 'trash',
              label: 'Удалить',
              danger: true,
              onClick: () => {
                onDelProject(ctxMenu.proj.id);
                setCtxMenu(null);
              },
            },
          ]}
        />
      )}
    </div>
  );
}
