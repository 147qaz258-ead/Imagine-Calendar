/**
 * 行业领域维度 - 动态问题
 * 根据用户选择的行业返回特定问题
 */

import type { CognitiveQuestion } from './cognitive-questions'

/**
 * 行业特定问题映射
 * key: 行业名称（对应 UserPreferences.industries 中的值）
 */
export const INDUSTRY_SPECIFIC_QUESTIONS: ReadonlyMap<string, readonly CognitiveQuestion[]> = new Map([
  // ========== 互联网/IT ==========
  [
    '互联网',
    [
      {
        id: 'industry-internet-1',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '互联网',
        question: '互联网行业的细分领域（电商、社交、内容、工具、企业服务）你了解吗？每个细分领域的代表公司和商业模式是什么？',
        level: 1,
        relatedOptions: ['互联网', 'IT'],
      },
      {
        id: 'industry-internet-2',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '互联网',
        question: '互联网行业的盈利模式（广告、电商、订阅、佣金、增值服务）你清楚吗？不同盈利模式对应的产品形态和运营策略有什么不同？',
        level: 2,
        relatedOptions: ['互联网'],
      },
      {
        id: 'industry-internet-3',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '互联网',
        question: '互联网行业目前面临反垄断监管、数据安全合规、内容审核等政策环境变化，你知道这对行业发展和人才需求的影响吗？',
        level: 3,
        relatedOptions: ['互联网'],
      },
      {
        id: 'industry-internet-4',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '互联网',
        question: '互联网行业的工作强度（996文化）和职业发展路径（P序列、管理序列）你了解吗？互联网公司的晋升机制和淘汰机制是怎样的？',
        level: 2,
        relatedOptions: ['互联网'],
      },
      {
        id: 'industry-internet-5',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '互联网',
        question: 'AI大模型的兴起对互联网行业产生了什么影响？传统互联网产品经理、运营、开发岗位的能力要求发生了什么变化？',
        level: 3,
        relatedOptions: ['互联网', 'AI'],
      },
    ],
  ],

  // ========== 金融 ==========
  [
    '金融',
    [
      {
        id: 'industry-finance-1',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '金融',
        question: '金融行业的细分领域（银行、证券、保险、基金、信托、租赁、消费金融）你了解吗？每个细分领域的工作内容和职业路径有什么不同？',
        level: 1,
        relatedOptions: ['金融'],
      },
      {
        id: 'industry-finance-2',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '金融',
        question: '金融行业的持牌机构和非持牌机构有什么区别？你知道哪些岗位需要从业资格证（证券从业、基金从业、CPA、CFA等）吗？',
        level: 2,
        relatedOptions: ['金融'],
      },
      {
        id: 'industry-finance-3',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '金融',
        question: '金融行业的收入结构（基本工资+奖金+福利）你了解吗？不同细分领域（投行、券商、银行、基金）的薪酬水平差异大吗？',
        level: 2,
        relatedOptions: ['金融'],
      },
      {
        id: 'industry-finance-4',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '金融',
        question: '金融科技（FinTech）的发展对传统金融机构有什么影响？你知道量化交易、智能投顾、区块链金融等新兴方向吗？',
        level: 3,
        relatedOptions: ['金融', '科技'],
      },
      {
        id: 'industry-finance-5',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '金融',
        question: '金融行业的工作压力和职业发展天花板你了解吗？基金经理、投行MD、银行行长分别需要多长时间和什么样的能力？',
        level: 3,
        relatedOptions: ['金融'],
      },
    ],
  ],

  // ========== 制造业 ==========
  [
    '制造业',
    [
      {
        id: 'industry-manufacturing-1',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '制造业',
        question: '制造业的产业链（原材料-零部件-组装-销售-售后服务）你了解吗？不同环节对应的企业类型和工作内容有什么不同？',
        level: 1,
        relatedOptions: ['制造业'],
      },
      {
        id: 'industry-manufacturing-2',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '制造业',
        question: '中国制造业正在从"制造"向"智造"转型，你知道工业4.0、智能制造、数字化转型对制造业人才的要求变化吗？',
        level: 2,
        relatedOptions: ['制造业', '科技'],
      },
      {
        id: 'industry-manufacturing-3',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '制造业',
        question: '制造业的企业类型（国企、民企、外企）差异很大，你知道不同类型企业的管理模式、薪酬福利、发展空间吗？',
        level: 2,
        relatedOptions: ['制造业'],
      },
      {
        id: 'industry-manufacturing-4',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '制造业',
        question: '制造业的工作环境（工厂、办公室、研发中心）你清楚吗？一线生产、质量管控、供应链管理、研发设计岗位的区别你了解吗？',
        level: 1,
        relatedOptions: ['制造业'],
      },
      {
        id: 'industry-manufacturing-5',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '制造业',
        question: '新能源汽车、半导体、航空航天等高端制造业是政策重点扶持领域，你知道这些细分行业的人才需求和发展前景吗？',
        level: 3,
        relatedOptions: ['制造业', '新能源', '半导体'],
      },
    ],
  ],

  // ========== 医疗健康 ==========
  [
    '医疗健康',
    [
      {
        id: 'industry-healthcare-1',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '医疗健康',
        question: '医疗健康行业包括医疗服务、医药研发、医疗器械、医疗信息化等细分领域，你清楚每个细分领域的代表企业和工作内容吗？',
        level: 1,
        relatedOptions: ['医疗健康', '医药'],
      },
      {
        id: 'industry-healthcare-2',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '医疗健康',
        question: '医药行业的研发周期长、投入大、风险高，你知道创新药研发从靶点发现到上市销售需要多长时间和多少资金吗？',
        level: 2,
        relatedOptions: ['医疗健康', '医药'],
      },
      {
        id: 'industry-healthcare-3',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '医疗健康',
        question: '医疗行业的政策环境（集采、医保谈判、一致性评价）对行业发展有什么影响？你知道这些政策对医药企业的利润影响吗？',
        level: 3,
        relatedOptions: ['医疗健康', '医药'],
      },
      {
        id: 'industry-healthcare-4',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '医疗健康',
        question: '医疗健康行业对专业背景要求较高，你知道临床医学、药学、生物医学工程等专业的就业方向差异吗？',
        level: 2,
        relatedOptions: ['医疗健康'],
      },
      {
        id: 'industry-healthcare-5',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '医疗健康',
        question: 'AI医疗、远程医疗、精准医疗等新兴方向的发展前景你了解吗？这些技术对传统医疗行业的人才需求有什么影响？',
        level: 3,
        relatedOptions: ['医疗健康', 'AI'],
      },
    ],
  ],

  // ========== 教育 ==========
  [
    '教育',
    [
      {
        id: 'industry-education-1',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '教育',
        question: '教育行业包括学历教育（K12、高等教育）、职业教育、在线教育、教育科技等细分领域，你了解每个领域的发展现状吗？',
        level: 1,
        relatedOptions: ['教育'],
      },
      {
        id: 'industry-education-2',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '教育',
        question: '"双减"政策对教育行业产生了深远影响，你知道政策出台前后教育行业的就业机会变化吗？转型后的教培人才流向了哪里？',
        level: 2,
        relatedOptions: ['教育'],
      },
      {
        id: 'industry-education-3',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '教育',
        question: '教师编制、合同制、代课教师有什么区别？你知道公立学校和私立学校的工作强度、薪酬福利、职业发展差异吗？',
        level: 2,
        relatedOptions: ['教育'],
      },
      {
        id: 'industry-education-4',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '教育',
        question: '职业教育是政策鼓励方向，你知道职业技能培训、职业资格证书、产教融合等方向的发展前景吗？',
        level: 2,
        relatedOptions: ['教育'],
      },
      {
        id: 'industry-education-5',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '教育',
        question: '教育行业的职业发展路径（教师-教研组长-教导主任-校长/教研员）你了解吗？教育管理岗位需要什么样的能力？',
        level: 3,
        relatedOptions: ['教育'],
      },
    ],
  ],

  // ========== 新能源 ==========
  [
    '新能源',
    [
      {
        id: 'industry-newenergy-1',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '新能源',
        question: '新能源行业包括光伏、风电、储能、新能源汽车等细分领域，你知道每个细分领域的产业链和代表企业吗？',
        level: 1,
        relatedOptions: ['新能源'],
      },
      {
        id: 'industry-newenergy-2',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '新能源',
        question: '中国的新能源产业在全球处于领先地位，你知道"双碳"目标对行业发展的推动作用吗？政策补贴对企业和就业的影响如何？',
        level: 2,
        relatedOptions: ['新能源'],
      },
      {
        id: 'industry-newenergy-3',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '新能源',
        question: '新能源汽车行业的竞争格局（比亚迪、特斯拉、蔚小理等）你了解吗？造车新势力与传统车企的人才需求有什么不同？',
        level: 2,
        relatedOptions: ['新能源', '汽车'],
      },
      {
        id: 'industry-newenergy-4',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '新能源',
        question: '新能源行业对技术人才的需求很大，你知道电池研发、电机控制、充电桩技术等方向的专业要求和薪资水平吗？',
        level: 2,
        relatedOptions: ['新能源'],
      },
      {
        id: 'industry-newenergy-5',
        dimensionKey: 'industries',
        dimensionName: '行业领域',
        subCategory: '新能源',
        question: '新能源行业的就业地域分布你了解吗？光伏产业集中在哪些省份？新能源汽车产业的主要城市有哪些？',
        level: 2,
        relatedOptions: ['新能源'],
      },
    ],
  ],
])

/**
 * 获取行业特定问题
 */
export function getIndustryQuestions(industry: string): readonly CognitiveQuestion[] {
  return INDUSTRY_SPECIFIC_QUESTIONS.get(industry) ?? []
}

/**
 * 获取所有支持的行业列表
 */
export function getSupportedIndustries(): string[] {
  return Array.from(INDUSTRY_SPECIFIC_QUESTIONS.keys())
}