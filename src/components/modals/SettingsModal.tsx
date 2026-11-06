import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_ACCENT, T, isValidFill } from '../../styles/Theme';
import { BACKGROUND_PRESETS, DEFAULT_BACKGROUND_PRESET, UI, canAnimateBackground, normalizeBackgroundPreset } from '../../styles/Styles';
import { genId, relDate, dateStatus, extractSmartDate, buildHK, formatHK } from '../../lib/Helpers';
import { PALETTE, AVATAR_EMOJIS } from '../../lib/Constants';
import { typographize } from '../../lib/Typograf';
import { AppData, Task, Project, Category, Comment, Note, Column, Hotkeys, ID, Profile } from '../../types/Schemas';
import { Btn, Icon, SI, FillPicker } from '../ui/UiExports';
import { RichEditor } from '../RichEditor';
import { CustomDropdown, DateDropdown, fontFamily, innerDesk, innerMob, modalHoverBg, modalInnerBg, modalSurfaceBg, noteInnerDesk, wrapDesk, wrapMob } from './Shared';
interface SettingsModalProps {
  data: AppData;
  onSave: (val: Pick<AppData, 'categories' | 'profile' | 'hotkeys'>) => void;
  onClose: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isMobile?: boolean;
  initialTab?: 'profile' | 'ai';
}

export function SettingsModal({ data, onSave, onClose, onExport, onImport, isMobile, initialTab = 'profile' }: SettingsModalProps) {
  const [tab, setTab] = useState<string>(initialTab);
  const [cats, setCats] = useState<Category[]>(data.categories.map((c: Category) => ({ ...c })));
  const [profile, setProfile] = useState<Profile>({ ...data.profile,
    backgroundPreset: normalizeBackgroundPreset(data.profile.backgroundPreset || DEFAULT_BACKGROUND_PRESET),
  });
  const [hotkeys, setHotkeys] = useState<Hotkeys>({ ...data.hotkeys });
  const [catN, setCatN] = useState('');
  const [recordingKey, setRecordingKey] = useState<keyof Hotkeys | null>(null);
  const [initialSnapshot] = useState(() => JSON.stringify({ cats, profile, hotkeys }));
  const [confirmClose, setConfirmClose] = useState(false);
  const handleClose = () => {
    if (JSON.stringify({ cats, profile, hotkeys }) !== initialSnapshot) setConfirmClose(true);
    else onClose();
  };
  const accentPreview = isValidFill(profile.accentColor) ? profile.accentColor.trim() : DEFAULT_ACCENT;
  const canSave = isValidFill(profile.accentColor);
  const supportsMotion = canAnimateBackground(profile.backgroundPreset);
  const backgroundAnimated = supportsMotion && profile.backgroundAnimated === true;

  useEffect(() => {
    if (!recordingKey) return;
    const handleRec = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === 'Escape') { setRecordingKey(null); return; }
      if (!['Control', 'Shift', 'Alt', 'Meta'].some(key => e.code.includes(key))) {
        setHotkeys(prev => ({ ...prev, [recordingKey]: buildHK(e) }));
        setRecordingKey(null);
      }
    };
    window.addEventListener('keydown', handleRec);
    return () => window.removeEventListener('keydown', handleRec);
  }, [recordingKey]);

  return (
    <div style={isMobile ? wrapMob : wrapDesk} onMouseDown={!isMobile ? e => e.target === e.currentTarget && handleClose() : undefined}>
      <div style={UI.settings.shell(isMobile ? innerMob : innerDesk, !!isMobile)} onMouseDown={e => e.stopPropagation()}>
        <div style={UI.settings.header}>
          <div style={UI.settings.headerRow}>
            <span style={UI.settings.title}>
              <span style={UI.settings.avatarText}>{profile.avatarEmoji}</span> Настройки
            </span>
            <button onClick={handleClose} className="fk-modal-close" style={UI.modal.closeButton}><Icon name="x" size={18}/></button>
          </div>
          <div style={UI.settings.tabBar}>
      {/* Локализованные вкладки */}
            {[
              { id: 'profile', lbl: 'ПРОФИЛЬ' },
              { id: 'ai', lbl: 'AI' },
              { id: 'categories', lbl: 'МЕТКИ' },
              { id: 'hotkeys', lbl: 'ХОТКЕИ' },
              { id: 'data', lbl: 'ДАННЫЕ' }
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className="fk-settings-tab" style={UI.settings.tab(tab === t.id)}>{t.lbl}</button>
            ))}
          </div>
        </div>

        <div style={UI.settings.body}>
          {tab === 'profile' && (
            <div style={UI.settings.stack(24)}>
              <div><div style={UI.settings.label()}>АВАТАР</div><div style={UI.settings.avatarGrid}>{AVATAR_EMOJIS.map(e => <button key={e} onClick={() => setProfile({...profile, avatarEmoji: e})} className="fk-settings-avatar" style={UI.settings.avatarButton(profile.avatarEmoji === e)}>{e}</button>)}</div></div>
              <div><div style={UI.settings.label(8)}>ИМЯ</div><input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Твое имя?" style={SI(UI.settings.textInput)} /></div>
              <div><div style={UI.settings.label()}>ЦВЕТ</div><FillPicker value={profile.accentColor} onChange={(v:string) => setProfile({...profile, accentColor: v})} /></div>
              <div style={UI.settings.stack(10)}>
                <div style={UI.settings.label()}>ФОН</div>
                <div role="group" aria-label="Режим фона" style={UI.modal.actions()}>
                  <Btn size="sm" variant={backgroundAnimated ? 'ghost' : 'subtle'} aria-pressed={!backgroundAnimated}
                    onClick={() => setProfile({ ...profile, backgroundAnimated: false })}>Статичный</Btn>
                  <Btn size="sm" variant={backgroundAnimated ? 'subtle' : 'ghost'} aria-pressed={backgroundAnimated}
                    disabled={!supportsMotion} onClick={() => setProfile({ ...profile, backgroundAnimated: true })}>Анимированный</Btn>
                </div>
                <div style={UI.settings.presetGrid}>
                  {BACKGROUND_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={profile.backgroundPreset === preset.id}
                      onClick={() => setProfile({ ...profile, backgroundPreset: preset.id })}
                      className="fk-hover-subtle"
                      style={UI.settings.presetButton(profile.backgroundPreset === preset.id, accentPreview)}
                    >
                      <span style={UI.settings.presetPreview(preset, backgroundAnimated && profile.backgroundPreset === preset.id)} />
                      <span style={UI.settings.presetLabel}>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div style={UI.settings.stack(18)}>
              <div style={UI.settings.stack(8)}>
                <div style={UI.settings.label(8)}>API-КЛЮЧ</div>
                <input
                  type="password"
                  value={profile.aiApiKey || ''}
                  onChange={e => setProfile({ ...profile, aiApiKey: e.target.value })}
                  placeholder="sk-..."
                  style={SI(UI.settings.textInput)}
                />
              </div>

              <div style={UI.settings.stack(8)}>
                <div style={UI.settings.label(8)}>MODEL ID</div>
                <input
                  value={profile.aiModel || ''}
                  onChange={e => setProfile({ ...profile, aiModel: e.target.value })}
                  placeholder="Оставьте пустым для модели по умолчанию в Neurly"
                  style={SI(UI.settings.textInput)}
                />
              </div>

              <div style={UI.settings.stack(8)}>
                <div style={UI.settings.label(8)}>ПОЛЬЗОВАТЕЛЬСКИЕ ИНСТРУКЦИИ</div>
                <textarea
                  value={profile.aiUserInstructions || ''}
                  onChange={e => setProfile({ ...profile, aiUserInstructions: e.target.value })}
                  placeholder="Например: отвечай кратко, предлагай только практичные шаги, учитывай мой стиль работы."
                  style={SI({
                    ...UI.settings.textInput,
                    minHeight: 110,
                    resize: 'vertical',
                    lineHeight: 1.45,
                  })}
                />
              </div>

              <div style={UI.settings.stack(8)}>
                <div style={UI.settings.label(8)}>О МОИХ ЗАДАЧАХ</div>
                <textarea
                  value={profile.aiTaskContext || ''}
                  onChange={e => setProfile({ ...profile, aiTaskContext: e.target.value })}
                  placeholder="Например: я веду продуктовые, маркетинговые и операционные задачи; важны дедлайны, декомпозиция и приоритизация."
                  style={SI({
                    ...UI.settings.textInput,
                    minHeight: 130,
                    resize: 'vertical',
                    lineHeight: 1.45,
                  })}
                />
              </div>

              <div style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid var(--border2)',
                background: 'rgba(255,255,255,0.03)',
                color: T.text2,
                fontSize: 12.5,
                lineHeight: 1.5,
                fontFamily,
              }}>
                Ключ хранится локально в приложении и не попадает в JSON-экспорт. Поле модели можно оставить пустым: тогда FlowKit не будет навязывать `model id`, и Neurly использует настройки по умолчанию вашего аккаунта. Оба текстовых поля выше добавляются в контекст AI вместе с задачами.
              </div>
            </div>
          )}

          {tab === 'hotkeys' && (
            <div style={UI.settings.stack()}>
              {[{ id: 'newTask', lbl: 'Новая задача' }, { id: 'search', lbl: 'Поиск' }, { id: 'today', lbl: 'Сегодня' }].map(hk => (
                <div key={hk.id} style={UI.settings.row}>
                  <span style={UI.settings.rowLabel}>{hk.lbl}</span>
                  <button onClick={() => setRecordingKey(hk.id as keyof Hotkeys)} className="fk-settings-key" style={UI.settings.keyButton(recordingKey === hk.id)}>{recordingKey === hk.id ? 'Запись...' : formatHK((hotkeys as any)[hk.id])}</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'categories' && (
            <div style={UI.settings.stack(10)}>
              {cats.map((cat) => (
                <div key={cat.id} style={UI.settings.editRow}>
                  <div style={UI.settings.fillEditor}>
                    <FillPicker value={cat.color} onChange={(nextColor) => setCats((c) => c.map((x) => x.id === cat.id ? { ...x, color: nextColor } : x))} compact />
                  </div>
                  <input value={cat.name} onChange={e => setCats((c) => c.map((x) => x.id === cat.id ? { ...x, name: e.target.value } : x))} style={UI.settings.inlineInput} />
                  <button onClick={() => setCats((c) => c.filter((x) => x.id !== cat.id))} className="fk-modal-icon-danger" style={UI.settings.deleteButton}><Icon name="trash" size={16}/></button>
                </div>
              ))}
              <div style={UI.modal.inlineForm()}>
                <input value={catN} onChange={e => setCatN(e.target.value)} onKeyDown={e => e.key === 'Enter' && setCats([...cats, { id: genId(), name: catN.trim(), color: PALETTE[cats.length % PALETTE.length] }])} placeholder="Новая метка" style={SI(UI.settings.textInputFlex)} />
                <Btn variant="subtle" onClick={() => { if(catN.trim()) setCats([...cats, { id: genId(), name: catN.trim(), color: PALETTE[cats.length % PALETTE.length] }]); setCatN(''); }}><Icon name="plus" size={18}/></Btn>
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div style={UI.settings.stack()}>
              <button onClick={onExport} className="fk-settings-data-btn" style={UI.settings.dataButton}><Icon name="export" size={20} color={T.accent} /> Экспорт JSON</button>
              <label className="fk-settings-data-btn" style={UI.settings.dataButton}>
                <Icon name="import" size={20} color={T.success} /> Импорт JSON
                <input type="file" accept=".json,application/json" onChange={onImport} style={UI.layout.hidden} />
              </label>
            </div>
          )}
        </div>

        <div style={UI.settings.footer}>
          {confirmClose ? <>
            <span style={UI.modal.confirmText}>Закрыть без сохранения?</span>
            <Btn variant="subtle" onClick={() => setConfirmClose(false)}>Назад</Btn>
            <Btn variant="danger" onClick={onClose}>Закрыть</Btn>
          </> : <Btn variant="subtle" onClick={handleClose}>Отмена</Btn>}
          <Btn
            variant="primary"
            disabled={!canSave}
            className="fk-settings-save-preview"
            style={UI.settings.savePreviewButton(accentPreview)}
            onClick={() =>
              onSave({
                categories: cats,
                profile: {
                  ...profile,
                  accentColor: profile.accentColor.trim(),
                  backgroundPreset: profile.backgroundPreset || DEFAULT_BACKGROUND_PRESET,
                },
                hotkeys,
              })
            }
          >
            Сохранить
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Global Search ────────────────────────────────────────────────────────────
