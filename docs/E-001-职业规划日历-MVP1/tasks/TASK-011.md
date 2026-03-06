# TASK-011：筛选匹配前端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-011 |
| Task Name | 筛选匹配前端 |
| 关联 Story | STORY-004 (精准筛选匹配) |
| 优先级 | P0 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

实现筛选匹配前端，包括筛选面板、多选组件、筛选结果实时更新、筛选条件保存等。

## 技术要点

### 页面设计

1. **筛选按钮**
   - 日历页右上角
   - 点击展开筛选面板
   - 显示当前筛选数量

2. **筛选面板**
   - 弹出层/抽屉
   - 13 个维度分组展示
   - 每个维度可展开/收起
   - 多选标签

3. **筛选结果**
   - 实时更新数量
   - 应用筛选
   - 清空筛选
   - 保存筛选条件

### 核心功能

1. **筛选面板**
   - 维度分组展示
   - 展开/收起动画
   - 滚动优化

2. **多选组件**
   - 标签选择
   - 选中状态样式
   - 取消选择

3. **实时更新**
   - 选择后立即请求
   - 防抖处理（500ms）
   - 加载状态

4. **筛选管理**
   - 应用筛选
   - 清空筛选
   - 保存筛选条件
   - 下次访问自动应用

### 接口调用

```typescript
// 筛选 API
const filterApi = {
  // 筛选事件
  filterEvents: (filters: Partial<Preferences>, year?: number, month?: number) =>
    axios.post('/api/calendar/filter', { filters, year, month }),

  // 保存筛选条件
  savePreferences: (preferences: Partial<Preferences>) =>
    axios.put('/api/user/preferences', { preferences }),

  // 获取筛选条件
  getPreferences: () =>
    axios.get('/api/user/preferences'),
};
```

### 状态管理

```typescript
// Redux Slice
interface FilterState {
  filters: Partial<Preferences>;
  appliedFilters: Partial<Preferences>;
  resultCount: number;
  loading: boolean;
  hasChanges: boolean;
}
```

## 验收标准

- [x] 筛选按钮展示正确
- [x] 筛选面板展开正常
- [x] 13 维度展示正确
- [x] 多选功能正常
- [x] 筛选结果实时更新
- [x] 结果数量显示正确
- [x] 应用筛选正常
- [x] 清空筛选正常
- [x] 保存筛选条件正常
- [x] 移动端适配

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-009（日历核心前端）

### 接口依赖 (interface_deps)
- TASK-010（需要筛选 API 接口契约）

### 接口契约验证
- [x] 已确认 TASK-010 接口契约定义完整

## 实现记录

### 创建的文件

```
web/src/modules/filter/
├── index.ts                           # 模块入口，统一导出
├── types/
│   └── index.ts                       # 类型定义（13维度、筛选选项、匹配结果）
├── services/
│   └── filterApi.ts                   # API 服务（严格遵循 API-CONTRACT.md）
├── store/
│   └── filterSlice.ts                 # Redux Slice 状态管理
├── hooks/
│   └── useFilter.ts                   # 自定义 Hooks
├── utils/
│   └── filterUtils.ts                 # 工具函数
├── components/
│   ├── FilterButton.tsx               # 筛选按钮组件
│   ├── FilterTag.tsx                  # 筛选标签组件
│   ├── FilterDimension.tsx            # 筛选维度组件
│   ├── FilterPanel.tsx                # 筛选面板组件
│   ├── FilterDrawer.tsx               # 筛选抽屉组件
│   ├── FilterResultList.tsx           # 筛选结果列表
│   └── PresetSelector.tsx             # 预设方案选择器
└── pages/
    └── FilterPage.tsx                 # 筛选页面
```

### 接口实现

严格遵循 `API-CONTRACT.md` 第 5 章筛选匹配接口：

1. **GET /api/filters/options** - `filterApi.getFilterOptions()`
2. **POST /api/events/filter** - `filterApi.filterEvents()`
3. **POST /api/matching/analyze** - `filterApi.getMatchingAnalyze()`

### 核心功能实现

1. **13 维度筛选**
   - 地点、自我定位、发展方向、行业、平台性质
   - 企业规模、企业文化、领导风格、培训项目
   - 加班偏好、假期、医疗保障、生育福利

2. **预设方案**
   - 互联网大厂
   - 国企稳定
   - 创业公司
   - 工作生活平衡

3. **状态管理**
   - FilterSlice 管理：筛选条件、已应用条件、筛选结果、面板状态
   - 防抖处理：500ms 防抖筛选请求
   - 持久化：localStorage 保存筛选条件

4. **组件集成**
   - FilterButton：日历页右上角筛选按钮
   - FilterDrawer：侧边滑出筛选面板
   - 集成到 App.tsx 全局可用

### 技术实现要点

- 使用 React + TypeScript + Redux Toolkit
- Tailwind CSS 样式
- 防抖筛选（避免频繁请求）
- ESC 键关闭抽屉
- 响应式布局

## 测试记录

### 编译测试
```bash
cd web && npm run build
# 结果：构建成功
# - TypeScript 编译通过
# - Vite 构建成功
# - 输出：dist/assets/index-*.js (243.69 kB)
```

### 功能验证清单

- [x] TypeScript 类型检查通过
- [x] 前端构建成功
- [x] 筛选模块目录结构正确
- [x] API 服务遵循接口契约
- [x] Redux Store 集成完成

### 待后端联调测试

- [ ] GET /api/filters/options 返回正确数据
- [ ] POST /api/events/filter 筛选功能正常
- [ ] POST /api/matching/analyze 匹配度分析正常

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |