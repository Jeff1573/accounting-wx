# Nginx 配置说明

## 目录结构

```
nginx/
├── nginx.conf              # Nginx 主配置文件
├── conf.d/
│   └── default.conf       # 完整配置（包含 HTTP + HTTPS）
├── ssl/                   # SSL 证书目录（需要手动创建）
│   ├── your-domain.crt   # 证书文件
│   └── your-domain.key   # 私钥文件
└── README.md             # 本说明文件
```

## 重要说明

⚠️ **`default.conf` 已包含完整的 HTTP 和 HTTPS 配置**
- 包括 upstream backend 定义、SSL 证书配置、HTTP 重定向、WebSocket 支持等
- 只需修改域名和证书路径即可使用
- **不需要额外的配置文件**

## 快速开始

### 配置步骤

**步骤 1：修改域名**

编辑 `conf.d/default.conf`，将以下两处域名替换为你的实际域名：

```nginx
# 第 15 行 - HTTP 服务器域名
server_name mdice.top keep-account.mdice.top;

# 第 28 行 - HTTPS 服务器域名
server_name mdice.top keep-account.mdice.top;
```

**步骤 2：准备 SSL 证书（HTTPS 必需）**

如果暂时没有证书，可以先注释掉 HTTPS 配置（第 22-116 行）或参考下方获取证书的方法。

**步骤 3：启动服务**

```bash
# 在项目根目录执行
docker compose up -d

# 查看 Nginx 日志
docker compose logs -f accounting-nginx
```

**步骤 4：测试访问**

```bash
# 测试 HTTP
curl http://your-domain.com/api/health

# 测试 HTTPS
curl https://your-domain.com/api/health
```

## SSL 证书配置

### 方案 A：使用 Let's Encrypt 免费证书（推荐）

**步骤 1：安装 Certbot**

```bash
# CentOS/RHEL
sudo yum install certbot

# Ubuntu/Debian
sudo apt-get install certbot

# macOS
brew install certbot
```

**步骤 2：获取证书**

```bash
# 停止 Nginx 服务（避免端口冲突）
docker compose stop accounting-nginx

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 证书将保存在：
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

**步骤 3：复制证书到项目**

```bash
# 创建 SSL 目录
mkdir -p nginx/ssl

# 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/your-domain.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/your-domain.key

# 修改权限
sudo chmod 644 nginx/ssl/your-domain.crt
sudo chmod 600 nginx/ssl/your-domain.key
```

**步骤 4：修改证书路径**

编辑 `conf.d/default.conf`，将证书路径改为你的域名：

```nginx
# 第 31-32 行
ssl_certificate /etc/nginx/ssl/your-domain.crt;
ssl_certificate_key /etc/nginx/ssl/your-domain.key;
```

**步骤 5：重启 Nginx**

```bash
docker compose restart accounting-nginx
```

**步骤 6：自动续期（Let's Encrypt 证书 90 天过期）**

```bash
# 添加定时任务
sudo crontab -e

# 添加以下内容（每天凌晨 2 点检查并续期）
0 2 * * * certbot renew --quiet && cd /path/to/your/project && docker compose restart accounting-nginx
```

### 方案 B：使用购买的 SSL 证书

**步骤 1：准备证书文件**

从证书提供商获取以下文件：
- 证书文件（.crt 或 .pem）
- 私钥文件（.key）

**步骤 2：复制到项目**

```bash
# 创建 SSL 目录
mkdir -p nginx/ssl

# 复制证书文件
cp /path/to/your-domain.crt nginx/ssl/
cp /path/to/your-domain.key nginx/ssl/

# 修改权限
chmod 644 nginx/ssl/your-domain.crt
chmod 600 nginx/ssl/your-domain.key
```

**步骤 3：修改配置并重启**

参考方案 A 的步骤 4-5。

## 配置说明

### 性能优化

当前配置已包含以下优化：

1. **Gzip 压缩**：自动压缩文本内容，减少传输大小
2. **连接复用**：`keepalive` 减少连接建立开销
3. **缓冲设置**：合理的缓冲区大小，平衡内存和性能
4. **静态文件缓存**：上传的图片等静态文件缓存 30 天

### 安全配置

HTTPS 配置包含以下安全措施：

1. **强制 HTTPS**：HTTP 自动重定向到 HTTPS
2. **HSTS**：防止 SSL 降级攻击
3. **安全头**：防止 XSS、点击劫持等攻击
4. **现代 TLS 协议**：仅支持 TLS 1.2 和 1.3

### 上传文件大小限制

默认限制为 10MB，修改方法：

```nginx
# 在 nginx.conf 或 server 块中修改
client_max_body_size 50M;  # 改为 50MB
```

修改后重启 Nginx：

```bash
docker compose restart accounting-nginx
```

## 常见问题

### 1. 域名无法访问

**检查步骤：**

```bash
# 1. 检查 Nginx 是否运行
docker compose ps

# 2. 查看 Nginx 日志
docker compose logs accounting-nginx

# 3. 检查端口是否被占用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# 4. 测试 Nginx 配置
docker compose exec accounting-nginx nginx -t

# 5. 检查防火墙
sudo firewall-cmd --list-all  # CentOS/RHEL
sudo ufw status               # Ubuntu/Debian
```

### 2. 502 Bad Gateway

**原因：** Nginx 无法连接到后端服务

**解决方法：**

```bash
# 1. 检查后端服务是否运行
docker compose ps accounting-backend

# 2. 检查后端健康状态
docker compose exec accounting-backend wget -qO- http://localhost:3000/api/health

# 3. 查看后端日志
docker compose logs accounting-backend
```

### 3. SSL 证书错误

**检查证书：**

```bash
# 查看证书信息
openssl x509 -in nginx/ssl/your-domain.crt -text -noout

# 验证证书和私钥是否匹配
openssl x509 -noout -modulus -in nginx/ssl/your-domain.crt | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/your-domain.key | openssl md5
# 两者输出应该一致
```

### 4. 日志查看

```bash
# 实时查看访问日志
docker compose exec accounting-nginx tail -f /var/log/nginx/access.log

# 实时查看错误日志
docker compose exec accounting-nginx tail -f /var/log/nginx/error.log

# 查看日志文件（在宿主机上）
docker volume inspect accounting-miniapp_nginx_logs
```

## 高级配置

### 负载均衡（多个后端实例）

编辑 `conf.d/default.conf`：

```nginx
upstream backend {
    # 负载均衡策略：轮询（默认）
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
    
    # 或使用加权轮询
    # server backend1:3000 weight=3;
    # server backend2:3000 weight=2;
    # server backend3:3000 weight=1;
    
    keepalive 32;
}
```

### IP 白名单（限制访问）

```nginx
location /api/admin {
    # 只允许特定 IP 访问
    allow 192.168.1.0/24;
    allow 10.0.0.1;
    deny all;
    
    proxy_pass http://backend;
}
```

### 速率限制（防止 DDoS）

在 `nginx.conf` 的 `http` 块中添加：

```nginx
# 定义速率限制区域
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# 在 server 或 location 块中使用
location /api {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://backend;
}
```

## 监控和维护

### 查看 Nginx 状态

```bash
# 查看进程状态
docker compose exec accounting-nginx ps aux

# 查看连接数
docker compose exec accounting-nginx netstat -antp

# 测试配置文件
docker compose exec accounting-nginx nginx -t

# 重新加载配置（无需重启）
docker compose exec accounting-nginx nginx -s reload
```

### 日志分析

```bash
# 统计访问量最多的 IP
docker compose exec accounting-nginx awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 统计最常访问的 URL
docker compose exec accounting-nginx awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 统计 HTTP 状态码
docker compose exec accounting-nginx awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn
```

## 参考资料

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Let's Encrypt 官方文档](https://letsencrypt.org/docs/)
- [Mozilla SSL 配置生成器](https://ssl-config.mozilla.org/)

