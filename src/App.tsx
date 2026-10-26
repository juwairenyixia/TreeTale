import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Story, TreeRecord, WorkbenchMode } from './types';
import { buildExampleTrees, stories } from './data/examples';
import { parseNewick, NewickParseError } from './lib/newick';
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

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ id: Date.now(), message, type });
  }, []);

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

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        notify('文件超过 5 MB。课程项目建议先裁剪到几千个叶节点以内。', 'error');
        return;
      }
      try {
        const text = await file.text();
        const id = `custom-${Date.now()}`;
        const name = file.name.replace(/\.(nwk|newick|tree|tre|txt)$/i, '') || 'Imported tree';
        const tree = parseNewick(text, { id, name });
        const record: TreeRecord = {
          id,
          name,
          subtitle: `${tree.leaves.length} taxa · 本地导入`,
          newick: text,
          tree,
          metadata: {},
          source: `本地文件 · ${file.name} · ${new Date().toLocaleDateString('zh-CN')}`,
          accent: '#f2c14e',
          custom: true,
        };
        setRecords((current) => [...current, record]);
        setActiveId(id);
        setMode('explore');
        setStoryId(null);
        setView('workbench');
        notify(`已导入 ${name}，共 ${tree.leaves.length} 个叶节点。`, 'success');
      } catch (error) {
        const message =
          error instanceof NewickParseError
            ? error.message
            : error instanceof Error
              ? error.message
              : '未知解析错误';
        notify(`Newick 解析失败：${message}`, 'error');
      }
    },
    [notify],
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
          notify={notify}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
