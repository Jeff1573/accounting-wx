# Nginx 反向代理部署指南

## 概述

本指南帮助你配置 Nginx 反向代理，将域名请求转发到后端服务的 3000 端口。

## 架构说明

```
用户请求
    ↓
域名 (your-domain.com)
    ↓
Nginx 容器 (80/443 端口)
    ↓
后端容器 (3000 端口)
    ↓
MySQL 容器 (3306 端口)
```

## 前置条件

1. ✅ 已将域名 DNS 解析到服务器 IP
2. ✅ 服务器已安装 Docker 和 Docker Compose
3. ✅ 服务器防火墙已开放 80 和 443 端口
4. ✅ 已配置后端 `.env` 文件

## 快速开始（HTTP 访问）

### 步骤 1：修改域名配置

编辑 `nginx/conf.d/default.conf` 文件：

```bash
vi nginx/conf.d/default.conf
```

找到以下行：

```nginx
server_name your-domain.com www.your-domain.com;
```

替换为你的实际域名：

```nginx
server_name ;
```

### 步骤 2：启动服务

```bash
# 在项目根目录执行
docker-compose up -d

# 查看服务状态
docker-compose ps

# 应该看到以下容器运行：
# - accounting-mysql
# - accounting-backend
# - accounting-nginx
```

### 步骤 3：验证部署

**方法 1：使用 curl 测试**

```bash
# 测试健康检查接口
curl http://your-domain.com/api/health

# 预期返回：
# {"status":"ok","timestamp":"2024-xx-xx..."}
```

**方法 2：浏览器访问**

打开浏览器访问：`http://your-domain.com/api/health`

### 步骤 4：查看日志

```bash
# 查看 Nginx 日志
docker-compose logs -f nginx

# 查看后端日志
docker-compose logs -f backend

# 查看所有服务日志
docker-compose logs -f
```

## 配置 HTTPS（推荐）

### 方案 A：使用 Let's Encrypt 免费证书（推荐）

Let's Encrypt 提供免费的 SSL 证书，有效期 90 天，支持自动续期。

#### 1. 停止 Nginx 服务

```bash
docker-compose stop nginx
```

#### 2. 安装 Certbot

**CentOS/RHEL 系统：**

```bash
sudo yum install epel-release
sudo yum install certbot
```

**Ubuntu/Debian 系统：**

```bash
sudo apt-get update
sudo apt-get install certbot
```

#### 3. 获取 SSL 证书

```bash
# 使用 standalone 模式获取证书
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 证书将保存在：
# 证书：/etc/letsencrypt/live/your-domain.com/fullchain.pem
# 私钥：/etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### 4. 复制证书到项目

```bash
# 创建 SSL 目录（如果不存在）
mkdir -p nginx/ssl

# 复制证书文件
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/your-domain.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/your-domain.key

# 修改文件权限
sudo chown $USER:$USER nginx/ssl/your-domain.*
chmod 644 nginx/ssl/your-domain.crt
chmod 600 nginx/ssl/your-domain.key
```

#### 5. 配置 HTTPS

```bash
# 复制 HTTPS 配置模板
cp nginx/conf.d/ssl.conf.example nginx/conf.d/ssl.conf

# 编辑配置文件，替换域名
vi nginx/conf.d/ssl.conf
```

修改以下内容：

```nginx
# 替换域名
server_name your-domain.com www.your-domain.com;

# 替换证书路径（如果文件名不同）
ssl_certificate /etc/nginx/ssl/your-domain.crt;
ssl_certificate_key /etc/nginx/ssl/your-domain.key;
```

#### 6. 禁用 HTTP 配置（可选）

如果启用了 HTTPS 自动重定向，可以禁用 HTTP 独立配置：

```bash
# 重命名或删除 HTTP 配置
mv nginx/conf.d/default.conf nginx/conf.d/default.conf.bak
```

#### 7. 重启服务

```bash
# 启动所有服务
docker-compose up -d

# 查看 Nginx 日志
docker-compose logs -f nginx
```

#### 8. 验证 HTTPS

```bash
# 测试 HTTPS 访问
curl https://your-domain.com/api/health

# 在浏览器访问
https://your-domain.com
```

#### 9. 配置自动续期

Let's Encrypt 证书 90 天过期，需要设置自动续期。

**方法 1：使用 Cron 定时任务**

```bash
# 编辑 root 用户的 crontab
sudo crontab -e

# 添加以下行（每天凌晨 2 点检查并续期）
0 2 * * * certbot renew --quiet --deploy-hook "cd /path/to/your/project && docker-compose restart nginx"
```

**方法 2：创建续期脚本**

```bash
# 创建续期脚本
sudo vi /usr/local/bin/renew-ssl.sh
```

内容如下：

```bash
#!/bin/bash

# SSL 证书自动续期脚本

# 续期证书
certbot renew --quiet

# 如果续期成功，复制新证书并重启 Nginx
if [ $? -eq 0 ]; then
    # 项目路径
    PROJECT_DIR="/path/to/your/project"
    DOMAIN="your-domain.com"
    
    # 复制证书
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $PROJECT_DIR/nginx/ssl/$DOMAIN.crt
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $PROJECT_DIR/nginx/ssl/$DOMAIN.key
    
    # 重启 Nginx
    cd $PROJECT_DIR
    docker-compose restart nginx
    
    echo "SSL 证书已更新：$(date)"
fi
```

```bash
# 添加执行权限
sudo chmod +x /usr/local/bin/renew-ssl.sh

# 添加到 crontab
sudo crontab -e
# 添加：
0 2 * * * /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1
```

### 方案 B：使用购买的 SSL 证书

如果你从阿里云、腾讯云等平台购买了 SSL 证书：

#### 1. 下载证书文件

从证书提供商下载以下文件：
- 证书文件（.crt 或 .pem）
- 私钥文件（.key）
- 中间证书（可选，.crt）

#### 2. 合并证书（如果有中间证书）

```bash
# 合并证书和中间证书
cat your-domain.crt intermediate.crt > nginx/ssl/your-domain.crt
```

#### 3. 复制私钥

```bash
cp your-domain.key nginx/ssl/your-domain.key
chmod 600 nginx/ssl/your-domain.key
```

#### 4. 配置 HTTPS

按照方案 A 的步骤 5-8 进行配置。

## 防火墙配置

### CentOS/RHEL (firewalld)

```bash
# 开放 HTTP 端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-port=80/tcp

# 开放 HTTPS 端口
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=443/tcp

# 重载防火墙
sudo firewall-cmd --reload

# 查看开放的端口
sudo firewall-cmd --list-all
```

### Ubuntu/Debian (ufw)

```bash
# 开放 HTTP 端口
sudo ufw allow 80/tcp

# 开放 HTTPS 端口
sudo ufw allow 443/tcp

# 查看防火墙状态
sudo ufw status
```

### 阿里云/腾讯云安全组

登录云服务控制台，在安全组规则中添加：

| 规则方向 | 端口范围 | 授权对象 | 描述 |
|---------|---------|---------|------|
| 入方向 | 80/80 | 0.0.0.0/0 | HTTP |
| 入方向 | 443/443 | 0.0.0.0/0 | HTTPS |

## 常见问题排查

### 1. 域名无法访问

**检查 DNS 解析：**

```bash
# 检查域名解析
nslookup your-domain.com

# 或使用 dig
dig your-domain.com

# 检查是否解析到正确的 IP
ping your-domain.com
```

**检查端口是否开放：**

```bash
# 检查 80 端口
sudo netstat -tlnp | grep :80
sudo lsof -i :80

# 检查 443 端口
sudo netstat -tlnp | grep :443
sudo lsof -i :443
```

**检查 Docker 容器状态：**

```bash
# 查看所有容器
docker-compose ps

# 检查 Nginx 容器
docker-compose logs nginx

# 检查后端容器
docker-compose logs backend
```

### 2. 502 Bad Gateway

原因：Nginx 无法连接到后端服务

**解决步骤：**

```bash
# 1. 检查后端是否正常运行
docker-compose ps backend

# 2. 检查后端健康状态
docker-compose exec backend wget -qO- http://localhost:3000/api/health

# 3. 查看后端日志
docker-compose logs backend

# 4. 重启后端服务
docker-compose restart backend

# 5. 检查网络连接
docker-compose exec nginx ping backend
docker-compose exec nginx wget -qO- http://backend:3000/api/health
```

### 3. 413 Request Entity Too Large

原因：上传文件超过限制

**解决方法：**

编辑 `nginx/nginx.conf` 或 `nginx/conf.d/default.conf`：

```nginx
# 增加文件大小限制
client_max_body_size 50M;  # 改为 50MB
```

重启 Nginx：

```bash
docker-compose restart nginx
```

### 4. SSL 证书错误

**检查证书有效性：**

```bash
# 查看证书信息
openssl x509 -in nginx/ssl/your-domain.crt -text -noout

# 检查证书是否过期
openssl x509 -in nginx/ssl/your-domain.crt -noout -dates

# 验证证书和私钥是否匹配
openssl x509 -noout -modulus -in nginx/ssl/your-domain.crt | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/your-domain.key | openssl md5
# 两者输出应该一致
```

**在线检测工具：**

- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)

### 5. 日志查看

```bash
# 实时查看 Nginx 访问日志
docker-compose exec nginx tail -f /var/log/nginx/access.log

# 实时查看 Nginx 错误日志
docker-compose exec nginx tail -f /var/log/nginx/error.log

# 查看后端日志
docker-compose logs -f backend

# 查看所有服务日志
docker-compose logs -f
```

## 性能优化

### 1. 启用 HTTP/2

在 HTTPS 配置中已默认启用：

```nginx
listen 443 ssl http2;
```

### 2. 配置缓存

在 `nginx/conf.d/default.conf` 中添加：

```nginx
# 静态文件缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    proxy_pass http://backend;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. 启用 Gzip 压缩

在 `nginx/nginx.conf` 中已默认启用 Gzip 压缩。

### 4. 连接优化

在 `nginx/conf.d/default.conf` 的 upstream 块中：

```nginx
upstream backend {
    server backend:3000;
    keepalive 32;  # 保持 32 个长连接
}
```

## 监控和维护

### 查看服务状态

```bash
# 查看所有容器状态
docker-compose ps

# 查看资源使用情况
docker stats

# 查看 Nginx 进程
docker-compose exec nginx ps aux
```

### 重启服务

```bash
# 重启 Nginx
docker-compose restart nginx

# 重启后端
docker-compose restart backend

# 重启所有服务
docker-compose restart

# 重新构建并启动
docker-compose up -d --build
```

### 测试配置

```bash
# 测试 Nginx 配置文件
docker-compose exec nginx nginx -t

# 重新加载配置（无需重启）
docker-compose exec nginx nginx -s reload
```

### 备份和恢复

```bash
# 备份 Nginx 配置
tar -czf nginx-config-backup-$(date +%Y%m%d).tar.gz nginx/

# 备份 SSL 证书
tar -czf ssl-backup-$(date +%Y%m%d).tar.gz nginx/ssl/

# 恢复配置
tar -xzf nginx-config-backup-20240101.tar.gz
docker-compose restart nginx
```

## 安全建议

1. ✅ **使用 HTTPS**：强制所有流量使用 HTTPS
2. ✅ **定期更新证书**：Let's Encrypt 证书 90 天过期
3. ✅ **限制请求速率**：防止 DDoS 攻击
4. ✅ **隐藏版本信息**：在 `nginx.conf` 添加 `server_tokens off;`
5. ✅ **使用强密码**：数据库、JWT 等使用强密码
6. ✅ **定期备份**：备份配置文件和 SSL 证书
7. ✅ **监控日志**：定期检查访问日志和错误日志
8. ✅ **最小权限原则**：容器使用非 root 用户运行

## 参考资料

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Let's Encrypt 官方文档](https://letsencrypt.org/docs/)
- [Mozilla SSL 配置生成器](https://ssl-config.mozilla.org/)
- [Docker Compose 官方文档](https://docs.docker.com/compose/)

## 下一步

- [ ] 配置 CDN 加速（阿里云、腾讯云、Cloudflare）
- [ ] 设置日志轮转（logrotate）
- [ ] 配置监控告警（Prometheus + Grafana）
- [ ] 实施备份策略
- [ ] 压力测试（Apache Bench、wrk）

