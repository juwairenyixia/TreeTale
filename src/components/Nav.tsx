import { ArrowUpRight, GitBranch, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none">
        <path
          d="M10 29V12.5M10 12.5 18 7M10 12.5l8 6M18 7v22M18 18l8-6M18 18l8 6"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <circle cx="10" cy="29" r="1.9" fill="currentColor" />
        <circle cx="18" cy="7" r="1.9" fill="currentColor" />
        <circle cx="26" cy="12" r="1.9" fill="currentColor" />
        <circle cx="26" cy="24" r="1.9" fill="currentColor" />
      </svg>
    </span>
  );
}

interface NavProps {
  inWorkbench: boolean;
  onHome: () => void;
  onWorkbench: () => void;
  onSection: (id: string) => void;
}

export function Nav({ inWorkbench, onHome, onWorkbench, onSection }: NavProps) {
  const [open, setOpen] = useState(false);

  const go = (id: string) => {
    setOpen(false);
    onSection(id);
  };

  return (
    <header className="nav">
      <div className="nav__inner">
        <button className="brand" onClick={onHome} aria-label="TreeTale 首页">
          <BrandMark />
          <span className="brand__text">
            <strong>TreeTale</strong>
            <small>PHYLOGENY STUDIO</small>
          </span>
        </button>

        <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="主导航">
          <button className={inWorkbench ? 'is-active' : ''} onClick={() => { setOpen(false); onWorkbench(); }}>
            工作台
          </button>
          <button onClick={() => go('stories')}>演化故事</button>
          <button onClick={() => go('guide')}>阅读指南</button>
          <button onClick={() => go('about')}>关于项目</button>
        </nav>

        <div className="nav__actions">
          <span className="nav__status">
            <span className="status-dot" />
            Newick ready
          </span>
          <button className="btn btn--dark btn--sm" onClick={onWorkbench}>
            <GitBranch size={15} />
            打开工作台
            <ArrowUpRight size={14} />
          </button>
          <button
            className="nav__menu"
            aria-label={open ? '关闭菜单' : '打开菜单'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
