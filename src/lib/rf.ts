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
  matchedPairs: Array<{ left: string; right: string }>;
  rf: number;
  maxRf: number;
  normalizedRf: number;
  leftOnly: CladeDifference[];
  rightOnly: CladeDifference[];
  identical: boolean;
}

export interface CompareOptions {
  /** left taxon name -> right taxon name */
  aliases?: Record<string, string>;
}

function sharedCladeMap(
  tree: Tree,
  canonicalForName: (name: string) => string | undefined,
  sharedKeys: Set<string>,
): Map<string, { node: PhyloNode; tipNames: string[] }> {
  const map = new Map<string, { node: PhyloNode; tipNames: string[] }>();
  for (const node of nonTrivialClades(tree).values()) {
    const names = descendantTipNames(node);
    const canonical = names
      .map((name) => canonicalForName(name))
      .filter((key): key is string => Boolean(key) && sharedKeys.has(key as string));
    if (canonical.length < 2 || canonical.length >= sharedKeys.size) continue;
    const sharedKey = [...canonical].sort().join('\u0001');
    map.set(sharedKey, { node, tipNames: names });
  }
  return map;
}

export function compareTrees(
  left: Tree,
  right: Tree,
  options: CompareOptions = {},
): TreeComparison {
  const matched = matchTaxa(left, right, options.aliases);
  const sharedKeys = new Set(matched.matches.map((pair) => taxonKey(pair.left.name ?? '')));
  const leftCanonical = new Map<string, string>();
  const rightCanonical = new Map<string, string>();
  for (const pair of matched.matches) {
    const leftName = pair.left.name ?? '';
    const rightName = pair.right.name ?? '';
    if (!leftName || !rightName) continue;
    const key = taxonKey(leftName);
    leftCanonical.set(taxonKey(leftName), key);
    rightCanonical.set(taxonKey(rightName), key);
  }
  const leftClades = sharedCladeMap(
    left,
    (name) => leftCanonical.get(taxonKey(name)),
    sharedKeys,
  );
  const rightClades = sharedCladeMap(
    right,
    (name) => rightCanonical.get(taxonKey(name)),
    sharedKeys,
  );

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
    matchedPairs: matched.matches.map((pair) => ({
      left: pair.left.name ?? '',
      right: pair.right.name ?? '',
    })),
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
