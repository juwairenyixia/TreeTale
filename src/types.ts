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
  common?: string;
  group?: string;
  habitat?: string;
  note?: string;
}

export interface TreeRecord {
  id: string;
  name: string;
  subtitle: string;
  newick: string;
  tree: Tree;
  metadata: Record<string, TaxonMeta>;
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
