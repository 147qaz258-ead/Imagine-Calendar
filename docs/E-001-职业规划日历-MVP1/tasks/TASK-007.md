# TASK-007：OCR 服务集成

## 基本信息

| 项目 | 内容 |
|------|------|
| Task ID | TASK-007 |
| Task Name | OCR 服务集成 |
| 关联 Story | STORY-002 (用户画像建立) |
| 优先级 | P0 |
| 预估工时 | 1天 |
| BEADS_ID | [待填写] |

## 任务描述

集成 OCR 服务实现学生证识别，自动填充学校、姓名、学号等信息。

## 技术要点

### OCR 服务选择

**推荐**：阿里云 OCR（或百度 OCR）

- 支持身份证、学生证识别
- 准确率 >= 95%
- 价格合理

### 核心功能

1. **图片上传**
   - 调用摄像头拍照
   - 图片压缩（<= 1MB）
   - 上传到 OSS

2. **OCR 识别**
   - 调用 OCR API
   - 解析返回结果
   - 提取关键字段

3. **字段映射**
   - school_name → 学校名称
   - name → 姓名
   - student_id → 学号
   - college → 学院（可选）

4. **学校匹配**
   - OCR 结果与学校库匹配
   - 模糊匹配（相似度 >= 80%）
   - 不匹配时提示手动选择

### 接口定义

```typescript
// POST /api/ocr/student-card
interface OCRRequest {
  // multipart/form-data
  image: File;
}

interface OCRResponse {
  success: boolean;
  data?: {
    schoolName: string;
    name: string;
    studentId: string;
    college?: string;
    confidence: number;  // 0-1
  };
  error?: {
    code: string;
    message: string;
  };
}

// 错误码
// - IMAGE_TOO_LARGE: 图片过大
// - IMAGE_UNCLEAR: 图片不清晰
// - OCR_SERVICE_ERROR: OCR 服务异常
// - NO_TEXT_DETECTED: 未检测到文字
```

### 前端组件

```typescript
// OCR 拍照组件
interface OCRCameraProps {
  onResult: (result: OCRResult) => void;
  onError: (error: string) => void;
}

// OCR 结果确认组件
interface OCRResultConfirmProps {
  result: OCRResult;
  onConfirm: () => void;
  onRetry: () => void;
  onManual: () => void;
}
```

## 验收标准

- [ ] 摄像头调用正常
- [ ] 图片压缩正常
- [ ] OCR 识别准确率 >= 85%
- [ ] 学校名称匹配正确
- [ ] 识别失败时降级到手动输入
- [ ] 识别结果可确认/重试
- [ ] 移动端相机适配

## 接口契约

> **唯一可信源**: `docs/E-001-职业规划日历-MVP1/tech/API-CONTRACT.md`
>
> - 所有接口定义必须遵循 API-CONTRACT.md
> - 禁止添加任何中间层
> - 禁止出现违反接口的代码


## 依赖关系

### 硬依赖 (deps)
- TASK-005（用户画像 API）

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