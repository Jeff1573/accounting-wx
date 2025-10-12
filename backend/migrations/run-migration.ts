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
    
    // 1) 用户表 status 字段（幂等处理）
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN status ENUM('active', 'deleted', 'banned') 
        NOT NULL DEFAULT 'active' 
        COMMENT '用户状态：active-正常，deleted-已注销，banned-已封禁'
        AFTER wx_avatar
      `);
      console.log('✅ users.status 字段添加成功');
      await sequelize.query(`
        UPDATE users SET status = 'active' 
        WHERE status IS NULL OR status = ''
      `);
      await sequelize.query(`CREATE INDEX idx_users_status ON users(status)`);
      console.log('✅ users.status 索引创建成功');
    } catch (err: any) {
      if (err.original?.errno === 1060) {
        console.log('⚠️  users.status 已存在，跳过');
      } else if (err.original?.errno === 1061) {
        console.log('⚠️  idx_users_status 已存在，跳过');
      } else {
        throw err;
      }
    }

    // 2) 结算相关结构（IF NOT EXISTS 保幂等）
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS settlements (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        room_id INT UNSIGNED NOT NULL COMMENT '房间ID',
        creator_id INT UNSIGNED NOT NULL COMMENT '发起人（房主）',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX idx_settlements_room_id (room_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ settlements 表检查/创建完成');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS settlement_items (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        settlement_id INT UNSIGNED NOT NULL COMMENT '结算ID',
        user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
        net_amount DECIMAL(10,2) NOT NULL COMMENT '净额(收-支)',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX idx_items_settlement_id (settlement_id),
        INDEX idx_items_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ settlement_items 表检查/创建完成');

    // transactions 增加 settlement_id 字段
    try {
      await sequelize.query(`
        ALTER TABLE transactions
        ADD COLUMN settlement_id INT UNSIGNED NULL DEFAULT NULL COMMENT '结算ID（NULL 表示未结算）' AFTER amount;
      `);
      console.log('✅ transactions.settlement_id 字段添加成功');
      await sequelize.query(`CREATE INDEX idx_transactions_settlement_id ON transactions(settlement_id)`);
      console.log('✅ idx_transactions_settlement_id 索引创建成功');
    } catch (err: any) {
      if (err.original?.errno === 1060) {
        console.log('⚠️  transactions.settlement_id 已存在，跳过');
      } else if (err.original?.errno === 1061) {
        console.log('⚠️  idx_transactions_settlement_id 已存在，跳过');
      } else {
        throw err;
      }
    }
    
    console.log('\n✨ 数据库迁移完成！');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ 数据库迁移失败：', error.message);
    process.exit(1);
  }
}

runMigration();

