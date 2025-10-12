/**
 * 数据库迁移执行脚本
 * 
 * 执行方式：
 * npx ts-node backend/migrations/run-migration.ts
 */

import sequelize from '../src/config/database';

async function runMigration() {
  try {
    console.log('开始执行数据库迁移...');
    
    // 添加 status 字段
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN status ENUM('active', 'deleted', 'banned') 
      NOT NULL DEFAULT 'active' 
      COMMENT '用户状态：active-正常，deleted-已注销，banned-已封禁'
      AFTER wx_avatar
    `);
    console.log('✅ status 字段添加成功');
    
    // 为现有用户设置默认值
    await sequelize.query(`
      UPDATE users SET status = 'active' 
      WHERE status IS NULL OR status = ''
    `);
    console.log('✅ 现有用户状态更新成功');
    
    // 创建索引
    await sequelize.query(`
      CREATE INDEX idx_users_status ON users(status)
    `);
    console.log('✅ 索引创建成功');
    
    console.log('\n✨ 数据库迁移完成！');
    process.exit(0);
  } catch (error: any) {
    // 检查是否是字段已存在的错误
    if (error.original?.errno === 1060) {
      console.log('⚠️  status 字段已存在，跳过迁移');
      process.exit(0);
    }
    
    console.error('❌ 数据库迁移失败：', error.message);
    process.exit(1);
  }
}

runMigration();

