# 记账小程序

一个基于微信小程序的多人房间记账应用，支持创建房间、邀请成员、记录转账，实时显示每个成员的余额。

## ✅ 项目状态：100% 完成

**最新版本：** v1.0.0  
**完成时间：** 2025年10月  
**使用技术：** uni-app 3.0 + Vue 3 + Express + MySQL + npm workspace

## 项目概述

这是一个纯记录型的记账小程序，不涉及真实金额交易，主要用于朋友聚会、旅行等场景下的 AA 制记账。

**✨ 特点：**
- 🎯 使用官方最新 uni-app 模板
- 📦 npm workspace monorepo 管理
- 💎 TypeScript 全栈开发
- 🎨 美观简洁的 UI 设计
- 📚 完整的项目文档

## 核心功能

- ✅ 微信登录认证
- ✅ 创建和管理房间
- ✅ 邀请码加入房间
- ✅ 记录转账（文字显示）
- ✅ 实时显示成员余额
- ✅ 查看交易记录
- ✅ 分享房间邀请码

## 技术栈

### 前端
- **uni-app** - 跨平台框架
- **Vue 3** + **TypeScript** - 核心框架
- **Pinia** - 状态管理
- **Vite** - 构建工具

### 后端
- **Express.js** + **TypeScript** - Web 框架
- **MySQL 8.0** - 数据库
- **Sequelize** - ORM
- **JWT** - 身份认证

## 项目结构

```
记账小程序/
├── backend/           # 后端服务
│   ├── src/
│   │   ├── config/    # 配置
│   │   ├── models/    # 数据模型
│   │   ├── controllers/ # 控制器
│   │   ├── routes/    # 路由
│   │   ├── middleware/ # 中间件
│   │   ├── utils/     # 工具函数
│   │   └── app.ts     # 应用入口
│   ├── package.json
│   └── README.md
│
├── frontend/          # 前端小程序
│   ├── src/
│   │   ├── api/       # API 接口
│   │   ├── components/ # 组件
│   │   ├── pages/     # 页面
│   │   ├── stores/    # 状态管理
│   │   ├── utils/     # 工具函数
│   │   └── App.vue    # 应用入口
│   ├── package.json
│   └── README.md
│
├── docs/              # 📚 项目文档
│   ├── README.md      # 文档目录索引
│   ├── 快速启动指南.md
│   ├── 真机调试配置指南.md
│   ├── 项目架构说明.md
│   ├── 开发规范.md
│   ├── 部署指南.md
│   ├── workspace使用指南.md
│   └── 项目交付清单.md
│
├── 数据库初始化.sql   # 数据库脚本
├── 测试数据.sql        # 测试数据
└── README.md          # 项目说明（本文件）
```

## 快速开始

### 环境要求

- **Node.js** >= 16.x
- **MySQL** >= 8.0
- **微信开发者工具**

### 1. 克隆项目

```bash
cd 记账小程序
```

### 2. 安装依赖（使用 npm workspace）

本项目使用 npm workspace 管理 monorepo，在根目录执行一次即可：

```bash
# 安装所有依赖
npm install
```

### 3. 配置并启动后端服务

```bash
# 配置环境变量
cp backend/env.template backend/.env
# 编辑 backend/.env 填写配置

# 创建数据库
mysql -u root -p
CREATE DATABASE accounting_miniapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 启动后端服务
npm run dev:backend
```

后端服务将运行在 `http://localhost:3000`

### 4. 启动前端小程序

```bash
# 修改 frontend/src/utils/request.ts 中的 BASE_URL
# 修改 frontend/src/manifest.json 中的微信小程序 appid

# 启动前端开发模式
npm run dev:frontend
```

使用微信开发者工具打开 `frontend/dist/dev/mp-weixin` 目录。

### 5. 配置微信小程序

1. 在[微信公众平台](https://mp.weixin.qq.com/)注册小程序
2. 获取 AppID 和 AppSecret
3. 配置到后端 `.env` 文件中
4. 配置到前端 `manifest.json` 中
5. 在微信开发者工具中关闭域名校验（开发阶段）

## 💡 NPM Workspace 使用

本项目使用 npm workspace 管理 monorepo，提供以下便利：

```bash
# 一次安装所有依赖
npm install

# 同时启动前后端（推荐）
npm run dev

# 分别启动
npm run dev:backend    # 只启动后端
npm run dev:frontend   # 只启动前端

# 构建所有项目
npm run build

# 添加依赖到特定项目
npm install <package> --workspace=backend
npm install <package> --workspace=frontend
```

详细使用方法请查看 [workspace使用指南.md](./docs/workspace使用指南.md)

## 📚 项目文档

所有项目文档都已整理到 `docs/` 目录中：

- **[文档目录索引](./docs/README.md)** - 查看所有文档
- **[快速启动指南](./docs/快速启动指南.md)** - 5分钟快速开始
- **[真机调试配置指南](./docs/真机调试配置指南.md)** - 真机调试完整教程
- **[项目架构说明](./docs/项目架构说明.md)** - 详细架构设计
- **[开发规范](./docs/开发规范.md)** - 代码规范和最佳实践
- **[Docker部署指南](./docs/Docker部署指南.md)** - 使用 Docker 快速部署（推荐）
- **[部署指南](./docs/部署指南.md)** - 传统方式部署
- **[项目交付清单](./docs/项目交付清单.md)** - 完整交付清单

## 使用说明

### 1. 登录
- 打开小程序
- 点击"微信授权登录"
- 授权获取微信信息

### 2. 创建房间
- 点击"创建房间"按钮
- 输入房间名称
- 创建成功后自动加入房间
- 获得 6 位邀请码

### 3. 加入房间
- 点击"加入房间"按钮
- 输入邀请码
- 加入成功后进入房间

### 4. 记录转账
- 进入房间详情
- 点击成员卡片或右下角"+"按钮
- 选择收款人
- 输入金额
- 确认提交

### 5. 查看余额
- 房间详情页显示所有成员的余额
- 绿色表示应收（正余额）
- 红色表示应付（负余额）
- 灰色表示已结清（零余额）

### 6. 分享房间
- 点击"分享"按钮
- 复制邀请码
- 分享给好友

## 数据库设计

### users (用户表)
存储微信用户的基本信息

### rooms (房间表)
存储记账房间的信息和邀请码

### room_members (房间成员表)
存储用户与房间的关联关系

### transactions (交易记录表)
存储房间内的转账记录

详细表结构请查看 `backend/README.md`

## API 文档

详细 API 文档请查看 `backend/README.md`

主要接口：
- `POST /api/auth/wx-login` - 微信登录
- `POST /api/rooms` - 创建房间
- `POST /api/rooms/join` - 加入房间
- `GET /api/rooms/:roomId` - 获取房间详情
- `POST /api/rooms/:roomId/transactions` - 创建交易记录

## 开发计划

### 已完成 ✅
- [x] 用户认证（微信登录）
- [x] 房间管理（创建/加入）
- [x] 成员管理
- [x] 交易记录
- [x] 余额统计
- [x] 基础 UI

### 待开发 🚧
- [ ] 自定义成员昵称
- [ ] 交易记录分类
- [ ] 交易备注
- [ ] 统计报表
- [ ] 导出数据
- [ ] 房间设置
- [ ] 删除交易记录
- [ ] 推送通知

## 部署方式

本项目提供两种部署方式，推荐使用 Docker 部署：

### 方式一：Docker 部署（推荐）⭐

使用 Docker 和 Docker Compose 可以快速部署完整环境，无需手动安装 Node.js 和 MySQL。

```bash
# 1. 配置环境变量
cp backend/env.docker.example .env
vim .env  # 修改配置

# 2. 启动服务
docker-compose up -d

# 3. 查看状态
docker-compose ps
```

**优势：**
- ✅ 一键启动，无需复杂配置
- ✅ 环境一致，避免依赖问题
- ✅ 易于迁移和扩展
- ✅ 数据持久化，安全可靠

详细步骤请查看 **[Docker部署指南](./docs/Docker部署指南.md)**

### 方式二：传统部署

手动安装 Node.js、MySQL 等环境，适合已有运维体系的场景。

详细步骤请查看 **[部署指南](./docs/部署指南.md)**

## 注意事项

1. 本小程序仅用于记账记录，不涉及真实金额交易
2. 数据存储在服务器，请妥善保管数据库
3. 建议定期备份数据
4. 生产环境需配置 HTTPS
5. 需要在微信公众平台配置合法域名

## 常见问题

### Q: 登录失败怎么办？
A: 检查后端服务是否启动，微信 AppID 和 Secret 是否配置正确。

### Q: 无法创建房间？
A: 确认已登录，检查网络连接和后端服务状态。

### Q: 邀请码无效？
A: 邀请码区分大小写，确认输入正确的邀请码。

### Q: 如何清空数据？
A: 在数据库中删除相应的记录即可。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。

