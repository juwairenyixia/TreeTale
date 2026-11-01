import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FileJson,
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
import type { CladeLabel, Story, TreeRecord, ViewSettings, WorkbenchMode } from '../types';
import type { LegendItem } from '../lib/palette';

interface SidebarProps {
  records: TreeRecord[];
  activeId: string;
  mode: WorkbenchMode;
  settings: ViewSettings;
  story: Story | null;
  stepIndex: number;
  compareId: string;
  cladeLabels: CladeLabel[];
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
  onCladeFocus: (tips: string[]) => void;
  onDownloadAnnotations: () => void;
  onImportAnnotations: (file: File) => void;
  onImportProject: (file: File) => void;
  onProvenanceChange: (patch: Partial<TreeRecord>) => void;
  comparePrune: boolean;
  onComparePrune: (value: boolean) => void;
  aliasCount: number;
  onOpenAliases: () => void;
}

export function Sidebar({
  records,
  activeId,
  mode,
  settings,
  story,
  stepIndex,
  compareId,
  cladeLabels,
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
  onCladeFocus,
  onDownloadAnnotations,
  onImportAnnotations,
  onImportProject,
  onProvenanceChange,
  comparePrune,
  onComparePrune,
  aliasCount,
  onOpenAliases,
}: SidebarProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const annotationFileRef = useRef<HTMLInputElement>(null);
  const projectFileRef = useRef<HTMLInputElement>(null);
  const active = records.find((record) => record.id === activeId) ?? records[0];
  const annotatedCount = active
    ? active.tree.leaves.filter((leaf) => active.metadata[leaf.name ?? '']?.cn).length
    : 0;

  const handleFile = (file: File | undefined) => {
    if (file) onUpload(file);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`} aria-label="树库与视图设置">
      <div className="sidebar__mobile-head">
        <span>树库</span>
        <button onClick={onClose} aria-label="关闭侧栏">
          <X size={18} />
        </button>
      </div>

      {mode === 'story' && story ? (
        <div className="story-sidebar">
          <div className="story-sidebar__eyebrow">
            <span>{story.eyebrow}</span>
            <span>{story.steps.length} 步</span>
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
              <span>树库</span>
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
                accept=".nwk,.newick,.tree,.tre,.txt,.nex,.nexus"
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <span className="upload-zone__icon">
                {dragOver ? <FileUp size={19} /> : <Upload size={19} />}
              </span>
              <span>
                <strong>{dragOver ? '松手导入' : '导入树文件'}</strong>
                <small>支持 Newick / NEXUS · 只在本地读取</small>
              </span>
            </div>

            <div className="annotation-tools">
              <button className="annotation-tool" onClick={onDownloadAnnotations}>
                <Download size={13} />
                注释模板
              </button>
              <button
                className="annotation-tool"
                onClick={() => annotationFileRef.current?.click()}
              >
                <FileUp size={13} />
                导入 CSV
              </button>
              <button
                className="annotation-tool"
                onClick={() => projectFileRef.current?.click()}
              >
                <FileJson size={13} />
                导入项目
              </button>
              <input
                ref={annotationFileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onImportAnnotations(file);
                  event.target.value = '';
                }}
              />
              <input
                ref={projectFileRef}
                type="file"
                accept=".json,application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onImportProject(file);
                  event.target.value = '';
                }}
              />
            </div>
            <p className="annotation-coverage">
              中文注释：<strong>{annotatedCount}</strong> / {active?.tree.leaves.length ?? 0}
              {annotatedCount < (active?.tree.leaves.length ?? 0) && ' · 点击叶节点可补全'}
            </p>
          </section>

          {mode === 'compare' ? (
            <section className="sidebar-section">
              <div className="sidebar-heading">
                <span>比较对象</span>
                <GitCompareArrows size={14} />
              </div>
              <div className="compare-current">
                <span className="compare-dot compare-dot--left" />
                <div>
                  <small>左树</small>
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
                          {record.name} · {record.tree.leaves.length} 个类群
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={15} />
                </div>
              </label>
              <div className="compare-current compare-current--right">
                <span className="compare-dot compare-dot--right" />
                <div>
                  <small>右树</small>
                  <strong>{records.find((record) => record.id === compareId)?.name ?? '—'}</strong>
                </div>
              </div>
              <div className="toggle-row">
                <div>
                  <strong>只比较共同物种</strong>
                  <small>画布中裁掉未匹配物种</small>
                </div>
                <button
                  className={`switch ${comparePrune ? 'is-on' : ''}`}
                  onClick={() => onComparePrune(!comparePrune)}
                  aria-pressed={comparePrune}
                >
                  <span />
                </button>
              </div>
              <button className="annotation-tool annotation-tool--wide" onClick={onOpenAliases}>
                <GitCompareArrows size={13} />
                匹配物种别名
                {aliasCount > 0 && <b>{aliasCount}</b>}
              </button>
              <p className="sidebar-help">
                RF 距离只比较两棵树共有的物种。未匹配的物种会在右侧提示，不参与计算。
              </p>
            </section>
          ) : (
            <section className="sidebar-section">
              <div className="sidebar-heading">
                <span>视图设置</span>
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
                    按枝长
                  </button>
                  <button
                    className={settings.branchMode === 'cladogram' ? 'is-active' : ''}
                    onClick={() => onSettings({ branchMode: 'cladogram' })}
                  >
                    按拓扑
                  </button>
                </div>
              </div>

              <div className="field">
                <div className="field__row">
                  <span>折叠低支持分支</span>
                  <b>{settings.supportThreshold === 0 ? '关闭' : `低于 ${settings.supportThreshold}`}</b>
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
                  <strong>按类群大小排序</strong>
                  <small>让较大的进化枝排在前面</small>
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

          {cladeLabels.length > 0 && mode !== 'compare' && (
            <section className="sidebar-section">
              <div className="sidebar-heading">
                <span>主要进化枝</span>
                <span>{cladeLabels.length}</span>
              </div>
              <div className="clade-list">
                {cladeLabels.map((clade) => (
                  <button
                    key={clade.id}
                    className="clade-list__item"
                    onClick={() => onCladeFocus(clade.tips)}
                    title={clade.description}
                  >
                    <span className="clade-list__dot" />
                    <span>{clade.name}</span>
                  </button>
                ))}
              </div>
              <p className="legend-help">点击名称可定位到该进化枝；矩形布局中标签会贴在分支旁。</p>
            </section>
          )}

          {legend.length > 0 && (
            <section className="sidebar-section">
              <div className="sidebar-heading">
                <span>图例</span>
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
              <p className="legend-help">
                {settings.colorBy === 'habitat'
                  ? '颜色表示这种动物主要生活在什么环境。'
                  : '颜色相同的物种属于同一类群。'}
              </p>
            </section>
          )}

          <section className="sidebar-section">
            <div className="sidebar-heading">
              <span>数据说明</span>
              <Info size={14} />
            </div>
            <div className="provenance-card">
              <p className="provenance-source">{active.source}</p>
              <label className="provenance-row">
                <span>支持度类型</span>
                <span className="select-wrap">
                  <select
                    value={active.supportType ?? 'unknown'}
                    onChange={(event) =>
                      onProvenanceChange({
                        supportType: event.target.value as TreeRecord['supportType'],
                      })
                    }
                  >
                    <option value="bootstrap">自举值 bootstrap</option>
                    <option value="posterior">后验概率 posterior</option>
                    <option value="unknown">未提供 / 不明确</option>
                  </select>
                  <ChevronDown size={13} />
                </span>
              </label>
              <div className="provenance-line">
                <span>枝长单位</span>
                <strong>{active.branchUnit ?? '未提供'}</strong>
              </div>
              <div className="provenance-line">
                <span>建树方法</span>
                <strong>{active.method ?? '未提供'}</strong>
              </div>
            </div>
          </section>

          <div className="sidebar-note sidebar-note--cn">
            <BookOpen size={14} />
            <span>内置示例中的每个物种都有中文名和一段简单说明，点击树上的名字即可查看。</span>
          </div>

          <div className="sidebar-note">
            <Info size={14} />
            <span>解析、注释和项目状态都会自动保存在本浏览器，不会上传你的树文件。</span>
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
