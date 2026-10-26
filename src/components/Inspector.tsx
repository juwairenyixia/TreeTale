import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  CircleHelp,
  GitCompareArrows,
  Info,
  MousePointerClick,
  Sparkles,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import type { PhyloNode, Story, Tree, WorkbenchMode, TaxonMeta } from '../types';
import type { TreeComparison } from '../lib/rf';
import { displayName, descendantTips, pathToRoot } from '../lib/tree';
import { formatBranchLength } from '../lib/newick';
import { formatRf } from '../lib/rf';
import { supportColor } from '../lib/palette';

interface InspectorProps {
  tree: Tree;
  metadata: Record<string, TaxonMeta>;
  selectedNode: PhyloNode | null;
  mode: WorkbenchMode;
  comparison?: TreeComparison | null;
  compareNames?: { left: string; right: string };
  story?: Story | null;
  stepIndex: number;
  onStoryStep: (index: number) => void;
  onSelectTip: (name: string) => void;
  onOpenCompare?: () => void;
}

function distanceFromRoot(node: PhyloNode): number {
  return pathToRoot(node).reduce((total, item) => total + item.length, 0);
}

export function Inspector({
  tree,
  metadata,
  selectedNode,
  mode,
  comparison,
  compareNames,
  story,
  stepIndex,
  onStoryStep,
  onSelectTip,
  onOpenCompare,
}: InspectorProps) {
  if (mode === 'story' && story) {
    const step = story.steps[stepIndex];
    return (
      <aside className="inspector">
        <div className="inspector__head">
          <span className="panel-title">STORY / {String(stepIndex + 1).padStart(2, '0')}</span>
          <span className="story-progress">{stepIndex + 1} / {story.steps.length}</span>
        </div>
        <div className="story-step">
          <span className="story-step__kicker">{step.kicker ?? story.eyebrow}</span>
          <h2>{step.title}</h2>
          <p>{step.body}</p>
          <div className="story-focus">
            <span className="mono-label">FOCUS TAXA</span>
            <div className="chip-wrap">
              {step.focusTips.slice(0, 8).map((tipName) => (
                <button key={tipName} className="taxon-chip" onClick={() => onSelectTip(tipName)}>
                  {metadata[tipName]?.common ?? tipName.replace(/_/g, ' ')}
                </button>
              ))}
              {step.focusTips.length > 8 && (
                <span className="taxon-chip taxon-chip--more">+{step.focusTips.length - 8}</span>
              )}
            </div>
          </div>
          <div className="story-nav">
            <button
              className="btn btn--ghost btn--sm"
              disabled={stepIndex === 0}
              onClick={() => onStoryStep(stepIndex - 1)}
            >
              <ArrowLeft size={15} /> 上一步
            </button>
            {stepIndex < story.steps.length - 1 ? (
              <button className="btn btn--dark btn--sm" onClick={() => onStoryStep(stepIndex + 1)}>
                下一步 <ArrowRight size={15} />
              </button>
            ) : story.compareWith && onOpenCompare ? (
              <button className="btn btn--dark btn--sm" onClick={onOpenCompare}>
                打开比较 <GitCompareArrows size={15} />
              </button>
            ) : (
              <span className="story-end">故事结束</span>
            )}
          </div>
        </div>
        <div className="inspector-note">
          <Info size={14} />
          <p>故事中的高亮是教学引导，不替代对支持度和枝长的独立判断。</p>
        </div>
      </aside>
    );
  }

  if (mode === 'compare' && comparison) {
    if (comparison.sharedTaxa < 3) {
      return (
        <aside className="inspector">
          <div className="inspector__head">
            <span className="panel-title">COMPARE / RF</span>
            <span className="status-pill">not enough taxa</span>
          </div>
          <div className="empty-inspector">
            <span className="empty-inspector__icon">
              <GitCompareArrows size={22} />
            </span>
            <h2>共同 taxa 太少</h2>
            <p>
              当前两棵树只有 {comparison.sharedTaxa} 个共同 taxa，无法计算有意义的 RF 距离。
              请在左侧 COMPARE WITH 中选择一棵共享更多物种的树。
            </p>
          </div>
          <div className="inspector-note">
            <Info size={14} />
            <p>RF 只比较共同 taxa 的非平凡进化枝；名称按大小写不敏感、下划线转空格匹配。</p>
          </div>
        </aside>
      );
    }

    const score = Math.round(comparison.normalizedRf * 100);
    return (
      <aside className="inspector">
        <div className="inspector__head">
          <span className="panel-title">COMPARE / RF</span>
          <span className={`status-pill ${comparison.identical ? 'is-success' : ''}`}>
            {comparison.identical ? 'identical' : 'topology differs'}
          </span>
        </div>

        <div className="rf-hero">
          <div className="rf-gauge" style={{ '--rf-progress': `${score * 3.6}deg` } as CSSProperties}>
            <div>
              <strong>{formatRf(comparison.normalizedRf)}</strong>
              <span>normalized RF</span>
            </div>
          </div>
          <div className="rf-copy">
            <h2>{comparison.identical ? '两棵树拓扑一致' : '拓扑存在差异'}</h2>
            <p>
              {comparison.rf} 个不共享的进化枝，理论最大 RF 为 {comparison.maxRf}。
              RF 只描述拓扑差异，不解释差异的原因。
            </p>
          </div>
        </div>

        <div className="compare-names">
          <span><i className="compare-dot compare-dot--left" />{compareNames?.left ?? 'Tree A'}</span>
          <GitCompareArrows size={14} />
          <span><i className="compare-dot compare-dot--right" />{compareNames?.right ?? 'Tree B'}</span>
        </div>

        <div className="inspector-section">
          <div className="section-line">
            <span>匹配 taxa</span>
            <strong>{comparison.sharedTaxa}</strong>
          </div>
          <div className="section-line">
            <span>仅左树出现的 clade</span>
            <strong>{comparison.leftOnly.length}</strong>
          </div>
          <div className="section-line">
            <span>仅右树出现的 clade</span>
            <strong>{comparison.rightOnly.length}</strong>
          </div>
        </div>

        {(comparison.unmatchedLeft.length > 0 || comparison.unmatchedRight.length > 0) && (
          <div className="warning-card">
            <Info size={15} />
            <p>
              有未匹配的 taxa：{comparison.unmatchedLeft.length} 个只在左树，
              {comparison.unmatchedRight.length} 个只在右树。RF 仅基于共同 taxa 计算。
            </p>
          </div>
        )}

        <div className="inspector-section">
          <div className="section-heading">
            <span className="mono-label">CONFLICTING CLADES</span>
            <span>{comparison.leftOnly.length + comparison.rightOnly.length}</span>
          </div>
          {comparison.leftOnly.length + comparison.rightOnly.length === 0 ? (
            <p className="muted-copy">两棵树的非平凡 clade 集合完全一致。</p>
          ) : (
            <div className="conflict-list">
              {[...comparison.leftOnly.slice(0, 3), ...comparison.rightOnly.slice(0, 3)].map((clade, index) => (
                <div className="conflict-item" key={`${clade.side}-${clade.key}-${index}`}>
                  <span className={`compare-dot compare-dot--${clade.side}`} />
                  <div>
                    <strong>{clade.size} taxa clade</strong>
                    <p>{clade.tipNames.slice(0, 4).map((name) => metadata[name]?.common ?? name.replace(/_/g, ' ')).join('、')}</p>
                  </div>
                  <span className="conflict-side">{clade.side === 'left' ? 'A only' : 'B only'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="inspector-note">
          <Info size={14} />
          <p>基因树和物种树不一致可能来自不完全谱系分选、基因复制/丢失或建树误差。</p>
        </div>
      </aside>
    );
  }

  if (selectedNode) {
    const tips = descendantTips(selectedNode);
    const isTip = !selectedNode.children.length;
    const support = selectedNode.support;
    return (
      <aside className="inspector">
        <div className="inspector__head">
          <span className="panel-title">INSPECTOR</span>
          <span className="status-pill">{selectedNode.collapsed ? 'collapsed' : isTip ? 'tip' : 'clade'}</span>
        </div>

        <div className="node-hero">
          <span className="node-hero__type">{isTip ? 'LEAF / TAXON' : 'INTERNAL NODE'}</span>
          <h2>{displayName(selectedNode, metadata)}</h2>
          {selectedNode.name && metadata[selectedNode.name]?.common && (
            <p className="scientific">{selectedNode.name.replace(/_/g, ' ')}</p>
          )}
          <div className="node-badges">
            {metadata[selectedNode.name ?? '']?.group && (
              <span className="soft-badge">{metadata[selectedNode.name!]?.group}</span>
            )}
            {metadata[selectedNode.name ?? '']?.habitat && (
              <span className="soft-badge">{metadata[selectedNode.name!]?.habitat}</span>
            )}
            {selectedNode.collapsed && <span className="soft-badge">折叠的 clade</span>}
          </div>
        </div>

        <div className="metric-grid">
          <div className="metric">
            <span>Branch length</span>
            <strong>{formatBranchLength(selectedNode.length)}</strong>
            <small>到父节点的枝长</small>
          </div>
          <div className="metric">
            <span>Root distance</span>
            <strong>{formatBranchLength(distanceFromRoot(selectedNode))}</strong>
            <small>累计枝长</small>
          </div>
          <div className="metric">
            <span>Descendants</span>
            <strong>{tips.length}</strong>
            <small>{isTip ? '叶节点' : '后代 taxa'}</small>
          </div>
          <div className="metric">
            <span>Support</span>
            <strong style={{ color: support !== undefined ? supportColor(support) : undefined }}>
              {support !== undefined ? Math.round(support) : '—'}
            </strong>
            <small>bootstrap / posterior</small>
          </div>
        </div>

        {support !== undefined && (
          <div className="support-meter">
            <div className="support-meter__head">
              <span>Support</span>
              <strong>{Math.round(support)} / 100</strong>
            </div>
            <div className="support-meter__track">
              <span style={{ width: `${support}%`, background: supportColor(support) }} />
            </div>
          </div>
        )}

        {!isTip && (
          <div className="inspector-section">
            <div className="section-heading">
              <span className="mono-label">DESCENDANT TAXA</span>
              <span>{tips.length}</span>
            </div>
            <div className="chip-wrap">
              {tips.slice(0, 12).map((tip) => (
                <button
                  key={tip.id}
                  className="taxon-chip"
                  onClick={() => onSelectTip(tip.name ?? '')}
                  title={tip.name}
                >
                  {metadata[tip.name ?? '']?.common ?? tip.name?.replace(/_/g, ' ')}
                </button>
              ))}
              {tips.length > 12 && <span className="taxon-chip taxon-chip--more">+{tips.length - 12}</span>}
            </div>
          </div>
        )}

        {metadata[selectedNode.name ?? '']?.note && (
          <div className="inspector-note">
            <BookOpen size={14} />
            <p>{metadata[selectedNode.name!]?.note}</p>
          </div>
        )}

        <div className="inspector-note">
          <Info size={14} />
          <p>支持度不是“该分支为真”的概率。bootstrap 与 posterior 的含义不同，读图时要看建树方法。</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="inspector">
      <div className="inspector__head">
        <span className="panel-title">HOW TO READ</span>
        <CircleHelp size={16} />
      </div>

      <div className="empty-inspector">
        <span className="empty-inspector__icon">
          <MousePointerClick size={22} />
        </span>
        <h2>点击任意节点</h2>
        <p>查看它代表的类群、支持度、枝长和后代 taxa。也可以直接搜索一个物种。</p>
      </div>

      <div className="reading-list">
        <div className="reading-item">
          <span>01</span>
          <div>
            <strong>先看拓扑</strong>
            <p>谁和谁更近？一个内部节点代表一个 clade。</p>
          </div>
        </div>
        <div className="reading-item">
          <span>02</span>
          <div>
            <strong>再看枝长</strong>
            <p>Phylogram 的横轴是替换数，不是时间。</p>
          </div>
        </div>
        <div className="reading-item">
          <span>03</span>
          <div>
            <strong>最后看支持度</strong>
            <p>低支持分支可以折叠，但不要直接删掉。</p>
          </div>
        </div>
      </div>

      <div className="inspector-note inspector-note--accent">
        <Sparkles size={14} />
        <p>提示：打开 Story 模式，看看一条叙事如何把注意力带到特定分支。</p>
      </div>

      <button className="inspector-link" onClick={() => onSelectTip(tree.leaves[0]?.name ?? '')}>
        选中第一个叶节点
        <ChevronRight size={15} />
      </button>
      {mode === 'compare' && (
        <button className="inspector-link" onClick={onOpenCompare}>
          重新查看比较
          <ArrowUpRight size={15} />
        </button>
      )}
    </aside>
  );
}
