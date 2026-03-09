/**
 * 企业类型枚举定义
 * 单独文件避免循环依赖
 */

// 企业类型枚举
export enum CompanyType {
  SOE = 'soe',           // 国企（灰色）
  FOREIGN = 'foreign',   // 外企（紫色）
  PRIVATE = 'private',   // 民企（黄色）
  STARTUP = 'startup',   // 创业公司（橙色）
  GOVERNMENT = 'government', // 事业单位（蓝色）
}