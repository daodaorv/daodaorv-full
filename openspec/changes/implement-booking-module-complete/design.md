# 房车预订模块技术设计

## Context

房车预订模块是小程序首页的核心功能,需要提供流畅的用户体验和可靠的数据验证。当前仅有 UI 展示,缺少完整的交互逻辑和后端对接。

### 技术栈

- **前端框架**: uni-app + Vue 3 Composition API
- **状态管理**: Pinia
- **UI 组件**: 自定义组件 + uni-app 内置组件
- **类型系统**: TypeScript
- **设计系统**: 橙色主题 (#FF9F29),卡片式布局

### 约束条件

1. 必须兼容微信小程序环境
2. 必须保持现有 UI 设计风格
3. 必须支持离线缓存和快速加载
4. 必须符合业务规则(详见需求文档 5.1.3 节)

## Goals / Non-Goals

### Goals

- ✅ 实现完整的城市、门店、时间选择功能
- ✅ 实现所有业务规则验证
- ✅ 提供流畅的用户体验
- ✅ 支持智能默认值和记忆功能
- ✅ 与后端 API 完整对接

### Non-Goals

- ❌ 不实现房车列表页(已有独立需求)
- ❌ 不实现支付功能(已有独立模块)
- ❌ 不实现用户登录(已有独立模块)
- ❌ 不实现地图选点功能(V2 版本考虑)

## Decisions

### 1. 组件架构设计

**决策**: 采用"容器组件 + 展示组件"模式

**理由**:
- BookingModule 作为容器组件,负责状态管理和业务逻辑
- CityPicker、StorePicker、DateTimePicker 作为展示组件,负责 UI 交互
- 职责分离,便于测试和复用

**架构图**:
```
BookingModule (容器组件)
├── 状态管理 (Pinia Store)
├── 业务逻辑 (验证、计算)
└── 子组件
    ├── CityPicker (城市选择器)
    ├── StorePicker (门店选择器)
    └── DateTimePicker (时间选择器)
```

### 2. 状态管理方案

**决策**: 使用 Pinia Store + 组件本地状态

**理由**:
- Pinia Store 管理全局共享状态(城市列表、门店列表)
- 组件本地状态管理临时选择(未确认的选择)
- 避免状态污染,提高性能

**状态结构**:
```typescript
// Pinia Store
interface BookingState {
  cities: City[];              // 城市列表
  stores: Record<string, Store[]>;  // 门店列表(按城市ID索引)
  lastSelection: BookingParams | null;  // 上次选择
  loading: boolean;
}

// 组件本地状态
interface LocalState {
  selectedCity: string;
  selectedStore: string;
  pickupTime: string;
  returnTime: string;
  differentReturn: boolean;
  returnCity: string;
  returnStore: string;
}
```

### 3. 数据验证策略

**决策**: 分层验证 - 实时验证 + 提交验证

**理由**:
- 实时验证:用户输入时立即反馈(如时间选择)
- 提交验证:点击查询按钮时完整验证
- 提供最佳用户体验,避免无效提交

**验证层次**:
```typescript
// 1. 字段级验证(实时)
const validatePickupTime = (time: string) => {
  const minTime = addHours(new Date(), 4);
  const maxTime = addMonths(new Date(), 6);
  // ...
};

// 2. 表单级验证(提交时)
const validateBookingForm = (params: BookingParams) => {
  // 验证所有必填字段
  // 验证时间逻辑
  // 验证租期长度
  // ...
};
```

### 4. 时间处理方案

**决策**: 使用 dayjs 库处理时间

**理由**:
- dayjs 轻量级(2KB),适合小程序
- API 简洁,易于使用
- 支持时区和格式化

**时间计算示例**:
```typescript
import dayjs from 'dayjs';

// 默认取车时间:当前时间+4小时,取整点
const getDefaultPickupTime = () => {
  const now = dayjs();
  const pickup = now.add(4, 'hour');
  return pickup.startOf('hour');  // 取整点
};

// 默认还车时间:取车时间+2天,时间点同步
const getDefaultReturnTime = (pickupTime: string) => {
  return dayjs(pickupTime).add(2, 'day');
};

// 计算租期天数
const calculateRentalDays = (pickup: string, returnTime: string) => {
  const diff = dayjs(returnTime).diff(dayjs(pickup), 'hour');
  return Math.ceil(diff / 24);
};
```

### 5. API 设计

**决策**: RESTful API + 请求缓存

**API 接口**:
```typescript
// 获取城市列表
GET /api/cities
Response: {
  code: 0,
  data: {
    cities: [
      { id: '1', name: '深圳', hot: true },
      { id: '2', name: '上海', hot: true },
      // ...
    ]
  }
}

// 获取门店列表
GET /api/stores?cityId=1
Response: {
  code: 0,
  data: {
    stores: [
      {
        id: '1',
        name: '深圳湾门店',
        address: '深圳市南山区...',
        businessHours: '09:00-21:00',
        isDefault: true
      },
      // ...
    ]
  }
}

// 查询可用房车
POST /api/vehicles/search
Request: {
  pickupCityId: '1',
  pickupStoreId: '1',
  returnCityId: '1',
  returnStoreId: '1',
  pickupTime: '2024-01-15 10:00',
  returnTime: '2024-01-17 10:00'
}
Response: {
  code: 0,
  data: {
    vehicles: [...],
    total: 25
  }
}
```

**缓存策略**:
- 城市列表:缓存 1 小时
- 门店列表:缓存 1 小时
- 查询结果:不缓存(实时数据)

### 6. 选择器组件设计

**决策**: 使用 uni-app 的 `<picker>` 组件 + 自定义弹窗

**理由**:
- `<picker>` 组件在微信小程序中体验最好
- 自定义弹窗提供更灵活的 UI 控制
- 结合使用,兼顾原生体验和定制需求

**组件接口**:
```typescript
// CityPicker.vue
interface CityPickerProps {
  modelValue: string;  // 选中的城市ID
  cities: City[];      // 城市列表
  showSearch?: boolean;  // 是否显示搜索
}

interface CityPickerEmits {
  'update:modelValue': [cityId: string];
  'confirm': [city: City];
}

// StorePicker.vue
interface StorePickerProps {
  modelValue: string;
  stores: Store[];
  cityId: string;
}

// DateTimePicker.vue
interface DateTimePickerProps {
  modelValue: string;
  mode: 'pickup' | 'return';
  minTime?: string;
  maxTime?: string;
  pickupTime?: string;  // 用于还车时间同步
}
```

## Risks / Trade-offs

### 风险 1: 后端 API 延迟

**风险**: 后端 API 开发进度可能滞后

**缓解措施**:
- 使用 Mock 数据先完成前端开发
- 定义清晰的 API 接口契约
- 使用 TypeScript 类型确保接口一致性

### 风险 2: 时间验证复杂度

**风险**: 时间验证规则复杂,容易出错

**缓解措施**:
- 编写完整的单元测试
- 使用 dayjs 库简化时间计算
- 提供清晰的错误提示

### 风险 3: 用户体验一致性

**风险**: 不同机型和系统的选择器体验可能不一致

**缓解措施**:
- 在多种设备上测试
- 使用 uni-app 的跨平台组件
- 提供降级方案

### Trade-off: 性能 vs 功能

**选择**: 优先保证功能完整性,再优化性能

**理由**:
- 预订模块是核心功能,必须保证可用性
- 性能问题可以后续优化(如虚拟列表、懒加载)
- 当前数据量不大(城市<100,门店<500),性能影响有限

## Migration Plan

### 阶段 1: 组件开发(不影响现有功能)

1. 创建新的选择器组件
2. 在开发环境测试
3. 不影响生产环境

### 阶段 2: 集成到 BookingModule

1. 逐步替换现有的占位逻辑
2. 保持 UI 一致性
3. 添加功能开关,支持灰度发布

### 阶段 3: API 对接

1. 先使用 Mock 数据
2. 后端 API 就绪后切换
3. 监控错误率和性能

### 阶段 4: 全量上线

1. 完成所有测试
2. 移除功能开关
3. 监控用户反馈

### 回滚方案

- 保留旧版本代码(使用 Git 分支)
- 功能开关支持快速回滚
- 准备降级方案(禁用部分功能)

## Open Questions

1. **Q**: 是否需要支持多语言?
   **A**: 暂不支持,V2 版本考虑

2. **Q**: 是否需要支持语音输入?
   **A**: 暂不支持,V2 版本考虑

3. **Q**: 异地还车费用如何计算和展示?
   **A**: 在订单确认页展示,预订模块仅提示"需支付异地还车费"

4. **Q**: 是否需要支持收藏常用地点?
   **A**: V2 版本考虑,当前仅记住上次选择

5. **Q**: 时间选择器是否需要支持快捷选项(如"明天"、"后天")?
   **A**: 可以考虑,作为优化项

## Implementation Notes

### 关键代码位置

- 主组件: `miniprogram/pages/index/components/BookingModule.vue`
- 选择器: `miniprogram/components/common/`
- API: `miniprogram/api/modules/booking.ts`
- 类型: `miniprogram/types/booking.d.ts`
- Store: `miniprogram/store/modules/booking.ts`

### 开发顺序

1. 类型定义 → API 接口 → Store
2. 选择器组件(独立开发和测试)
3. 集成到 BookingModule
4. 数据验证和错误处理
5. 测试和优化

### 测试策略

- **单元测试**: 验证函数、时间计算
- **组件测试**: 选择器组件交互
- **集成测试**: 完整预订流程
- **E2E 测试**: 真机测试

### 性能优化

- 城市/门店列表使用虚拟滚动(数据量大时)
- 防抖处理搜索输入
- 缓存 API 请求结果
- 懒加载选择器组件

