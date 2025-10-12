# NPM Workspace 配置完成说明

## ✅ 配置完成

已成功将项目配置为 npm workspace 管理的 monorepo！

## 📝 完成的工作

### 1. 根目录配置

创建了根目录 `package.json`，配置 workspaces：

```json
{
  "name": "accounting-miniapp",
  "workspaces": ["backend", "frontend"],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "dev:backend": "npm run dev --workspace=backend",
    "dev:frontend": "npm run dev:mp-weixin --workspace=frontend",
    "build": "npm run build --workspaces --if-present",
    "build:backend": "npm run build --workspace=backend",
    "build:frontend": "npm run build:mp-weixin --workspace=frontend"
  }
}
```

### 2. 子项目更名

更新了 backend 和 frontend 的 package.json：

- **backend**: `accounting-miniapp-backend` → `@accounting-miniapp/backend`
- **frontend**: `accounting-miniapp-frontend` → `@accounting-miniapp/frontend`
- 添加 `"private": true` 标记

### 3. 统一脚本

添加了 `clean` 脚本到各个子项目：

```json
{
  "scripts": {
    "clean": "rm -rf dist node_modules"
  }
}
```

### 4. 文档更新

更新了以下文档：

- ✅ **README.md** - 添加 npm workspace 使用说明
- ✅ **快速启动指南.md** - 更新为使用 workspace 命令
- ✅ **项目交付清单.md** - 添加 workspace 配置说明
- ✅ **workspace使用指南.md** - 新建详细的 workspace 教程

## 🚀 现在你可以这样使用

### 安装依赖（推荐）

```bash
# 在项目根目录，一次安装所有依赖
npm install
```

这会自动安装 backend 和 frontend 的所有依赖，并进行依赖提升优化。

### 启动开发环境

```bash
# 方式 1：同时启动前后端
npm run dev

# 方式 2：分别启动
npm run dev:backend    # 只启动后端
npm run dev:frontend   # 只启动前端
```

### 构建项目

```bash
# 构建所有项目
npm run build

# 构建特定项目
npm run build:backend
npm run build:frontend
```

### 添加依赖

```bash
# 为 backend 添加依赖
npm install <package> --workspace=backend

# 为 frontend 添加依赖
npm install <package> --workspace=frontend

# 示例
npm install lodash --workspace=backend
npm install dayjs --workspace=frontend
```

### 清理项目

```bash
# 清理所有构建产物和依赖
npm run clean
```

## 📊 对比优势

### 之前（不使用 workspace）

```bash
# 需要分别进入目录安装
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 需要分别启动
cd backend && npm run dev &
cd frontend && npm run dev:mp-weixin &
```

### 现在（使用 workspace）

```bash
# 一次安装所有依赖
npm install

# 统一启动
npm run dev
```

## 🎯 主要优点

1. **统一依赖管理** - 所有依赖在根目录统一管理
2. **依赖提升优化** - 公共依赖自动提升，节省磁盘空间
3. **简化命令** - 不需要频繁切换目录
4. **便于 CI/CD** - 统一的构建流程
5. **更好的开发体验** - 一个命令搞定所有操作

## 📚 详细文档

查看 [workspace使用指南.md](./workspace使用指南.md) 了解更多：

- 完整的命令列表
- 常见场景示例
- 最佳实践
- 故障排除

## ⚠️ 注意事项

### npm 版本要求

npm workspace 需要 **npm >= 7.0.0**：

```bash
# 查看版本
npm -v

# 如果版本过低，请升级
npm install -g npm@latest
```

### 首次使用

如果之前已经安装过依赖，建议清理后重新安装：

```bash
# 清理旧的 node_modules
rm -rf node_modules backend/node_modules frontend/node_modules

# 重新安装（使用 workspace）
npm install
```

### 目录结构

确保你的目录结构如下：

```
记账小程序/
├── package.json              # workspace 配置
├── backend/
│   └── package.json          # @accounting-miniapp/backend
└── frontend/
    └── package.json          # @accounting-miniapp/frontend
```

## ✨ 快速验证

运行以下命令验证 workspace 配置是否正常：

```bash
# 查看所有 workspace
npm list --workspaces

# 应该看到类似输出：
# accounting-miniapp@1.0.0
# ├─┬ @accounting-miniapp/backend@1.0.0
# └─┬ @accounting-miniapp/frontend@1.0.0
```

## 🎉 配置完成！

现在你可以享受 npm workspace 带来的便利了！

如有任何问题，请查看：
- [workspace使用指南.md](./workspace使用指南.md) - 详细使用教程
- [快速启动指南.md](./快速启动指南.md) - 快速开始指南
- [README.md](./README.md) - 项目总览

---

**配置完成时间：** 2024年  
**配置版本：** v1.0.0  
**npm 最低版本要求：** 7.0.0+

