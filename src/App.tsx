import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Story, TaxonMeta, TreeRecord, ViewSettings, WorkbenchMode } from './types';
import { buildExampleTrees, stories } from './data/examples';
import { parseNewick, NewickParseError } from './lib/newick';
import { parseNexus, isNexus } from './lib/nexus';
import { parseProjectFile } from './lib/project';
import {
  loadWorkspace,
  recordToStored,
  saveWorkspace,
  storedToRecord,
  loadLastTreeId,
  saveLastTreeId,
} from './lib/storage';
import { Nav } from './components/Nav';
import { Home } from './components/Home';
import { Workbench } from './components/Workbench';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';

type View = 'home' | 'workbench';

export default function App() {
  const examples = useMemo(() => buildExampleTrees(), []);
  const [records, setRecords] = useState<TreeRecord[]>(examples);
  const [view, setView] = useState<View>('home');
  const [activeId, setActiveId] = useState('vertebrates');
  const [mode, setMode] = useState<WorkbenchMode>('explore');
  const [storyId, setStoryId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [pendingProjectSettings, setPendingProjectSettings] = useState<{
    id: string;
    settings: ViewSettings;
  } | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadWorkspace().then((snapshot) => {
      if (cancelled) return;
      if (!snapshot) {
        setHydrated(true);
        return;
      }
      const customRecords = snapshot.customRecords
        .map(storedToRecord)
        .filter((record): record is TreeRecord => Boolean(record));
      const mergedExamples = examples.map((record) => {
        const override = snapshot.metadataOverrides?.[record.id];
        const provenance = snapshot.provenanceOverrides?.[record.id];
        return {
          ...record,
          ...(override ? { metadata: override } : {}),
          ...(provenance ?? {}),
        };
      });
      setRecords([...mergedExamples, ...customRecords]);
      const savedActive = snapshot.activeId ?? loadLastTreeId();
      if (savedActive && [...mergedExamples, ...customRecords].some((record) => record.id === savedActive)) {
        setActiveId(savedActive);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [examples]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const snapshot = {
        version: 1 as const,
        customRecords: records.filter((record) => record.custom).map(recordToStored),
        metadataOverrides: Object.fromEntries(
          records.filter((record) => !record.custom).map((record) => [record.id, record.metadata]),
        ),
        provenanceOverrides: Object.fromEntries(
          records
            .filter((record) => !record.custom)
            .map((record) => [
              record.id,
              {
                supportType: record.supportType,
                branchUnit: record.branchUnit,
                method: record.method,
              },
            ]),
        ),
        activeId,
      };
      void saveWorkspace(snapshot);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [records, activeId, hydrated]);

  useEffect(() => {
    saveLastTreeId(activeId);
  }, [activeId]);

  const openWorkbench = useCallback(() => {
    setView('workbench');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openTree = useCallback((id: string) => {
    setActiveId(id);
    setMode('explore');
    setStoryId(null);
    openWorkbench();
  }, [openWorkbench]);

  const openStory = useCallback((story: Story) => {
    setActiveId(story.treeId);
    setStoryId(story.id);
    setMode('story');
    openWorkbench();
  }, [openWorkbench]);

  const handleMode = useCallback(
    (next: WorkbenchMode) => {
      if (next === 'story') {
        const chosen = stories.find((story) => story.id === storyId) ?? stories[0];
        setStoryId(chosen.id);
        setActiveId(chosen.treeId);
      }
      setMode(next);
      if (next !== 'explore') setView('workbench');
    },
    [storyId],
  );

  const handleStoryId = useCallback((id: string) => {
    const story = stories.find((item) => item.id === id);
    if (!story) return;
    setStoryId(id);
    setActiveId(story.treeId);
    setMode('story');
    setView('workbench');
  }, []);

  const handleTreeActive = useCallback((id: string) => {
    setActiveId(id);
    setMode((current) => (current === 'story' ? 'explore' : current));
  }, []);

  const handleUpdateTaxon = useCallback(
    (id: string, taxon: string, patch: TaxonMeta) => {
      setRecords((current) =>
        current.map((record) =>
          record.id === id
            ? {
                ...record,
                metadata: {
                  ...record.metadata,
                  [taxon]: { ...(record.metadata[taxon] ?? {}), ...patch },
                },
              }
            : record,
        ),
      );
    },
    [],
  );

  const handleReplaceMetadata = useCallback(
    (id: string, metadata: Record<string, TaxonMeta>) => {
      setRecords((current) =>
        current.map((record) => (record.id === id ? { ...record, metadata } : record)),
      );
    },
    [],
  );

  const handleProvenanceChange = useCallback(
    (id: string, patch: Partial<TreeRecord>) => {
      setRecords((current) =>
        current.map((record) => (record.id === id ? { ...record, ...patch } : record)),
      );
    },
    [],
  );

  const addImportedRecords = useCallback(
    (newRecords: TreeRecord[], message: string) => {
      if (!newRecords.length) return;
      setRecords((current) => [...current, ...newRecords]);
      setActiveId(newRecords[0].id);
      setMode('explore');
      setStoryId(null);
      setView('workbench');
      notify(message, 'success');
    },
    [notify],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > 12 * 1024 * 1024) {
        notify('文件超过 12 MB。建议先裁剪到几千个叶节点以内。', 'error');
        return;
      }
      try {
        const text = await file.text();
        const stamp = Date.now();
        const importedAt = new Date().toISOString();
        const baseName = file.name.replace(/\.(nwk|newick|tree|tre|txt|nex|nexus)$/i, '') || '导入的树';

        if (isNexus(text) || /\.(nex|nexus)$/i.test(file.name)) {
          const nexusTrees = parseNexus(text);
          const created: TreeRecord[] = [];
          const errors: string[] = [];
          nexusTrees.forEach((entry, index) => {
            const id = `custom-${stamp}-${index}`;
            try {
              const name = entry.name || `${baseName}-${index + 1}`;
              const tree = parseNewick(entry.newick, { id, name });
              created.push({
                id,
                name,
                subtitle: `${tree.leaves.length} 个类群 · NEXUS 导入`,
                newick: entry.newick,
                tree,
                metadata: {},
                source: `本地 NEXUS · ${file.name} · ${new Date().toLocaleDateString('zh-CN')}`,
                accent: '#f2c14e',
                custom: true,
                supportType: 'unknown',
                branchUnit: '未提供',
                method: 'NEXUS 文件导入',
                importedAt,
              });
            } catch (error) {
              errors.push(`${entry.name}：${error instanceof Error ? error.message : '解析失败'}`);
            }
          });
          if (!created.length) {
            throw new Error(errors[0] ?? 'NEXUS 中没有可用的树');
          }
          addImportedRecords(
            created,
            `已导入 ${created.length} 棵树${errors.length ? `，${errors.length} 棵失败` : ''}。`,
          );
          return;
        }

        const id = `custom-${stamp}`;
        const tree = parseNewick(text, { id, name: baseName });
        const record: TreeRecord = {
          id,
          name: baseName,
          subtitle: `${tree.leaves.length} 个类群 · 本地导入`,
          newick: text,
          tree,
          metadata: {},
          source: `本地文件 · ${file.name} · ${new Date().toLocaleDateString('zh-CN')}`,
          accent: '#f2c14e',
          custom: true,
          supportType: 'unknown',
          branchUnit: '未提供',
          method: 'Newick 文件导入',
          importedAt,
        };
        addImportedRecords([record], `已导入 ${baseName}，共 ${tree.leaves.length} 个叶节点。`);
      } catch (error) {
        const message =
          error instanceof NewickParseError
            ? error.message
            : error instanceof Error
              ? error.message
              : '未知解析错误';
        notify(`文件解析失败：${message}`, 'error');
      }
    },
    [addImportedRecords, notify],
  );

  const handleProjectImport = useCallback(
    async (file: File) => {
      try {
        const project = parseProjectFile(await file.text());
        const id = `custom-${Date.now()}-project`;
        const tree = parseNewick(project.newick, { id, name: project.name });
        const record: TreeRecord = {
          id,
          name: project.name,
          subtitle: `${tree.leaves.length} 个类群 · 项目导入`,
          newick: project.newick,
          tree,
          metadata: project.metadata,
          cladeLabels: project.cladeLabels,
          source: project.source ?? `项目 JSON · ${file.name}`,
          accent: '#f2c14e',
          custom: true,
          supportType: project.supportType ?? 'unknown',
          branchUnit: project.branchUnit ?? '未提供',
          method: project.method ?? '项目 JSON 导入',
          importedAt: new Date().toISOString(),
        };
        addImportedRecords([record], `已导入项目「${project.name}」。`);
        if (project.settings) {
          setPendingProjectSettings({ id, settings: project.settings });
        }
      } catch (error) {
        notify(
          `项目导入失败：${error instanceof Error ? error.message : '未知错误'}`,
          'error',
        );
      }
    },
    [addImportedRecords, notify],
  );

  const scrollToSection = useCallback(
    (id: string) => {
      if (view !== 'home') {
        setView('home');
        window.setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [view],
  );

  useEffect(() => {
    document.title =
      view === 'workbench'
        ? 'Workbench — TreeTale'
        : 'TreeTale — Every tree tells a story';
  }, [view]);

  return (
    <div className={`app app--${view}`}>
      <Nav
        inWorkbench={view === 'workbench'}
        onHome={() => {
          setView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onWorkbench={openWorkbench}
        onSection={scrollToSection}
      />

      {view === 'home' ? (
        <Home
          records={records}
          onWorkbench={openWorkbench}
          onOpenTree={openTree}
          onOpenStory={openStory}
        />
      ) : (
        <Workbench
          records={records}
          activeId={activeId}
          mode={mode}
          storyId={storyId}
          onActive={handleTreeActive}
          onMode={handleMode}
          onStoryId={handleStoryId}
          onUpload={handleUpload}
          onProjectImport={handleProjectImport}
          onUpdateTaxon={handleUpdateTaxon}
          onReplaceMetadata={handleReplaceMetadata}
          onProvenanceChange={handleProvenanceChange}
          projectSettings={pendingProjectSettings}
          onProjectSettingsApplied={() => setPendingProjectSettings(null)}
          notify={notify}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
