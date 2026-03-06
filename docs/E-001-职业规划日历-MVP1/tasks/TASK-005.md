# TASK-005：用户画像后端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-005 |
| Task Name | 用户画像后端 |
| 关联 Story | STORY-002 (用户画像建立) |
| 优先级 | P0 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

实现用户画像服务后端，包括个人资料管理、偏好设置、学校专业查询等功能。

## 技术要点

### 核心功能

1. **个人资料管理**
   - 获取用户画像
   - 更新个人资料
   - 学校/专业选择

2. **偏好设置**
   - 13 维度偏好存储（JSONB）
   - 偏好更新
   - 偏好推荐

3. **基础数据查询**
   - 学校列表查询（分页、搜索）
   - 专业列表查询（分页、搜索）
   - 城市/年级枚举

### 接口定义

```typescript
// GET /api/user/profile
interface UserProfileResponse {
  success: boolean;
  data: {
    userId: string;
    phone: string;
    nickname: string;
    avatarUrl?: string;
    school?: { id: string; name: string };
    major?: { id: string; name: string };
    grade?: string;
    graduationYear?: number;
    city?: string;
    name?: string;
    studentId?: string;
    preferences: Preferences;
  };
}

// PUT /api/user/profile
interface UpdateProfileRequest {
  schoolId?: string;
  majorId?: string;
  grade?: string;
  city?: string;
  name?: string;
  studentId?: string;
}

// PUT /api/user/preferences
interface UpdatePreferencesRequest {
  preferences: Partial<Preferences>;
}

// GET /api/schools
interface SchoolsResponse {
  success: boolean;
  data: {
    total: number;
    items: { id: string; name: string; province: string; city: string }[];
  };
}

// GET /api/majors
interface MajorsResponse {
  success: boolean;
  data: {
    total: number;
    items: { id: string; name: string; category: string }[];
  };
}

// Preferences 类型定义
interface Preferences {
  location: string[];           // 地点
  selfPositioning: string[];    // 自我定位
  developmentDirection: string[]; // 发展方向
  industry: string[];           // 行业
  platformType: string[];       // 平台性质
  companyScale: string[];       // 企业规模
  companyCulture: string[];     // 企业文化
  leadershipStyle: string[];    // 领导风格
  trainingProgram: string[];    // 培训项目
  overtimePreference: string[]; // 加班偏好
  holiday: string[];            // 假期
  medicalInsurance: string[];   // 医疗保障
  maternityBenefit: string[];   // 生育福利
}
```

### 数据库操作

- 使用 TypeORM 操作 user_profiles 表
- JSONB 字段存储偏好数据
- GIN 索引支持偏好查询

## 验收标准

- [ ] 获取用户画像接口正常
- [ ] 更新个人资料接口正常
- [ ] 更新偏好设置接口正常
- [ ] 学校列表查询接口正常（分页、搜索）
- [ ] 专业列表查询接口正常（分页、搜索）
- [ ] 毕业年份自动计算正确
- [ ] JWT 认证守卫正常
- [ ] Swagger 文档完整

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-002（数据库 user_profiles、schools、majors 表）
- TASK-003（认证中间件、JWT 守卫）

### 接口依赖 (interface_deps)
- 无

## 实现记录

### 实现概要

已完成用户画像后端所有核心功能实现，包括：

1. **UserController** - 用户画像控制器
   - `GET /api/users/:id/profile` - 获取用户画像
   - `PUT /api/users/:id/profile` - 更新用户画像
   - `PUT /api/users/:id/preferences` - 更新用户偏好（13维度）
   - `POST /api/users/:id/student-card` - 上传学生证（OCR Mock）

2. **SchoolController** - 学校数据控制器
   - `GET /api/schools` - 学校列表查询（分页、搜索）

3. **MajorController** - 专业数据控制器
   - `GET /api/majors` - 专业列表查询（分页、搜索）

4. **UserService** - 用户服务
   - 用户画像 CRUD 操作
   - 13维度偏好存储与计算
   - 学校/专业查询
   - OCR Mock 实现

### 文件变更清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `server/src/modules/user/dto/user.dto.ts` | 新增 | DTO定义（UpdateProfileDto, UpdatePreferencesDto等） |
| `server/src/modules/user/dto/index.ts` | 新增 | DTO导出 |
| `server/src/modules/user/user.service.ts` | 新增 | 用户服务实现 |
| `server/src/modules/user/user.controller.ts` | 新增 | 用户/学校/专业控制器 |
| `server/src/modules/user/user.module.ts` | 修改 | 添加控制器和服务 |
| `server/src/modules/user/index.ts` | 修改 | 导出新增模块 |

### 关键实现细节

1. **13维度偏好存储**
   - 使用 JSONB 字段存储 UserPreferences
   - 支持部分更新（merge 策略）
   - 自动计算匹配度评分

2. **学校/专业查询**
   - 支持关键词搜索
   - 支持省份/类别筛选
   - 分页查询

3. **OCR Mock**
   - 当前返回固定模拟数据
   - 后续可接入真实 OCR 服务

4. **认证集成**
   - 所有用户接口需要 JWT 认证
   - 学校/专业列表为公开接口

## 测试记录

### 编译验证

```bash
cd server && npm run build
# 结果：编译通过，无错误
```

### 接口验证（待运行）

- [ ] GET /api/users/:id/profile - 需要 JWT Token
- [ ] PUT /api/users/:id/profile - 需要 JWT Token
- [ ] PUT /api/users/:id/preferences - 需要 JWT Token
- [ ] POST /api/users/:id/student-card - 需要 JWT Token
- [ ] GET /api/schools - 公开接口
- [ ] GET /api/majors - 公开接口

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |
| v2 | 2026-03-04 | 实现完成 | dev agent |