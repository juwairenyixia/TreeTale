import type { CladeLabel, Story, TaxonMeta, TreeRecord } from '../types';
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
  Danio_rerio: {
    cn: '斑马鱼',
    group: '鱼类',
    habitat: '淡水',
    note: '一种小型淡水鱼，身上有黑白条纹，是研究动物发育的常用模式生物。',
  },
  Latimeria_chalumnae: {
    cn: '腔棘鱼',
    group: '鱼类',
    habitat: '海洋',
    note: '被称为“活化石”的肉鳍鱼，与四足动物的祖先关系较近。',
  },
  Callorhinchus_milii: {
    cn: '银鲛',
    group: '鱼类',
    habitat: '海洋',
    note: '一种生活在深海的软骨鱼，和鲨鱼、鳐鱼是近亲，也被叫作“鬼鲨”。',
  },
  Xenopus_laevis: {
    cn: '非洲爪蟾',
    group: '两栖类',
    habitat: '淡水',
    note: '一种水生两栖动物，是研究胚胎发育的经典模式生物。',
  },
  Gallus_gallus: {
    cn: '原鸡',
    group: '鸟类',
    habitat: '陆地',
    note: '家鸡的野生祖先，也是鸟类发育与基因组研究的重要对象。',
  },
  Taeniopygia_guttata: {
    cn: '斑胸草雀',
    group: '鸟类',
    habitat: '陆地',
    note: '一种小型鸣禽，常被用来研究鸟类如何学习鸣唱。',
  },
  Chelonia_mydas: {
    cn: '绿海龟',
    group: '爬行类',
    habitat: '海洋',
    note: '一种大型海龟，大部分时间生活在海洋里，产卵时会回到沙滩。',
  },
  Crocodylus_porosus: {
    cn: '湾鳄',
    group: '爬行类',
    habitat: '淡水',
    note: '现存体型最大的鳄鱼，生活在河口和淡水湿地。',
  },
  Ornithorhynchus_anatinus: {
    cn: '鸭嘴兽',
    group: '哺乳类',
    habitat: '淡水',
    note: '会下蛋的哺乳动物，长着鸭嘴和蹼足，生活在澳大利亚的淡水环境。',
  },
  Macropus_giganteus: {
    cn: '红大袋鼠',
    group: '哺乳类',
    habitat: '陆地',
    note: '大型有袋类，幼崽出生后会在育儿袋里继续发育。',
  },
  Phascolarctos_cinereus: {
    cn: '考拉',
    group: '哺乳类',
    habitat: '陆地',
    note: '也叫树袋熊，以桉树叶为食，大部分时间待在树上。',
  },
  Loxodonta_africana: {
    cn: '非洲草原象',
    group: '哺乳类',
    habitat: '陆地',
    note: '现存最大的陆生动物，有长鼻和象牙。',
  },
  Dasypus_novemcinctus: {
    cn: '九带犰狳',
    group: '哺乳类',
    habitat: '陆地',
    note: '身披骨质甲片的小型哺乳动物，擅长挖洞。',
  },
  Homo_sapiens: {
    cn: '智人',
    group: '哺乳类',
    habitat: '陆地',
    note: '现代人类，也就是我们自己。',
  },
  Pan_troglodytes: {
    cn: '黑猩猩',
    group: '哺乳类',
    habitat: '陆地',
    note: '与人类亲缘关系最近的现生动物之一，会使用工具。',
  },
  Macaca_mulatta: {
    cn: '恒河猴',
    group: '哺乳类',
    habitat: '陆地',
    note: '一种常见的旧大陆猴，常用于生物医学研究。',
  },
  Mus_musculus: {
    cn: '小家鼠',
    group: '哺乳类',
    habitat: '陆地',
    note: '常见的实验小鼠，是遗传学和医学研究的模式动物。',
  },
  Rattus_norvegicus: {
    cn: '褐家鼠',
    group: '哺乳类',
    habitat: '陆地',
    note: '适应力很强的啮齿动物，常生活在人类附近。',
  },
  Pteropus_vampyrus: {
    cn: '马来大狐蝠',
    group: '哺乳类',
    habitat: '空中',
    note: '一种大型果蝠，翼展可以超过一米，靠飞行活动。',
  },
  Canis_lupus: {
    cn: '灰狼',
    group: '哺乳类',
    habitat: '陆地',
    note: '家犬的野生祖先，喜欢成群生活的食肉动物。',
  },
  Felis_catus: {
    cn: '家猫',
    group: '哺乳类',
    habitat: '陆地',
    note: '常见的家养食肉动物，属于猫科。',
  },
  Phoca_vitulina: {
    cn: '港海豹',
    group: '哺乳类',
    habitat: '海洋',
    note: '生活在温带沿海的海豹，擅长潜水。',
  },
  Bos_taurus: {
    cn: '黄牛',
    group: '哺乳类',
    habitat: '陆地',
    note: '常见的家畜，属于偶蹄类动物。',
  },
  Hippopotamus_amphibius: {
    cn: '河马',
    group: '哺乳类',
    habitat: '淡水',
    note: '半水生的大型哺乳动物，白天多泡在水里。',
  },
  Balaenoptera_musculus: {
    cn: '蓝鲸',
    group: '哺乳类',
    habitat: '海洋',
    note: '现存最大的动物，生活在海洋中，主要以磷虾为食。',
  },
  Tursiops_truncatus: {
    cn: '宽吻海豚',
    group: '哺乳类',
    habitat: '海洋',
    note: '一种聪明的小型齿鲸，常成群活动。',
  },
};

const bacterialMeta: Record<string, TaxonMeta> = {
  Escherichia_coli: {
    cn: '大肠杆菌',
    group: '变形菌门',
    habitat: '肠道',
    note: '常见于人和动物肠道的细菌，也是分子生物学最常用的实验菌。',
  },
  Salmonella_enterica: {
    cn: '肠道沙门氏菌',
    group: '变形菌门',
    habitat: '肠道',
    note: '一种肠道细菌，部分菌株会引起食物中毒。',
  },
  Vibrio_cholerae: {
    cn: '霍乱弧菌',
    group: '变形菌门',
    habitat: '水体',
    note: '生活在水中，部分菌株会引起霍乱。',
  },
  Pseudomonas_aeruginosa: {
    cn: '铜绿假单胞菌',
    group: '变形菌门',
    habitat: '临床',
    note: '广泛存在于水和土壤，常与医院感染有关。',
  },
  Bacillus_subtilis: {
    cn: '枯草芽孢杆菌',
    group: '厚壁菌门',
    habitat: '土壤',
    note: '土壤中常见的芽孢杆菌，是微生物学模式菌。',
  },
  Staphylococcus_aureus: {
    cn: '金黄色葡萄球菌',
    group: '厚壁菌门',
    habitat: '临床',
    note: '常见于皮肤和鼻腔，部分菌株会引起感染。',
  },
  Streptococcus_pyogenes: {
    cn: '化脓性链球菌',
    group: '厚壁菌门',
    habitat: '临床',
    note: '一种链球菌，可引起咽炎等感染。',
  },
  Lactobacillus_acidophilus: {
    cn: '嗜酸乳杆菌',
    group: '厚壁菌门',
    habitat: '肠道',
    note: '常见于酸奶和肠道，能发酵产生乳酸。',
  },
  Bifidobacterium_longum: {
    cn: '长双歧杆菌',
    group: '放线菌门',
    habitat: '肠道',
    note: '常见于人和动物肠道的有益菌。',
  },
  Mycobacterium_tuberculosis: {
    cn: '结核分枝杆菌',
    group: '放线菌门',
    habitat: '临床',
    note: '引起结核病的病原菌。',
  },
  Streptomyces_coelicolor: {
    cn: '天蓝色链霉菌',
    group: '放线菌门',
    habitat: '土壤',
    note: '土壤中的放线菌，能产生多种抗生素。',
  },
  Synechococcus_elongatus: {
    cn: '细长聚球藻',
    group: '蓝细菌门',
    habitat: '水体',
    note: '能进行光合作用的蓝细菌。',
  },
  Prochlorococcus_marinus: {
    cn: '海洋原绿球藻',
    group: '蓝细菌门',
    habitat: '水体',
    note: '海洋中最丰富的光合微生物之一。',
  },
  Nitrosopumilus_maritimus: {
    cn: '海洋亚硝化侏儒菌',
    group: '嗜极类群',
    habitat: '海洋',
    note: '海洋中参与氮循环的古菌。',
  },
  Methanobrevibacter_smithii: {
    cn: '史密斯甲烷短杆菌',
    group: '嗜极类群',
    habitat: '肠道',
    note: '生活在肠道中、能产生甲烷的古菌。',
  },
  Thermus_thermophilus: {
    cn: '嗜热栖热菌',
    group: '嗜极类群',
    habitat: '极端环境',
    note: '生活在高温环境中的细菌。',
  },
  Deinococcus_radiodurans: {
    cn: '耐辐射奇球菌',
    group: '嗜极类群',
    habitat: '极端环境',
    note: '对辐射有极强耐受力的细菌。',
  },
};

const geneMeta: Record<string, TaxonMeta> = {
  Homo_sapiens: {
    cn: '智人',
    group: '灵长类',
    habitat: '陆地',
    note: '现代人类，也就是我们自己。',
  },
  Pan_troglodytes: {
    cn: '黑猩猩',
    group: '灵长类',
    habitat: '陆地',
    note: '与人类亲缘关系最近的现生动物之一。',
  },
  Gorilla_gorilla: {
    cn: '大猩猩',
    group: '灵长类',
    habitat: '陆地',
    note: '体型最大的现生灵长类，生活在非洲森林。',
  },
  Mus_musculus: {
    cn: '小家鼠',
    group: '啮齿类',
    habitat: '陆地',
    note: '常见的实验小鼠，是遗传学研究的模式动物。',
  },
  Rattus_norvegicus: {
    cn: '褐家鼠',
    group: '啮齿类',
    habitat: '陆地',
    note: '适应力很强的啮齿动物，常生活在人类附近。',
  },
  Oryctolagus_cuniculus: {
    cn: '欧洲兔',
    group: '兔形类',
    habitat: '陆地',
    note: '常见的兔形目动物，耳朵长、后腿发达。',
  },
  Canis_lupus: {
    cn: '灰狼',
    group: '食肉类',
    habitat: '陆地',
    note: '家犬的野生祖先，喜欢成群生活。',
  },
  Felis_catus: {
    cn: '家猫',
    group: '食肉类',
    habitat: '陆地',
    note: '常见的家养食肉动物。',
  },
  Equus_caballus: {
    cn: '马',
    group: '有蹄类',
    habitat: '陆地',
    note: '善于奔跑的有蹄类，已经被人类驯化。',
  },
  Bos_taurus: {
    cn: '黄牛',
    group: '有蹄类',
    habitat: '陆地',
    note: '常见的家畜，属于偶蹄类动物。',
  },
};

const fishTips = [
  'Danio_rerio',
  'Latimeria_chalumnae',
  'Callorhinchus_milii',
];

const amphibianTips = ['Xenopus_laevis'];

const reptileBirdTips = [
  'Gallus_gallus',
  'Taeniopygia_guttata',
  'Chelonia_mydas',
  'Crocodylus_porosus',
];

const mammalTips = [
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
];

const primateTips = ['Homo_sapiens', 'Pan_troglodytes', 'Macaca_mulatta'];
const cetaceanTips = ['Balaenoptera_musculus', 'Tursiops_truncatus'];
const cetartiodactylTips = [
  'Bos_taurus',
  'Hippopotamus_amphibius',
  'Balaenoptera_musculus',
  'Tursiops_truncatus',
];
const rodentTips = ['Mus_musculus', 'Rattus_norvegicus'];
const carnivoreTips = ['Canis_lupus', 'Felis_catus'];

const amnioteTips = [...reptileBirdTips, ...mammalTips];
const tetrapodTips = [...amphibianTips, ...amnioteTips];

const vertebrateCladeLabels: CladeLabel[] = [
  {
    id: 'fish',
    name: '鱼类',
    tips: fishTips,
    description: '终生生活在水中、用鳃呼吸的脊椎动物。',
    offsetX: 10,
    offsetY: 20,
  },
  {
    id: 'tetrapods',
    name: '四足动物',
    tips: tetrapodTips,
    description: '拥有四肢（或由四肢演化而来的结构）的脊椎动物。',
    offsetX: 10,
    offsetY: -34,
  },
  {
    id: 'amniotes',
    name: '羊膜动物',
    tips: amnioteTips,
    description: '产羊膜卵或胎生的脊椎动物，包括爬行类、鸟类和哺乳类。',
    offsetX: 12,
    offsetY: 30,
  },
  {
    id: 'mammals',
    name: '哺乳动物',
    tips: mammalTips,
    description: '用乳汁哺育幼崽、身上有毛的脊椎动物。',
    offsetX: 10,
    offsetY: -34,
  },
  {
    id: 'primates',
    name: '灵长类',
    tips: primateTips,
    description: '猴子、猩猩和人类所在的类群，手指灵活、眼睛朝前。',
    offsetX: 12,
    offsetY: -26,
  },
  {
    id: 'cetaceans',
    name: '鲸类',
    tips: cetaceanTips,
    description: '完全生活在海洋中的哺乳动物，包括鲸和海豚。',
    offsetX: 12,
    offsetY: -26,
  },
];

const vertebrateGeneCladeLabels: CladeLabel[] = [
  vertebrateCladeLabels[0],
  vertebrateCladeLabels[1],
  vertebrateCladeLabels[2],
  vertebrateCladeLabels[3],
  vertebrateCladeLabels[4],
  {
    id: 'cetartiodactyls',
    name: '鲸偶蹄类',
    tips: cetartiodactylTips,
    description: '鲸、海豚、河马和牛等组成的类群；在这棵基因树里，海豚的位置与物种树不同。',
    offsetX: 12,
    offsetY: -26,
  },
];

const microbeCladeLabels: CladeLabel[] = [
  {
    id: 'proteobacteria',
    name: '变形菌门',
    tips: ['Escherichia_coli', 'Salmonella_enterica', 'Vibrio_cholerae', 'Pseudomonas_aeruginosa'],
    description: '一类常见细菌，包含大肠杆菌、沙门氏菌和霍乱弧菌等。',
    offsetX: 10,
    offsetY: -28,
  },
  {
    id: 'bacilli',
    name: '芽孢杆菌类',
    tips: ['Bacillus_subtilis', 'Staphylococcus_aureus', 'Streptococcus_pyogenes'],
    description: '包含枯草芽孢杆菌和常见球菌的一组细菌。',
    offsetX: 10,
    offsetY: -28,
  },
  {
    id: 'lactic-acid',
    name: '乳酸菌',
    tips: ['Lactobacillus_acidophilus', 'Bifidobacterium_longum'],
    description: '能发酵产生乳酸、常见于肠道和发酵食品的细菌。',
    offsetX: 10,
    offsetY: 24,
  },
  {
    id: 'cyanobacteria',
    name: '蓝细菌门',
    tips: ['Synechococcus_elongatus', 'Prochlorococcus_marinus'],
    description: '能进行光合作用、在海洋中非常丰富的微生物。',
    offsetX: 10,
    offsetY: -26,
  },
  {
    id: 'extremophiles',
    name: '嗜极类群',
    tips: ['Nitrosopumilus_maritimus', 'Methanobrevibacter_smithii', 'Thermus_thermophilus', 'Deinococcus_radiodurans'],
    description: '生活在高温、高盐、强辐射等极端环境中的微生物。',
    offsetX: 10,
    offsetY: -30,
  },
  {
    id: 'actinomycetes',
    name: '放线菌类',
    tips: ['Mycobacterium_tuberculosis', 'Streptomyces_coelicolor'],
    description: '包含结核分枝杆菌和能产生抗生素的链霉菌。',
    offsetX: 10,
    offsetY: 24,
  },
];

const geneTreeCladeLabels: CladeLabel[] = [
  {
    id: 'primates',
    name: '灵长类',
    tips: ['Homo_sapiens', 'Pan_troglodytes', 'Gorilla_gorilla'],
    description: '人类、黑猩猩和大猩猩所在的类群。',
    offsetX: 10,
    offsetY: -28,
  },
  {
    id: 'rodents',
    name: '啮齿类',
    tips: rodentTips,
    description: '小鼠和大鼠所在的类群。',
    offsetX: 10,
    offsetY: 24,
  },
];

const speciesTreeCladeLabels: CladeLabel[] = [
  {
    id: 'primates',
    name: '灵长类',
    tips: ['Homo_sapiens', 'Pan_troglodytes', 'Gorilla_gorilla'],
    description: '人类、黑猩猩和大猩猩所在的类群。',
    offsetX: 10,
    offsetY: -28,
  },
  {
    id: 'rodents',
    name: '啮齿类',
    tips: rodentTips,
    description: '小鼠和大鼠所在的类群。',
    offsetX: 10,
    offsetY: 24,
  },
  {
    id: 'carnivores',
    name: '食肉类',
    tips: carnivoreTips,
    description: '灰狼和家猫所在的类群。',
    offsetX: 10,
    offsetY: -28,
  },
];

export const exampleSpecs: ExampleSpec[] = [
  {
    id: 'vertebrates',
    name: '脊椎动物演化树',
    subtitle: '26 个物种 · 从鱼到鲸',
    newick: vertebrateTree,
    metadata: vertebrateMeta,
    cladeLabels: vertebrateCladeLabels,
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
    cladeLabels: vertebrateGeneCladeLabels,
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
    cladeLabels: microbeCladeLabels,
    source: '教学示意树 · 拓扑与分支长度不构成真实推断结果',
    accent: '#ff8a66',
  },
  {
    id: 'gene-tree',
    name: '基因树 · 灵长类',
    subtitle: '10 个物种 · 与物种树冲突',
    newick: geneTree,
    metadata: geneMeta,
    cladeLabels: geneTreeCladeLabels,
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
    cladeLabels: speciesTreeCladeLabels,
    source: '教学示例 · 用于演示基因树与物种树的拓扑冲突',
    accent: '#c7b8ff',
    compareWith: 'gene-tree',
  },
];

export const stories: Story[] = [
  {
    id: 'whale-road',
    title: '鲸类的回家路',
    eyebrow: '故事 01',
    treeId: 'vertebrates',
    summary: '从鳃到肺，再从陆地回到海洋。沿着分支，重读生命史上的一次重大转折。',
    accent: '#d8f27a',
    steps: [
      {
        kicker: '01 / 起点',
        title: '先找到水里的分支',
        body: '树的最下方是鱼类的分支。注意：不是所有水生动物都在这条分支上。海豚和鲸生活在海里，但它们属于哺乳动物。',
        focusTips: ['Danio_rerio', 'Latimeria_chalumnae', 'Callorhinchus_milii'],
      },
      {
        kicker: '02 / 登陆',
        title: '四足动物的一次分叉',
        body: '在鱼类分支的上方，是四足动物。两栖类、爬行类、鸟类和哺乳类共享一个更近的共同祖先——这是“登陆”留下的拓扑印记。',
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
        body: '在“按枝长”视图中，枝长表示每个位点的预期替换数。鲸类支系上较长的枝，提示这段谱系积累了更多分子变化；但枝长本身不是“进化了多少年”。',
        focusTips: ['Balaenoptera_musculus', 'Tursiops_truncatus'],
      },
    ],
  },
  {
    id: 'tree-argument',
    title: '当两棵树吵架',
    eyebrow: '故事 02',
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
        body: 'RF 距离统计两棵树中不同的进化枝数量。它适合快速筛查拓扑差异，但不告诉你差异是生物学信号还是建树误差。打开比较模式，查看哪些进化枝只出现在一棵树里。',
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
