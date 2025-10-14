# 本地开发 MySQL 配置指南

本文档说明如何使用 Docker 在本地快速启动 MySQL 数据库用于开发。

## 快速开始

### 1. 启动 MySQL 容器

```bash
# 在项目根目录执行
docker-compose -f docker-compose.dev.yml up -d
```

首次启动会自动：
- 下载 MySQL 8.0 镜像
- 创建数据库 `accounting_miniapp`
- 执行初始化脚本（创建表结构）
- 导入测试数据

### 2. 配置后端环境变量

复制 `env.dev.example` 文件到 `backend/.env`：

```bash
# Windows PowerShell
Copy-Item env.dev.example backend\.env

# Linux/macOS
cp env.dev.example backend/.env
```

或手动修改 `backend/.env`，确保数据库配置为：

```env
DB_HOST=localhost
DB_PORT=3307
DB_NAME=accounting_miniapp
DB_USER=accounting_dev
DB_PASSWORD=dev123456
```

### 3. 启动后端服务

```bash
cd backend
npm install
npm run dev
```

## 数据库连接信息

| 配置项 | 值 |
|-------|-----|
| **主机** | `localhost` |
| **端口** | `3307` |
| **数据库名** | `accounting_miniapp` |
| **用户名** | `accounting_dev` |
| **密码** | `dev123456` |
| **Root 密码** | `root` |

### 使用数据库客户端连接

支持任何 MySQL 客户端工具，如：
- MySQL Workbench
- Navicat
- DBeaver
- DataGrip
- VS Code MySQL 插件

连接示例（MySQL Workbench）：
```
Host: localhost
Port: 3307
Username: accounting_dev
Password: dev123456
```

### 使用命令行连接

```bash
# 使用开发用户连接
mysql -h 127.0.0.1 -P 3307 -u accounting_dev -pdev123456 accounting_miniapp

# 使用 root 用户连接
mysql -h 127.0.0.1 -P 3307 -u root -proot accounting_miniapp

# 或进入 Docker 容器内连接
docker exec -it accounting-mysql-dev mysql -u root -proot accounting_miniapp
```

## 常用命令

### 容器管理

```bash
# 启动 MySQL 容器
docker-compose -f docker-compose.dev.yml up -d

# 查看容器状态
docker-compose -f docker-compose.dev.yml ps

# 查看容器日志
docker-compose -f docker-compose.dev.yml logs -f mysql-dev

# 停止容器（保留数据）
docker-compose -f docker-compose.dev.yml stop

# 停止并删除容器（保留数据）
docker-compose -f docker-compose.dev.yml down

# 停止并删除容器和数据（⚠️ 慎用，会丢失所有数据）
docker-compose -f docker-compose.dev.yml down -v
```

### 数据管理

```bash
# 重新初始化数据库（删除所有数据并重新导入）
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

# 手动导入 SQL 文件
docker exec -i accounting-mysql-dev mysql -u root -proot accounting_miniapp < your-file.sql

# 导出数据库
docker exec accounting-mysql-dev mysqldump -u root -proot accounting_miniapp > backup.sql

# 查看数据库列表
docker exec accounting-mysql-dev mysql -u root -proot -e "SHOW DATABASES;"

# 查看表列表
docker exec accounting-mysql-dev mysql -u root -proot accounting_miniapp -e "SHOW TABLES;"
```

## 测试数据说明

启动容器后会自动导入以下测试数据：

### 测试用户
| ID | 昵称 | OpenID |
|----|------|--------|
| 1 | 张三 | test_openid_001 |
| 2 | 李四 | test_openid_002 |
| 3 | 王五 | test_openid_003 |
| 4 | 赵六 | test_openid_004 |

### 测试账本
| ID | 名称 | 创建者 | 邀请码 |
|----|------|--------|--------|
| 1 | 周末聚餐 | 张三 | ABC123 |
| 2 | 春节旅行 | 李四 | XYZ789 |
| 3 | 公司团建 | 张三 | DEF456 |

### 账本成员
- **周末聚餐**：张三、李四、王五
- **春节旅行**：李四、王五、赵六
- **公司团建**：张三、李四

每个账本都有若干测试交易记录，可用于开发和调试。

## 常见问题

### 1. 端口 3307 被占用

**错误信息**：`Bind for 0.0.0.0:3307 failed: port is already allocated`

**解决方案**：
```bash
# 方案 1：修改 docker-compose.dev.yml 中的端口映射
ports:
  - "3308:3306"  # 改为 3308 或其他未被占用的端口

# 方案 2：停止占用端口的服务
# Windows 查找占用进程
netstat -ano | findstr :3307
taskkill /PID <进程ID> /F

# Linux/macOS 查找占用进程
lsof -i :3307
kill -9 <进程ID>
```

### 2. 容器无法启动

**查看日志**：
```bash
docker-compose -f docker-compose.dev.yml logs mysql-dev
```

**常见原因**：
- Docker 服务未启动
- 磁盘空间不足
- MySQL 镜像下载失败

**解决方案**：
```bash
# 重新拉取镜像
docker pull mysql:8.0

# 清理未使用的资源
docker system prune -a
```

### 3. 数据库连接失败

**检查容器状态**：
```bash
docker-compose -f docker-compose.dev.yml ps
```

**确认健康检查通过**：
```bash
docker inspect accounting-mysql-dev | grep -A 5 Health
```

**等待容器完全启动**：
MySQL 容器初次启动需要时间初始化，等待 30 秒后再连接。

### 4. 测试数据未导入

**原因**：初始化脚本只在**首次创建容器**时执行。

**解决方案**：
```bash
# 删除数据卷，重新创建容器
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

# 或手动导入
docker exec -i accounting-mysql-dev mysql -u root -proot accounting_miniapp < 测试数据.sql
```

### 5. 后端连接数据库失败

**检查配置**：
- 确认 `backend/.env` 文件存在
- 确认 `DB_HOST=localhost` 和 `DB_PORT=3307`
- 确认 Docker 容器正在运行

**测试连接**：
```bash
# 测试数据库连接
mysql -h 127.0.0.1 -P 3307 -u accounting_dev -pdev123456 -e "SELECT 1"
```

### 6. 数据持久化问题

**说明**：
- 数据存储在 Docker Volume `mysql_dev_data` 中
- 执行 `docker-compose down` 不会删除数据
- 执行 `docker-compose down -v` 会删除所有数据

**查看数据卷**：
```bash
# 列出所有 Volume
docker volume ls

# 查看 Volume 详情
docker volume inspect accounting-wx_mysql_dev_data
```

## 开发工作流

### 推荐工作流

1. **启动开发环境**
   ```bash
   # 启动 MySQL
   docker-compose -f docker-compose.dev.yml up -d
   
   # 启动后端
   cd backend
   npm run dev
   ```

2. **开发调试**
   - 使用测试数据进行开发
   - 使用数据库客户端查看数据变化
   - 修改代码后自动重启（nodemon）

3. **重置数据**（需要时）
   ```bash
   # 重新导入测试数据
   docker exec -i accounting-mysql-dev mysql -u root -proot accounting_miniapp < 测试数据.sql
   ```

4. **关闭环境**
   ```bash
   # 停止后端（Ctrl+C）
   
   # 停止 MySQL（保留数据）
   docker-compose -f docker-compose.dev.yml stop
   ```

### 数据库变更管理

当数据库结构发生变更时：

1. **修改初始化脚本**
   - 更新 `数据库初始化.sql`

2. **应用到开发环境**
   ```bash
   # 方案 1：完全重建（⚠️ 会丢失数据）
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d
   
   # 方案 2：手动执行 SQL
   docker exec -i accounting-mysql-dev mysql -u root -proot accounting_miniapp < 数据库初始化.sql
   ```

3. **创建迁移脚本**（推荐）
   - 在 `backend/migrations/` 目录创建迁移脚本
   - 参考：[migrations/add_user_status.sql](../backend/migrations/add_user_status.sql)

## 性能优化配置

开发环境已优化以下参数以提升性能：

```yaml
command:
  - --innodb-flush-log-at-trx-commit=2  # 减少刷盘频率
  - --sync-binlog=0                      # 禁用 binlog 同步
```

⚠️ **注意**：这些配置仅适用于开发环境，生产环境应使用默认配置以确保数据安全。

## 与生产环境区别

| 配置项 | 开发环境 | 生产环境 |
|-------|---------|----------|
| 端口映射 | 3307:3306 | 内部网络 |
| Root 密码 | root | 强密码 |
| 用户密码 | dev123456 | 强密码 |
| 测试数据 | 自动导入 | 不导入 |
| 性能优化 | 启用 | 禁用 |
| 数据持久化 | Local Volume | 生产 Volume |

## 相关文档

- [快速启动指南](./快速启动指南.md)
- [Docker 部署指南](./Docker部署指南.md)
- [数据库设计规范](../docs/开发规范.md)
- [后端开发规范](../docs/开发规范.md)

## 技术支持

遇到问题？
1. 查看本文档「常见问题」章节
2. 检查 Docker 容器日志
3. 确认网络和端口配置
4. 参考项目其他文档

---

**最后更新**：2024-01-20

