export type LayoutKind = 'rectangular' | 'circular';
export type BranchMode = 'phylogram' | 'cladogram';
export type ColorMode = 'group' | 'habitat' | 'none';
export type WorkbenchMode = 'explore' | 'compare' | 'story';

export interface PhyloNode {
  id: string;
  name?: string;
  length: number;
  support?: number;
  children: PhyloNode[];
  parent?: PhyloNode;
  collapsed?: boolean;
  originalId?: string;
}

export interface Tree {
  id: string;
  name: string;
  root: PhyloNode;
  nodes: PhyloNode[];
  leaves: PhyloNode[];
  rooted: boolean;
}

export interface TaxonMeta {
  /** 中文常用名，优先用于树标签和检查器标题 */
  cn?: string;
  /** 英文常用名，仅在需要时作为辅助信息 */
  common?: string;
  /** 中文类群名 */
  group?: string;
  /** 中文生境名 */
  habitat?: string;
  /** 面向初学者的中文说明 */
  note?: string;
}

export interface CladeLabel {
  id: string;
  /** 中文进化枝名 */
  name: string;
  /** 组成该进化枝的物种名，必须恰好覆盖一个完整进化枝 */
  tips: string[];
  /** 面向初学者的中文说明 */
  description?: string;
  /** 相对 MRCA 节点的水平偏移，用于避开其他标签 */
  offsetX?: number;
  /** 相对 MRCA 节点的垂直偏移，用于避开其他标签 */
  offsetY?: number;
}

export interface TreeRecord {
  id: string;
  name: string;
  subtitle: string;
  newick: string;
  tree: Tree;
  metadata: Record<string, TaxonMeta>;
  cladeLabels?: CladeLabel[];
  source: string;
  accent: string;
  compareWith?: string;
  custom?: boolean;
}

export interface ViewSettings {
  layout: LayoutKind;
  branchMode: BranchMode;
  supportThreshold: number;
  ladderize: boolean;
  showSupport: boolean;
  colorBy: ColorMode;
}

export interface StoryStep {
  title: string;
  body: string;
  focusTips: string[];
  kicker?: string;
}

export interface Story {
  id: string;
  title: string;
  eyebrow: string;
  treeId: string;
  summary: string;
  accent: string;
  compareWith?: string;
  steps: StoryStep[];
}

export interface LayoutNode {
  id: string;
  name?: string;
  x: number;
  y: number;
  depth: number;
  distance: number;
  support?: number;
  leafCount: number;
  isTip: boolean;
  collapsed: boolean;
  originalId: string;
  angle?: number;
}

export interface LayoutLink {
  id: string;
  source: LayoutNode;
  target: LayoutNode;
}

export interface TreeLayout {
  nodes: LayoutNode[];
  links: LayoutLink[];
  tips: LayoutNode[];
  width: number;
  height: number;
  centerX?: number;
  centerY?: number;
  maxRadius?: number;
}
