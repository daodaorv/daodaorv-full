# 路由工具使用示例

## ⚠️ 重要说明

### 业务逻辑

- **当前业务**: 用户只需登录后在订单页填写资料即可下单
- **线下核验**: 实际核验在门店取车/营地入住时进行(核验证件原件)
- **关键原则**: 线上提交资料 ≠ 线上认证,门店核验 ≠ 系统认证

### 权限体系

- **白名单页面**: 无需认证(首页、社区、登录页等)
- **登录页面**: 需要登录(订单、支付、钱包、我的等)
- **实名认证**: 仅用于金融操作(如提现),保留用于未来扩展
- **驾照认证**: 保留用于未来扩展

---

## 1. 基本使用

### 1.1 在 Vue 组件中使用

```vue
<template>
  <view>
    <button @click="goToVehicleDetail">查看车辆详情</button>
    <button @click="goToOrderConfirm">确认订单</button>
    <button @click="goToProfile">我的</button>
  </view>
</template>

<script setup lang="ts">
import router from "@/utils/router";

// 跳转到车辆详情页(保留当前页面)
function goToVehicleDetail() {
  router.navigateTo({
    url: "/pages/vehicle/detail?id=123",
  });
}

// 跳转到订单确认页(只需登录,用户在页面内填写资料)
function goToOrderConfirm() {
  router.navigateTo({
    url: "/pages/order/confirm?vehicleId=123",
  });
}

// 切换到"我的"TabBar 页面
function goToProfile() {
  router.switchTab({
    url: "/pages/mine/index",
  });
}
</script>
```

### 1.2 使用全局 $router

```vue
<template>
  <view>
    <button @click="handleClick">跳转</button>
  </view>
</template>

<script setup lang="ts">
import { getCurrentInstance } from "vue";

const instance = getCurrentInstance();
const $router = instance?.proxy?.$router;

function handleClick() {
  $router?.navigateTo({
    url: "/pages/vehicle/detail?id=123",
  });
}
</script>
```

## 2. 路由拦截示例

### 2.1 未登录用户访问需要登录的页面

```typescript
// 用户点击"我的"页面
router.navigateTo({
  url: "/pages/mine/index",
});

// 如果用户未登录:
// 1. 显示提示: "请先登录"
// 2. 保存原始目标路径: /pages/mine/index
// 3. 跳转到登录页: /pages/login/index
```

### 2.2 登录后访问订单页面

```typescript
// 用户点击"房车租赁订单确认"
router.navigateTo({
  url: "/pages/rv-rental/order-confirm?vehicleId=123",
});

// 当前业务逻辑:
// 1. 如果用户未登录: 显示"请先登录",跳转到登录页
// 2. 如果用户已登录: 直接进入订单确认页
// 3. 用户在订单确认页填写驾照资料(姓名、电话、驾照照片、驾照号码)
// 4. 提交订单后,门店在取车时核验驾照原件
```

### 2.3 访问提现页面(需要实名认证)

```typescript
// 用户点击"提现"
router.navigateTo({
  url: "/pages/wallet/withdraw",
});

// 金融操作需要实名认证:
// 1. 如果用户未登录: 显示"请先登录",跳转到登录页
// 2. 如果用户已登录但未实名认证: 显示"请先完成实名认证",跳转到实名认证页
// 3. 如果用户已实名认证: 直接进入提现页面
```

## 3. 登录后返回原页面

### 3.1 在登录页获取重定向路径

```vue
<script setup lang="ts">
import { useUserStore } from "@/store/modules/user";
import router from "@/utils/router";

const userStore = useUserStore();

async function handleLogin() {
  // 执行登录
  const success = await userStore.login({
    phone: "13800138000",
    password: "123456",
  });

  if (success) {
    // 获取重定向路径
    const redirectPath = router.getRedirectPath();

    if (redirectPath) {
      // 清除重定向路径
      router.clearRedirectPath();

      // 跳转回原页面
      router.reLaunch({
        url: redirectPath,
        checkAuth: false, // 跳过权限检查,因为已经登录
      });
    } else {
      // 没有重定向路径,跳转到首页
      router.switchTab({
        url: "/pages/index/index",
      });
    }
  }
}
</script>
```

### 3.2 在实名认证页完成后返回

```vue
<script setup lang="ts">
import { useUserStore } from "@/store/modules/user";
import router from "@/utils/router";

const userStore = useUserStore();

async function handleSubmit() {
  // 提交实名认证
  const success = await submitRealNameAuth();

  if (success) {
    // 刷新用户信息
    await userStore.fetchUserInfo();

    // 获取重定向路径
    const redirectPath = router.getRedirectPath();

    if (redirectPath) {
      // 清除重定向路径
      router.clearRedirectPath();

      // 跳转回原页面
      router.reLaunch({
        url: redirectPath,
        checkAuth: false, // 跳过权限检查,因为已经实名认证
      });
    } else {
      // 没有重定向路径,返回上一页
      router.navigateBack();
    }
  }
}
</script>
```

## 4. 路由方法说明

### 4.1 navigateTo

保留当前页面,跳转到应用内的某个页面。

```typescript
router.navigateTo({
  url: "/pages/vehicle/detail?id=123",
  checkAuth: true, // 是否进行权限检查,默认 true
  success: () => {
    console.log("跳转成功");
  },
  fail: (err) => {
    console.error("跳转失败", err);
  },
});
```

### 4.2 redirectTo

关闭当前页面,跳转到应用内的某个页面。

```typescript
router.redirectTo({
  url: "/pages/login/index",
  checkAuth: false, // 登录页不需要权限检查
});
```

### 4.3 switchTab

跳转到 tabBar 页面,并关闭其他所有非 tabBar 页面。

```typescript
router.switchTab({
  url: "/pages/index/index",
});
```

### 4.4 reLaunch

关闭所有页面,打开到应用内的某个页面。

```typescript
router.reLaunch({
  url: "/pages/index/index",
  checkAuth: false,
});
```

### 4.5 navigateBack

关闭当前页面,返回上一页面或多级页面。

```typescript
// 返回上一页
router.navigateBack();

// 返回上两页
router.navigateBack({ delta: 2 });
```

## 5. 页面权限配置

在 `miniprogram/config/page-auth.ts` 中配置页面权限:

```typescript
import { PageAuthType } from '@/config/page-auth'

// 添加新的页面权限配置
{
  path: '/pages/my-page/index',
  authType: PageAuthType.REAL_NAME_REQUIRED,
  redirectPath: '/pages/auth/real-name'
}
```

权限类型:

- `PageAuthType.WHITELIST` - 白名单页面(无需任何认证)
- `PageAuthType.LOGIN_REQUIRED` - 需要登录
- `PageAuthType.REAL_NAME_REQUIRED` - 需要实名认证
- `PageAuthType.DRIVER_LICENSE_REQUIRED` - 需要驾照认证

## 6. 注意事项

1. **TabBar 页面不需要权限检查**: 使用 `switchTab` 跳转 TabBar 页面时,不会进行权限检查。

2. **跳过权限检查**: 在某些场景下(如登录后跳转),可以设置 `checkAuth: false` 跳过权限检查。

3. **重定向路径**: 登录、实名认证、驾照认证完成后,记得清除重定向路径 `router.clearRedirectPath()`。

4. **用户状态刷新**: 完成认证后,记得调用 `userStore.fetchUserInfo()` 刷新用户信息。

5. **多端兼容**: 路由工具已封装 uni-app 的路由 API,支持微信小程序、H5、支付宝小程序等多个平台。
