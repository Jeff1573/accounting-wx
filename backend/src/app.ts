/**
 * Express 应用主入口
 * 
 * 配置并启动 Express 服务器
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection, syncDatabase } from './config/database';
import { setupAssociations } from './models';

// 导入路由
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import transactionRoutes from './routes/transactions';
import uploadRoutes from './routes/upload';

// 加载环境变量
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

/**
 * 中间件配置
 */
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码请求体

// 设置默认响应头，确保中文不乱码
app.use((req: Request, res: Response, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 静态文件服务（用于访问上传的头像）
// 配置在 /api 路径下，与其他接口保持一致
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * 请求日志中间件
 */
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * 路由配置
 */
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms', transactionRoutes);
app.use('/api/upload', uploadRoutes);

/**
 * 健康检查接口（用于 Docker 健康检查和监控）
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    code: 200,
    message: '服务运行正常',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// 兼容旧路径
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * 404 处理
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: '接口不存在' });
});

/**
 * 错误处理中间件
 */
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

/**
 * 启动服务器
 */
async function startServer(): Promise<void> {
  try {
    // 测试数据库连接
    await testConnection();

    // 设置模型关联
    setupAssociations();

    // 同步数据库（开发环境可以使用 force: true 重建表）
    await syncDatabase(false);

    // 启动服务器（绑定到 0.0.0.0 以支持局域网访问）
    app.listen(PORT as number, '0.0.0.0', () => {
      console.log(`🚀 服务器运行在:`);
      console.log(`   - 本地访问: http://localhost:${PORT}`);
      console.log(`   - 局域网访问: http://<你的IP>:${PORT}`);
      console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💡 真机调试时，请将前端 API 地址改为局域网 IP`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

export default app;

