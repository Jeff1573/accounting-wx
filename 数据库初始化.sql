-- 记账小程序数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS accounting_miniapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE accounting_miniapp;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  wx_openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信OpenID',
  wx_nickname VARCHAR(100) NOT NULL COMMENT '微信昵称',
  wx_avatar VARCHAR(500) NOT NULL DEFAULT '' COMMENT '微信头像URL',
  status ENUM('active', 'deleted', 'banned') NOT NULL DEFAULT 'active' COMMENT '用户状态：active-正常，deleted-已注销，banned-已封禁',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_openid (wx_openid),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 房间表
CREATE TABLE IF NOT EXISTS rooms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '房间ID',
  name VARCHAR(100) NOT NULL COMMENT '房间名称',
  creator_id INT UNSIGNED NOT NULL COMMENT '创建者用户ID',
  invite_code VARCHAR(6) NOT NULL UNIQUE COMMENT '邀请码',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_creator (creator_id),
  INDEX idx_invite_code (invite_code),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房间表';

-- 房间成员表
CREATE TABLE IF NOT EXISTS room_members (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '成员记录ID',
  room_id INT UNSIGNED NOT NULL COMMENT '房间ID',
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  custom_nickname VARCHAR(100) DEFAULT NULL COMMENT '房间内自定义昵称',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  UNIQUE KEY uk_room_user (room_id, user_id),
  INDEX idx_room (room_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房间成员表';

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '交易记录ID',
  room_id INT UNSIGNED NOT NULL COMMENT '房间ID',
  payer_id INT UNSIGNED NOT NULL COMMENT '付款人用户ID',
  payee_id INT UNSIGNED NOT NULL COMMENT '收款人用户ID',
  amount DECIMAL(10,2) NOT NULL COMMENT '金额',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_room (room_id),
  INDEX idx_payer (payer_id),
  INDEX idx_payee (payee_id),
  INDEX idx_created (created_at),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';

-- 插入测试数据（可选）
-- INSERT INTO users (wx_openid, wx_nickname, wx_avatar) VALUES 
-- ('test_openid_1', '测试用户1', 'https://example.com/avatar1.jpg'),
-- ('test_openid_2', '测试用户2', 'https://example.com/avatar2.jpg');

