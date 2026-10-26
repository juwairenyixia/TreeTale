import type { PhyloNode, Tree, TaxonMeta } from '../types';

export function walk(node: PhyloNode, visit: (node: PhyloNode, depth: number) => void, depth = 0): void {
  visit(node, depth);
  for (const child of node.children) walk(child, visit, depth + 1);
}

export function getLeaves(node: PhyloNode): PhyloNode[] {
  const leaves: PhyloNode[] = [];
  walk(node, (current) => {
    if (!current.children.length) leaves.push(current);
  });
  return leaves;
}

export function countLeaves(node: PhyloNode): number {
  if (!node.children.length) return 1;
  return node.children.reduce((total, child) => total + countLeaves(child), 0);
}

export function maxDistance(node: PhyloNode, distance = 0): number {
  const next = distance + node.length;
  if (!node.children.length) return next;
  return Math.max(...node.children.map((child) => maxDistance(child, next)));
}

export function maxDepth(node: PhyloNode, depth = 0): number {
  if (!node.children.length) return depth;
  return Math.max(...node.children.map((child) => maxDepth(child, depth + 1)));
}

export function pathToRoot(node: PhyloNode): PhyloNode[] {
  const path: PhyloNode[] = [];
  let current: PhyloNode | undefined = node;
  while (current) {
    path.push(current);
    current = current.parent;
  }
  return path;
}

export function descendantTips(node: PhyloNode): PhyloNode[] {
  return getLeaves(node);
}

export function descendantTipNames(node: PhyloNode): string[] {
  return descendantTips(node)
    .map((tip) => tip.name ?? '')
    .filter(Boolean);
}

export function isAncestor(ancestor: PhyloNode, node: PhyloNode): boolean {
  let current: PhyloNode | undefined = node;
  while (current) {
    if (current.id === ancestor.id) return true;
    current = current.parent;
  }
  return false;
}

export function findNode(tree: Tree, predicate: (node: PhyloNode) => boolean): PhyloNode | undefined {
  return tree.nodes.find(predicate);
}

export function findTip(tree: Tree, name: string): PhyloNode | undefined {
  const key = taxonKey(name);
  return tree.leaves.find((tip) => taxonKey(tip.name ?? '') === key);
}

export function getMrca(tree: Tree, tipNames: string[]): PhyloNode | undefined {
  const tips = tipNames.map((name) => findTip(tree, name)).filter(Boolean) as PhyloNode[];
  if (!tips.length) return undefined;
  const path = pathToRoot(tips[0]);
  let candidate: PhyloNode | undefined;
  for (const ancestor of path) {
    if (tips.every((tip) => isAncestor(ancestor, tip))) candidate = ancestor;
  }
  return candidate;
}

export function ancestorIdSet(node: PhyloNode | undefined): Set<string> {
  const ids = new Set<string>();
  if (!node) return ids;
  let current: PhyloNode | undefined = node;
  while (current) {
    ids.add(current.id);
    current = current.parent;
  }
  return ids;
}

export function taxonKey(name: string): string {
  return name
    .trim()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function displayName(node: PhyloNode, metadata?: Record<string, TaxonMeta>): string {
  if (!node.name) return '未命名节点';
  return metadata?.[node.name]?.common ?? node.name.replace(/_/g, ' ');
}

export function cladeKey(node: PhyloNode): string {
  return descendantTips(node)
    .map((tip) => tip.name ?? tip.id)
    .sort()
    .join('|');
}

export function nonTrivialClades(tree: Tree): Map<string, PhyloNode> {
  const clades = new Map<string, PhyloNode>();
  walk(tree.root, (node) => {
    if (!node.children.length) return;
    const tips = descendantTips(node);
    if (tips.length < 2 || tips.length >= tree.leaves.length) return;
    clades.set(cladeKey(node), node);
  });
  return clades;
}

export function treeStats(tree: Tree) {
  const supports = tree.nodes
    .filter((node) => node.children.length > 0 && node.support !== undefined)
    .map((node) => node.support as number);
  return {
    taxa: tree.leaves.length,
    nodes: tree.nodes.length,
    supportCount: supports.length,
    meanSupport: supports.length ? supports.reduce((a, b) => a + b, 0) / supports.length : 0,
    height: maxDistance(tree.root),
    depth: maxDepth(tree.root),
  };
}

interface CloneOptions {
  collapseBelow?: number;
  ladderize?: boolean;
}

function sortChildren(node: PhyloNode): void {
  node.children.sort((a, b) => {
    const size = countLeaves(b) - countLeaves(a);
    if (size !== 0) return size;
    return (a.name ?? '').localeCompare(b.name ?? '');
  });
  node.children.forEach(sortChildren);
}

/**
 * Produces a display-only copy. Nodes below the support threshold become a
 * single collapsed tip, while ladderize sorts children by clade size.
 */
export function prepareTree(tree: Tree, options: CloneOptions = {}): Tree {
  const collapseBelow = options.collapseBelow ?? 0;
  const nodes: PhyloNode[] = [];

  const clone = (original: PhyloNode, parent?: PhyloNode): PhyloNode => {
    const shouldCollapse =
      collapseBelow > 0 &&
      original.children.length > 0 &&
      original.support !== undefined &&
      original.support < collapseBelow;

    if (shouldCollapse) {
      const size = countLeaves(original);
      const collapsed: PhyloNode = {
        id: `${original.id}-collapsed`,
        name: `${size} 个类群`,
        length: original.length,
        support: original.support,
        children: [],
        parent,
        collapsed: true,
        originalId: original.id,
      };
      nodes.push(collapsed);
      return collapsed;
    }

    const copy: PhyloNode = {
      id: original.id,
      name: original.name,
      length: original.length,
      support: original.support,
      children: [],
      parent,
      originalId: original.id,
    };
    nodes.push(copy);
    copy.children = original.children.map((child) => clone(child, copy));
    return copy;
  };

  const root = clone(tree.root);
  if (options.ladderize) sortChildren(root);

  const leaves: PhyloNode[] = [];
  walk(root, (node) => {
    if (!node.children.length) leaves.push(node);
  });

  return {
    ...tree,
    id: `${tree.id}-display`,
    root,
    nodes,
    leaves,
  };
}

export interface TaxonMatch {
  left: PhyloNode;
  right: PhyloNode;
}

export function matchTaxa(left: Tree, right: Tree): {
  matches: TaxonMatch[];
  unmatchedLeft: string[];
  unmatchedRight: string[];
} {
  const rightByKey = new Map<string, PhyloNode>();
  for (const tip of right.leaves) rightByKey.set(taxonKey(tip.name ?? ''), tip);

  const matches: TaxonMatch[] = [];
  const matchedRight = new Set<string>();
  const unmatchedLeft: string[] = [];

  for (const tip of left.leaves) {
    const key = taxonKey(tip.name ?? '');
    const other = rightByKey.get(key);
    if (other) {
      matches.push({ left: tip, right: other });
      matchedRight.add(key);
    } else {
      unmatchedLeft.push(tip.name ?? '未命名');
    }
  }

  const unmatchedRight = right.leaves
    .filter((tip) => !matchedRight.has(taxonKey(tip.name ?? '')))
    .map((tip) => tip.name ?? '未命名');

  return { matches, unmatchedLeft, unmatchedRight };
}
