import type { PhyloNode, Tree } from '../types';

export class NewickParseError extends Error {
  readonly position: number;
  readonly source: string;

  constructor(message: string, position: number, source: string) {
    const near = source.slice(Math.max(0, position - 18), position + 24).replace(/\s+/g, ' ');
    super(`${message} @ ${position}${near ? ` — “${near}”` : ''}`);
    this.name = 'NewickParseError';
    this.position = position;
    this.source = source;
  }
}

interface ParseOptions {
  id?: string;
  name?: string;
}

function normaliseSupport(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const scaled = value > 0 && value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, scaled));
}

/**
 * A small, deliberately strict Newick parser.
 *
 * Supports quoted labels, branch lengths, numeric internal labels,
 * and [&support=…] style comments. It intentionally accepts one tree at a
 * time; multi-tree NEXUS files should be split upstream.
 */
export function parseNewick(input: string, options: ParseOptions = {}): Tree {
  const source = input.replace(/^\uFEFF/, '').trim();
  if (!source) throw new NewickParseError('树文件为空', 0, source);

  let index = 0;
  let counter = 0;
  const nodes: PhyloNode[] = [];
  const treeId = options.id ?? 'tree';

  const fail = (message: string): never => {
    throw new NewickParseError(message, index, source);
  };

  const skipWhitespace = () => {
    while (index < source.length && /\s/.test(source[index])) index += 1;
  };

  const makeNode = (parent?: PhyloNode): PhyloNode => {
    const node: PhyloNode = {
      id: `${treeId}-n${counter}`,
      length: 0,
      children: [],
      parent,
    };
    counter += 1;
    nodes.push(node);
    return node;
  };

  const parseComment = (): string => {
    skipWhitespace();
    if (source[index] !== '[') return '';
    const start = index;
    let depth = 0;
    while (index < source.length) {
      if (source[index] === '[') depth += 1;
      if (source[index] === ']') {
        depth -= 1;
        index += 1;
        if (depth === 0) return source.slice(start + 1, index - 1);
      } else {
        index += 1;
      }
    }
    return fail('注释缺少闭合的 “]”');
  };

  const parseLabel = (): string | undefined => {
    skipWhitespace();
    if (index >= source.length) return undefined;
    const char = source[index];
    if (char === '(' || char === ')' || char === ',' || char === ':' || char === ';' || char === '[') {
      return undefined;
    }

    if (char === "'") {
      index += 1;
      let output = '';
      while (index < source.length) {
        if (source[index] === "'") {
          if (source[index + 1] === "'") {
            output += "'";
            index += 2;
          } else {
            index += 1;
            return output.trim() || undefined;
          }
        } else {
          output += source[index];
          index += 1;
        }
      }
      return fail('引号包裹的名称未闭合');
    }

    const start = index;
    while (
      index < source.length &&
      !/[(),:;[\]]/.test(source[index]) &&
      !/\s/.test(source[index])
    ) {
      index += 1;
    }
    const label = source.slice(start, index).trim();
    return label || undefined;
  };

  const parseLength = (): number => {
    skipWhitespace();
    if (source[index] !== ':') return 0;
    index += 1;
    skipWhitespace();
    const start = index;
    while (index < source.length && /[0-9eE+\-.]/.test(source[index])) index += 1;
    const raw = source.slice(start, index);
    const value = Number(raw);
    if (!raw || Number.isNaN(value)) return fail('分支长度缺失或格式错误');
    if (value < 0) return fail('分支长度不能为负数');
    return value;
  };

  const absorbComments = (node: PhyloNode) => {
    skipWhitespace();
    while (source[index] === '[') {
      const comment = parseComment();
      const support = comment.match(/(?:support|posterior)\s*=\s*([0-9.]+)/i);
      if (support) node.support = normaliseSupport(Number(support[1]));
      skipWhitespace();
    }
  };

  const parseNode = (parent?: PhyloNode): PhyloNode => {
    skipWhitespace();
    const node = makeNode(parent);

    if (source[index] === '(') {
      index += 1;
      skipWhitespace();
      if (source[index] === ')') return fail('内部节点没有子节点');

      while (true) {
        node.children.push(parseNode(node));
        skipWhitespace();
        if (source[index] === ',') {
          index += 1;
          continue;
        }
        if (source[index] === ')') {
          index += 1;
          break;
        }
        return fail('预期 “,” 或 “)”');
      }

      absorbComments(node);
      const label = parseLabel();
      if (label !== undefined) {
        if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(label)) {
          node.support = normaliseSupport(Number(label));
        } else {
          node.name = label;
        }
      }
      absorbComments(node);
      node.length = parseLength();
    } else {
      const label = parseLabel();
      if (label === undefined) return fail('叶节点缺少名称');
      node.name = label;
      absorbComments(node);
      node.length = parseLength();
    }

    absorbComments(node);
    return node;
  };

  const root = parseNode();
  skipWhitespace();
  if (source[index] === ';') index += 1;
  skipWhitespace();
  if (index < source.length) {
    fail('树结束后仍有多余内容（一次只支持一棵树）');
  }
  if (!root.children.length) {
    fail('一棵树至少需要两个叶节点');
  }

  const leaves = nodes.filter((node) => node.children.length === 0);
  if (leaves.length < 2) {
    fail('一棵树至少需要两个叶节点');
  }

  return {
    id: treeId,
    name: options.name ?? treeId,
    root,
    nodes,
    leaves,
    rooted: true,
  };
}

export function formatBranchLength(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (value === 0) return '0';
  if (Math.abs(value) >= 100) return value.toFixed(1);
  if (Math.abs(value) >= 1) return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function quoteLabel(label: string): string {
  if (/^[^\s(),:;'[\]]+$/.test(label)) return label;
  return `'${label.replace(/'/g, "''")}'`;
}

function supportLabel(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

export function toNewick(tree: Tree): string {
  const render = (node: PhyloNode): string => {
    let output = '';
    if (node.children.length) {
      output += `(${node.children.map(render).join(',')})`;
    }
    if (node.name) output += quoteLabel(node.name);
    if (node.support !== undefined && node.support !== null) {
      output += node.name ? `[&support=${supportLabel(node.support)}]` : supportLabel(node.support);
    }
    if (node.length > 0) output += `:${formatBranchLength(node.length)}`;
    return output;
  };

  return `${render(tree.root)};`;
}
