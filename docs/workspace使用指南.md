# NPM Workspace 使用指南

本项目使用 npm workspace 管理前后端 monorepo，可以统一管理依赖和脚本。

## 📦 Workspace 结构

```
记账小程序/
├── package.json              # 根 workspace 配置
├── backend/                  # @accounting-miniapp/backend
│   └── package.json
└── frontend/                 # @accounting-miniapp/frontend
    └── package.json
```

## 🚀 快速开始

### 1. 安装所有依赖（推荐）

在项目根目录执行一次即可安装所有 workspace 的依赖：

```bash
npm install
```

这会自动安装 backend 和 frontend 的所有依赖。

### 2. 启动开发环境

#### 方式 1：同时启动前后端（推荐）

```bash
npm run dev
```

这会同时启动后端和前端服务。

#### 方式 2：分别启动

```bash
# 只启动后端
npm run dev:backend

# 只启动前端
npm run dev:frontend
```

### 3. 构建生产版本

```bash
# 构建所有项目
npm run build

# 只构建后端
npm run build:backend

# 只构建前端
npm run build:frontend
```

## 📝 可用命令

### 根目录命令

在项目根目录可以执行：

```bash
# 安装所有依赖
npm install

# 启动所有服务
npm run dev

# 构建所有项目
npm run build

# 清理所有构建产物和依赖
npm run clean

# 运行所有测试
npm run test

# 运行所有 linter
npm run lint
```

### 针对特定 workspace 的命令

```bash
# 启动后端
npm run dev:backend

# 启动前端
npm run dev:frontend

# 构建后端
npm run build:backend

# 构建前端
npm run build:frontend
```

### 在特定 workspace 中执行命令

```bash
# 在 backend 中执行命令
npm run <script> --workspace=backend

# 在 frontend 中执行命令
npm run <script> --workspace=frontend

# 示例：在 backend 中运行 start
npm run start --workspace=backend
```

### 添加依赖

```bash
# 为 backend 添加依赖
npm install <package> --workspace=backend

# 为 frontend 添加依赖
npm install <package> --workspace=frontend

# 为根项目添加依赖（通常是开发工具）
npm install <package> -D

# 示例
npm install lodash --workspace=backend
npm install axios --workspace=frontend
```

## 🔧 Workspace 优势

### 1. 统一依赖管理

- 所有依赖在根目录的 `node_modules` 中统一管理
- 避免重复安装相同的依赖
- 减少磁盘占用

### 2. 统一脚本管理

- 可以在根目录统一执行所有 workspace 的脚本
- 方便的启动/构建/测试流程

### 3. 共享配置

- TypeScript 配置可以共享
- ESLint、Prettier 等工具配置可以统一
- 版本号统一管理

### 4. 依赖提升

npm workspace 会自动提升（hoist）公共依赖到根目录，例如：

```
node_modules/
├── typescript        # 共享依赖
├── express          # backend 独有
└── vue              # frontend 独有
```

## 📋 常见场景

### 场景 1：初次克隆项目

```bash
# 1. 克隆项目
git clone <repository>
cd 记账小程序

# 2. 安装所有依赖
npm install

# 3. 配置环境变量
cp backend/env.template backend/.env
# 编辑 backend/.env 填写配置

# 4. 启动开发
npm run dev:backend    # 先启动后端
npm run dev:frontend   # 再启动前端
```

### 场景 2：添加新依赖

```bash
# 后端需要安装 moment
npm install moment --workspace=backend

# 前端需要安装 dayjs
npm install dayjs --workspace=frontend

# 根项目需要添加开发工具（如 prettier）
npm install prettier -D
```

### 场景 3：更新依赖

```bash
# 更新所有依赖
npm update

# 更新特定 workspace 的依赖
npm update --workspace=backend
npm update --workspace=frontend
```

### 场景 4：清理和重装

```bash
# 清理所有构建产物和依赖
npm run clean

# 重新安装
npm install
```

### 场景 5：生产部署

```bash
# 1. 安装依赖（生产环境）
npm ci

# 2. 构建所有项目
npm run build

# 3. 启动后端服务
npm run start --workspace=backend
```

## 🔍 Workspace 命令详解

### 基础语法

```bash
npm <command> --workspace=<workspace-name>
npm <command> --workspaces                    # 所有 workspace
npm <command> --workspaces --if-present       # 有该脚本的 workspace
```

### 实用命令

```bash
# 查看所有 workspace
npm list --workspaces

# 查看特定 workspace 的依赖
npm list --workspace=backend

# 运行所有 workspace 的脚本（如果存在）
npm run test --workspaces --if-present

# 只在特定 workspace 运行脚本
npm run dev --workspace=backend

# 安装依赖到特定 workspace
npm install express --workspace=backend

# 卸载依赖
npm uninstall express --workspace=backend

# 查看过时的依赖
npm outdated --workspaces
```

## 🎯 最佳实践

### 1. 统一使用根目录命令

推荐在根目录执行命令，而不是进入子目录：

```bash
# ✅ 推荐
npm install express --workspace=backend

# ❌ 不推荐
cd backend && npm install express && cd ..
```

### 2. 共享开发工具

将 TypeScript、ESLint、Prettier 等开发工具安装在根目录：

```bash
npm install -D typescript eslint prettier
```

### 3. 版本同步

在根 package.json 中定义统一的版本号：

```json
{
  "version": "1.0.0",
  "workspaces": ["backend", "frontend"]
}
```

### 4. 脚本命名规范

统一的脚本命名可以让 `--workspaces` 更好用：

```json
{
  "scripts": {
    "dev": "...",      // 所有 workspace 都有
    "build": "...",    // 所有 workspace 都有
    "test": "..."      // 所有 workspace 都有
  }
}
```

### 5. 使用 --if-present

执行可能不存在的脚本时使用 `--if-present`：

```bash
npm run lint --workspaces --if-present
```

## ⚠️ 注意事项

### 1. npm 版本要求

npm workspace 需要 npm >= 7.0.0：

```bash
# 查看版本
npm -v

# 升级 npm
npm install -g npm@latest
```

### 2. 依赖冲突

如果前后端需要不同版本的同一个包，workspace 会自动处理，将不同版本安装在各自的 `node_modules` 中。

### 3. 清理依赖

删除 `node_modules` 时要清理根目录和子目录：

```bash
npm run clean
```

### 4. Git 忽略

确保 `.gitignore` 正确配置：

```
node_modules/
backend/node_modules/
frontend/node_modules/
```

## 🆚 对比传统方式

### 传统方式（不使用 workspace）

```bash
# 需要分别进入目录安装
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 需要分别启动
cd backend && npm run dev &
cd frontend && npm run dev &
```

### 使用 Workspace

```bash
# 一次安装所有
npm install

# 统一启动
npm run dev
```

## 📚 参考资源

- [npm workspace 官方文档](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Monorepo 最佳实践](https://monorepo.tools/)

## 🎉 总结

使用 npm workspace 的好处：

- ✅ 统一的依赖管理
- ✅ 简化的开发流程
- ✅ 减少磁盘占用
- ✅ 更好的团队协作
- ✅ 便于 CI/CD 配置

现在你可以用更简洁的命令管理整个项目了！

