# Docker 部署指南

本文档介绍如何使用 Docker 和 Docker Compose 快速部署记账小程序后端服务。

## 一、前提条件

### 1. 系统要求

- **操作系统**：Linux、macOS 或 Windows（支持 WSL2）
- **内存**：至少 2GB RAM
- **硬盘**：至少 5GB 可用空间
- **网络**：可访问 Docker Hub

### 2. 安装 Docker

#### Linux (Ubuntu/Debian)

```bash
# 更新软件包索引
sudo apt-get update

# 安装必要的依赖
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

#### macOS

```bash
# 使用 Homebrew 安装
brew install --cask docker

# 或下载 Docker Desktop：https://www.docker.com/products/docker-desktop
```

#### Windows

下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

### 3. 验证安装

```bash
# 检查 Docker 版本
docker --version
# 输出示例：Docker version 20.10.x

# 检查 Docker Compose 版本
docker compose version
# 输出示例：Docker Compose version v2.x.x

# 测试 Docker 是否正常运行
docker run hello-world
```

## 二、快速启动

### 1. 克隆代码

```bash
# 克隆项目
git clone <your-repository-url>
cd 记账小程序
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp backend/.env.docker.example .env

# 编辑环境变量
vim .env
# 或使用其他编辑器：nano .env / code .env
```

**必须修改的配置项：**

```bash
# 数据库密码（建议使用强密码）
DB_PASSWORD=your_secure_password
MYSQL_ROOT_PASSWORD=root_password
MYSQL_PASSWORD=your_secure_password

# JWT 密钥（至少 32 位随机字符串）
JWT_SECRET=your_random_jwt_secret_at_least_32_chars

# 微信小程序配置
WX_APPID=your_wechat_appid
WX_SECRET=your_wechat_appsecret
```

**生成随机 JWT 密钥：**

```bash
# 使用 Node.js 生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 32
```

### 3. 启动服务

```bash
# 构建并启动所有服务（后台运行）
docker compose up -d

# 查看启动日志
docker compose logs -f

# 等待服务启动完成（约 30-60 秒）
# 看到 "Server is running on port 3000" 表示启动成功
```

### 4. 验证服务

```bash
# 检查容器状态
docker compose ps

# 预期输出：
# NAME                  STATUS              PORTS
# accounting-backend    Up (healthy)        0.0.0.0:3000->3000/tcp
# accounting-mysql      Up (healthy)        3306/tcp

# 测试 API
curl http://localhost:3000/api/health

# 预期输出：
# {"code":200,"message":"服务运行正常"}
```

## 三、配置说明

### 1. 环境变量详解

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `PORT` | 后端服务端口 | 3000 | 否 |
| `NODE_ENV` | 运行环境 | production | 否 |
| `DB_HOST` | 数据库主机（容器内使用服务名） | mysql | 是 |
| `DB_PORT` | 数据库端口 | 3306 | 否 |
| `DB_NAME` | 数据库名称 | accounting_miniapp | 是 |
| `DB_USER` | 数据库用户 | accounting_user | 是 |
| `DB_PASSWORD` | 数据库密码 | - | **是** |
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | - | **是** |
| `JWT_SECRET` | JWT 签名密钥 | - | **是** |
| `WX_APPID` | 微信小程序 AppID | - | **是** |
| `WX_SECRET` | 微信小程序 AppSecret | - | **是** |

### 2. 端口映射

- **3000**：后端 API 服务端口，映射到宿主机 `http://localhost:3000`
- **3306**：MySQL 端口（仅容器内部访问，不对外暴露）

如需修改端口，编辑 `.env` 文件：

```bash
PORT=8080  # 修改为其他端口
```

然后重启服务：

```bash
docker compose down
docker compose up -d
```

### 3. 数据持久化

Docker Compose 使用 Volume 持久化数据，数据不会随容器删除而丢失：

| Volume 名称 | 用途 | 挂载路径 |
|------------|------|---------|
| `mysql_data` | MySQL 数据 | `/var/lib/mysql` |
| `uploads_data` | 上传文件（头像等） | `/app/uploads` |

查看 Volume：

```bash
docker volume ls | grep accounting
```

## 四、常用命令

### 1. 服务管理

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 停止服务并删除 Volume（⚠️ 会删除数据）
docker compose down -v

# 重启服务
docker compose restart

# 重启单个服务
docker compose restart backend
docker compose restart mysql

# 查看服务状态
docker compose ps

# 查看服务日志
docker compose logs -f
docker compose logs -f backend  # 只查看后端日志
docker compose logs -f mysql    # 只查看 MySQL 日志
```

### 2. 容器操作

```bash
# 进入后端容器
docker compose exec backend sh

# 进入 MySQL 容器
docker compose exec mysql bash

# 在容器内执行命令
docker compose exec backend node -v
docker compose exec mysql mysql -u root -p
```

### 3. 查看日志

```bash
# 查看实时日志
docker compose logs -f

# 查看最近 100 行日志
docker compose logs --tail=100

# 查看特定时间段日志
docker compose logs --since="2024-01-01T00:00:00"
```

## 五、数据库管理

### 1. 自动初始化

首次启动时，MySQL 容器会自动执行 `数据库初始化.sql` 脚本，创建必要的表结构。

### 2. 手动执行 SQL 脚本

```bash
# 方式一：通过容器执行
docker compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} accounting_miniapp < your_script.sql

# 方式二：进入容器后执行
docker compose exec -it mysql bash
mysql -u root -p
USE accounting_miniapp;
SOURCE /path/to/your_script.sql;
```

### 3. 数据库备份

```bash
# 备份数据库
docker compose exec mysql mysqldump \
  -u root \
  -p${MYSQL_ROOT_PASSWORD} \
  accounting_miniapp > backup_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz backup_*.sql
```

### 4. 数据恢复

```bash
# 从备份文件恢复
docker compose exec -T mysql mysql \
  -u root \
  -p${MYSQL_ROOT_PASSWORD} \
  accounting_miniapp < backup_20240101_120000.sql
```

### 5. 连接数据库

```bash
# 使用 MySQL 客户端连接
docker compose exec mysql mysql -u accounting_user -p accounting_miniapp

# 或使用 root 用户
docker compose exec mysql mysql -u root -p

# 使用外部工具连接（需要先开放端口）
# 修改 docker-compose.yml，在 mysql 服务添加：
# ports:
#   - "3306:3306"
```

## 六、更新部署

### 1. 更新代码

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build

# 查看日志确认启动成功
docker compose logs -f backend
```

### 2. 更新环境变量

```bash
# 修改 .env 文件
vim .env

# 重启服务使配置生效
docker compose restart backend
```

### 3. 数据库迁移

```bash
# 如果有新的数据库迁移脚本
# 复制脚本到容器
docker compose cp migration.sql mysql:/tmp/

# 进入容器执行
docker compose exec mysql mysql -u root -p accounting_miniapp < /tmp/migration.sql
```

## 七、故障排查

### 1. 容器启动失败

**问题：** `docker compose up -d` 后容器反复重启

**排查步骤：**

```bash
# 查看容器日志
docker compose logs backend

# 查看容器状态
docker compose ps

# 查看详细错误信息
docker compose logs --tail=50 backend
```

**常见原因：**

- 环境变量配置错误（检查 `.env` 文件）
- 端口被占用（修改端口或停止占用端口的程序）
- 数据库连接失败（等待 MySQL 完全启动）

### 2. 数据库连接失败

**问题：** 后端日志显示 "Unable to connect to the database"

**解决方法：**

```bash
# 检查 MySQL 是否健康
docker compose ps mysql

# 查看 MySQL 日志
docker compose logs mysql

# 确认环境变量配置正确
cat .env | grep DB_

# 重启 MySQL
docker compose restart mysql

# 等待 MySQL 启动完成后重启后端
docker compose restart backend
```

### 3. 端口被占用

**问题：** 错误信息 "bind: address already in use"

**解决方法：**

```bash
# 查看端口占用
lsof -i :3000
# 或
netstat -tuln | grep 3000

# 停止占用端口的程序
kill -9 <PID>

# 或修改 .env 中的 PORT
PORT=8080
```

### 4. 权限问题

**问题：** "Permission denied" 错误

**解决方法：**

```bash
# 修复 uploads 目录权限
docker compose exec backend chown -R nodejs:nodejs /app/uploads

# 或重新构建镜像
docker compose build --no-cache backend
docker compose up -d
```

### 5. 磁盘空间不足

**问题：** "no space left on device"

**解决方法：**

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的 Volume
docker volume prune

# 查看磁盘使用情况
docker system df
```

### 6. 健康检查失败

**问题：** 容器状态显示 "unhealthy"

**解决方法：**

```bash
# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' accounting-backend | jq

# 手动测试健康检查接口
curl http://localhost:3000/api/health

# 如果接口不存在，需要在后端添加健康检查接口
# 临时禁用健康检查（修改 docker-compose.yml）
```

## 八、生产环境建议

### 1. 配置 Nginx 反向代理

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 上传文件大小限制
    client_max_body_size 10M;
}
```

### 2. 配置 HTTPS

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. 安全建议

1. **使用强密码**
   - 数据库密码至少 16 位
   - JWT Secret 至少 32 位
   - 定期更换密码

2. **限制网络访问**
   ```bash
   # 只暴露必要端口
   # 在 docker-compose.yml 中移除 MySQL 端口暴露
   ```

3. **定期更新**
   ```bash
   # 更新 Docker 镜像
   docker compose pull
   docker compose up -d
   ```

4. **配置防火墙**
   ```bash
   # 只允许必要端口
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

5. **监控和日志**
   ```bash
   # 配置日志轮转
   # 监控容器资源使用
   docker stats
   ```

### 4. 性能优化

1. **数据库连接池**
   - 已在代码中配置（Sequelize pool）

2. **容器资源限制**
   在 `docker-compose.yml` 中添加：
   ```yaml
   backend:
     deploy:
       resources:
         limits:
           cpus: '1'
           memory: 512M
         reservations:
           cpus: '0.5'
           memory: 256M
   ```

3. **日志管理**
   ```yaml
   backend:
     logging:
       driver: "json-file"
       options:
         max-size: "10m"
         max-file: "3"
   ```

## 九、与传统部署方式对比

| 对比项 | Docker 部署 | 传统部署 |
|--------|------------|----------|
| **安装复杂度** | ⭐⭐ 简单，一键启动 | ⭐⭐⭐⭐ 复杂，需要安装多个软件 |
| **环境一致性** | ✅ 完全一致 | ❌ 可能不一致 |
| **依赖管理** | ✅ 自动处理 | ⚠️ 需要手动安装 |
| **迁移难度** | ⭐ 简单，复制即用 | ⭐⭐⭐⭐ 困难，需要重新配置 |
| **资源占用** | ⚠️ 稍高（~300MB） | ✅ 较低 |
| **隔离性** | ✅ 完全隔离 | ❌ 可能冲突 |
| **备份恢复** | ⭐⭐ 简单 | ⭐⭐⭐ 中等 |
| **适用场景** | 开发、测试、生产 | 生产环境 |

### Docker 部署优势

1. ✅ **快速启动**：5 分钟内完成部署
2. ✅ **环境一致**：开发、测试、生产环境完全一致
3. ✅ **易于维护**：一行命令更新部署
4. ✅ **易于扩展**：轻松添加 Redis、Nginx 等服务
5. ✅ **团队协作**：统一开发环境，减少"在我机器上能跑"问题

### 适用场景

- ✅ **推荐使用 Docker：**
  - 开发和测试环境
  - 快速原型验证
  - 小型生产环境
  - 需要快速迁移的场景

- ⚠️ **考虑传统部署：**
  - 大规模生产环境（配合 Kubernetes）
  - 对性能要求极高的场景
  - 已有完善的运维体系

## 十、常见问题

### Q1：如何查看数据库内容？

```bash
# 方式一：使用命令行
docker compose exec mysql mysql -u accounting_user -p accounting_miniapp

# 方式二：使用外部工具（需要开放 3306 端口）
# 修改 docker-compose.yml 添加端口映射
```

### Q2：如何清空数据重新开始？

```bash
# ⚠️ 警告：此操作会删除所有数据
docker compose down -v
docker compose up -d
```

### Q3：如何在生产环境使用？

1. 修改 `NODE_ENV=production`
2. 配置强密码
3. 配置 Nginx 和 HTTPS
4. 配置域名白名单（微信公众平台）
5. 设置定期备份

### Q4：容器重启后数据会丢失吗？

不会。数据保存在 Docker Volume 中，只有执行 `docker compose down -v` 才会删除。

### Q5：如何修改数据库密码？

```bash
# 1. 停止服务
docker compose down

# 2. 删除数据库 Volume（⚠️ 会删除数据，请先备份）
docker volume rm 记账小程序_mysql_data

# 3. 修改 .env 中的密码
vim .env

# 4. 重新启动
docker compose up -d
```

## 十一、技术支持

如遇到问题：

1. 查看本文档的"故障排查"章节
2. 查看容器日志：`docker compose logs -f`
3. 查看项目其他文档：`docs/` 目录
4. 提交 Issue（附上错误日志）

## 十二、参考资料

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [MySQL Docker 镜像](https://hub.docker.com/_/mysql)
- [Node.js Docker 镜像](https://hub.docker.com/_/node)
- [项目部署指南](./部署指南.md)

