import React, { useEffect, useMemo, useRef, useState } from 'react';
import { T } from '../../styles/Theme';
import { UI } from '../../styles/Styles';
import { genId } from '../../lib/Helpers';
import { PALETTE } from '../../lib/Constants';
import { Project } from '../../types/Schemas';
import { Btn, Icon, SI, FillPicker } from '../ui/UiExports';
import { innerDesk, innerMob, wrapDesk, wrapMob } from './Shared';
interface ProjModalProps {
  project?: Project;
  onSave: (p: Project) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export function ProjModal({ project, onSave, onClose, isMobile }: ProjModalProps) {
  const [proj, setProj] = useState<Project | null>(
    project ? { ...project, columns: project.columns.map(c => ({ ...c })) } : null
  );
  const [n, setN] = useState('');

  if (!proj) return null;

  const addCol = () => {
    if (!n.trim()) return;
    setProj(p => {
      if (!p) return null;
      return { 
        ...p, 
        columns: [...p.columns, { id: genId(), name: n.trim(), color: PALETTE[p.columns.length % PALETTE.length] }] 
      };
    });
    setN('');
  };

  const wrap = isMobile ? wrapMob : wrapDesk;
  const inner = UI.projectModal.shell(isMobile ? innerMob : innerDesk, !!isMobile);

  return (
    <div style={wrap} onMouseDown={!isMobile ? e => e.target === e.currentTarget && onClose() : undefined}>
      <div style={inner} onMouseDown={e => e.stopPropagation()}>
        <div style={UI.projectModal.header}>
          <span style={UI.projectModal.title}>Колонки — {proj.name}</span>
          <button onClick={onClose} className="fk-modal-close" style={UI.modal.closeButton}>
            <Icon name="x" size={18}/>
          </button>
        </div>

        <div style={UI.projectModal.body}>
          <div style={UI.projectModal.columns}>
            {proj.columns.map((col) => (
              <div key={col.id} style={UI.projectModal.columnCard}>
                <div style={UI.projectModal.columnRow}>
                  <div style={UI.projectModal.fillEditor}>
                    <FillPicker value={col.color} onChange={(nextColor) => setProj(p => p ? ({ ...p, columns: p.columns.map(c => c.id === col.id ? { ...c, color: nextColor } : c) }) : null)} compact />
                  </div>
                  <input value={col.name} onChange={e => setProj(p => p ? ({ ...p, columns: p.columns.map(c => c.id === col.id ? { ...c, name: e.target.value } : c) }) : null)} style={UI.projectModal.columnInput} />
                  <button onClick={() => setProj(p => p ? ({ ...p, columns: p.columns.filter(c => c.id !== col.id) }) : null)} className="fk-modal-icon-danger" style={UI.settings.deleteButton}><Icon name="trash" size={16}/></button>
                </div>
                <label style={UI.projectModal.doneLabel(!!col.isDone)}>
                  <input type="checkbox" checked={col.isDone || false} onChange={e => setProj(p => p ? ({ ...p, columns: p.columns.map(c => c.id === col.id ? { ...c, isDone: e.target.checked } : c) }) : null)} /> 
                  Финальная колонка (Готово)
                </label>
              </div>
            ))}
          </div>

          <div style={UI.projectModal.addRow}>
            <input value={n} onChange={e => setN(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCol()} placeholder="Название новой колонки" style={SI(UI.projectModal.addInput)} />
            <Btn variant="subtle" onClick={addCol}><Icon name="plus" size={18}/></Btn>
          </div>
        </div>

        <div style={UI.projectModal.footer}>
          <Btn variant="subtle" onClick={onClose}>Отмена</Btn>
          <Btn variant="primary" onClick={() => onSave(proj)}>Сохранить</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Modal ──────────────────────────────────────────────────────────

