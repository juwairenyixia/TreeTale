import type {
  BranchMode,
  LayoutKind,
  LayoutLink,
  LayoutNode,
  PhyloNode,
  Tree,
  TreeLayout,
} from '../types';
import { countLeaves, maxDepth, maxDistance, walk } from './tree';

export interface LayoutOptions {
  kind: LayoutKind;
  branchMode: BranchMode;
  width?: number;
  height?: number;
  padding?: number;
  labelSpace?: number;
  xStart?: number;
  xEnd?: number;
  yStart?: number;
  yEnd?: number;
  reverse?: boolean;
}

function makeLayoutNode(
  node: PhyloNode,
  values: Pick<LayoutNode, 'x' | 'y' | 'distance' | 'depth' | 'leafCount' | 'angle'>,
): LayoutNode {
  return {
    id: node.id,
    name: node.name,
    x: values.x,
    y: values.y,
    depth: values.depth,
    distance: values.distance,
    support: node.support,
    leafCount: values.leafCount,
    isTip: node.children.length === 0,
    collapsed: Boolean(node.collapsed),
    originalId: node.originalId ?? node.id,
    angle: values.angle,
  };
}

export function layoutTree(tree: Tree, options: LayoutOptions): TreeLayout {
  if (options.kind === 'circular') return circularLayout(tree, options);
  return rectangularLayout(tree, options);
}

function rectangularLayout(tree: Tree, options: LayoutOptions): TreeLayout {
  const padding = options.padding ?? 44;
  const labelSpace = options.labelSpace ?? 188;
  const width = options.width ?? 1120;
  const height = options.height ?? Math.max(620, tree.leaves.length * 34 + 120);
  const xStart = options.xStart ?? padding;
  const xEnd = options.xEnd ?? width - padding - labelSpace;
  const yStart = options.yStart ?? padding;
  const yEnd = options.yEnd ?? height - padding;

  const leafCountMap = new Map<string, number>();
  walk(tree.root, (node) => leafCountMap.set(node.id, countLeaves(node)));

  const distanceMap = new Map<string, number>();
  const depthMap = new Map<string, number>();
  walk(tree.root, (node) => {
    if (!node.parent) {
      distanceMap.set(node.id, 0);
      depthMap.set(node.id, 0);
    } else {
      distanceMap.set(node.id, (distanceMap.get(node.parent.id) ?? 0) + node.length);
      depthMap.set(node.id, (depthMap.get(node.parent.id) ?? 0) + 1);
    }
  });

  const maxDist = Math.max(0, ...Array.from(distanceMap.values()));
  const maxDep = Math.max(1, maxDepth(tree.root));
  const useDistance = options.branchMode === 'phylogram' && maxDist > 0;
  const span = Math.max(1, useDistance ? maxDist : maxDep);
  const rowHeight = tree.leaves.length > 1 ? (yEnd - yStart) / (tree.leaves.length - 1) : 0;

  const nodes: LayoutNode[] = [];
  const byId = new Map<string, LayoutNode>();
  let leafIndex = 0;

  const visit = (node: PhyloNode): LayoutNode => {
    const leafCount = leafCountMap.get(node.id) ?? 1;
    let y: number;
    if (node.children.length) {
      const children = node.children.map(visit);
      y = (children[0].y + children[children.length - 1].y) / 2;
    } else {
      y = tree.leaves.length > 1 ? yStart + leafIndex * rowHeight : (yStart + yEnd) / 2;
      leafIndex += 1;
    }

    const value = useDistance ? (distanceMap.get(node.id) ?? 0) : (depthMap.get(node.id) ?? 0);
    const ratio = Math.max(0, Math.min(1, value / span));
    const x = options.reverse ? xEnd - ratio * (xEnd - xStart) : xStart + ratio * (xEnd - xStart);
    const layoutNode = makeLayoutNode(node, {
      x,
      y,
      distance: distanceMap.get(node.id) ?? 0,
      depth: depthMap.get(node.id) ?? 0,
      leafCount,
    });
    nodes.push(layoutNode);
    byId.set(node.id, layoutNode);
    return layoutNode;
  };

  const root = visit(tree.root);
  const links: LayoutLink[] = [];
  walk(tree.root, (node) => {
    for (const child of node.children) {
      const source = byId.get(node.id);
      const target = byId.get(child.id);
      if (source && target) {
        links.push({ id: `${source.id}-${target.id}`, source, target });
      }
    }
  });

  return {
    nodes,
    links,
    tips: nodes.filter((node) => node.isTip),
    width,
    height,
    centerX: root.x,
    centerY: root.y,
  };
}

function circularLayout(tree: Tree, options: LayoutOptions): TreeLayout {
  const width = options.width ?? 1000;
  const height = options.height ?? 940;
  const padding = options.padding ?? 40;
  const labelSpace = options.labelSpace ?? 92;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - padding - labelSpace;
  const leafCountMap = new Map<string, number>();
  walk(tree.root, (node) => leafCountMap.set(node.id, countLeaves(node)));

  const distanceMap = new Map<string, number>();
  const depthMap = new Map<string, number>();
  walk(tree.root, (node) => {
    if (!node.parent) {
      distanceMap.set(node.id, 0);
      depthMap.set(node.id, 0);
    } else {
      distanceMap.set(node.id, (distanceMap.get(node.parent.id) ?? 0) + node.length);
      depthMap.set(node.id, (depthMap.get(node.parent.id) ?? 0) + 1);
    }
  });

  const maxDist = Math.max(0.000001, ...Array.from(distanceMap.values()));
  const maxDep = Math.max(1, maxDepth(tree.root));
  const useDistance = options.branchMode === 'phylogram' && maxDist > 0;
  const span = useDistance ? maxDist : maxDep;
  const step = (Math.PI * 2) / Math.max(1, tree.leaves.length);
  const start = -Math.PI / 2;
  let leafIndex = 0;

  const nodes: LayoutNode[] = [];
  const byId = new Map<string, LayoutNode>();

  const visit = (node: PhyloNode): LayoutNode => {
    let angle = start;
    if (node.children.length) {
      const children = node.children.map(visit);
      angle = (children[0].angle! + children[children.length - 1].angle!) / 2;
    } else {
      angle = start + leafIndex * step;
      leafIndex += 1;
    }

    const value = useDistance ? (distanceMap.get(node.id) ?? 0) : (depthMap.get(node.id) ?? 0);
    const radius = (value / span) * maxRadius;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const layoutNode = makeLayoutNode(node, {
      x,
      y,
      distance: distanceMap.get(node.id) ?? 0,
      depth: depthMap.get(node.id) ?? 0,
      leafCount: leafCountMap.get(node.id) ?? 1,
      angle,
    });
    nodes.push(layoutNode);
    byId.set(node.id, layoutNode);
    return layoutNode;
  };

  visit(tree.root);

  const links: LayoutLink[] = [];
  walk(tree.root, (node) => {
    for (const child of node.children) {
      const source = byId.get(node.id);
      const target = byId.get(child.id);
      if (source && target) {
        links.push({ id: `${source.id}-${target.id}`, source, target });
      }
    }
  });

  return {
    nodes,
    links,
    tips: nodes.filter((node) => node.isTip),
    width,
    height,
    centerX,
    centerY,
    maxRadius,
  };
}

export function tipLayoutPositions(layout: TreeLayout): Map<string, LayoutNode> {
  const map = new Map<string, LayoutNode>();
  for (const tip of layout.tips) {
    if (tip.name) map.set(tip.name, tip);
  }
  return map;
}
