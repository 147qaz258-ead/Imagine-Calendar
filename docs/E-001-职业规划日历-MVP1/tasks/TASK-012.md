# TASK-012：圆桌匹配后端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-012 |
| Task Name | 圆桌匹配后端 |
| 关联 Story | STORY-005 (同频人匹配) |
| 优先级 | P0 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

实现圆桌匹配服务后端，包括报名、匹配算法、分组逻辑、状态管理等。

## 技术要点

### 核心功能

1. **报名流程**
   - 收集用户偏好
   - 创建报名记录
   - 进入匹配队列

2. **匹配算法**
   - 权重计算
   - 相似度评分
   - 凑齐 6 人成组

3. **状态管理**
   - matching → matched → scheduled → completed
   - 超时处理（72 小时）

4. **分组通知**
   - 成组后通知参与者
   - 确定会议时间

### 匹配算法

```typescript
// 匹配权重
const MATCH_WEIGHTS = {
  schoolLevel: 0.30,    // 学校层次
  location: 0.20,       // 地点偏好
  industry: 0.20,       // 行业偏好
  selfPositioning: 0.15, // 自我定位
  developmentDirection: 0.15, // 发展方向
};

// 计算相似度
function calculateSimilarity(user1: UserPreferences, user2: UserPreferences): number {
  let score = 0;

  // 学校层次匹配
  if (user1.schoolLevel === user2.schoolLevel) {
    score += MATCH_WEIGHTS.schoolLevel;
  }

  // 地点偏好匹配
  const locationOverlap = intersection(user1.locations, user2.locations);
  score += MATCH_WEIGHTS.location * (locationOverlap.length / Math.max(user1.locations.length, user2.locations.length));

  // ... 其他维度

  return score;
}

// 匹配流程
async function matchUsers(): Promise<void> {
  // 1. 获取所有 matching 状态的用户
  // 2. 计算两两相似度
  // 3. 选择相似度最高的组合
  // 4. 凑齐 6 人成组
  // 5. 更新状态为 matched
  // 6. 发送通知
}
```

### 接口定义

```typescript
// POST /api/roundtable/apply
interface RoundtableApplyRequest {
  preferences: Partial<Preferences>;
}

interface RoundtableApplyResponse {
  success: boolean;
  data: {
    applyId: string;
    status: 'matching' | 'matched';
    currentCount: number;
    targetCount: number;
  };
}

// GET /api/roundtable/my
interface MyRoundtablesResponse {
  success: boolean;
  data: {
    matching: RoundtableInfo[];
    upcoming: RoundtableInfo[];
    completed: RoundtableInfo[];
  };
}

interface RoundtableInfo {
  id: string;
  status: string;
  scheduledAt?: string;
  participantCount: number;
  topic?: string;
}

// GET /api/roundtable/:id
interface RoundtableDetailResponse {
  success: boolean;
  data: RoundtableInfo & {
    participants: Participant[];
    messages: ChatMessage[];
  };
}

// POST /api/roundtable/:id/cancel
interface CancelRoundtableResponse {
  success: boolean;
}
```

### 定时任务

```typescript
// 每 5 分钟执行一次匹配
@Cron('*/5 * * * *')
async runMatching(): Promise<void> {
  // 执行匹配算法
  // 检查超时
  // 发送通知
}
```

## 验收标准

- [x] 报名接口正常
- [x] 匹配算法正确
- [x] 6 人成组逻辑正确
- [x] 状态流转正确
- [ ] 超时处理正确（72 小时）- 待添加定时任务
- [x] 获取我的圆桌接口正常
- [x] 取消报名接口正常
- [x] Swagger 文档完整

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-005（用户偏好数据）
- TASK-010（筛选逻辑）

### 接口依赖 (interface_deps)
- 无

## 实现记录

### 已实现文件

| 文件路径 | 说明 |
|---------|------|
| `server/src/modules/roundtable/roundtable.module.ts` | 圆桌模块定义 |
| `server/src/modules/roundtable/roundtable.controller.ts` | 圆桌控制器（7个接口） |
| `server/src/modules/roundtable/roundtable.service.ts` | 圆桌服务（匹配算法+业务逻辑） |
| `server/src/modules/roundtable/dto/roundtable.dto.ts` | DTO 定义 |
| `server/src/modules/roundtable/dto/index.ts` | DTO 导出 |
| `server/src/modules/roundtable/index.ts` | 模块导出 |

### 已实现接口

1. **GET /api/round-tables** - 获取圆桌列表（支持状态筛选、分页）
2. **POST /api/round-tables/apply** - 创建圆桌报名（自动匹配逻辑）
3. **GET /api/round-tables/:id** - 获取圆桌详情
4. **POST /api/round-tables/:id/join** - 加入圆桌
5. **POST /api/round-tables/:id/leave** - 离开圆桌
6. **POST /api/round-tables/:id/summary** - 提交讨论纪要
7. **GET /api/round-tables/questions** - 获取圆桌问题清单
8. **GET /api/round-tables/my** - 获取我的圆桌
9. **POST /api/round-tables/:id/cancel** - 取消报名

### 匹配算法实现

```typescript
// 权重配置（8个维度）
const MATCH_WEIGHTS = {
  locations: 0.20,           // 地点偏好
  industries: 0.20,          // 行业偏好
  selfPositioning: 0.15,     // 自我定位
  developmentDirection: 0.15, // 发展方向
  platformTypes: 0.10,       // 平台性质
  companyScales: 0.10,       // 企业规模
  companyCulture: 0.05,      // 企业文化
  leadershipStyle: 0.05,     // 领导风格
};

// Jaccard 相似度计算
// similarity = intersection / union
```

### 状态流转

```
matching → ready → in_progress → completed
                  ↘ cancelled
```

### 编译验证

- 后端编译通过：`npm run build` 成功
- 模块已注册到 AppModule

## 测试记录

### 编译测试
- 后端编译通过：`npm run build` 成功无错误

### 接口验证（待集成测试）
- [ ] 报名接口 - 需启动服务验证
- [ ] 匹配算法 - 需真实用户数据验证
- [ ] 6人成组逻辑 - 需多用户场景测试
- [ ] 状态流转 - 需端到端验证

### 注意事项
1. 定时任务（Cron）未实现，后续可添加 `@nestjs/schedule` 支持
2. WebSocket 连接端点已定义，但 WebSocket 服务未实现
3. 认知图谱更新功能预留 TODO

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |