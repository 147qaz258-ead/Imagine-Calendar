# TASK-006：用户画像前端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-006 |
| Task Name | 用户画像前端 |
| 关联 Story | STORY-002 (用户画像建立) |
| 优先级 | P0 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

实现用户画像前端，包括个人资料填写页、偏好设置页、引导流程等。

## 技术要点

### 页面设计

1. **引导页**
   - 欢迎语
   - 快速引导（可跳过）
   - 进入填写流程

2. **个人资料页**
   - 学校选择（搜索下拉）
   - 专业选择（搜索下拉）
   - 年级选择
   - 城市选择
   - 保存按钮

3. **偏好设置页**
   - 13 维度多选
   - 每个维度展开/收起
   - 保存按钮
   - 跳过按钮

### 核心功能

1. **学校搜索**
   - 输入关键词实时搜索
   - 防抖处理（300ms）
   - 显示学校、省份、城市

2. **专业搜索**
   - 输入关键词实时搜索
   - 分类展示

3. **偏好设置**
   - 多选标签组件
   - 预设选项
   - 可展开/收起
   - 进度指示

4. **表单验证**
   - 必填项校验
   - 实时反馈
   - 保存前验证

### 接口调用

```typescript
// 用户画像 API
const userApi = {
  // 获取画像
  getProfile: () =>
    axios.get('/api/user/profile'),

  // 更新画像
  updateProfile: (data: UpdateProfileRequest) =>
    axios.put('/api/user/profile', data),

  // 更新偏好
  updatePreferences: (preferences: Partial<Preferences>) =>
    axios.put('/api/user/preferences', { preferences }),

  // 获取学校列表
  getSchools: (keyword: string, page: number) =>
    axios.get('/api/schools', { params: { keyword, page } }),

  // 获取专业列表
  getMajors: (keyword: string, page: number) =>
    axios.get('/api/majors', { params: { keyword, page } }),
};
```

### 状态管理

```typescript
// Redux Slice
interface UserState {
  profile: UserProfile | null;
  preferences: Preferences;
  loading: boolean;
  error: string | null;
}
```

## 验收标准

- [ ] 引导页展示正确
- [ ] 个人资料页布局正确
- [ ] 学校搜索功能正常
- [ ] 专业搜索功能正常
- [ ] 年级/城市选择正常
- [ ] 偏好设置页布局正确
- [ ] 13 维度多选正常
- [ ] 表单验证正确
- [ ] 保存成功跳转
- [ ] 跳过功能正常
- [ ] 移动端适配

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-001（基础框架）
- TASK-004（认证状态）

### 接口依赖 (interface_deps)
- TASK-005（需要用户画像 API 接口契约）

### 接口契约验证
- [ ] 已确认 TASK-005 接口契约定义完整

## 实现记录

_由 dev agent 填写_

## 测试记录

_由 dev agent 填写_

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |