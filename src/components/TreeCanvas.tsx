import { Maximize2, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { TaxonMeta, Tree, ViewSettings } from '../types';
import { layoutTree } from '../lib/layout';
import { displayName, maxDistance, pathToRoot, taxonLabel, walk } from '../lib/tree';
import { supportColor } from '../lib/palette';
import type { ColorScale } from '../lib/palette';

interface TreeCanvasProps {
  tree: Tree;
  settings: ViewSettings;
  metadata: Record<string, TaxonMeta>;
  colorScale: ColorScale;
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  storyFocusId?: string | null;
  storyActive?: boolean;
  accent: string;
  svgRef: RefObject<SVGSVGElement | null>;
  resetToken: number;
}

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_ZOOM = 0.16;
const MAX_ZOOM = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function niceScale(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0.1;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  return nice * 10 ** exponent;
}

export function TreeCanvas({
  tree,
  settings,
  metadata,
  colorScale,
  selectedId,
  onSelect,
  search,
  storyFocusId,
  storyActive = false,
  accent,
  svgRef,
  resetToken,
}: TreeCanvasProps) {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth,
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const narrow = viewportWidth < 760;
  const narrowHeight = Math.max(780, tree.leaves.length * 38 + 100);

  const layout = useMemo(() => {
    if (settings.layout === 'circular') {
      return layoutTree(tree, {
        kind: 'circular',
        branchMode: settings.branchMode,
        width: narrow ? 720 : 1000,
        height: narrow ? 720 : 940,
        padding: narrow ? 24 : 30,
        labelSpace: narrow ? 72 : 86,
      });
    }
    return layoutTree(tree, {
      kind: 'rectangular',
      branchMode: settings.branchMode,
      width: narrow ? 720 : 1120,
      height: narrow ? narrowHeight : undefined,
      padding: narrow ? 24 : 44,
      labelSpace: narrow ? 216 : 188,
      xStart: narrow ? 24 : 44,
      xEnd: narrow ? 480 : undefined,
      yStart: narrow ? 40 : 44,
      yEnd: narrow ? narrowHeight - 40 : undefined,
    });
  }, [tree, settings.layout, settings.branchMode, narrow, narrowHeight]);

  const [view, setView] = useState<ViewBox>({ x: 0, y: 0, w: layout.width, h: layout.height });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    view: ViewBox;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    setView({ x: 0, y: 0, w: layout.width, h: layout.height });
  }, [layout.width, layout.height, tree.id, settings.layout, settings.branchMode, resetToken]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      setView((current) => {
        const factor = Math.exp(event.deltaY * 0.0011);
        const nextW = clamp(current.w * factor, layout.width * MIN_ZOOM, layout.width * MAX_ZOOM);
        const scale = nextW / current.w;
        const nextH = current.h * scale;
        const nextX = current.x + px * current.w - px * nextW;
        const nextY = current.y + py * current.h - py * nextH;
        return { x: nextX, y: nextY, w: nextW, h: nextH };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [layout.width, layout.height, svgRef]);

  const selectedNode = tree.nodes.find((node) => node.id === selectedId);
  const selectedIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const ids = new Set<string>();
    walk(selectedNode, (node) => ids.add(node.id));
    for (const node of pathToRoot(selectedNode)) ids.add(node.id);
    return ids;
  }, [selectedNode]);

  const searchText = search.trim().toLowerCase();
  const searchIds = useMemo(() => {
    if (!searchText) return new Set<string>();
    const ids = new Set<string>();
    for (const tip of tree.leaves) {
      const label = displayName(tip, metadata).toLowerCase();
      const raw = (tip.name ?? '').toLowerCase();
      if (label.includes(searchText) || raw.includes(searchText)) {
        for (const ancestor of pathToRoot(tip)) ids.add(ancestor.id);
      }
    }
    return ids;
  }, [tree.leaves, metadata, searchText]);

  const searchTipIds = useMemo(() => {
    const ids = new Set<string>();
    if (!searchText) return ids;
    for (const tip of tree.leaves) {
      const label = displayName(tip, metadata).toLowerCase();
      const raw = (tip.name ?? '').toLowerCase();
      if (label.includes(searchText) || raw.includes(searchText)) ids.add(tip.id);
    }
    return ids;
  }, [tree.leaves, metadata, searchText]);

  const storyIds = useMemo(() => {
    const ids = new Set<string>();
    if (!storyActive || !storyFocusId) return ids;
    const node = tree.nodes.find((candidate) => candidate.id === storyFocusId);
    if (node) walk(node, (child) => ids.add(child.id));
    return ids;
  }, [storyActive, storyFocusId, tree.nodes]);

  const dimmed = (nodeId: string) => {
    if (storyActive && storyIds.size > 0) return !storyIds.has(nodeId);
    return false;
  };

  const selectedOrFocusIds = storyActive ? storyIds : selectedIds;
  const linkHot = (sourceId: string, targetId: string) =>
    selectedOrFocusIds.has(sourceId) && selectedOrFocusIds.has(targetId);

  const minX = Math.min(...layout.nodes.map((node) => node.x));
  const maxX = Math.max(...layout.nodes.map((node) => node.x));
  const maxDist = maxDistance(tree.root);
  const scaleValue = niceScale(maxDist * 0.14);
  const scaleLength = maxDist > 0 ? (scaleValue / maxDist) * (maxX - minX) : 60;
  const showScale = settings.branchMode === 'phylogram' && settings.layout === 'rectangular' && maxDist > 0;

  const zoom = (factor: number) => {
    setView((current) => {
      const nextW = clamp(current.w * factor, layout.width * MIN_ZOOM, layout.width * MAX_ZOOM);
      const scale = nextW / current.w;
      const nextH = current.h * scale;
      return {
        x: current.x + (current.w - nextW) / 2,
        y: current.y + (current.h - nextH) / 2,
        w: nextW,
        h: nextH,
      };
    });
  };

  const resetView = () => setView({ x: 0, y: 0, w: layout.width, h: layout.height });

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest('[data-tree-interactive="true"]')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      view,
      width: rect.width,
      height: rect.height,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.clientX;
    const dy = event.clientY - drag.current.clientY;
    const start = drag.current.view;
    setView({
      ...start,
      x: start.x - (dx * start.w) / Math.max(1, drag.current.width),
      y: start.y - (dy * start.h) / Math.max(1, drag.current.height),
    });
  };

  const endDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId === event.pointerId) {
      drag.current = null;
      setDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  const labelFor = (name?: string) => taxonLabel(name, metadata);

  return (
    <div className="tree-canvas-shell">
      <div className="canvas-tools">
        <button onClick={() => zoom(0.82)} aria-label="放大" title="放大">
          <Plus size={17} />
        </button>
        <button onClick={() => zoom(1.22)} aria-label="缩小" title="缩小">
          <Minus size={17} />
        </button>
        <button onClick={resetView} aria-label="适应窗口" title="适应窗口">
          <Maximize2 size={16} />
        </button>
      </div>

      <svg
        ref={svgRef}
        className={`tree-canvas ${dragging ? 'is-dragging' : ''}`}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="img"
        aria-label={`${tree.name} 系统发育树`}
      >
        <rect
          className="canvas-hitarea"
          x={view.x}
          y={view.y}
          width={view.w}
          height={view.h}
          fill="transparent"
        />

        {settings.layout === 'circular' && layout.centerX !== undefined && layout.centerY !== undefined && (
          <g className="circular-guides">
            {[0.34, 0.64, 0.94].map((ratio) => (
              <circle
                key={ratio}
                className="circular-ring"
                cx={layout.centerX}
                cy={layout.centerY}
                r={(layout.maxRadius ?? 300) * ratio}
              />
            ))}
            <text
              className="center-label"
              x={layout.centerX}
              y={layout.centerY + 6}
              textAnchor="middle"
            >
              phylogeny
            </text>
          </g>
        )}

        <g className="tree-links">
          {layout.links.map((link) => {
            const hot = linkHot(link.source.id, link.target.id);
            const inSearch = searchIds.has(link.source.id) && searchIds.has(link.target.id);
            const muted = dimmed(link.source.id) || dimmed(link.target.id);
            const path =
              settings.layout === 'circular'
                ? `M ${link.source.x} ${link.source.y} L ${link.target.x} ${link.target.y}`
                : `M ${link.source.x} ${link.source.y} H ${link.target.x} V ${link.target.y}`;
            return (
              <path
                key={link.id}
                d={path}
                className={`tree-link ${hot ? 'tree-link--highlight' : ''} ${
                  inSearch ? 'tree-link--search' : ''
                } ${muted ? 'tree-link--muted' : ''}`}
                style={hot ? ({ '--hot-color': accent } as CSSProperties) : undefined}
              />
            );
          })}
        </g>

        <g className="tree-nodes">
          {layout.nodes.map((node) => {
            const muted = dimmed(node.id);
            const isSelected = selectedId === node.id;
            const isSearch = searchTipIds.has(node.id);
            const nodeColor = colorScale.byTaxon.get(node.name ?? '') ?? '#10231c';
            if (node.isTip) {
              const isCollapsed = node.collapsed;
              const ringColor = isSearch ? '#d96c4b' : isSelected ? accent : nodeColor;
              const circular = settings.layout === 'circular' && node.angle !== undefined;
              const angle = node.angle ?? 0;
              const flip = circular && Math.cos(angle) < 0;
              const labelX = circular
                ? node.x + Math.cos(angle) * 10
                : node.x + (isCollapsed ? 14 : 10);
              const labelY = circular
                ? node.y + Math.sin(angle) * 10
                : node.y + 4.5;
              const rotation = circular
                ? (flip ? (angle * 180) / Math.PI - 180 : (angle * 180) / Math.PI)
                : 0;
              const note = metadata[node.name ?? '']?.note;
              return (
                <g
                  key={node.id}
                  className={`tree-tip ${muted ? 'is-muted' : ''}`}
                  data-tree-interactive="true"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(node.id);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onSelect(node.id);
                  }}
                  aria-label={note ? `${labelFor(node.name)}：${note}` : labelFor(node.name)}
                >
                  <title>{note ? `${labelFor(node.name)}：${note}` : labelFor(node.name)}</title>
                  {isCollapsed ? (
                    <path
                      d={`M ${node.x - 2} ${node.y - 5} L ${node.x + 9} ${node.y} L ${node.x - 2} ${node.y + 5} Z`}
                      className="collapsed-tip"
                      fill={ringColor}
                    />
                  ) : (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected || isSearch ? 4.6 : 3.2}
                      fill={ringColor}
                      className="tip-dot"
                    />
                  )}
                  <text
                    x={circular ? 0 : labelX}
                    y={circular ? 0 : labelY}
                    transform={circular ? `translate(${labelX} ${labelY}) rotate(${rotation})` : undefined}
                    textAnchor={circular && flip ? 'end' : 'start'}
                    dominantBaseline={circular ? 'middle' : undefined}
                    className={`tip-label ${isSelected ? 'is-selected' : ''} ${
                      isSearch ? 'is-search' : ''
                    } ${muted ? 'is-muted' : ''}`}
                    style={
                      settings.colorBy !== 'none' && !isSearch && !isSelected
                        ? { fill: ringColor }
                        : undefined
                    }
                  >
                    {isCollapsed ? node.name : labelFor(node.name)}
                  </text>
                </g>
              );
            }

            const support = node.support;
            return (
              <g key={node.id} className={`tree-internal ${muted ? 'is-muted' : ''}`}>
                <title>
                  共同祖先 · 包含 {node.leafCount} 个类群
                  {support !== undefined ? ` · 支持度 ${Math.round(support)}` : ''}
                </title>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 5 : 3}
                  fill={isSelected ? accent : '#f7f3e9'}
                  stroke={support !== undefined ? supportColor(support) : 'rgba(16,35,28,.35)'}
                  strokeWidth={isSelected ? 2.2 : 1.4}
                  className="tree-node"
                  data-tree-interactive="true"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(node.id);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onSelect(node.id);
                  }}
                />
                {settings.showSupport && support !== undefined && (
                  <text
                    x={node.x + 6}
                    y={node.y - 7}
                    className={`support-label ${muted ? 'is-muted' : ''}`}
                    fill={supportColor(support)}
                  >
                    {Math.round(support)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {showScale && (
          <g className="tree-scale">
            <line
              x1={minX}
              y1={layout.height - 16}
              x2={minX + scaleLength}
              y2={layout.height - 16}
              className="scale-line"
            />
            <line x1={minX} y1={layout.height - 20} x2={minX} y2={layout.height - 12} className="scale-line" />
            <line
              x1={minX + scaleLength}
              y1={layout.height - 20}
              x2={minX + scaleLength}
              y2={layout.height - 12}
              className="scale-line"
            />
            <text x={minX + scaleLength + 8} y={layout.height - 13} className="scale-label">
              每位点 {scaleValue} 个替换
            </text>
          </g>
        )}
      </svg>

      <div className="canvas-status">
        <span>{tree.leaves.length} 个叶节点</span>
        <i />
        <span>{settings.layout === 'rectangular' ? '矩形' : '圆形'}</span>
        <i />
        <span>{settings.branchMode === 'phylogram' ? '按枝长' : '按拓扑'}</span>
        {searchText && (
          <>
            <i />
            <span className="canvas-status__search">{searchTipIds.size} 个匹配</span>
          </>
        )}
      </div>
    </div>
  );
}
