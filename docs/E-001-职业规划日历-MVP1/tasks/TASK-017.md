# TASK-017：认知图谱前端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-017 |
| Task Name | 认知图谱前端 |
| 关联 Story | STORY-007 (成长可视化) |
| 优先级 | P1 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

实现认知图谱前端，包括雷达图展示、对比功能、时间轴、颜色编码等。

## 技术要点

### 页面设计

1. **认知图谱页**
   - 雷达图展示
   - 维度分数
   - 知识来源颜色
   - 对比按钮

2. **对比模式**
   - 与小组对比
   - 与历史对比
   - 差异值标注

3. **时间轴**
   - 历史记录
   - 变化趋势
   - 关键事件节点

### 核心功能

1. **雷达图**
   - 使用 ECharts 或 Recharts
   - 5 维度展示
   - 颜色编码

2. **对比功能**
   - 雷达图叠加
   - 差异值计算
   - 动画效果

3. **时间轴**
   - 折线图展示
   - 时间范围选择
   - 关键节点标记

### 雷达图配置

```typescript
// ECharts 雷达图配置
const radarOption = {
  title: {
    text: '认知边界图',
  },
  legend: {
    data: ['当前状态', '基准对比'],
  },
  radar: {
    indicator: [
      { name: '行业认知', max: 100 },
      { name: '岗位认知', max: 100 },
      { name: '能力认知', max: 100 },
      { name: '路径认知', max: 100 },
      { name: '资源认知', max: 100 },
    ],
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: [75, 60, 80, 55, 45],
          name: '当前状态',
          itemStyle: {
            color: '#3498db',
          },
          areaStyle: {
            color: 'rgba(52, 152, 219, 0.3)',
          },
        },
        {
          value: [65, 55, 70, 50, 40],
          name: '基准对比',
          itemStyle: {
            color: '#e74c3c',
          },
          areaStyle: {
            color: 'rgba(231, 76, 60, 0.2)',
          },
        },
      ],
    },
  ],
};
```

### 接口调用

```typescript
// 认知图谱 API
const cognitiveApi = {
  // 创建认知记录
  create: (data: CreateCognitiveRequest) =>
    axios.post('/api/cognitive', data),

  // 获取当前认知
  getCurrent: () =>
    axios.get('/api/cognitive/current'),

  // 获取历史记录
  getHistory: (params?: CognitiveHistoryQuery) =>
    axios.get('/api/cognitive/history', { params }),

  // 对比分析
  compare: (params: CompareCognitiveQuery) =>
    axios.get('/api/cognitive/compare', { params }),

  // 趋势数据
  getTrend: () =>
    axios.get('/api/cognitive/trend'),
};
```

### 状态管理

```typescript
// Redux Slice
interface CognitiveState {
  currentMap: CognitiveMap | null;
  history: CognitiveMap[];
  comparison: {
    current: CognitiveDimensions;
    baseline: CognitiveDimensions;
    diff: CognitiveDimensions;
  } | null;
  trend: {
    dates: string[];
    dimensions: Record<string, number[]>;
  } | null;
  loading: boolean;
  error: string | null;
}
```

## 验收标准

- [ ] 雷达图展示正确
- [ ] 5 维度分数显示正确
- [ ] 知识来源颜色编码正确
- [ ] 与小组对比功能正常
- [ ] 与历史对比功能正常
- [ ] 差异值标注正确
- [ ] 时间轴展示正确
- [ ] 趋势折线图正常
- [ ] 移动端适配

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-015（圆桌交流前端）

### 接口依赖 (interface_deps)
- TASK-016（需要认知图谱 API 接口契约）

### 接口契约验证
- [ ] 已确认 TASK-016 接口契约定义完整

## 实现记录

_由 dev agent 填写_

## 测试记录

_由 dev agent 填写_

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |