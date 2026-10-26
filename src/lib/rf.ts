import type { PhyloNode, Tree } from '../types';
import { descendantTipNames, matchTaxa, nonTrivialClades, taxonKey } from './tree';

export interface CladeDifference {
  key: string;
  tipNames: string[];
  size: number;
  support?: number;
  side: 'left' | 'right';
}

export interface TreeComparison {
  sharedTaxa: number;
  unmatchedLeft: string[];
  unmatchedRight: string[];
  rf: number;
  maxRf: number;
  normalizedRf: number;
  leftOnly: CladeDifference[];
  rightOnly: CladeDifference[];
  identical: boolean;
}

function sharedCladeMap(
  tree: Tree,
  sharedKeys: Set<string>,
): Map<string, { node: PhyloNode; tipNames: string[] }> {
  const map = new Map<string, { node: PhyloNode; tipNames: string[] }>();
  for (const [key, node] of nonTrivialClades(tree)) {
    const names = descendantTipNames(node).filter((name) => sharedKeys.has(taxonKey(name)));
    if (names.length < 2 || names.length >= sharedKeys.size) continue;
    const sharedKey = names.map((name) => taxonKey(name)).sort().join('\u0001');
    map.set(sharedKey, { node, tipNames: names });
  }
  return map;
}

export function compareTrees(left: Tree, right: Tree): TreeComparison {
  const matched = matchTaxa(left, right);
  const sharedKeys = new Set(matched.matches.map((pair) => taxonKey(pair.left.name ?? '')));
  const leftClades = sharedCladeMap(left, sharedKeys);
  const rightClades = sharedCladeMap(right, sharedKeys);

  const leftOnly: CladeDifference[] = [];
  const rightOnly: CladeDifference[] = [];

  for (const [key, value] of leftClades) {
    if (!rightClades.has(key)) {
      leftOnly.push({
        key,
        tipNames: value.tipNames,
        size: value.tipNames.length,
        support: value.node.support,
        side: 'left',
      });
    }
  }
  for (const [key, value] of rightClades) {
    if (!leftClades.has(key)) {
      rightOnly.push({
        key,
        tipNames: value.tipNames,
        size: value.tipNames.length,
        support: value.node.support,
        side: 'right',
      });
    }
  }

  leftOnly.sort((a, b) => b.size - a.size);
  rightOnly.sort((a, b) => b.size - a.size);

  const rf = leftOnly.length + rightOnly.length;
  const maxRf = Math.max(1, 2 * (sharedKeys.size - 2));

  return {
    sharedTaxa: sharedKeys.size,
    unmatchedLeft: matched.unmatchedLeft,
    unmatchedRight: matched.unmatchedRight,
    rf,
    maxRf,
    normalizedRf: Math.min(1, rf / maxRf),
    leftOnly,
    rightOnly,
    identical: rf === 0,
  };
}

export function formatRf(value: number): string {
  if (value === 0) return '0';
  return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}
