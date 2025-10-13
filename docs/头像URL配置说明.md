# 头像 URL 配置说明

## 问题描述

头像上传后返回的 URL 包含硬编码的 IP 地址，部署到不同服务器后这个 IP 不会自动更新。

**原因**：上传接口返回的资源 URL（如头像）需要使用完整的可访问域名，但之前使用了硬编码的默认值。

## 解决方案

### 1. URL 生成策略（优先级从高到低）

```typescript
// backend/src/utils/url.ts
export function toFullUrl(path: string, req?: Request): string {
  // 1. 优先使用环境变量 API_BASE_URL（推荐生产环境配置）
  if (process.env.API_BASE_URL) {
    return `${process.env.API_BASE_URL}${path}`;
  }
  
  // 2. 使用请求对象自动获取当前访问的域名（开发环境友好）
  if (req) {
    const protocol = req.protocol; // http/https
    const host = req.get('host');   // 包含域名和端口
    return `${protocol}://${host}${path}`;
  }
  
  // 3. 使用默认值（不推荐，会有警告）
  return `http://localhost:3000${path}`;
}
```

### 2. 配置方式

#### 开发环境（本地开发）

**无需配置**，会自动使用当前请求的域名：
- 手机通过 `http://192.168.31.197:3000` 访问，头像 URL 也会是 `http://192.168.31.197:3000/api/uploads/avatars/xxx.jpg`
- 电脑通过 `http://localhost:3000` 访问，头像 URL 也会是 `http://localhost:3000/api/uploads/avatars/xxx.jpg`

**可选配置**（如果需要固定域名）：
```bash
# backend/.env
API_BASE_URL=http://192.168.31.197:3000
```

#### Docker 部署（必须配置）

**为什么必须配置？**
- Docker 容器内部访问：`http://backend:3000`（其他容器能访问）
- 外部访问：`https://your-domain.com` 或 `http://server-ip`（用户访问）
- 如果不配置，可能会生成内部域名，外部无法访问

**配置步骤**：

1. 复制环境变量模板：
```bash
cp backend/env.docker.example .env
```

2. 编辑 `.env` 文件：
```bash
# .env（项目根目录）

# 使用域名（推荐）
API_BASE_URL=https://your-domain.com

# 或使用 IP 地址
API_BASE_URL=http://192.168.1.100

# 或开发环境
API_BASE_URL=http://localhost:3000
```

3. 启动服务：
```bash
docker-compose up -d
```

### 3. 不同部署场景的配置示例

#### 场景 1：有域名 + HTTPS（推荐）

```bash
# .env
API_BASE_URL=https://accounting.example.com
```

访问方式：
- 前端配置：`https://accounting.example.com/api`
- 头像 URL：`https://accounting.example.com/api/uploads/avatars/xxx.jpg` ✅

#### 场景 2：有域名 + HTTP

```bash
# .env
API_BASE_URL=http://accounting.example.com
```

#### 场景 3：使用服务器 IP

```bash
# .env
# 注意：如果 Docker 中 Nginx 监听 443 端口，外部访问不需要加端口号
API_BASE_URL=http://192.168.1.100
```

访问方式：
- 前端配置：`http://192.168.1.100/api`（或 `http://192.168.1.100:443/api`）
- 头像 URL：`http://192.168.1.100/api/uploads/avatars/xxx.jpg` ✅

#### 场景 4：开发环境（本地测试）

```bash
# .env（或不配置，会自动使用请求域名）
API_BASE_URL=http://localhost:3000
```

或直接不配置，使用自动检测功能。

### 4. 配置检查清单

**部署前检查**：
- [ ] `.env` 文件中已配置 `API_BASE_URL`
- [ ] `API_BASE_URL` 是外部可访问的完整域名（不包含 `/api` 后缀）
- [ ] `API_BASE_URL` 不是 Docker 内部服务名（如 `http://backend:3000`）
- [ ] 前端 `config/env.ts` 中的 `API_BASE_URL` 与后端保持一致（除了前端的要加 `/api`）

**部署后验证**：
1. 上传一张头像
2. 查看返回的头像 URL
3. 在浏览器中直接访问该 URL，确认可以正常显示

### 5. 常见问题

#### Q1: 头像 URL 显示 `http://backend:3000`，无法访问
**原因**：未配置 `API_BASE_URL`，使用了 Docker 内部服务名

**解决**：在 `.env` 中配置正确的外部域名：
```bash
API_BASE_URL=https://your-domain.com
```

#### Q2: 开发环境手机访问显示 `http://localhost:3000`，无法显示头像
**原因**：配置了 `API_BASE_URL=http://localhost:3000`，但手机无法访问 localhost

**解决方案 1**（推荐）：不配置 `API_BASE_URL`，让系统自动检测
```bash
# 注释掉或删除这一行
# API_BASE_URL=http://localhost:3000
```

**解决方案 2**：配置为局域网 IP
```bash
API_BASE_URL=http://192.168.31.197:3000
```

#### Q3: 头像上传成功但显示不了
**可能原因**：
1. Nginx 未正确配置静态文件代理
2. 防火墙阻止了端口访问
3. 头像文件权限问题

**排查步骤**：
1. 检查 Nginx 配置中的 `/api/uploads/` 代理规则
2. 确认服务器防火墙开放了相应端口
3. 检查上传目录权限：`ls -la backend/uploads/avatars/`

### 6. 相关文件

- **后端配置**：
  - `backend/env.template` - 本地开发环境变量模板
  - `backend/env.docker.example` - Docker 部署环境变量模板
  - `backend/src/utils/url.ts` - URL 转换工具函数
  - `backend/src/controllers/uploadController.ts` - 上传控制器

- **Docker 配置**：
  - `docker-compose.yml` - 容器编排配置（已添加 API_BASE_URL 环境变量）
  - `.env` - Docker Compose 环境变量文件（需要自行创建）

- **前端配置**：
  - `frontend/src/config/env.ts` - 前端环境配置
  - `frontend/src/utils/avatar.ts` - 头像 URL 处理工具

## 总结

- **开发环境**：无需配置，自动检测当前访问域名
- **Docker 部署**：**必须配置** `API_BASE_URL` 为外部可访问的完整域名
- **配置原则**：配置的域名必须是外部可以访问的，不能是 Docker 内部服务名

