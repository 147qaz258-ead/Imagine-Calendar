/**
 * 地点选择维度 - 动态问题
 * 根据用户选择的城市返回特定问题
 */

import type { CognitiveQuestion } from './cognitive-questions'

/**
 * 城市特定问题映射
 * key: 城市名称（对应 UserPreferences.locations 中的值）
 */
export const LOCATION_SPECIFIC_QUESTIONS: ReadonlyMap<string, readonly CognitiveQuestion[]> = new Map([
  // ========== 北京 ==========
  [
    '北京',
    [
      {
        id: 'location-beijing-1',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '北京',
        question: '北京作为中国的政治中心和文化中心，你知道这意味着什么吗？央企总部、部委机关、外交机构林立，这对你的职业发展有什么样的影响？',
        level: 1,
        relatedOptions: ['北京'],
      },
      {
        id: 'location-beijing-2',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '北京',
        question: '北京的支柱产业包括金融、科技、文化创意、医药健康等。你知道中关村、金融街、亦庄经济技术开发区分别聚集了什么类型的企业吗？',
        level: 2,
        relatedOptions: ['北京'],
      },
      {
        id: 'location-beijing-3',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '北京',
        question: '北京的人才落户政策你了解吗？应届生落户、积分落户、人才引进分别需要什么条件？这对你规划职业路径有什么影响？',
        level: 3,
        relatedOptions: ['北京'],
      },
      {
        id: 'location-beijing-4',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '北京',
        question: '北京的房价和租金水平在全国处于什么位置？你清楚在国贸、西二旗、望京等不同区域工作对应的生活成本差异吗？',
        level: 2,
        relatedOptions: ['北京'],
      },
      {
        id: 'location-beijing-5',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '北京',
        question: '北京的互联网大厂（字节、美团、百度、小米等）人才竞争激烈，你了解这些公司对校招生的能力要求和薪资水平吗？',
        level: 3,
        relatedOptions: ['北京'],
      },
    ],
  ],

  // ========== 上海 ==========
  [
    '上海',
    [
      {
        id: 'location-shanghai-1',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '上海',
        question: '上海作为中国的经济中心和金融中心，陆家嘴金融城聚集了多少家金融机构？你知道上海在中国的外资企业占比吗？',
        level: 1,
        relatedOptions: ['上海'],
      },
      {
        id: 'location-shanghai-2',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '上海',
        question: '上海的支柱产业包括金融、汽车、电子信息、生物医药等。你知道张江高科、漕河泾开发区、自贸区临港新片区分别定位什么产业吗？',
        level: 2,
        relatedOptions: ['上海'],
      },
      {
        id: 'location-shanghai-3',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '上海',
        question: '上海的落户政策（居转户、人才引进、留学生落户）你了解吗？上海对海归人才的优惠政策与北京有什么不同？',
        level: 3,
        relatedOptions: ['上海'],
      },
      {
        id: 'location-shanghai-4',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '上海',
        question: '上海的跨国公司地区总部数量居全国首位，你知道这对你的职业发展意味着什么吗？外企的工作文化和国企、民企有什么不同？',
        level: 2,
        relatedOptions: ['上海'],
      },
      {
        id: 'location-shanghai-5',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '上海',
        question: '上海的生活成本在全国处于什么水平？你了解浦西和浦东的生活环境差异吗？通勤成本和居住成本如何权衡？',
        level: 2,
        relatedOptions: ['上海'],
      },
    ],
  ],

  // ========== 深圳 ==========
  [
    '深圳',
    [
      {
        id: 'location-shenzhen-1',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '深圳',
        question: '深圳作为中国的科技创新中心，你知道华为、腾讯、比亚迪、大疆等企业的总部都在深圳吗？这对你的职业选择意味着什么？',
        level: 1,
        relatedOptions: ['深圳'],
      },
      {
        id: 'location-shenzhen-2',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '深圳',
        question: '深圳的支柱产业是高新技术产业、金融业、物流业。你知道深圳南山区被称为"中国硅谷"的原因吗？',
        level: 2,
        relatedOptions: ['深圳'],
      },
      {
        id: 'location-shenzhen-3',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '深圳',
        question: '深圳的人才引进政策相对宽松，你了解深圳对本科、硕士、博士毕业生的落户补贴政策吗？与其他一线城市相比有什么优势？',
        level: 3,
        relatedOptions: ['深圳'],
      },
      {
        id: 'location-shenzhen-4',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '深圳',
        question: '深圳是一个年轻的城市，平均年龄只有33岁。你知道这种人口结构对职场文化和职业发展有什么影响吗？',
        level: 2,
        relatedOptions: ['深圳'],
      },
      {
        id: 'location-shenzhen-5',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '深圳',
        question: '深圳毗邻香港，你知道这对从事金融、贸易、跨境业务的人才意味着什么吗？粤港澳大湾区的发展规划对深圳的影响你了解吗？',
        level: 3,
        relatedOptions: ['深圳'],
      },
    ],
  ],

  // ========== 杭州 ==========
  [
    '杭州',
    [
      {
        id: 'location-hangzhou-1',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '杭州',
        question: '杭州作为阿里巴巴的大本营，你知道电商和互联网产业在杭州经济中的地位吗？滨江区和未来科技城分别聚集了什么类型的企业？',
        level: 1,
        relatedOptions: ['杭州'],
      },
      {
        id: 'location-hangzhou-2',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '杭州',
        question: '杭州的数字经济产业发达，你知道杭州在直播电商、SaaS服务、云计算等细分领域的优势吗？',
        level: 2,
        relatedOptions: ['杭州'],
      },
      {
        id: 'location-hangzhou-3',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '杭州',
        question: '杭州的人才引进政策（应届生补贴、高层次人才认定）你了解吗？杭州对互联网人才的吸引力与北上深相比如何？',
        level: 2,
        relatedOptions: ['杭州'],
      },
      {
        id: 'location-hangzhou-4',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '杭州',
        question: '杭州的生活成本和房价与北上深相比有什么优势？你了解杭州的公共交通和通勤情况吗？',
        level: 1,
        relatedOptions: ['杭州'],
      },
      {
        id: 'location-hangzhou-5',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '杭州',
        question: '杭州的创业氛围浓厚，你知道杭州有哪些知名的创业孵化器和投资机构吗？这对想创业的人才意味着什么？',
        level: 3,
        relatedOptions: ['杭州'],
      },
    ],
  ],

  // ========== 广州 ==========
  [
    '广州',
    [
      {
        id: 'location-guangzhou-1',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '广州',
        question: '广州作为华南地区的商贸中心，你知道广交会的历史和影响力吗？广州的批发市场、外贸企业聚集区你了解吗？',
        level: 1,
        relatedOptions: ['广州'],
      },
      {
        id: 'location-guangzhou-2',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '广州',
        question: '广州的支柱产业包括汽车制造、电子信息、石油化工、商贸会展。你知道广州汽车产业（广汽、东风日产）的发展情况吗？',
        level: 2,
        relatedOptions: ['广州'],
      },
      {
        id: 'location-guangzhou-3',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '广州',
        question: '广州的落户政策相对友好，你了解广州的人才引进和积分入户政策吗？与深圳相比，广州的入户门槛如何？',
        level: 2,
        relatedOptions: ['广州'],
      },
      {
        id: 'location-guangzhou-4',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '广州',
        question: '广州的生活成本在一线城市中相对较低，你知道广州的房价水平和各区的生活环境差异吗？',
        level: 1,
        relatedOptions: ['广州'],
      },
      {
        id: 'location-guangzhou-5',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '广州',
        question: '广州是华南地区的教育中心，中山大学、华南理工大学等高校的毕业生流向你了解吗？广州的产学研合作情况如何？',
        level: 3,
        relatedOptions: ['广州'],
      },
    ],
  ],

  // ========== 成都 ==========
  [
    '成都',
    [
      {
        id: 'location-chengdu-1',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '成都',
        question: '成都被称为"新一线城市"的代表，你知道成都的高新区聚集了哪些知名企业吗？腾讯、字节、阿里的成都分部情况你了解吗？',
        level: 1,
        relatedOptions: ['成都'],
      },
      {
        id: 'location-chengdu-2',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '成都',
        question: '成都的支柱产业包括电子信息、汽车制造、食品饮料、文创旅游。你知道成都为什么被称为"手游之都"吗？',
        level: 2,
        relatedOptions: ['成都'],
      },
      {
        id: 'location-chengdu-3',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '成都',
        question: '成都的人才引进力度很大，你了解"蓉漂计划"的具体内容吗？成都对本科、硕士、博士的补贴政策如何？',
        level: 2,
        relatedOptions: ['成都'],
      },
      {
        id: 'location-chengdu-4',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '成都',
        question: '成都的生活节奏和工作文化你了解吗？相比北上广深，成都的工作强度和生活平衡有什么不同？',
        level: 1,
        relatedOptions: ['成都'],
      },
      {
        id: 'location-chengdu-5',
        dimensionKey: 'locations',
        dimensionName: '地点选择',
        subCategory: '成都',
        question: '成都是西部地区的消费中心，你知道成都的消费市场规模和商业环境吗？这对从事零售、消费品行业的人才意味着什么？',
        level: 2,
        relatedOptions: ['成都'],
      },
    ],
  ],
])

/**
 * 获取城市特定问题
 */
export function getLocationQuestions(location: string): readonly CognitiveQuestion[] {
  return LOCATION_SPECIFIC_QUESTIONS.get(location) ?? []
}

/**
 * 获取所有支持的城市列表
 */
export function getSupportedLocations(): string[] {
  return Array.from(LOCATION_SPECIFIC_QUESTIONS.keys())
}