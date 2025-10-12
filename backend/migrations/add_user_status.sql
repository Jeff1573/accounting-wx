/**
 * 数据库迁移：添加用户状态字段
 * 
 * 为 users 表添加 status 字段，用于标识用户状态
 * 
 * 执行方式：
 * mysql -u root -p accounting < backend/migrations/add_user_status.sql
 */

-- 添加 status 字段
ALTER TABLE users 
ADD COLUMN status ENUM('active', 'deleted', 'banned') 
NOT NULL DEFAULT 'active' 
COMMENT '用户状态：active-正常，deleted-已注销，banned-已封禁'
AFTER wx_avatar;

-- 为现有用户设置默认值（确保没有 NULL 值）
UPDATE users SET status = 'active' WHERE status IS NULL OR status = '';

-- 创建索引以优化状态查询
CREATE INDEX idx_users_status ON users(status);

