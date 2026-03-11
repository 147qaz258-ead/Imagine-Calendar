# 省-市两级联动选择器实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现中国省-市两级联动下拉选择器，替换当前硬编码的 6 个城市，支持全国所有省市选择。

**Architecture:**
1. 从 GitHub 下载 `pc.json` 省市联动数据，转换为前端可用格式
2. 后端新增 `/api/filter/locations` 接口返回省市结构化数据
3. 前端创建 `ProvinceCitySelector` 组件实现级联选择
4. 更新 `PreferencesForm` 使用新组件替代原有标签选择

**Tech Stack:** React, TypeScript, NestJS, Tailwind CSS

---

## 文件结构

```
web/src/
├── data/
│   └── provinces-cities.json        # 新增: 省市数据文件
├── modules/
│   ├── filter/
│   │   ├── components/
│   │   │   └── ProvinceCitySelector.tsx  # 新增: 级联选择组件
│   │   └── types/
│   │       └── index.ts             # 修改: 添加省市类型
│   └── profile/
│       └── components/
│           └── PreferencesForm.tsx  # 修改: 使用新组件

server/src/
├── modules/filter/
│   ├── filter.service.ts            # 修改: 返回省市结构化数据
│   └── filter.controller.ts         # 修改: 添加省市接口
└── data/
    └── provinces-cities.json        # 新增: 后端省市数据
```

---

## Chunk 1: 数据准备与后端接口

### Task 1: 下载并处理省市数据

**Files:**
- Create: `server/src/data/provinces-cities.json`
- Create: `web/src/data/provinces-cities.json`

- [ ] **Step 1: 下载省市数据**

```bash
# 下载 pc.json 文件
curl -L "https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/pc.json" -o D:/C_Projects/日历/server/src/data/provinces-cities.json
cp D:/C_Projects/日历/server/src/data/provinces-cities.json D:/C_Projects/日历/web/src/data/provinces-cities.json
```

Expected: 文件下载成功，包含省市联动数据

- [ ] **Step 2: 验证数据格式**

```bash
head -100 D:/C_Projects/日历/web/src/data/provinces-cities.json
```

Expected: 看到类似以下格式
```json
{
  "北京市": {
    "110100": "市辖区",
    ...
  },
  ...
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/C_Projects/日历
git add server/src/data/provinces-cities.json web/src/data/provinces-cities.json
git commit -m "feat: 添加中国省市联动数据

数据来源: https://github.com/modood/Administrative-divisions-of-China

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: 更新后端 Filter Service

**Files:**
- Modify: `server/src/modules/filter/filter.service.ts`
- Modify: `server/src/modules/filter/filter.controller.ts`

- [ ] **Step 1: 添加省市类型定义**

在 `server/src/modules/filter/filter.service.ts` 文件顶部添加:

```typescript
/**
 * 省份选项接口
 */
export interface ProvinceOption {
  code: string
  name: string
  cities: CityOption[]
}

/**
 * 城市选项接口
 */
export interface CityOption {
  code: string
  name: string
}
```

- [ ] **Step 2: 添加省市数据加载方法**

在 `FilterService` 类中添加:

```typescript
// 缓存省市数据
private provincesCache: ProvinceOption[] | null = null

/**
 * 获取省市联动数据
 */
getLocationsWithProvinces(): { success: boolean; data: ProvinceOption[] } {
  if (this.provincesCache) {
    return { success: true, data: this.provincesCache }
  }

  try {
    // 动态导入 JSON 数据
    const pcData = require('../../data/provinces-cities.json')

    const provinces: ProvinceOption[] = Object.entries(pcData).map(
      ([provinceName, cities]) => ({
        code: provinceName,
        name: provinceName,
        cities: Object.entries(cities as Record<string, string>).map(
          ([cityCode, cityName]) => ({
            code: cityCode,
            name: cityName,
          })
        ),
      })
    )

    this.provincesCache = provinces
    return { success: true, data: provinces }
  } catch (error) {
    console.error('加载省市数据失败:', error)
    return { success: false, data: [] }
  }
}
```

- [ ] **Step 3: 更新 FilterController**

在 `server/src/modules/filter/filter.controller.ts` 添加新接口:

```typescript
@Get('locations')
@ApiOperation({ summary: '获取省市联动数据' })
@ApiResponse({
  status: 200,
  description: '返回省市两级联动数据',
})
getLocationsWithProvinces() {
  return this.filterService.getLocationsWithProvinces()
}
```

- [ ] **Step 4: 验证后端编译**

```bash
cd D:/C_Projects/日历/server && npm run build
```

Expected: 编译成功，无错误

- [ ] **Step 5: Commit**

```bash
cd D:/C_Projects/日历
git add server/src/modules/filter/filter.service.ts server/src/modules/filter/filter.controller.ts
git commit -m "feat: 添加省市联动数据接口

- 新增 /api/filter/locations 接口
- 返回省-市两级联动结构化数据

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: 前端组件实现

### Task 3: 创建省市类型定义

**Files:**
- Modify: `web/src/modules/filter/types/index.ts`

- [ ] **Step 1: 添加省市类型**

在 `web/src/modules/filter/types/index.ts` 添加:

```typescript
/**
 * 省份选项
 */
export interface ProvinceOption {
  code: string
  name: string
  cities: CityOption[]
}

/**
 * 城市选项
 */
export interface CityOption {
  code: string
  name: string
}

/**
 * 省市选择值
 */
export interface ProvinceCityValue {
  province: string      // 省份名称
  city: string          // 城市名称
  cityCode?: string     // 城市代码（可选）
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/C_Projects/日历
git add web/src/modules/filter/types/index.ts
git commit -m "feat: 添加省市联动类型定义

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: 创建省市联动选择组件

**Files:**
- Create: `web/src/modules/filter/components/ProvinceCitySelector.tsx`

- [ ] **Step 1: 创建组件文件**

创建 `web/src/modules/filter/components/ProvinceCitySelector.tsx`:

```tsx
/**
 * 省市两级联动选择器
 */
import React, { useState, useEffect } from 'react'
import type { ProvinceOption, ProvinceCityValue } from '../types'

interface ProvinceCitySelectorProps {
  value: ProvinceCityValue[]
  onChange: (value: ProvinceCityValue[]) => void
  max?: number
  disabled?: boolean
}

export const ProvinceCitySelector: React.FC<ProvinceCitySelectorProps> = ({
  value,
  onChange,
  max = 5,
  disabled = false,
}) => {
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  // 加载省市数据
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await fetch(
          'https://career-calendar-server.onrender.com/api/filter/locations'
        )
        const result = await response.json()
        if (result.success) {
          setProvinces(result.data)
        }
      } catch (error) {
        console.error('加载省市数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProvinces()
  }, [])

  // 获取选中省份的城市列表
  const getCitiesForProvince = (provinceName: string): { code: string; name: string }[] => {
    const province = provinces.find((p) => p.name === provinceName)
    return province?.cities || []
  }

  // 添加城市
  const handleAdd = () => {
    if (!selectedProvince || !selectedCity) return
    if (value.length >= max) return
    if (value.some((v) => v.province === selectedProvince && v.city === selectedCity)) return

    const cityOption = getCitiesForProvince(selectedProvince).find((c) => c.name === selectedCity)

    onChange([
      ...value,
      {
        province: selectedProvince,
        city: selectedCity,
        cityCode: cityOption?.code,
      },
    ])

    setShowAddModal(false)
    setSelectedProvince('')
    setSelectedCity('')
  }

  // 移除城市
  const handleRemove = (province: string, city: string) => {
    onChange(value.filter((v) => !(v.province === province && v.city === city)))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        加载省市数据...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 已选择的城市标签 */}
      <div className="flex flex-wrap gap-2">
        {value.map((v, index) => (
          <span
            key={`${v.province}-${v.city}-${index}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
          >
            <span className="text-blue-500">{v.province}</span>
            <span>·</span>
            <span>{v.city}</span>
            {!disabled && (
              <button
                onClick={() => handleRemove(v.province, v.city)}
                className="ml-1 text-blue-400 hover:text-blue-600"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {/* 添加按钮 */}
      {!disabled && value.length < max && (
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-full hover:bg-blue-50"
        >
          + 添加城市
        </button>
      )}

      {/* 选择弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-medium mb-4">选择城市</h3>

            {/* 省份选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                省份
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value)
                  setSelectedCity('')
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择省份</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 城市选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                城市
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedProvince}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">请选择城市</option>
                {selectedProvince &&
                  getCitiesForProvince(selectedProvince).map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedProvince('')
                  setSelectedCity('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedProvince || !selectedCity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProvinceCitySelector
```

- [ ] **Step 2: 验证组件编译**

```bash
cd D:/C_Projects/日历/web && npm run build
```

Expected: 编译成功，无错误

- [ ] **Step 3: Commit**

```bash
cd D:/C_Projects/日历
git add web/src/modules/filter/components/ProvinceCitySelector.tsx
git commit -m "feat: 创建省市联动选择器组件

- 支持省-市两级级联选择
- 支持多选（最多5个城市）
- 显示已选择的城市标签
- 支持删除已选城市

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: 集成到偏好表单

### Task 5: 更新偏好表单使用新组件

**Files:**
- Modify: `web/src/modules/profile/components/PreferencesForm.tsx`
- Modify: `web/src/modules/profile/types/index.ts`

- [ ] **Step 1: 更新 UserPreferences 类型**

在 `web/src/modules/profile/types/index.ts` 中更新 locations 类型:

```typescript
import type { ProvinceCityValue } from '@/modules/filter/types'

export interface UserPreferences {
  // 修改: locations 从 string[] 改为 ProvinceCityValue[]
  locations: ProvinceCityValue[]
  // ... 其他字段保持不变
  selfPositioning: string[]
  developmentDirection: string[]
  industries: string[]
  platformTypes: string[]
  companyScales: string[]
  companyCulture: string[]
  leadershipStyle: string[]
  trainingPrograms: string[]
  overtimePreference: string[]
  holidayPolicy: string[]
  medicalBenefits: string[]
  maternityBenefits: string[]
}
```

- [ ] **Step 2: 更新 PreferencesForm 组件**

修改 `web/src/modules/profile/components/PreferencesForm.tsx`:

1. 导入新组件:
```tsx
import { ProvinceCitySelector } from '@/modules/filter/components/ProvinceCitySelector'
import type { ProvinceCityValue } from '@/modules/filter/types'
```

2. 修改维度配置（将地点偏好单独处理）:
```tsx
// 偏好维度配置（排除 locations，单独处理）
const PREFERENCE_DIMENSIONS = [
  // { key: 'locations', label: '地点偏好' }, // 移除，单独处理
  { key: 'selfPositioning', label: '自我定位' },
  // ... 其他维度
] as const
```

3. 在渲染部分添加地点偏好的特殊处理:
```tsx
return (
  <div className="bg-white rounded-lg shadow p-6">
    <p className="text-gray-600 mb-6">
      选择符合你期望的选项，系统会根据你的偏好推荐匹配的招聘事件。
    </p>

    {/* 地点偏好（特殊处理） */}
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-2">地点偏好</h3>
      <p className="text-xs text-gray-500 mb-2">
        选择你期望工作的城市（最多5个）
      </p>
      <ProvinceCitySelector
        value={preferences.locations || []}
        onChange={(locations: ProvinceCityValue[]) =>
          setPreferences((prev) => ({ ...prev, locations }))
        }
        max={5}
        disabled={updateLoading}
      />
    </div>

    {/* 其他维度列表 */}
    <div className="space-y-6">
      {PREFERENCE_DIMENSIONS.map((dimension) => (
        // ... 原有渲染逻辑
      ))}
    </div>

    {/* ... 其余代码保持不变 */}
  </div>
)
```

- [ ] **Step 3: 验证前端编译**

```bash
cd D:/C_Projects/日历/web && npm run build
```

Expected: 编译成功

- [ ] **Step 4: Commit**

```bash
cd D:/C_Projects/日历
git add web/src/modules/profile/components/PreferencesForm.tsx web/src/modules/profile/types/index.ts
git commit -m "feat: 更新偏好表单使用省市联动选择器

- locations 类型改为 ProvinceCityValue[]
- 地点偏好使用新的 ProvinceCitySelector 组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 4: 后端数据兼容性与测试

### Task 6: 更新后端 UserProfile 实体

**Files:**
- Modify: `server/src/modules/user/entities/user-profile.entity.ts`

- [ ] **Step 1: 更新 preferences 字段类型**

确保 `user-profile.entity.ts` 中的 preferences 字段可以存储新的数据格式:

```typescript
@Column({ type: 'jsonb', nullable: true })
preferences: UserPreferences
```

UserPreferences 接口应更新为支持新格式（在 DTO 中定义）。

- [ ] **Step 2: Commit**

```bash
cd D:/C_Projects/日历
git add server/src/modules/user/entities/user-profile.entity.ts
git commit -m "chore: 确保 preferences 支持新的省市数据格式

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: 端到端测试

**Files:**
- Create: `e2e-tests/tests/location-selector.spec.ts`

- [ ] **Step 1: 创建测试文件**

```typescript
import { test, expect } from '@playwright/test'

test.describe('省市联动选择器', () => {
  test.use({ storageState: '.auth/user.json' })

  test('可以打开省市选择弹窗', async ({ page }) => {
    await page.goto('/profile')

    // 点击添加城市按钮
    await page.click('button:has-text("+ 添加城市")')

    // 验证弹窗出现
    await expect(page.locator('text=选择城市')).toBeVisible()
  })

  test('省份选择后城市列表更新', async ({ page }) => {
    await page.goto('/profile')

    await page.click('button:has-text("+ 添加城市")')

    // 选择省份
    await page.selectOption('select:first-of-type', '北京市')

    // 验证城市下拉框有内容
    const citySelect = page.locator('select:last-of-type')
    await expect(citySelect).not.toBeDisabled()
  })

  test('可以添加和删除城市', async ({ page }) => {
    await page.goto('/profile')

    // 添加城市
    await page.click('button:has-text("+ 添加城市")')
    await page.selectOption('select:first-of-type', '北京市')
    await page.selectOption('select:last-of-type', '市辖区')
    await page.click('button:has-text("确认")')

    // 验证标签出现
    await expect(page.locator('text=北京市·市辖区')).toBeVisible()
  })
})
```

- [ ] **Step 2: 运行测试**

```bash
cd D:/C_Projects/日历/e2e-tests
npx playwright test tests/location-selector.spec.ts
```

Expected: 测试通过

- [ ] **Step 3: Commit**

```bash
cd D:/C_Projects/日历
git add e2e-tests/tests/location-selector.spec.ts
git commit -m "test: 添加省市联动选择器 E2E 测试

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 完成检查清单

- [ ] 后端省市数据已下载并放置在正确位置
- [ ] 后端 `/api/filter/locations` 接口已实现
- [ ] 前端 `ProvinceCitySelector` 组件已创建
- [ ] `PreferencesForm` 已更新使用新组件
- [ ] 类型定义已更新
- [ ] 编译通过
- [ ] E2E 测试通过
- [ ] 代码已提交

---

## 部署步骤

完成开发后:

```bash
cd D:/C_Projects/日历
./deploy.sh "feat: 实现省-市两级联动选择器

- 添加全国省市联动数据
- 后端新增省市数据接口
- 前端创建级联选择组件
- 更新偏好表单使用新组件

数据来源: https://github.com/modood/Administrative-divisions-of-China

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 注意事项

1. **数据来源**: 使用 `https://github.com/modood/Administrative-divisions-of-China` 的 `pc.json` 文件
2. **数据更新**: 该数据源已于 2024 年 10 月停止更新（国家统计局政策变更）
3. **性能考虑**: 省市数据较大，已添加缓存避免重复加载
4. **向后兼容**: 新的 `ProvinceCityValue` 类型与原有的 `string[]` 不兼容，需要数据迁移
5. **最大选择数**: 默认最多选择 5 个城市，可根据需求调整