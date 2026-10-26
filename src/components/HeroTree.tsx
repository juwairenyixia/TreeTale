import { ArrowUpRight, GitCompareArrows } from 'lucide-react';
import { useMemo } from 'react';
import { parseNewick } from '../lib/newick';
import { layoutTree } from '../lib/layout';
import { pathToRoot } from '../lib/tree';

const HERO_NEWICK = `
(
  (Zebrafish:0.28,Coelacanth:0.24)97:0.06,
  (
    Frog:0.22,
    (
      Chicken:0.12,
      (
        Human:0.06,
        (
          Hippo:0.14,
          (Whale:0.17,Dolphin:0.15)100:0.07
        )84:0.06
      )96:0.08
    )90:0.08
  )94:0.08,
  Shark:0.28
)100;
`;

const COMMON: Record<string, string> = {
  Zebrafish: 'Zebrafish',
  Coelacanth: 'Coelacanth',
  Frog: 'Frog',
  Chicken: 'Chicken',
  Human: 'Human',
  Hippo: 'Hippo',
  Whale: 'Blue whale',
  Dolphin: 'Dolphin',
  Shark: 'Shark',
};

export function HeroTree({ onOpen }: { onOpen: () => void }) {
  const tree = useMemo(() => parseNewick(HERO_NEWICK, { id: 'hero', name: 'Vertebrata' }), []);
  const layout = useMemo(
    () =>
      layoutTree(tree, {
        kind: 'rectangular',
        branchMode: 'phylogram',
        width: 580,
        height: 510,
        padding: 26,
        labelSpace: 152,
        xStart: 64,
        xEnd: 372,
        yStart: 62,
        yEnd: 446,
      }),
    [tree],
  );

  const whaleTip = layout.tips.find((tip) => tip.name === 'Whale');
  const hotIds = useMemo(() => {
    if (!whaleTip) return new Set<string>();
    const node = tree.nodes.find((candidate) => candidate.id === whaleTip.id);
    return new Set(node ? pathToRoot(node).map((item) => item.id) : []);
  }, [tree, whaleTip]);

  return (
    <div className="hero-visual" aria-label="系统发育树预览">
      <div className="hero-visual__top">
        <span className="mono-label">SPECIMEN 01 / VERTEBRATA</span>
        <span className="hero-visual__count">09 taxa</span>
      </div>

      <div className="hero-visual__glow" />
      <svg
        className="hero-tree"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="heroGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#d8f27a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#d8f27a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="250" r="215" fill="url(#heroGlow)" />
        <circle className="hero-tree__ring" cx="300" cy="250" r="198" />
        <circle className="hero-tree__ring" cx="300" cy="250" r="142" />

        {layout.links.map((link) => {
          const hot =
            hotIds.has(link.source.id) &&
            hotIds.has(link.target.id) &&
            link.target.id !== layout.tips.find((tip) => tip.name === 'Shark')?.id;
          return (
            <path
              key={link.id}
              className={`hero-tree__link ${hot ? 'is-hot' : ''}`}
              d={`M ${link.source.x} ${link.source.y} H ${link.target.x} V ${link.target.y}`}
            />
          );
        })}

        {layout.nodes
          .filter((node) => !node.isTip && node.depth > 0)
          .map((node) => (
            <circle
              key={node.id}
              className={`hero-tree__node ${hotIds.has(node.id) ? 'is-hot' : ''}`}
              cx={node.x}
              cy={node.y}
              r={node.depth === 1 ? 4.2 : 3.1}
            />
          ))}

        {layout.tips.map((tip) => {
          const hot = hotIds.has(tip.id);
          const x = tip.x + 12;
          return (
            <g key={tip.id} className={hot ? 'is-hot' : ''}>
              <circle
                className={`hero-tree__tip ${hot ? 'is-hot' : ''}`}
                cx={tip.x}
                cy={tip.y}
                r={hot ? 5 : 3.6}
              />
              <text
                x={x}
                y={tip.y + 4.5}
                className={`hero-tree__label ${hot ? 'is-hot' : ''}`}
              >
                {COMMON[tip.name ?? ''] ?? tip.name}
              </text>
              {hot && (
                <circle
                  className="hero-tree__pulse"
                  cx={tip.x}
                  cy={tip.y}
                  r="8"
                />
              )}
            </g>
          );
        })}
      </svg>

      <div className="hero-float hero-float--clade">
        <span className="hero-float__dot" />
        <div>
          <strong>Cetacea</strong>
          <span>鲸类 · 100 support</span>
        </div>
      </div>

      <div className="hero-float hero-float--rf">
        <GitCompareArrows size={17} />
        <div>
          <strong>RF 0.18</strong>
          <span>gene tree vs species tree</span>
        </div>
      </div>

      <button className="hero-visual__open" onClick={onOpen}>
        打开这棵树
        <ArrowUpRight size={15} />
      </button>
    </div>
  );
}
