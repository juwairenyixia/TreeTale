import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  GitCompareArrows,
  GitFork,
  Layers3,
  MousePointer2,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Story, TreeRecord } from '../types';
import { stories } from '../data/examples';
import { MiniTree } from './MiniTree';
import { HeroTree } from './HeroTree';
import { BrandMark } from './Nav';

interface HomeProps {
  records: TreeRecord[];
  onWorkbench: () => void;
  onOpenTree: (id: string) => void;
  onOpenStory: (story: Story) => void;
}

const concepts = [
  {
    number: '01',
    term: '进化枝',
    cn: 'Clade',
    body: '一个祖先及其所有后代。选中一个节点，就是在选中一整段共享的历史。',
    icon: GitFork,
  },
  {
    number: '02',
    term: '支持度',
    cn: 'Support',
    body: '重采样中该分支出现的比例。它是证据强度，不是“95% 的概率为真”。',
    icon: Sparkles,
  },
  {
    number: '03',
    term: '枝长',
    cn: 'Branch length',
    body: '在“按枝长”视图中表示每个位点的替换数；在“按拓扑”视图中只保留分支顺序。',
    icon: Layers3,
  },
  {
    number: '04',
    term: '拓扑距离',
    cn: 'RF distance',
    body: '两棵树中不共享的进化枝数量。适合快速筛查冲突，不负责解释原因。',
    icon: GitCompareArrows,
  },
];

export function Home({ records, onWorkbench, onOpenTree, onOpenStory }: HomeProps) {
  const builtInRecords = records.filter((record) => !record.custom);
  const examples = builtInRecords.slice(0, 3);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="home">
      <section className="hero">
        <div className="hero__copy">
          <div className="eyebrow">
            <span className="eyebrow__dot" />
            A FIELD GUIDE TO PHYLOGENIES
          </div>
          <h1>
            Every tree
            <br />
            <em>tells a story.</em>
          </h1>
          <p className="hero__lead">
            读懂一棵树，看见一段演化史。TreeTale 把树文件变成可以缩放、搜索、比较和讲述的交互式图谱，并为每个物种准备了中文名和简单说明。
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary btn--lg" onClick={onWorkbench}>
              打开工作台
              <ArrowUpRight size={18} />
            </button>
            <button className="btn btn--ghost btn--lg" onClick={() => scrollTo('examples')}>
              先看示例
              <ArrowDown size={17} />
            </button>
          </div>
          <div className="hero__metrics">
            <div>
              <strong>{String(builtInRecords.length).padStart(2, '0')}</strong>
              <span>棵示例树</span>
            </div>
            <div>
              <strong>{String(stories.length).padStart(2, '0')}</strong>
              <span>段演化故事</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>纯前端运行</span>
            </div>
          </div>
          <p className="hero__note">
            <span className="status-dot" />
            无需服务器 · 拖入树文件即可开始 · 数据不会离开浏览器
          </p>
        </div>

        <HeroTree onOpen={onWorkbench} />
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          <span>PARSE</span><i />
          <span>EXPLORE</span><i />
          <span>COMPARE</span><i />
          <span>TELL</span><i />
          <span>EXPORT</span><i />
          <span>PARSE</span><i />
          <span>EXPLORE</span><i />
          <span>COMPARE</span><i />
          <span>TELL</span><i />
          <span>EXPORT</span><i />
        </div>
      </div>

      <section className="section" id="examples">
        <div className="section-head">
          <div>
            <div className="eyebrow">
              <span className="eyebrow__dot" />
              START SOMEWHERE
            </div>
            <h2>三棵树，三种读法。</h2>
          </div>
          <p>
            从脊椎动物的登陆，到微生物的极端生存，再到基因树与物种树的冲突。
            每一棵都是一张可以走进去的地图。
          </p>
        </div>

        <div className="example-grid">
          {examples.map((record, index) => (
            <button
              className="example-card"
              key={record.id}
              onClick={() => onOpenTree(record.id)}
              style={{ '--accent': record.accent } as CSSProperties}
            >
              <div className="example-card__top">
                <span className="mono-label">{String(index + 1).padStart(2, '0')} / TREE</span>
                <span className="example-card__arrow">
                  <ArrowUpRight size={17} />
                </span>
              </div>
              <div className="example-card__visual">
                <MiniTree tree={record.tree} accent={record.accent} />
              </div>
              <div className="example-card__body">
                <h3>{record.name}</h3>
                <p>{record.subtitle}</p>
                <div className="tag-row">
                  <span>{record.tree.leaves.length} 个类群</span>
                  <span>Newick</span>
                  {record.compareWith && <span>compare</span>}
                </div>
              </div>
            </button>
          ))}

          <button className="example-card example-card--upload" onClick={onWorkbench}>
            <div className="upload-orbit">
              <Upload size={26} />
            </div>
            <h3>带上你自己的树</h3>
            <p>拖入 IQ-TREE、RAxML 或 BEAST 导出的 Newick 文件，在这里继续探索。</p>
            <span className="text-link">
              打开工作台 <ArrowRight size={15} />
            </span>
          </button>
        </div>
      </section>

      <section className="feature-band">
        <div className="feature-band__inner">
          <div className="feature-item">
            <span className="feature-item__num">01</span>
            <MousePointer2 size={21} />
            <h3>解析</h3>
            <p>严格但友好的 Newick parser。支持枝长、支持度、引号名称和注释。</p>
          </div>
          <div className="feature-item">
            <span className="feature-item__num">02</span>
            <Search size={21} />
            <h3>探索</h3>
            <p>缩放、搜索、折叠低支持分支，点击任意节点查看它的进化枝。</p>
          </div>
          <div className="feature-item">
            <span className="feature-item__num">03</span>
            <GitCompareArrows size={21} />
            <h3>比较</h3>
            <p>两棵树并排对照，用连线追踪同一物种，用 RF 距离量化拓扑差异。</p>
          </div>
          <div className="feature-item">
            <span className="feature-item__num">04</span>
            <BookOpen size={21} />
            <h3>讲述</h3>
            <p>把树变成一步步的故事，再导出 SVG，放进报告、课件或论文。</p>
          </div>
        </div>
      </section>

      <section className="section story-section" id="stories">
        <div className="story-section__intro">
          <div className="eyebrow eyebrow--light">
            <span className="eyebrow__dot" />
            GUIDED STORIES
          </div>
          <h2>
            每棵树，
            <br />
            都可以被讲成
            <br />
            <em>一个故事。</em>
          </h2>
          <p>
            故事模式会把视线带到该看的地方：一个支系、一段长枝、一次冲突。
            不是讲解幻灯片，而是一棵可以自己走进去的树。
          </p>
          <button className="btn btn--light" onClick={onWorkbench}>
            从工作台开始
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="story-list">
          {stories.map((story) => (
            <button
              key={story.id}
              className="story-card"
              onClick={() => onOpenStory(story)}
              style={{ '--story-accent': story.accent } as CSSProperties}
            >
              <div className="story-card__top">
                <span>{story.eyebrow}</span>
                <ArrowUpRight size={17} />
              </div>
              <h3>{story.title}</h3>
              <p>{story.summary}</p>
              <div className="story-card__foot">
                <span>{String(story.steps.length).padStart(2, '0')} 步</span>
                <span className="story-card__line" />
                <span>开始阅读</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="section guide-section" id="guide">
        <div className="section-head">
          <div>
            <div className="eyebrow">
              <span className="eyebrow__dot" />
              READ THE TREE
            </div>
            <h2>读树之前，先读四个词。</h2>
          </div>
          <p>
            系统发育树不是插画，而是一个关于关系的假设。
            这四个概念，足以让你在大多数论文里找到方向。
          </p>
        </div>

        <div className="concept-grid">
          {concepts.map((concept) => {
            const Icon = concept.icon;
            return (
              <article className="concept-card" key={concept.term}>
                <div className="concept-card__top">
                  <span>{concept.number}</span>
                  <Icon size={18} />
                </div>
                <h3>{concept.term}</h3>
                <h4>{concept.cn}</h4>
                <p>{concept.body}</p>
              </article>
            );
          })}
        </div>

        <div className="howto">
          <div className="howto__title">
            <span className="mono-label">60 秒上手</span>
            <h3>第一次打开，先做这三件事。</h3>
          </div>
          <ol>
            <li><span>01</span>打开一棵示例树，点击任意叶节点。</li>
            <li><span>02</span>在右侧检查器里看它的枝长、支持度和类群。</li>
            <li><span>03</span>切到“比较”，选择另一棵树，读一次 RF 距离。</li>
          </ol>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-card">
          <div className="about-card__copy">
            <div className="eyebrow eyebrow--light">
              <span className="eyebrow__dot" />
              ABOUT THE PROJECT
            </div>
            <h2>一棵树，<em>一段可被探索的论证。</em></h2>
            <p>
              TreeTale 是一个为生物信息学课程而做的静态网页项目：
              把 Newick 解析、树布局、RF 距离和交互叙事放进一个不需要服务器的浏览器工作台。
            </p>
            <div className="tech-row">
              <span>React</span>
              <span>TypeScript</span>
              <span>SVG</span>
              <span>Newick</span>
              <span>GitHub Pages</span>
            </div>
          </div>
          <div className="about-card__mark">
            <BrandMark size={92} />
            <span>TREETALE / 2026</span>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <BrandMark size={30} />
            <div>
              <strong>TreeTale</strong>
              <span>Every tree tells a story.</span>
            </div>
          </div>
          <div className="footer__links">
            <button onClick={onWorkbench}>工作台</button>
            <button onClick={() => scrollTo('examples')}>示例树</button>
            <button onClick={() => scrollTo('guide')}>阅读指南</button>
          </div>
          <p>生物信息学课程项目 · 静态网页 · 2026</p>
        </div>
      </footer>
    </main>
  );
}
