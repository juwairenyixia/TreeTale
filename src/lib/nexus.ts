export interface NexusTree {
  name: string;
  newick: string;
}

export function isNexus(text: string): boolean {
  const source = text.replace(/^\uFEFF/, '');
  return /^\s*#NEXUS\b/i.test(source) || /\bBEGIN\s+TREES\s*;/i.test(source);
}

/**
 * A pragmatic NEXUS TREE-block reader.
 * It intentionally ignores TAXA/TRANSLATE blocks and expects literal taxon
 * labels in each Newick string, which covers the common exported files used
 * by TreeTale.
 */
export function parseNexus(text: string): NexusTree[] {
  const source = text.replace(/^\uFEFF/, '');
  const trees: NexusTree[] = [];
  const treePattern =
    /\bTREE\s+(?:\*\s*)?(?:'((?:[^']|'')+)'|([^\s=]+))\s*=\s*(?:\[[^\]]*\]\s*)?([^;]+);/gi;

  let match: RegExpExecArray | null;
  while ((match = treePattern.exec(source))) {
    const rawName = match[1] ?? match[2] ?? `tree-${trees.length + 1}`;
    const name = rawName.replace(/''/g, "'").trim();
    const newick = `${match[3].trim()};`;
    if (!newick.startsWith('(')) continue;
    trees.push({ name, newick });
  }

  if (!trees.length) {
    throw new Error('NEXUS 文件中没有找到 TREE 语句');
  }
  return trees;
}
