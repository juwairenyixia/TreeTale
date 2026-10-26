import {
  BookOpen,
  ChevronDown,
  Download,
  FileJson,
  FileText,
  GitBranch,
  GitCompareArrows,
  Image,
  Info,
  PanelLeft,
  PanelRight,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TreeRecord, ViewSettings, WorkbenchMode } from '../types';
import { stories } from '../data/examples';
import { prepareTree, getMrca, findTip, taxonKey } from '../lib/tree';
import { compareTrees } from '../lib/rf';
import { buildColorScale } from '../lib/palette';
import { exportPng, exportSvg, downloadText } from '../lib/export';
import { toNewick } from '../lib/newick';
import { Sidebar } from './Sidebar';
import { TreeCanvas } from './TreeCanvas';
import { CompareView } from './CompareView';
import { Inspector } from './Inspector';

interface WorkbenchProps {
  records: TreeRecord[];
  activeId: string;
  mode: WorkbenchMode;
  storyId: string | null;
  onActive: (id: string) => void;
  onMode: (mode: WorkbenchMode) => void;
  onStoryId: (id: string) => void;
  onUpload: (file: File) => void;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const defaultSettings: ViewSettings = {
  layout: 'rectangular',
  branchMode: 'phylogram',
  supportThreshold: 0,
  ladderize: true,
  showSupport: true,
  colorBy: 'group',
};

export function Workbench({
  records,
  activeId,
  mode,
  storyId,
  onActive,
  onMode,
  onStoryId,
  onUpload,
  notify,
}: WorkbenchProps) {
  const active = records.find((record) => record.id === activeId) ?? records[0];
  const story = stories.find((item) => item.id === storyId) ?? null;
  const [settings, setSettings] = useState<ViewSettings>(defaultSettings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [compareId, setCompareId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const displayTree = useMemo(
    () =>
      prepareTree(active.tree, {
        collapseBelow: settings.supportThreshold,
        ladderize: settings.ladderize,
      }),
    [active.tree, settings.supportThreshold, settings.ladderize],
  );

  const colorScale = useMemo(
    () => buildColorScale(active.metadata, settings.colorBy),
    [active.metadata, settings.colorBy],
  );

  const selectedNode = displayTree.nodes.find((node) => node.id === selectedId) ?? null;
  const compareRecord = records.find((record) => record.id === compareId) ?? null;
  const comparison = useMemo(
    () => (compareRecord ? compareTrees(active.tree, compareRecord.tree) : null),
    [active.tree, compareRecord],
  );

  const currentStep = story?.steps[stepIndex] ?? null;
  const storyFocus = useMemo(() => {
    if (mode !== 'story' || !currentStep) return null;
    return getMrca(displayTree, currentStep.focusTips) ?? null;
  }, [mode, currentStep, displayTree]);

  useEffect(() => {
    setSelectedId(null);
    setSearch('');
    setSidebarOpen(false);
    setInspectorOpen(false);
    const preferred =
      records.find((record) => record.id === active.compareWith)?.id ??
      records.find(
        (record) =>
          record.id !== active.id &&
          record.tree.leaves.some((tip) =>
            active.tree.leaves.some((other) => taxonKey(other.name ?? '') === taxonKey(tip.name ?? '')),
          ),
      )?.id ??
      records.find((record) => record.id !== active.id)?.id ??
      '';
    setCompareId(preferred);
  }, [activeId]);

  useEffect(() => {
    if (storyId) setStepIndex(0);
  }, [storyId]);

  useEffect(() => {
    if (mode === 'story') {
      setSettings((current) => ({
        ...current,
        layout: 'rectangular',
        supportThreshold: 0,
        ladderize: true,
        colorBy: current.colorBy === 'none' ? 'group' : current.colorBy,
      }));
    }
  }, [mode, storyId]);

  useEffect(() => {
    if (!exportOpen) return;
    const close = (event: MouseEvent) => {
      if (!exportRef.current?.contains(event.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [exportOpen]);

  if (!active) {
    return (
      <div className="workbench-empty">
        <Info size={20} />
        <p>还没有可用的树。打开一个示例，或导入 Newick 文件。</p>
      </div>
    );
  }

  const setMode = (next: WorkbenchMode) => {
    if (next === 'story' && !storyId) onStoryId(stories[0].id);
    onMode(next);
    setSidebarOpen(false);
  };

  const handleSelectTip = (name: string) => {
    const tip = findTip(displayTree, name);
    if (tip) {
      setSelectedId(tip.id);
      setInspectorOpen(true);
    }
  };

  const handleStoryStep = (index: number) => {
    if (!story) return;
    setStepIndex(Math.max(0, Math.min(story.steps.length - 1, index)));
  };

  const handleOpenCompare = () => {
    if (story?.compareWith) setCompareId(story.compareWith);
    onMode('compare');
    setInspectorOpen(true);
  };

  const handleActive = (id: string) => {
    onActive(id);
    if (mode === 'story') onMode('explore');
    setSidebarOpen(false);
  };

  const openCompare = () => {
    setMode('compare');
    setInspectorOpen(true);
  };

  const closeMenus = () => setExportOpen(false);

  const currentSvgSize = () => {
    const svg = svgRef.current;
    if (!svg) return { width: 1200, height: 800 };
    const box = svg.viewBox.baseVal;
    return {
      width: box.width || 1200,
      height: box.height || 800,
    };
  };

  const handleExportSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = currentSvgSize();
    const name = mode === 'compare' && compareRecord ? `${active.name}-vs-${compareRecord.name}` : active.name;
    exportSvg(svg, name, width, height);
    closeMenus();
    notify('SVG 已导出，可在 Illustrator / Inkscape 中继续编辑。', 'success');
  };

  const handleExportPng = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = currentSvgSize();
    const name = mode === 'compare' && compareRecord ? `${active.name}-vs-${compareRecord.name}` : active.name;
    try {
      await exportPng(svg, name, width, height);
      closeMenus();
      notify('PNG 已导出。', 'success');
    } catch {
      notify('PNG 导出失败，请改用 SVG。', 'error');
    }
  };

  const handleExportNewick = () => {
    downloadText(toNewick(displayTree), `${active.id}.nwk`);
    closeMenus();
    notify('当前视图已导出为 Newick。', 'success');
  };

  const handleExportProject = () => {
    const payload = {
      name: active.name,
      source: active.source,
      newick: active.newick,
      metadata: active.metadata,
      settings,
      search,
    };
    downloadText(JSON.stringify(payload, null, 2), `${active.id}-treetale.json`, 'application/json');
    closeMenus();
    notify('项目 JSON 已导出。', 'success');
  };

  const sharedCount = comparison?.sharedTaxa ?? 0;

  return (
    <div className="workbench">
      <Sidebar
        records={records}
        activeId={active.id}
        mode={mode}
        settings={settings}
        story={story}
        stepIndex={stepIndex}
        compareId={compareId}
        legend={colorScale.legend}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onActive={handleActive}
        onUpload={onUpload}
        onSettings={(patch) => setSettings((current) => ({ ...current, ...patch }))}
        onResetSettings={() => setSettings(defaultSettings)}
        onStoryStep={handleStoryStep}
        onExitStory={() => onMode('explore')}
        onOpenCompare={handleOpenCompare}
        onCompareId={setCompareId}
      />

      <div className="workbench__main">
        <div className="workbench__toolbar">
          <div className="toolbar__left">
            <button className="toolbar__mobile" onClick={() => setSidebarOpen(true)} aria-label="打开树库">
              <PanelLeft size={18} />
            </button>
            <div className="workbench__crumb">
              <span>WORKBENCH</span>
              <i>/</i>
              <strong>{active.name}</strong>
            </div>
          </div>

          <div className="mode-tabs" role="tablist" aria-label="工作模式">
            <button className={mode === 'explore' ? 'is-active' : ''} onClick={() => setMode('explore')}>
              <GitBranch size={15} />
              探索
            </button>
            <button className={mode === 'compare' ? 'is-active' : ''} onClick={openCompare}>
              <GitCompareArrows size={15} />
              比较
            </button>
            <button className={mode === 'story' ? 'is-active' : ''} onClick={() => setMode('story')}>
              <BookOpen size={15} />
              故事
            </button>
          </div>

          <div className="toolbar__right">
            {mode !== 'compare' && (
              <label className="search-field">
                <Search size={15} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="搜索物种…"
                  aria-label="搜索物种"
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="清除搜索">
                    <X size={13} />
                  </button>
                )}
              </label>
            )}

            {mode === 'compare' && comparison && (
              <span className={`rf-pill ${comparison.identical ? 'is-success' : ''}`}>
                RF {comparison.rf}
                <small>{sharedCount} shared</small>
              </span>
            )}

            <div className="export-wrap" ref={exportRef}>
              <button className="btn btn--dark btn--sm" onClick={() => setExportOpen((value) => !value)}>
                <Download size={15} />
                导出
                <ChevronDown size={14} />
              </button>
              {exportOpen && (
                <div className="export-menu">
                  <button onClick={handleExportSvg}>
                    <FileText size={15} />
                    <span><strong>SVG</strong><small>可编辑矢量图</small></span>
                  </button>
                  <button onClick={handleExportPng}>
                    <Image size={15} />
                    <span><strong>PNG</strong><small>适合直接放入报告</small></span>
                  </button>
                  {mode !== 'compare' && (
                    <button onClick={handleExportNewick}>
                      <GitBranch size={15} />
                      <span><strong>Newick</strong><small>当前折叠/过滤后的树</small></span>
                    </button>
                  )}
                  <button onClick={handleExportProject}>
                    <FileJson size={15} />
                    <span><strong>Project JSON</strong><small>树、设置与元数据</small></span>
                  </button>
                </div>
              )}
            </div>

            <button
              className="toolbar__mobile"
              onClick={() => setInspectorOpen(true)}
              aria-label="打开检查器"
            >
              <PanelRight size={18} />
            </button>
          </div>
        </div>

        <div className={`workbench__stage ${mode === 'compare' ? 'is-compare' : ''}`}>
          {mode === 'compare' && compareRecord && comparison ? (
            <CompareView
              left={active}
              right={compareRecord}
              comparison={comparison}
              svgRef={svgRef}
            />
          ) : (
            <TreeCanvas
              tree={displayTree}
              settings={settings}
              metadata={active.metadata}
              colorScale={colorScale}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setInspectorOpen(true);
              }}
              search={search}
              storyFocusId={storyFocus?.id ?? null}
              storyActive={mode === 'story'}
              accent={active.accent}
              svgRef={svgRef}
              resetToken={0}
            />
          )}

          {mode === 'story' && currentStep && (
            <div className="story-banner">
              <span>{String(stepIndex + 1).padStart(2, '0')} / {String(story?.steps.length ?? 0).padStart(2, '0')}</span>
              <strong>{currentStep.title}</strong>
              <button onClick={() => handleStoryStep(stepIndex + 1)} disabled={stepIndex >= (story?.steps.length ?? 1) - 1}>
                下一步
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`workbench__inspector ${inspectorOpen ? 'is-open' : ''}`}>
        <div className="inspector__mobile-head">
          <span>INSPECTOR</span>
          <button onClick={() => setInspectorOpen(false)} aria-label="关闭检查器">
            <X size={18} />
          </button>
        </div>
        <Inspector
          tree={displayTree}
          metadata={active.metadata}
          selectedNode={selectedNode}
          mode={mode}
          comparison={comparison}
          compareNames={
            compareRecord ? { left: active.name, right: compareRecord.name } : undefined
          }
          story={story}
          stepIndex={stepIndex}
          onStoryStep={handleStoryStep}
          onSelectTip={handleSelectTip}
          onOpenCompare={handleOpenCompare}
        />
      </div>

      {(sidebarOpen || inspectorOpen) && (
        <button
          className="drawer-backdrop"
          aria-label="关闭面板"
          onClick={() => {
            setSidebarOpen(false);
            setInspectorOpen(false);
          }}
        />
      )}
    </div>
  );
}
