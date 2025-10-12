# 记账小程序后端服务

基于 Express + TypeScript + MySQL + Sequelize 构建的记账小程序后端服务。

## 技术栈

- **Node.js** + **Express.js** - Web 框架
- **TypeScript** - 类型安全
- **MySQL** - 数据库
- **Sequelize** - ORM
- **JWT** - 用户认证
- **微信小程序登录** - 用户身份验证

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填写配置：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=accounting_miniapp
DB_USER=root
DB_PASSWORD=your_password

# JWT 配置
JWT_SECRET=your_jwt_secret_key

# 微信小程序配置
WX_APPID=your_wechat_appid
WX_SECRET=your_wechat_appsecret
```

### 3. 创建数据库

```sql
CREATE DATABASE accounting_miniapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

## API 文档

### 认证接口

#### POST /api/auth/wx-login
微信登录

**请求参数：**
```json
{
  "code": "微信登录凭证",
  "nickname": "微信昵称",
  "avatar": "微信头像URL"
}
```

**响应：**
```json
{
  "token": "JWT token",
  "userInfo": {
    "id": 1,
    "nickname": "用户昵称",
    "avatar": "头像URL"
  }
}
```

#### GET /api/auth/me
获取当前用户信息（需要认证）

### 房间接口

#### POST /api/rooms
创建房间（需要认证）

**请求参数：**
```json
{
  "name": "房间名称"
}
```

#### POST /api/rooms/join
加入房间（需要认证）

**请求参数：**
```json
{
  "invite_code": "邀请码"
}
```

#### GET /api/rooms
获取用户的房间列表（需要认证）

#### GET /api/rooms/:roomId
获取房间详情（需要认证）

#### PUT /api/rooms/:roomId/members/:memberId
更新成员昵称（需要认证）

**请求参数：**
```json
{
  "custom_nickname": "自定义昵称"
}
```

### 交易接口

#### POST /api/rooms/:roomId/transactions
创建交易记录（需要认证）

**请求参数：**
```json
{
  "payee_id": 收款人用户ID,
  "amount": 金额
}
```

#### GET /api/rooms/:roomId/transactions
获取房间交易记录（需要认证）

**查询参数：**
- `page`: 页码（默认 1）
- `limit`: 每页条数（默认 20）

#### GET /api/rooms/:roomId/balances
获取房间成员余额统计（需要认证）

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   │   └── database.ts  # 数据库配置
│   ├── models/          # 数据模型
│   │   ├── User.ts
│   │   ├── Room.ts
│   │   ├── RoomMember.ts
│   │   ├── Transaction.ts
│   │   └── index.ts
│   ├── controllers/     # 控制器
│   │   ├── authController.ts
│   │   ├── roomController.ts
│   │   └── transactionController.ts
│   ├── routes/          # 路由
│   │   ├── auth.ts
│   │   ├── rooms.ts
│   │   └── transactions.ts
│   ├── middleware/      # 中间件
│   │   └── auth.ts
│   ├── utils/           # 工具函数
│   │   ├── jwt.ts
│   │   ├── wechat.ts
│   │   └── inviteCode.ts
│   └── app.ts           # 应用入口
├── package.json
├── tsconfig.json
└── README.md
```

## 数据库表结构

### users (用户表)
- `id`: 用户ID
- `wx_openid`: 微信OpenID
- `wx_nickname`: 微信昵称
- `wx_avatar`: 微信头像
- `created_at`: 创建时间
- `updated_at`: 更新时间

### rooms (房间表)
- `id`: 房间ID
- `name`: 房间名称
- `creator_id`: 创建者ID
- `invite_code`: 邀请码
- `created_at`: 创建时间
- `updated_at`: 更新时间

### room_members (房间成员表)
- `id`: 成员记录ID
- `room_id`: 房间ID
- `user_id`: 用户ID
- `custom_nickname`: 自定义昵称
- `joined_at`: 加入时间

### transactions (交易记录表)
- `id`: 交易记录ID
- `room_id`: 房间ID
- `payer_id`: 付款人ID
- `payee_id`: 收款人ID
- `amount`: 金额
- `created_at`: 创建时间

## 开发说明

- 所有需要认证的接口都需要在请求头中携带 `Authorization: Bearer <token>`
- 数据库会在启动时自动同步表结构
- 开发环境下会打印 SQL 语句日志

