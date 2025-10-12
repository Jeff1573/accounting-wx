/**
 * 数据库配置模块
 * 
 * 负责初始化 Sequelize 实例并配置数据库连接
 */

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Sequelize 实例
 * 用于连接 MySQL 数据库
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'accounting_miniapp',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+08:00',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

/**
 * 测试数据库连接
 * 
 * @returns Promise<void>
 */
export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    throw error;
  }
}

/**
 * 同步数据库模型
 * 
 * @param force - 是否强制重建表（会删除现有数据）
 * @returns Promise<void>
 */
export async function syncDatabase(force: boolean = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    console.log('✅ 数据库同步成功');
  } catch (error) {
    console.error('❌ 数据库同步失败:', error);
    throw error;
  }
}

export default sequelize;

