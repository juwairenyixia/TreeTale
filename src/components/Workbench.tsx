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
import type { TaxonMeta, TreeRecord, ViewSettings, WorkbenchMode } from '../types';
import { stories } from '../data/examples';
import { prepareTree, getMrca, findTip, taxonKey, displayName, pruneTree } from '../lib/tree';
import { compareTrees } from '../lib/rf';
import { buildColorScale } from '../lib/palette';
import { downloadText, exportPng, exportSvg, parseViewBox } from '../lib/export';
import { toNewick } from '../lib/newick';
import { buildAnnotationCsv, applyAnnotationCsv } from '../lib/csv';
import { buildProjectFile } from '../lib/project';
import { loadViewSettings, saveViewSettings } from '../lib/storage';
import { Sidebar } from './Sidebar';
import { TreeCanvas } from './TreeCanvas';
import { CompareView } from './CompareView';
import { Inspector } from './Inspector';
import { AnnotationDialog } from './AnnotationDialog';
import { ExportDialog } from './ExportDialog';
import { AliasDialog } from './AliasDialog';

interface WorkbenchProps {
  records: TreeRecord[];
  activeId: string;
  mode: WorkbenchMode;
  storyId: string | null;
  onActive: (id: string) => void;
  onMode: (mode: WorkbenchMode) => void;
  onStoryId: (id: string) => void;
  onUpload: (file: File) => void;
  onProjectImport: (file: File) => void;
  onUpdateTaxon: (id: string, taxon: string, patch: TaxonMeta) => void;
  onReplaceMetadata: (id: string, metadata: Record<string, TaxonMeta>) => void;
  onProvenanceChange: (id: string, patch: Partial<TreeRecord>) => void;
  projectSettings?: { id: string; settings: ViewSettings } | null;
  onProjectSettingsApplied?: () => void;
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
  onProjectImport,
  onUpdateTaxon,
  onReplaceMetadata,
  onProvenanceChange,
  projectSettings,
  onProjectSettingsApplied,
  notify,
}: WorkbenchProps) {
  const active = records.find((record) => record.id === activeId) ?? records[0];
  const story = stories.find((item) => item.id === storyId) ?? null;
  const [settings, setSettings] = useState<ViewSettings>(
    () => loadViewSettings() ?? defaultSettings,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [compareId, setCompareId] = useState('');
  const [compareAliases, setCompareAliases] = useState<Record<string, string>>({});
  const [comparePrune, setComparePrune] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [editingTaxon, setEditingTaxon] = useState<string | null>(null);
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
    () =>
      compareRecord
        ? compareTrees(active.tree, compareRecord.tree, { aliases: compareAliases })
        : null,
    [active.tree, compareRecord, compareAliases],
  );

  const prunedCompare = useMemo(() => {
    if (!compareRecord || !comparison || !comparePrune) return null;
    if (!comparison.unmatchedLeft.length && !comparison.unmatchedRight.length) return null;
    const leftNames = comparison.matchedPairs.map((pair) => pair.left);
    const rightNames = comparison.matchedPairs.map((pair) => pair.right);
    const leftTree = pruneTree(active.tree, leftNames);
    const rightTree = pruneTree(compareRecord.tree, rightNames);
    if (!leftTree || !rightTree) return null;
    return { leftTree, rightTree };
  }, [active.tree, compareRecord, comparePrune, comparison]);

  const leftDisplayRecord = prunedCompare ? { ...active, tree: prunedCompare.leftTree } : active;
  const rightDisplayRecord =
    prunedCompare && compareRecord ? { ...compareRecord, tree: prunedCompare.rightTree } : compareRecord;
  const displayComparison = useMemo(() => {
    if (!leftDisplayRecord || !rightDisplayRecord) return comparison;
    if (!prunedCompare) return comparison;
    return compareTrees(leftDisplayRecord.tree, rightDisplayRecord.tree, {
      aliases: compareAliases,
    });
  }, [comparison, leftDisplayRecord, rightDisplayRecord, prunedCompare, compareAliases]);

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
    setEditingTaxon(null);
    setCompareAliases({});
    setComparePrune(false);
    setAliasOpen(false);
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
    saveViewSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!projectSettings || projectSettings.id !== active?.id) return;
    setSettings(projectSettings.settings);
    onProjectSettingsApplied?.();
  }, [projectSettings, active?.id, onProjectSettingsApplied]);

  useEffect(() => {
    setCompareAliases({});
    setComparePrune(false);
    setAliasOpen(false);
  }, [compareId]);

  useEffect(() => {
    const query = search.trim().toLowerCase();
    if (!query) return;
    const match = displayTree.leaves.find((leaf) => {
      const cn = displayName(leaf, active.metadata).toLowerCase();
      const latin = (leaf.name ?? '').toLowerCase();
      return cn.includes(query) || latin.includes(query);
    });
    if (match) setSelectedId(match.id);
  }, [search, displayTree, active.metadata]);

  useEffect(() => {
    if (mode === 'story') {
      setSettings((current) => ({
        ...current,
        layout: 'rectangular',
        supportThreshold: 0,
        ladderize: true,
        colorBy: current.colorBy === 'none' ? 'group' : current.colorBy,
      }));
      setSelectedId(null);
    }
  }, [mode, storyId, stepIndex]);

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

  const handleCladeFocus = (tips: string[]) => {
    if (settings.supportThreshold !== 0) {
      setSettings((current) => ({ ...current, supportThreshold: 0 }));
    }
    const mrca = getMrca(active.tree, tips);
    if (mrca) {
      setSelectedId(mrca.id);
      setInspectorOpen(true);
      setSidebarOpen(false);
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
    if (!svg) return { width: 1200, height: 800, viewBox: '0 0 1200 800' };
    const box = svg.viewBox.baseVal;
    const viewBox = `${box.x} ${box.y} ${box.width} ${box.height}`;
    const size = parseViewBox(viewBox);
    return {
      width: size?.width ?? 1200,
      height: size?.height ?? 800,
      viewBox,
    };
  };

  const exportName = () =>
    mode === 'compare' && compareRecord
      ? `${active.name}-vs-${compareRecord.name}`
      : active.name;

  const handleExportSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height, viewBox } = currentSvgSize();
    exportSvg(svg, exportName(), {
      width,
      height,
      viewBox,
      background: 'paper',
      showSupport: true,
      showCladeLabels: true,
    });
    closeMenus();
    notify('SVG 已导出，可在 Illustrator / Inkscape 中继续编辑。', 'success');
  };

  const handleExportPng = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height, viewBox } = currentSvgSize();
    try {
      await exportPng(svg, exportName(), {
        width,
        height,
        viewBox,
        background: 'paper',
        scale: 2,
        showSupport: true,
        showCladeLabels: true,
      });
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
    const payload = buildProjectFile(active, settings, search);
    downloadText(JSON.stringify(payload, null, 2), `${active.id}-treetale.json`, 'application/json');
    closeMenus();
    notify('项目 JSON 已导出。', 'success');
  };

  const handleDownloadAnnotations = () => {
    downloadText(
      buildAnnotationCsv(active.tree, active.metadata),
      `${active.id}-annotations.csv`,
      'text/csv;charset=utf-8',
    );
    notify('注释 CSV 模板已下载。', 'success');
  };

  const handleImportAnnotations = async (file: File) => {
    try {
      const result = applyAnnotationCsv(await file.text(), active.tree, active.metadata);
      if (result.errors.length && !result.matched) {
        notify(`注释导入失败：${result.errors[0]}`, 'error');
        return;
      }
      onReplaceMetadata(active.id, result.metadata);
      const details = [
        result.matched ? `匹配 ${result.matched} 条` : '',
        result.unmatched.length ? `${result.unmatched.length} 条未匹配` : '',
        result.errors.length ? `${result.errors.length} 行有问题` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      notify(`注释 CSV 已导入：${details || '没有可用数据'}。`, result.matched ? 'success' : 'error');
    } catch (error) {
      notify(`注释导入失败：${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  };

  const sharedCount = comparison?.sharedTaxa ?? 0;
  const aliasCount = Object.keys(compareAliases).length;
  const editingMetadata = editingTaxon ? active.metadata[editingTaxon] : undefined;

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
        cladeLabels={active.cladeLabels ?? []}
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
        onCladeFocus={handleCladeFocus}
        onDownloadAnnotations={handleDownloadAnnotations}
        onImportAnnotations={handleImportAnnotations}
        onImportProject={onProjectImport}
        onProvenanceChange={(patch) => onProvenanceChange(active.id, patch)}
        comparePrune={comparePrune}
        onComparePrune={setComparePrune}
        aliasCount={aliasCount}
        onOpenAliases={() => setAliasOpen(true)}
      />

      <div className="workbench__main">
        <div className="workbench__toolbar">
          <div className="toolbar__left">
            <button className="toolbar__mobile" onClick={() => setSidebarOpen(true)} aria-label="打开树库">
              <PanelLeft size={18} />
            </button>
            <div className="workbench__crumb">
              <span>工作台</span>
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
                  placeholder="搜索中文名或学名…"
                  aria-label="搜索中文名或学名"
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
                RF 距离 {comparison.rf}
                <small>{sharedCount} 个共同物种</small>
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
                  <button
                    onClick={() => {
                      closeMenus();
                      setExportDialogOpen(true);
                    }}
                  >
                    <FileText size={15} />
                    <span><strong>出版级导出…</strong><small>尺寸、背景、完整树</small></span>
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
          {mode === 'compare' && compareRecord && displayComparison ? (
            <CompareView
              left={leftDisplayRecord}
              right={rightDisplayRecord ?? compareRecord}
              comparison={displayComparison}
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
              cladeLabels={active.cladeLabels ?? []}
              branchUnit={active.branchUnit}
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
          <span>节点检查</span>
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
          cladeLabels={active.cladeLabels ?? []}
          supportType={active.supportType}
          stepIndex={stepIndex}
          onStoryStep={handleStoryStep}
          onSelectTip={handleSelectTip}
          onEditTaxon={(name) => setEditingTaxon(name)}
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

      <AnnotationDialog
        open={Boolean(editingTaxon)}
        taxonName={editingTaxon}
        metadata={editingMetadata}
        onClose={() => setEditingTaxon(null)}
        onSave={(patch) => {
          if (!editingTaxon) return;
          onUpdateTaxon(active.id, editingTaxon, patch);
          setEditingTaxon(null);
          notify('中文注释已保存。', 'success');
        }}
      />

      <ExportDialog
        open={exportDialogOpen}
        name={exportName()}
        svgRef={svgRef}
        onClose={() => setExportDialogOpen(false)}
        notify={notify}
      />

      {compareRecord && (
        <AliasDialog
          open={aliasOpen}
          left={active}
          right={compareRecord}
          aliases={compareAliases}
          onClose={() => setAliasOpen(false)}
          onSave={(aliases) => {
            setCompareAliases(aliases);
            const count = Object.keys(aliases).length;
            notify(count ? `已保存 ${count} 组物种别名。` : '已清除物种别名。', 'success');
          }}
        />
      )}
    </div>
  );
}
