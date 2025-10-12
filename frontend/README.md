# 记账小程序前端

基于 uni-app + Vue 3 + TypeScript 构建的微信记账小程序前端。

## 技术栈

- **uni-app** (3.0.0-4030620241128001) - 跨平台框架
- **Vue 3** (^3.4.21) - 渐进式框架
- **TypeScript** (^4.9.4) - 类型安全
- **Pinia** (^2.1.7) - 状态管理
- **Vite** (5.2.8) - 构建工具

## 快速开始

### 1. 安装依赖

```bash
# 在项目根目录使用 workspace
npm install

# 或在 frontend 目录
cd frontend
npm install
```

### 2. 配置后端地址

修改 `src/utils/request.ts` 中的 `BASE_URL`：

```typescript
const BASE_URL = 'http://localhost:3000/api';  // 开发环境
// const BASE_URL = 'https://your-domain.com/api';  // 生产环境
```

### 3. 配置微信小程序 AppID

修改 `src/manifest.json` 中的 `mp-weixin.appid`（可选，开发阶段使用测试号）

### 4. 运行开发模式

```bash
# 从项目根目录
npm run dev:frontend

# 或从 frontend 目录
npm run dev:mp-weixin
```

### 5. 使用微信开发者工具

打开微信开发者工具，导入项目：
- 目录：`frontend/dist/dev/mp-weixin`
- AppID：选择"测试号"或你的小程序 AppID

## 项目结构

```
frontend/src/
├── api/              # API 接口
│   ├── auth.ts       # 认证相关
│   ├── room.ts       # 房间相关
│   └── transaction.ts # 交易相关
├── components/       # 组件
│   ├── MemberCard.vue
│   └── TransactionItem.vue
├── pages/            # 页面
│   ├── login/        # 登录页
│   ├── rooms/        # 房间列表页
│   ├── room-detail/  # 房间详情页
│   └── transaction/  # 转账页
├── stores/           # 状态管理
│   ├── user.ts       # 用户状态
│   └── room.ts       # 房间状态
├── utils/            # 工具函数
│   ├── request.ts    # HTTP 请求
│   └── format.ts     # 格式化工具
├── App.vue           # 应用入口
├── main.ts           # 主文件
├── manifest.json     # 应用配置
└── pages.json        # 页面配置
```

## 主要功能

- ✅ 微信登录
- ✅ 创建/加入房间
- ✅ 查看房间列表
- ✅ 查看房间成员和余额
- ✅ 创建转账记录
- ✅ 查看交易记录
- ✅ 分享房间邀请码

## 页面说明

### 登录页 (`pages/login/index.vue`)
- 微信授权登录按钮
- 获取用户信息并保存

### 房间列表页 (`pages/rooms/index.vue`)
- 显示用户加入的所有房间
- 创建房间弹窗
- 加入房间弹窗（输入邀请码）
- 下拉刷新

### 房间详情页 (`pages/room-detail/index.vue`)
- 房间信息和邀请码
- 成员网格展示（头像、昵称、余额）
- 交易记录列表
- 浮动按钮快速转账
- 分享邀请码

### 转账页 (`pages/transaction/index.vue`)
- 显示收款人
- 输入转账金额
- 快捷金额按钮
- 提交转账

## 开发说明

### 状态管理

**User Store:**
- token: JWT token
- userInfo: 用户信息
- isLoggedIn: 是否已登录

**Room Store:**
- currentRoom: 当前房间
- members: 房间成员
- transactions: 交易记录

### 工具函数

**请求工具 (utils/request.ts):**
- request(): 通用请求
- get/post/put/del(): 快捷方法
- 自动携带 token
- 统一错误处理

**格式化工具 (utils/format.ts):**
- formatAmount(): 金额格式化
- formatBalance(): 余额格式化（+/-）
- formatDate(): 日期格式化
- getBalanceClass(): 余额样式类

## 开发调试

### 使用微信开发者工具

1. 打开编译后的目录
2. 在控制台查看日志
3. 使用调试器断点调试
4. 查看网络请求

### 常见问题

**Q: 登录失败？**
- 检查后端是否启动
- 检查 API 地址配置
- 开发阶段后端需配置开发模式

**Q: 页面白屏？**
- 查看控制台错误
- 检查路由配置
- 检查组件导入

**Q: 请求失败？**
- 关闭微信开发者工具的域名校验
- 检查后端服务状态
- 查看网络请求日志

## 构建生产版本

```bash
npm run build:mp-weixin
```

构建产物在 `dist/build/mp-weixin` 目录，使用微信开发者工具上传发布。

## 注意事项

1. 开发时关闭微信开发者工具的域名校验
2. 生产环境需配置合法域名
3. 确保后端服务正常运行
4. Token 过期会自动跳转登录页


