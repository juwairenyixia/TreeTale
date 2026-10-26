import type { Story, TaxonMeta, TreeRecord } from '../types';
import { parseNewick } from '../lib/newick';

export interface ExampleSpec extends Omit<TreeRecord, 'tree'> {
  newick: string;
  metadata: Record<string, TaxonMeta>;
}

const vertebrateTree = `
(
  (
    Danio_rerio:0.44,
    (Latimeria_chalumnae:0.32,Callorhinchus_milii:0.40)97:0.18
  )98:0.16,
  (
    Xenopus_laevis:0.30,
    (
      (
        (Gallus_gallus:0.16,Taeniopygia_guttata:0.18)90:0.10,
        (Chelonia_mydas:0.21,Crocodylus_porosus:0.23)92:0.14
      )88:0.15,
      (
        (Ornithorhynchus_anatinus:0.26,(Macropus_giganteus:0.18,Phascolarctos_cinereus:0.20)89:0.11)91:0.12,
        (
          (Loxodonta_africana:0.20,Dasypus_novemcinctus:0.23)78:0.13,
          (
            ((Homo_sapiens:0.06,Pan_troglodytes:0.05)100:0.02,Macaca_mulatta:0.09)99:0.10,
            (
              (Mus_musculus:0.12,Rattus_norvegicus:0.13)100:0.10,
              (
                Pteropus_vampyrus:0.14,
                (
                  (Canis_lupus:0.10,Felis_catus:0.11,Phoca_vitulina:0.12)86:0.08,
                  (
                    (Bos_taurus:0.12,Hippopotamus_amphibius:0.11)82:0.07,
                    (Balaenoptera_musculus:0.16,Tursiops_truncatus:0.14)100:0.10
                  )84:0.06
                )83:0.05
              )80:0.09
            )90:0.09
          )94:0.10
        )96:0.13
      )95:0.13
    )97:0.17
  )100:0.12
)100;
`;

const vertebrateGeneTree = vertebrateTree
  .replace(
    '(Bos_taurus:0.12,Hippopotamus_amphibius:0.11)82:0.07',
    '(Bos_taurus:0.12,Tursiops_truncatus:0.14)76:0.07',
  )
  .replace(
    '(Balaenoptera_musculus:0.16,Tursiops_truncatus:0.14)100:0.10',
    '(Balaenoptera_musculus:0.16,Hippopotamus_amphibius:0.11)81:0.10',
  );

const bacterialTree = `
(
  (
    (Escherichia_coli:0.04,Salmonella_enterica:0.05)99:0.03,
    (Vibrio_cholerae:0.07,Pseudomonas_aeruginosa:0.09)92:0.05
  )95:0.06,
  (
    (Bacillus_subtilis:0.06,Staphylococcus_aureus:0.07,Streptococcus_pyogenes:0.08)90:0.05,
    (Lactobacillus_acidophilus:0.09,Bifidobacterium_longum:0.10)88:0.06
  )93:0.06,
  (
    (Mycobacterium_tuberculosis:0.11,Streptomyces_coelicolor:0.12)94:0.07,
    (
      (Synechococcus_elongatus:0.08,Prochlorococcus_marinus:0.09)97:0.05,
      (
        (Nitrosopumilus_maritimus:0.12,Methanobrevibacter_smithii:0.14)85:0.08,
        (Thermus_thermophilus:0.13,Deinococcus_radiodurans:0.15)90:0.09
      )82:0.07
    )89:0.06
  )87:0.08
)100:0.10;
`;

const speciesTree = `
(
  (
    (
      (Homo_sapiens:0.06,Pan_troglodytes:0.05)100:0.02,
      Gorilla_gorilla:0.07
    )98:0.03,
    (
      (Mus_musculus:0.11,Rattus_norvegicus:0.12)100:0.08,
      Oryctolagus_cuniculus:0.14
    )95:0.05
  )97:0.04,
  (
    (Canis_lupus:0.10,Felis_catus:0.11)96:0.04,
    Equus_caballus:0.13
  )92:0.05,
  Bos_taurus:0.15
)100;
`;

const geneTree = `
(
  (
    (
      ((Homo_sapiens:0.06,Gorilla_gorilla:0.07)72:0.03,Pan_troglodytes:0.05)88:0.02,
      ((Mus_musculus:0.11,Rattus_norvegicus:0.12)100:0.08,Oryctolagus_cuniculus:0.14)95:0.05
    )94:0.04,
    ((Canis_lupus:0.10,Equus_caballus:0.13)81:0.04,Felis_catus:0.11)86:0.05
  )90:0.03,
  Bos_taurus:0.15
)100;
`;

const vertebrateMeta: Record<string, TaxonMeta> = {
  Danio_rerio: { common: 'Zebrafish', group: 'Fish', habitat: 'Freshwater' },
  Latimeria_chalumnae: { common: 'Coelacanth', group: 'Fish', habitat: 'Marine' },
  Callorhinchus_milii: { common: 'Ghost shark', group: 'Fish', habitat: 'Marine' },
  Xenopus_laevis: { common: 'Clawed frog', group: 'Amphibian', habitat: 'Freshwater' },
  Gallus_gallus: { common: 'Chicken', group: 'Bird', habitat: 'Terrestrial' },
  Taeniopygia_guttata: { common: 'Zebra finch', group: 'Bird', habitat: 'Terrestrial' },
  Chelonia_mydas: { common: 'Green turtle', group: 'Reptile', habitat: 'Marine' },
  Crocodylus_porosus: { common: 'Saltwater croc', group: 'Reptile', habitat: 'Freshwater' },
  Ornithorhynchus_anatinus: { common: 'Platypus', group: 'Mammal', habitat: 'Freshwater' },
  Macropus_giganteus: { common: 'Red kangaroo', group: 'Mammal', habitat: 'Terrestrial' },
  Phascolarctos_cinereus: { common: 'Koala', group: 'Mammal', habitat: 'Terrestrial' },
  Loxodonta_africana: { common: 'African elephant', group: 'Mammal', habitat: 'Terrestrial' },
  Dasypus_novemcinctus: { common: 'Armadillo', group: 'Mammal', habitat: 'Terrestrial' },
  Homo_sapiens: { common: 'Human', group: 'Mammal', habitat: 'Terrestrial' },
  Pan_troglodytes: { common: 'Chimpanzee', group: 'Mammal', habitat: 'Terrestrial' },
  Macaca_mulatta: { common: 'Rhesus macaque', group: 'Mammal', habitat: 'Terrestrial' },
  Mus_musculus: { common: 'House mouse', group: 'Mammal', habitat: 'Terrestrial' },
  Rattus_norvegicus: { common: 'Brown rat', group: 'Mammal', habitat: 'Terrestrial' },
  Pteropus_vampyrus: { common: 'Flying fox', group: 'Mammal', habitat: 'Aerial' },
  Canis_lupus: { common: 'Grey wolf', group: 'Mammal', habitat: 'Terrestrial' },
  Felis_catus: { common: 'Cat', group: 'Mammal', habitat: 'Terrestrial' },
  Phoca_vitulina: { common: 'Harbor seal', group: 'Mammal', habitat: 'Marine' },
  Bos_taurus: { common: 'Cattle', group: 'Mammal', habitat: 'Terrestrial' },
  Hippopotamus_amphibius: { common: 'Hippopotamus', group: 'Mammal', habitat: 'Freshwater' },
  Balaenoptera_musculus: { common: 'Blue whale', group: 'Mammal', habitat: 'Marine' },
  Tursiops_truncatus: { common: 'Bottlenose dolphin', group: 'Mammal', habitat: 'Marine' },
};

const bacterialMeta: Record<string, TaxonMeta> = {
  Escherichia_coli: { common: 'E. coli', group: 'Pseudomonadota', habitat: 'Gut' },
  Salmonella_enterica: { common: 'S. enterica', group: 'Pseudomonadota', habitat: 'Gut' },
  Vibrio_cholerae: { common: 'V. cholerae', group: 'Pseudomonadota', habitat: 'Aquatic' },
  Pseudomonas_aeruginosa: { common: 'P. aeruginosa', group: 'Pseudomonadota', habitat: 'Clinical' },
  Bacillus_subtilis: { common: 'B. subtilis', group: 'Bacillota', habitat: 'Soil' },
  Staphylococcus_aureus: { common: 'S. aureus', group: 'Bacillota', habitat: 'Clinical' },
  Streptococcus_pyogenes: { common: 'S. pyogenes', group: 'Bacillota', habitat: 'Clinical' },
  Lactobacillus_acidophilus: { common: 'L. acidophilus', group: 'Bacillota', habitat: 'Gut' },
  Bifidobacterium_longum: { common: 'B. longum', group: 'Actinomycetota', habitat: 'Gut' },
  Mycobacterium_tuberculosis: { common: 'M. tuberculosis', group: 'Actinomycetota', habitat: 'Clinical' },
  Streptomyces_coelicolor: { common: 'S. coelicolor', group: 'Actinomycetota', habitat: 'Soil' },
  Synechococcus_elongatus: { common: 'Synechococcus', group: 'Cyanobacteriota', habitat: 'Aquatic' },
  Prochlorococcus_marinus: { common: 'Prochlorococcus', group: 'Cyanobacteriota', habitat: 'Aquatic' },
  Nitrosopumilus_maritimus: { common: 'N. maritimus', group: 'Thermophiles', habitat: 'Marine' },
  Methanobrevibacter_smithii: { common: 'M. smithii', group: 'Thermophiles', habitat: 'Gut' },
  Thermus_thermophilus: { common: 'T. thermophilus', group: 'Thermophiles', habitat: 'Extreme' },
  Deinococcus_radiodurans: { common: 'D. radiodurans', group: 'Thermophiles', habitat: 'Extreme' },
};

const geneMeta: Record<string, TaxonMeta> = {
  Homo_sapiens: { common: 'Human', group: 'Primate', habitat: 'Terrestrial' },
  Pan_troglodytes: { common: 'Chimpanzee', group: 'Primate', habitat: 'Terrestrial' },
  Gorilla_gorilla: { common: 'Gorilla', group: 'Primate', habitat: 'Terrestrial' },
  Mus_musculus: { common: 'House mouse', group: 'Rodent', habitat: 'Terrestrial' },
  Rattus_norvegicus: { common: 'Brown rat', group: 'Rodent', habitat: 'Terrestrial' },
  Oryctolagus_cuniculus: { common: 'European rabbit', group: 'Lagomorph', habitat: 'Terrestrial' },
  Canis_lupus: { common: 'Grey wolf', group: 'Carnivore', habitat: 'Terrestrial' },
  Felis_catus: { common: 'Cat', group: 'Carnivore', habitat: 'Terrestrial' },
  Equus_caballus: { common: 'Horse', group: 'Ungulate', habitat: 'Terrestrial' },
  Bos_taurus: { common: 'Cattle', group: 'Ungulate', habitat: 'Terrestrial' },
};

export const exampleSpecs: ExampleSpec[] = [
  {
    id: 'vertebrates',
    name: '脊椎动物演化树',
    subtitle: '26 个物种 · 从鱼到鲸',
    newick: vertebrateTree,
    metadata: vertebrateMeta,
    source: '教学示例 · 拓扑依据公开系统发育关系整理，分支长度用于可视化演示',
    accent: '#d8f27a',
    compareWith: 'vertebrate-gene',
  },
  {
    id: 'vertebrate-gene',
    name: '脊椎动物 · 基因树',
    subtitle: '26 个物种 · 与物种树冲突',
    newick: vertebrateGeneTree,
    metadata: vertebrateMeta,
    source: '教学示意基因树 · 仅移动海豚的位置，用于演示基因树与物种树的拓扑冲突',
    accent: '#f2c14e',
    compareWith: 'vertebrates',
  },
  {
    id: 'microbes',
    name: '微生物 16S 树',
    subtitle: '17 个类群 · 极端环境与共生',
    newick: bacterialTree,
    metadata: bacterialMeta,
    source: '教学示意树 · 拓扑与分支长度不构成真实推断结果',
    accent: '#ff8a66',
  },
  {
    id: 'gene-tree',
    name: '基因树 · 灵长类',
    subtitle: '10 个物种 · 与物种树冲突',
    newick: geneTree,
    metadata: geneMeta,
    source: '教学示例 · 用于演示基因树与物种树的拓扑冲突',
    accent: '#8cc8c5',
    compareWith: 'species-tree',
  },
  {
    id: 'species-tree',
    name: '物种树 · 灵长类',
    subtitle: '10 个物种 · 参考拓扑',
    newick: speciesTree,
    metadata: geneMeta,
    source: '教学示例 · 用于演示基因树与物种树的拓扑冲突',
    accent: '#c7b8ff',
    compareWith: 'gene-tree',
  },
];

export const stories: Story[] = [
  {
    id: 'whale-road',
    title: '鲸类的回家路',
    eyebrow: 'STORY 01',
    treeId: 'vertebrates',
    summary: '从鳃到肺，再从陆地回到海洋。沿着分支，重读生命史上的一次重大转折。',
    accent: '#d8f27a',
    steps: [
      {
        kicker: '01 / 起点',
        title: '先找到水里的分支',
        body: '树的左侧是鱼类的分支。注意：不是所有水生动物都在这条分支上。海豚和鲸生活在海里，但它们属于哺乳动物。',
        focusTips: ['Danio_rerio', 'Latimeria_chalumnae', 'Callorhinchus_milii'],
      },
      {
        kicker: '02 / 登陆',
        title: '四足动物的一次分叉',
        body: '从鱼类分支往右，是四足动物。两栖类、爬行类、鸟类和哺乳类共享一个更近的共同祖先——这是“登陆”留下的拓扑印记。',
        focusTips: [
          'Xenopus_laevis',
          'Gallus_gallus',
          'Taeniopygia_guttata',
          'Chelonia_mydas',
          'Crocodylus_porosus',
          'Homo_sapiens',
          'Pan_troglodytes',
          'Macaca_mulatta',
          'Mus_musculus',
          'Rattus_norvegicus',
          'Pteropus_vampyrus',
          'Canis_lupus',
          'Felis_catus',
          'Phoca_vitulina',
          'Bos_taurus',
          'Hippopotamus_amphibius',
          'Balaenoptera_musculus',
          'Tursiops_truncatus',
          'Ornithorhynchus_anatinus',
          'Macropus_giganteus',
          'Phascolarctos_cinereus',
          'Loxodonta_africana',
          'Dasypus_novemcinctus',
        ],
      },
      {
        kicker: '03 / 哺乳',
        title: '毛发、乳腺与中耳',
        body: '哺乳动物形成一条高支持度的分支。鸭嘴兽位于最基部，有袋类与胎盘类随后分开；人类、鲸和蝙蝠都在这条分支的末端。',
        focusTips: [
          'Ornithorhynchus_anatinus',
          'Macropus_giganteus',
          'Phascolarctos_cinereus',
          'Loxodonta_africana',
          'Dasypus_novemcinctus',
          'Homo_sapiens',
          'Pan_troglodytes',
          'Macaca_mulatta',
          'Mus_musculus',
          'Rattus_norvegicus',
          'Pteropus_vampyrus',
          'Canis_lupus',
          'Felis_catus',
          'Phoca_vitulina',
          'Bos_taurus',
          'Hippopotamus_amphibius',
          'Balaenoptera_musculus',
          'Tursiops_truncatus',
        ],
      },
      {
        kicker: '04 / 回到海洋',
        title: '鲸类的近亲是河马',
        body: '把鲸、海豚、河马和牛一起选中。它们组成鲸偶蹄类分支：鲸类并不是“鱼”，而是与河马共享最近共同祖先的哺乳动物。',
        focusTips: [
          'Balaenoptera_musculus',
          'Tursiops_truncatus',
          'Hippopotamus_amphibius',
          'Bos_taurus',
        ],
      },
      {
        kicker: '05 / 读枝长',
        title: '分支长度也是证据',
        body: '在 phylogram 模式下，枝长表示每个位点的预期替换数。鲸类支系上较长的枝，提示这段谱系积累了更多分子变化；但枝长本身不是“进化了多少年”。',
        focusTips: ['Balaenoptera_musculus', 'Tursiops_truncatus'],
      },
    ],
  },
  {
    id: 'tree-argument',
    title: '当两棵树吵架',
    eyebrow: 'STORY 02',
    treeId: 'gene-tree',
    compareWith: 'species-tree',
    summary: '基因树和物种树不一致，不一定是谁算错了。冲突本身，也是演化过程留下的线索。',
    accent: '#8cc8c5',
    steps: [
      {
        kicker: '01 / 两种树',
        title: '同一批物种，不同的故事',
        body: '左边是一棵基因树，右边是一棵物种树。它们使用同一批物种，但拓扑并不完全一致。先不要急着判断谁对谁错。',
        focusTips: ['Homo_sapiens', 'Pan_troglodytes', 'Gorilla_gorilla'],
      },
      {
        kicker: '02 / 冲突',
        title: '黑猩猩、人类和古人类',
        body: '在基因树里，人类与黑猩猩先聚在一起；在物种树里，人类与黑猩猩同样最近，但支持度和分支长度可能不同。拓扑冲突往往集中在快速辐射的支系。',
        focusTips: ['Homo_sapiens', 'Pan_troglodytes', 'Gorilla_gorilla'],
      },
      {
        kicker: '03 / 原因',
        title: '不完全谱系分选',
        body: '祖先群体里原本就有多个等位基因。如果两个物种分化得很快，基因谱系可能在物种分化之后才完全分开，于是单个基因的树会“看起来”和物种树不一样。',
        focusTips: ['Homo_sapiens', 'Pan_troglodytes', 'Gorilla_gorilla'],
      },
      {
        kicker: '04 / 比较',
        title: '用 RF 距离量化差异',
        body: 'RF 距离统计两棵树中不同的进化枝数量。它适合快速筛查拓扑差异，但不告诉你差异是生物学信号还是建树误差。打开比较模式，查看哪些 clade 只出现在一棵树里。',
        focusTips: ['Canis_lupus', 'Felis_catus', 'Equus_caballus'],
      },
    ],
  },
];

export function buildExampleTrees(): TreeRecord[] {
  return exampleSpecs.map((spec) => ({
    ...spec,
    tree: parseNewick(spec.newick, { id: spec.id, name: spec.name }),
  }));
}
