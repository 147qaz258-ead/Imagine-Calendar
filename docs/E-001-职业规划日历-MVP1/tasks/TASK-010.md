# TASK-010：筛选匹配后端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-010 |
| Task Name | 筛选匹配后端 |
| 关联 Story | STORY-004 (精准筛选匹配) |
| 优先级 | P0 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

实现筛选匹配服务后端，包括 13 维度筛选、筛选条件保存、筛选结果返回等功能。

## 技术要点

### 核心功能

1. **13 维度筛选**
   - 地点、自我定位、发展方向、行业、平台性质
   - 企业规模、企业文化、领导风格、培训项目
   - 加班偏好、假期、医疗保障、生育福利

2. **筛选逻辑**
   - 多选条件取交集
   - 支持部分匹配
   - 返回筛选结果数量

3. **筛选保存**
   - 保存用户偏好到 user_profiles
   - 下次访问自动应用

### 接口定义

```typescript
// POST /api/calendar/filter
interface FilterRequest {
  filters: Partial<Preferences>;
  year?: number;
  month?: number;
}

interface FilterResponse {
  success: boolean;
  data: {
    total: number;
    events: CalendarEvent[];
    appliedFilters: Partial<Preferences>;
  };
}

// PUT /api/user/preferences
interface SavePreferencesRequest {
  preferences: Partial<Preferences>;
}

interface SavePreferencesResponse {
  success: boolean;
}

// GET /api/user/preferences
interface GetPreferencesResponse {
  success: boolean;
  data: Preferences;
}
```

### 13 维度选项定义

```typescript
const DIMENSION_OPTIONS = {
  location: ['北京', '上海', '深圳', '杭州', '成都', '广州', '武汉', '西安', '南京', '其他'],
  selfPositioning: ['技术', '产品', '运营', '销售', '职能', '设计', '市场', '财务'],
  developmentDirection: ['深耕专业', '管理路线', '创业', '自由职业', '未确定'],
  industry: ['互联网', '金融', '制造', '教育', '医疗', '能源', '消费', '其他'],
  platformType: ['国企', '外企', '民企', '事业单位', '初创公司'],
  companyScale: ['50人以下', '50-200人', '200-1000人', '1000人以上'],
  companyCulture: ['扁平化', '层级分明', '创新导向', '稳定导向'],
  leadershipStyle: ['导师型', '放权型', '指令型', '协作型'],
  trainingProgram: ['有系统培训', '导师带教', '自学为主'],
  overtimePreference: ['965', '996接受', '弹性工作', '不加班'],
  holiday: ['双休', '单休', '大小周'],
  medicalInsurance: ['基础五险', '补充医疗', '高端医疗'],
  maternityBenefit: ['无', '基础', '完善'],
};
```

### 数据库查询优化

- 使用 JSONB 查询用户偏好
- 事件表建立多维度索引
- 考虑使用 Elasticsearch 优化复杂筛选

## 验收标准

- [ ] 筛选接口正常（多维度）
- [ ] 多选条件交集正确
- [ ] 筛选结果数量正确
- [ ] 保存偏好接口正常
- [ ] 获取偏好接口正常
- [ ] 部分匹配逻辑正确
- [ ] Swagger 文档完整

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-005（用户偏好数据）
- TASK-008（事件数据）

### 接口依赖 (interface_deps)
- 无

## 实现记录

_由 dev agent 填写_

## 测试记录

_由 dev agent 填写_

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |