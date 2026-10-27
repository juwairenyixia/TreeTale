import { useMemo, useState } from 'react';
import type { RefObject } from 'react';
import type { TaxonMeta, TreeRecord } from '../types';
import type { TreeComparison } from '../lib/rf';
import { layoutTree } from '../lib/layout';
import { taxonKey } from '../lib/tree';
import { supportColor } from '../lib/palette';

interface CompareViewProps {
  left: TreeRecord;
  right: TreeRecord;
  comparison: TreeComparison;
  svgRef: RefObject<SVGSVGElement | null>;
}

const WIDTH = 1000;

export function CompareView({ left, right, comparison, svgRef }: CompareViewProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const height = Math.max(640, Math.max(left.tree.leaves.length, right.tree.leaves.length) * 30 + 120);

  const leftLayout = useMemo(
    () =>
      layoutTree(left.tree, {
        kind: 'rectangular',
        branchMode: 'phylogram',
        width: WIDTH,
        height,
        xStart: 18,
        xEnd: 282,
        yStart: 58,
        yEnd: height - 58,
        padding: 0,
        labelSpace: 0,
      }),
    [left.tree, height],
  );

  const rightLayout = useMemo(
    () =>
      layoutTree(right.tree, {
        kind: 'rectangular',
        branchMode: 'phylogram',
        width: WIDTH,
        height,
        xStart: 718,
        xEnd: 982,
        yStart: 58,
        yEnd: height - 58,
        padding: 0,
        labelSpace: 0,
        reverse: true,
      }),
    [right.tree, height],
  );

  const leftTips = new Map(leftLayout.tips.map((tip) => [taxonKey(tip.name ?? ''), tip]));
  const rightTips = new Map(rightLayout.tips.map((tip) => [taxonKey(tip.name ?? ''), tip]));

  const links = comparison.leftOnly.length + comparison.rightOnly.length;
  const hoveredKey = hovered ? taxonKey(hovered) : null;

  return (
    <div className="compare-view">
      <div className="compare-view__head">
        <span className="mono-label">连线比对图 / 共同物种</span>
        <div className="compare-view__legend">
          <span><i className="compare-dot compare-dot--left" />{left.name}</span>
          <span><i className="compare-dot compare-dot--right" />{right.name}</span>
          <b>RF 距离 {comparison.rf}</b>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="compare-canvas"
        viewBox={`0 0 ${WIDTH} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="两棵系统发育树的并排比较"
      >
        <defs>
          <linearGradient id="connectorGradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#8cc8c5" />
            <stop offset="100%" stopColor="#c7b8ff" />
          </linearGradient>
        </defs>

        <line x1={500} y1={28} x2={500} y2={height - 28} className="compare-divider" />
        <text x={500} y={36} textAnchor="middle" className="compare-gutter-label">
          相同物种 · 不同拓扑
        </text>

        <g className="compare-tree compare-tree--left">
          {leftLayout.links.map((link) => (
            <path
              key={link.id}
              d={`M ${link.source.x} ${link.source.y} H ${link.target.x} V ${link.target.y}`}
              className="tree-link"
            />
          ))}
          {leftLayout.nodes.filter((node) => !node.isTip).map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={2.6}
                className="tree-node"
                stroke={node.support !== undefined ? supportColor(node.support) : undefined}
              />
              {node.support !== undefined && (
                <text x={node.x + 5} y={node.y - 5} className="support-label" fill={supportColor(node.support)}>
                  {Math.round(node.support)}
                </text>
              )}
            </g>
          ))}
          {leftLayout.tips.map((tip) => {
            const active = hoveredKey === taxonKey(tip.name ?? '');
            return (
              <g
                key={tip.id}
                className={active ? 'is-hot' : ''}
                onMouseEnter={() => setHovered(tip.name ?? null)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle cx={tip.x} cy={tip.y} r={active ? 4.5 : 2.9} className="compare-tip" />
                <title>{labelFor(tip.name, left.metadata)}</title>
                <text
                  x={452}
                  y={tip.y + 4}
                  className={`compare-taxon ${active ? 'is-hot' : ''}`}
                  textAnchor="end"
                >
                  {truncate(labelFor(tip.name, left.metadata))}
                </text>
              </g>
            );
          })}
        </g>

        <g className="compare-tree compare-tree--right">
          {rightLayout.links.map((link) => (
            <path
              key={link.id}
              d={`M ${link.source.x} ${link.source.y} H ${link.target.x} V ${link.target.y}`}
              className="tree-link"
            />
          ))}
          {rightLayout.nodes.filter((node) => !node.isTip).map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={2.6}
                className="tree-node"
                stroke={node.support !== undefined ? supportColor(node.support) : undefined}
              />
              {node.support !== undefined && (
                <text x={node.x - 5} y={node.y - 5} textAnchor="end" className="support-label" fill={supportColor(node.support)}>
                  {Math.round(node.support)}
                </text>
              )}
            </g>
          ))}
          {rightLayout.tips.map((tip) => {
            const active = hoveredKey === taxonKey(tip.name ?? '');
            return (
              <g
                key={tip.id}
                className={active ? 'is-hot' : ''}
                onMouseEnter={() => setHovered(tip.name ?? null)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle cx={tip.x} cy={tip.y} r={active ? 4.5 : 2.9} className="compare-tip" />
                <title>{labelFor(tip.name, right.metadata)}</title>
                <text
                  x={548}
                  y={tip.y + 4}
                  className={`compare-taxon ${active ? 'is-hot' : ''}`}
                  textAnchor="start"
                >
                  {truncate(labelFor(tip.name, right.metadata))}
                </text>
              </g>
            );
          })}
        </g>

        <g className="tangle-links">
          {comparison.unmatchedLeft.length === 0 &&
            comparison.unmatchedRight.length === 0 &&
            [...leftTips.entries()].map(([key, leftTip]) => {
              const rightTip = rightTips.get(key);
              if (!rightTip) return null;
              const active = hoveredKey === key;
              return (
                <path
                  key={key}
                  d={`M 458 ${leftTip.y} C 482 ${leftTip.y}, 518 ${rightTip.y}, 542 ${rightTip.y}`}
                  className={`tangle-link ${active ? 'is-hot' : ''}`}
                />
              );
            })}
        </g>

        <g className="tangle-dots">
          {[...leftTips.entries()].map(([key, leftTip]) => {
            const rightTip = rightTips.get(key);
            if (!rightTip) return null;
            const active = hoveredKey === key;
            return (
              <g key={key} className={active ? 'is-hot' : ''}>
                <circle cx={458} cy={leftTip.y} r={active ? 3.2 : 2} />
                <circle cx={542} cy={rightTip.y} r={active ? 3.2 : 2} />
              </g>
            );
          })}
        </g>

        <g className="compare-foot">
          <text x={18} y={height - 18} className="compare-foot-label">
            {left.tree.leaves.length} 个物种 · 有根树 · 按枝长
          </text>
          <text x={982} y={height - 18} textAnchor="end" className="compare-foot-label">
            {right.tree.leaves.length} 个物种 · 有根树 · 按枝长
          </text>
          <text x={500} y={height - 18} textAnchor="middle" className="compare-foot-label">
            {links === 0 ? '两棵树拓扑一致' : `${links} 个不一致的进化枝`}
          </text>
        </g>
      </svg>

      <div className="compare-view__hint">
        <span>鼠标移到物种名上，可以看到它在两棵树中的位置。</span>
        <span>连线交叉表示位置变化，不一定是错误。</span>
      </div>
    </div>
  );
}

function labelFor(name: string | undefined, metadata: Record<string, TaxonMeta>): string {
  if (!name) return '未命名';
  const meta = metadata[name];
  return meta?.cn ?? meta?.common ?? name.replace(/_/g, ' ');
}

function truncate(value: string, max = 21): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
