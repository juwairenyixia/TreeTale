import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  FileUp,
  GitCompareArrows,
  Info,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { Story, TreeRecord, ViewSettings, WorkbenchMode } from '../types';
import type { LegendItem } from '../lib/palette';

interface SidebarProps {
  records: TreeRecord[];
  activeId: string;
  mode: WorkbenchMode;
  settings: ViewSettings;
  story: Story | null;
  stepIndex: number;
  compareId: string;
  legend: LegendItem[];
  isOpen: boolean;
  onClose: () => void;
  onActive: (id: string) => void;
  onUpload: (file: File) => void;
  onSettings: (patch: Partial<ViewSettings>) => void;
  onResetSettings: () => void;
  onStoryStep: (index: number) => void;
  onExitStory: () => void;
  onOpenCompare: () => void;
  onCompareId: (id: string) => void;
}

export function Sidebar({
  records,
  activeId,
  mode,
  settings,
  story,
  stepIndex,
  compareId,
  legend,
  isOpen,
  onClose,
  onActive,
  onUpload,
  onSettings,
  onResetSettings,
  onStoryStep,
  onExitStory,
  onOpenCompare,
  onCompareId,
}: SidebarProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const active = records.find((record) => record.id === activeId) ?? records[0];

  const handleFile = (file: File | undefined) => {
    if (file) onUpload(file);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`} aria-label="树库与视图设置">
      <div className="sidebar__mobile-head">
        <span>Tree library</span>
        <button onClick={onClose} aria-label="关闭侧栏">
          <X size={18} />
        </button>
      </div>

      {mode === 'story' && story ? (
        <div className="story-sidebar">
          <div className="story-sidebar__eyebrow">
            <span>{story.eyebrow}</span>
            <span>{story.steps.length} stops</span>
          </div>
          <h2>{story.title}</h2>
          <p>{story.summary}</p>

          <div className="story-progress-line">
            <span style={{ width: `${((stepIndex + 1) / story.steps.length) * 100}%` }} />
          </div>

          <div className="story-steps">
            {story.steps.map((step, index) => (
              <button
                key={`${story.id}-${index}`}
                className={`story-step-item ${index === stepIndex ? 'is-active' : ''} ${
                  index < stepIndex ? 'is-done' : ''
                }`}
                onClick={() => onStoryStep(index)}
              >
                <span className="story-step-item__num">
                  {index < stepIndex ? <Check size={12} /> : String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <small>{step.kicker}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="story-sidebar__actions">
            {story.compareWith && (
              <button className="btn btn--dark btn--sm btn--full" onClick={onOpenCompare}>
                <GitCompareArrows size={15} />
                打开比较模式
              </button>
            )}
            <button className="btn btn--ghost btn--sm btn--full" onClick={onExitStory}>
              <BookOpen size={15} />
              退出故事
            </button>
          </div>

          <div className="sidebar-note">
            <Info size={14} />
            <span>故事是阅读路径，不是结论。随时可以回到自由探索。</span>
          </div>
        </div>
      ) : (
        <>
          <section className="sidebar-section">
            <div className="sidebar-heading">
              <span>TREE LIBRARY</span>
              <span>{String(records.length).padStart(2, '0')}</span>
            </div>

            <div className="tree-list">
              {records.map((record) => (
                <button
                  key={record.id}
                  className={`tree-item ${record.id === activeId ? 'is-active' : ''}`}
                  onClick={() => onActive(record.id)}
                >
                  <span className="tree-item__dot" style={{ background: record.accent }} />
                  <span className="tree-item__body">
                    <strong>{record.name}</strong>
                    <small>{record.subtitle}</small>
                  </span>
                  <span className="tree-item__count">{record.tree.leaves.length}</span>
                </button>
              ))}
            </div>

            <div
              className={`upload-zone ${dragOver ? 'is-over' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                handleFile(event.dataTransfer.files[0]);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') fileRef.current?.click();
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".nwk,.newick,.tree,.tre,.txt"
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <span className="upload-zone__icon">
                {dragOver ? <FileUp size={19} /> : <Upload size={19} />}
              </span>
              <span>
                <strong>{dragOver ? '松手导入' : '导入 Newick'}</strong>
                <small>拖拽或点击 · 只在本地读取</small>
              </span>
            </div>
          </section>

          {mode === 'compare' ? (
            <section className="sidebar-section">
              <div className="sidebar-heading">
                <span>COMPARE WITH</span>
                <GitCompareArrows size={14} />
              </div>
              <div className="compare-current">
                <span className="compare-dot compare-dot--left" />
                <div>
                  <small>LEFT TREE</small>
                  <strong>{active.name}</strong>
                </div>
              </div>
              <label className="field">
                <span>右树</span>
                <div className="select-wrap">
                  <select value={compareId} onChange={(event) => onCompareId(event.target.value)}>
                    {records
                      .filter((record) => record.id !== activeId)
                      .map((record) => (
                        <option key={record.id} value={record.id}>
                          {record.name} · {record.tree.leaves.length} taxa
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={15} />
                </div>
              </label>
              <div className="compare-current compare-current--right">
                <span className="compare-dot compare-dot--right" />
                <div>
                  <small>RIGHT TREE</small>
                  <strong>{records.find((record) => record.id === compareId)?.name ?? '—'}</strong>
                </div>
              </div>
              <p className="sidebar-help">
                RF 距离只比较共同 taxa 的非平凡进化枝。未匹配的物种会在右侧提示。
              </p>
            </section>
          ) : (
            <section className="sidebar-section">
              <div className="sidebar-heading">
                <span>VIEW</span>
                <SlidersHorizontal size={14} />
              </div>

              <div className="field">
                <span>布局</span>
                <div className="segmented segmented--sm">
                  <button
                    className={settings.layout === 'rectangular' ? 'is-active' : ''}
                    onClick={() => onSettings({ layout: 'rectangular' })}
                  >
                    矩形
                  </button>
                  <button
                    className={settings.layout === 'circular' ? 'is-active' : ''}
                    onClick={() => onSettings({ layout: 'circular' })}
                  >
                    圆形
                  </button>
                </div>
              </div>

              <div className="field">
                <span>分支模式</span>
                <div className="segmented segmented--sm">
                  <button
                    className={settings.branchMode === 'phylogram' ? 'is-active' : ''}
                    onClick={() => onSettings({ branchMode: 'phylogram' })}
                  >
                    Phylogram
                  </button>
                  <button
                    className={settings.branchMode === 'cladogram' ? 'is-active' : ''}
                    onClick={() => onSettings({ branchMode: 'cladogram' })}
                  >
                    Cladogram
                  </button>
                </div>
              </div>

              <div className="field">
                <div className="field__row">
                  <span>折叠低支持分支</span>
                  <b>{settings.supportThreshold === 0 ? 'off' : `< ${settings.supportThreshold}`}</b>
                </div>
                <input
                  className="range"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={settings.supportThreshold}
                  onChange={(event) => onSettings({ supportThreshold: Number(event.target.value) })}
                />
                <div className="range-labels">
                  <span>显示全部</span>
                  <span>100</span>
                </div>
              </div>

              <div className="toggle-row">
                <div>
                  <strong>Ladderize</strong>
                  <small>按 clade 大小排序</small>
                </div>
                <button
                  className={`switch ${settings.ladderize ? 'is-on' : ''}`}
                  onClick={() => onSettings({ ladderize: !settings.ladderize })}
                  aria-pressed={settings.ladderize}
                >
                  <span />
                </button>
              </div>

              <div className="toggle-row">
                <div>
                  <strong>显示支持度</strong>
                  <small>标注内部节点</small>
                </div>
                <button
                  className={`switch ${settings.showSupport ? 'is-on' : ''}`}
                  onClick={() => onSettings({ showSupport: !settings.showSupport })}
                  aria-pressed={settings.showSupport}
                >
                  <span />
                </button>
              </div>

              <div className="field">
                <span>着色</span>
                <div className="select-wrap">
                  <Palette size={14} className="select-wrap__icon" />
                  <select
                    value={settings.colorBy}
                    onChange={(event) =>
                      onSettings({ colorBy: event.target.value as ViewSettings['colorBy'] })
                    }
                  >
                    <option value="none">不着色</option>
                    <option value="group">按类群</option>
                    <option value="habitat">按生境</option>
                  </select>
                  <ChevronDown size={15} />
                </div>
              </div>

              <button className="reset-link" onClick={onResetSettings}>
                <RotateCcw size={13} />
                恢复默认视图
              </button>
            </section>
          )}

          {legend.length > 0 && (
            <section className="sidebar-section">
              <div className="sidebar-heading">
                <span>LEGEND</span>
                <span>{legend.length}</span>
              </div>
              <div className="legend">
                {legend.map((item) => (
                  <div className="legend-item" key={item.label}>
                    <span className="legend-item__dot" style={{ background: item.color }} />
                    <span>{item.label}</span>
                    <small>{item.count}</small>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="sidebar-note">
            <Info size={14} />
            <span>所有解析与渲染都在浏览器本地完成，不会上传你的树文件。</span>
          </div>
        </>
      )}

      <button className="sidebar__back" onClick={onExitStory} hidden={mode !== 'story'}>
        回到自由探索
        <ArrowRight size={14} />
      </button>
    </aside>
  );
}
