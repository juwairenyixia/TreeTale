import type { Tree } from '../types';
import { layoutTree } from '../lib/layout';

interface MiniTreeProps {
  tree: Tree;
  accent: string;
}

export function MiniTree({ tree, accent }: MiniTreeProps) {
  const layout = layoutTree(tree, {
    kind: 'rectangular',
    branchMode: 'phylogram',
    width: 360,
    height: 174,
    padding: 10,
    labelSpace: 0,
    xStart: 18,
    xEnd: 324,
    yStart: 18,
    yEnd: 156,
  });

  return (
    <svg
      className="mini-tree"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g>
        {layout.links.map((link) => (
          <path
            key={link.id}
            d={`M ${link.source.x} ${link.source.y} H ${link.target.x} V ${link.target.y}`}
            fill="none"
            stroke={accent}
            strokeOpacity={link.source.depth === 0 ? 0.95 : 0.58}
            strokeWidth={link.source.depth === 0 ? 2.3 : 1.35}
            strokeLinecap="round"
          />
        ))}
      </g>
      {layout.tips.map((tip) => (
        <circle
          key={tip.id}
          cx={tip.x}
          cy={tip.y}
          r={2.5}
          fill={accent}
          fillOpacity={0.9}
        />
      ))}
    </svg>
  );
}
