#!/bin/sh

# Backend 启动脚本
# 用于在 Docker 环境中等待 MySQL 完全启动后再启动应用

set -e

echo "========================================"
echo "🚀 Backend 启动脚本开始执行"
echo "========================================"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "环境: ${NODE_ENV:-production}"
echo "数据库主机: ${DB_HOST}"
echo "数据库端口: ${DB_PORT:-3306}"
echo "========================================"

# 等待 MySQL 服务启动
# 给予 MySQL 容器足够的初始化时间（特别是首次启动时）
WAIT_TIME=15
echo "⏳ 等待 ${WAIT_TIME} 秒，确保 MySQL 完全启动..."
sleep $WAIT_TIME

echo "✅ 等待完成，正在启动 Node 应用..."
echo "========================================"
echo ""

# 启动 Node 应用
# 使用 exec 确保 Node 进程接收信号
exec node dist/app.js

