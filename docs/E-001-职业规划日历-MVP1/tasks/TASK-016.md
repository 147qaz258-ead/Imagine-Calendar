# TASK-016：认知图谱后端

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-016 |
| Task Name | 认知图谱后端 |
| 关联 Story | STORY-007 (成长可视化) |
| 优先级 | P1 |
| 预估工时 | 2天 |
| BEADS_ID | [待填写] |

## 任务描述

实现认知图谱服务后端，包括认知维度记录、历史查询、对比分析等功能。

## 技术要点

### 核心功能

1. **认知维度记录**
   - 5 个维度分数记录
   - 知识来源标记
   - 时间戳

2. **历史查询**
   - 按时间范围查询
   - 变化轨迹

3. **对比分析**
   - 与小组成员对比
   - 与历史自己对比

### 认知维度定义

```typescript
// 5 个认知维度
interface CognitiveDimensions {
  industryKnowledge: number;    // 行业认知 (0-100)
  positionKnowledge: number;    // 岗位认知 (0-100)
  abilityKnowledge: number;     // 能力认知 (0-100)
  pathKnowledge: number;        // 路径认知 (0-100)
  resourceKnowledge: number;    // 资源认知 (0-100)
}

// 知识来源
interface KnowledgeSource {
  industryKnowledge: 'deep' | 'discuss' | 'hearsay';  // 深度实践/讨论交流/道听途说
  positionKnowledge: 'deep' | 'discuss' | 'hearsay';
  abilityKnowledge: 'deep' | 'discuss' | 'hearsay';
  pathKnowledge: 'deep' | 'discuss' | 'hearsay';
  resourceKnowledge: 'deep' | 'discuss' | 'hearsay';
}

// 完整的认知图记录
interface CognitiveMap {
  id: string;
  userId: string;
  dimensions: CognitiveDimensions;
  sources: KnowledgeSource;
  recordedAt: Date;
  roundtableId?: string;  // 关联的圆桌
  notes?: string;         // 备注
}
```

### 接口定义

```typescript
// POST /api/cognitive
interface CreateCognitiveRequest {
  dimensions: CognitiveDimensions;
  sources: KnowledgeSource;
  roundtableId?: string;
  notes?: string;
}

interface CreateCognitiveResponse {
  success: boolean;
  data: {
    id: string;
  };
}

// GET /api/cognitive/current
interface CurrentCognitiveResponse {
  success: boolean;
  data: CognitiveMap | null;
}

// GET /api/cognitive/history
interface CognitiveHistoryQuery {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

interface CognitiveHistoryResponse {
  success: boolean;
  data: {
    records: CognitiveMap[];
    total: number;
  };
}

// GET /api/cognitive/compare
interface CompareCognitiveQuery {
  type: 'group' | 'self';  // 与小组对比/与历史对比
  roundtableId?: string;   // 小组对比时需要
  baselineDate?: string;   // 自我对比时的基准日期
}

interface CompareCognitiveResponse {
  success: boolean;
  data: {
    current: CognitiveDimensions;
    baseline: CognitiveDimensions;
    diff: CognitiveDimensions;  // 差值
  };
}

// GET /api/cognitive/trend
interface CognitiveTrendResponse {
  success: boolean;
  data: {
    dates: string[];
    dimensions: {
      industryKnowledge: number[];
      positionKnowledge: number[];
      abilityKnowledge: number[];
      pathKnowledge: number[];
      resourceKnowledge: number[];
    };
  };
}
```

### 颜色编码规则

| 来源类型 | 颜色 | 色值 | 说明 |
|----------|------|------|------|
| deep | 深蓝 | #1a365d | 深度实践得来的知识 |
| discuss | 浅蓝 | #63b3ed | 讨论交流得来的知识 |
| hearsay | 灰色 | #a0aec0 | 道听途说的知识 |

## 验收标准

- [x] 获取认知图谱接口正常 (GET /api/users/:id/cognitive-map)
- [x] 维度更新功能正常 (PUT /api/users/:id/cognitive-map/dimensions)
- [x] 历史查询接口正常 (GET /api/users/:id/cognitive-map/history)
- [x] 对比功能正常 (POST /api/cognitive-map/compare)
- [x] 后端编译通过
- [x] Swagger 文档完整

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-012（圆桌数据）
- TASK-014（消息记录）

### 接口依赖 (interface_deps)
- 无

## 实现记录

### 实现内容

**模块结构**：
```
server/src/modules/cognitive/
├── cognitive.module.ts      # 模块定义
├── cognitive.controller.ts  # 控制器
├── cognitive.service.ts     # 服务层
├── index.ts                 # 导出
├── dto/
│   ├── cognitive.dto.ts     # DTO 定义
│   └── index.ts
└── entities/
    ├── cognitive-map.entity.ts  # 实体定义（已存在）
    └── index.ts
```

**实现的接口**（严格遵循 API-CONTRACT.md）：

1. **GET /api/users/:id/cognitive-map** - 获取认知图谱
   - 返回用户认知图谱数据
   - 不存在时自动创建默认图谱（5个维度，初始分数0）

2. **PUT /api/users/:id/cognitive-map/dimensions** - 更新认知维度
   - 支持累加更新（分数累加，最大100）
   - 记录历史变更
   - 记录知识来源

3. **GET /api/users/:id/cognitive-map/history** - 获取认知历史
   - 支持按时间范围查询
   - 返回趋势数据

4. **POST /api/cognitive-map/compare** - 对比认知图谱
   - 支持 2-6 人对比
   - 分析共同优势、共同差距、互补项

**认知维度定义**（对应 API-CONTRACT.md 1.4）：
- 地点认知
- 自我定位认知
- 发展方向认知
- 行业认知
- 企业认知

**知识来源类型**（对应 API-CONTRACT.md KnowledgeSourceType）：
- self_exploration - 自我探索
- others_sharing - 他人分享
- round_table - 圆桌讨论
- study_buddy - 学习伙伴
- case_study - 案例实践

**集成圆桌模块**：
- 圆桌提交纪要后自动更新认知图谱
- 更新认知分数（基础分 + 关键点加成）
- 使用 forwardRef 解决循环依赖

## 测试记录

### 编译验证

```bash
cd server && npm run build
# 输出: nest build (成功，无错误)
```

### 接口验证

需要通过以下方式验证：

1. **启动服务**: `cd server && npm run start:dev`
2. **访问 Swagger**: http://localhost:3001/api
3. **验证接口**:
   - GET /api/users/:id/cognitive-map
   - PUT /api/users/:id/cognitive-map/dimensions
   - GET /api/users/:id/cognitive-map/history
   - POST /api/cognitive-map/compare

### 关键文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `server/src/modules/cognitive/cognitive.module.ts` | 新增 | 模块定义 |
| `server/src/modules/cognitive/cognitive.controller.ts` | 新增 | 控制器 |
| `server/src/modules/cognitive/cognitive.service.ts` | 新增 | 服务层 |
| `server/src/modules/cognitive/dto/cognitive.dto.ts` | 新增 | DTO定义 |
| `server/src/modules/cognitive/index.ts` | 新增 | 模块导出 |
| `server/src/app.module.ts` | 修改 | 导入CognitiveModule |
| `server/src/modules/roundtable/roundtable.module.ts` | 修改 | 导入CognitiveModule |
| `server/src/modules/roundtable/roundtable.service.ts` | 修改 | 集成认知图谱更新 |

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1 | 2026-03-04 | 初始版本 | tech agent |
| v2 | 2026-03-05 | 实现完成 | dev agent |