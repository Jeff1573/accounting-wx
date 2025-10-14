# 多阶段构建 Dockerfile

# ============================================
# 第一阶段：构建阶段
# ============================================
FROM node:16-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY backend/package*.json ./

# 安装所有依赖（包含 devDependencies）
RUN npm ci

# 复制源代码
COPY backend/ .

# 编译 TypeScript（跳过类型检查以避免版本兼容性问题）
RUN npx tsc --skipLibCheck

# ============================================
# 第二阶段：生产阶段
# ============================================
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 安装 dumb-init（用于正确处理信号）
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制 package.json 和 package-lock.json
COPY backend/package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 复制启动脚本
COPY backend/start.sh ./start.sh

# 创建 uploads 目录并设置权限
RUN mkdir -p uploads/avatars && \
    chmod +x start.sh && \
    chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查（start_period 增加到 60s，考虑启动脚本的 10s 延迟 + 数据库连接重试时间）
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]

# 启动命令（使用启动脚本，等待 MySQL 完全启动后再启动应用）
CMD ["sh", "start.sh"]

