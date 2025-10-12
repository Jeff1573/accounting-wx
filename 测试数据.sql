-- 测试数据插入脚本
-- 用于开发和测试环境

USE accounting_miniapp;

-- 清空现有数据（谨慎使用！）
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE transactions;
-- TRUNCATE TABLE room_members;
-- TRUNCATE TABLE rooms;
-- TRUNCATE TABLE users;
-- SET FOREIGN_KEY_CHECKS = 1;

-- 插入测试用户
INSERT INTO users (wx_openid, wx_nickname, wx_avatar) VALUES
('test_openid_001', '张三', 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132'),
('test_openid_002', '李四', 'https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83eoj0hHXhgJNOTSOFsS4uZs8x1ConecaVOB8eIl115xmJZcT4oCicvia7wMEufibKtTLqiaJeanU2Lpg3w/132'),
('test_openid_003', '王五', 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLL1byctY955Kkt1hf6Y1WXyf6FXKzqqH1b6ogXvPZXXP4jUP5cGsYbJ5EIIv6DL8LqCFEuLWPMKw/132'),
('test_openid_004', '赵六', 'https://thirdwx.qlogo.cn/mmopen/vi_32/5mKrvn3ibyDNaDZSZics3aoKlz1cv51ZPJFKqI99CbRPKs0q15UdeNqLT5BVcsCr2qRr8xvFNXcXkGhCH3OEYlMQ/132');

-- 插入测试房间
INSERT INTO rooms (name, creator_id, invite_code) VALUES
('周末聚餐', 1, 'ABC123'),
('春节旅行', 2, 'XYZ789'),
('公司团建', 1, 'DEF456');

-- 插入房间成员
-- 房间1: 张三、李四、王五
INSERT INTO room_members (room_id, user_id, custom_nickname) VALUES
(1, 1, NULL),
(1, 2, '小李'),
(1, 3, NULL);

-- 房间2: 李四、王五、赵六
INSERT INTO room_members (room_id, user_id, custom_nickname) VALUES
(2, 2, NULL),
(2, 3, '老王'),
(2, 4, NULL);

-- 房间3: 张三、李四
INSERT INTO room_members (room_id, user_id, custom_nickname) VALUES
(3, 1, NULL),
(3, 2, NULL);

-- 插入测试交易记录
-- 房间1的交易
INSERT INTO transactions (room_id, payer_id, payee_id, amount, created_at) VALUES
(1, 1, 2, 100.00, '2024-01-15 12:30:00'),  -- 张三 -> 李四 100元
(1, 2, 3, 50.00, '2024-01-15 13:00:00'),   -- 李四 -> 王五 50元
(1, 3, 1, 75.50, '2024-01-15 14:00:00'),   -- 王五 -> 张三 75.5元
(1, 1, 3, 30.00, '2024-01-15 15:00:00');   -- 张三 -> 王五 30元

-- 房间2的交易
INSERT INTO transactions (room_id, payer_id, payee_id, amount, created_at) VALUES
(2, 2, 3, 200.00, '2024-01-16 10:00:00'),  -- 李四 -> 王五 200元
(2, 3, 4, 150.00, '2024-01-16 11:00:00'),  -- 王五 -> 赵六 150元
(2, 4, 2, 80.00, '2024-01-16 12:00:00');   -- 赵六 -> 李四 80元

-- 房间3的交易
INSERT INTO transactions (room_id, payer_id, payee_id, amount, created_at) VALUES
(3, 1, 2, 500.00, '2024-01-17 09:00:00'),  -- 张三 -> 李四 500元
(3, 2, 1, 300.00, '2024-01-17 10:00:00');  -- 李四 -> 张三 300元

-- 查询验证数据
SELECT '========== 用户列表 ==========' as '';
SELECT id, wx_nickname, wx_openid FROM users;

SELECT '========== 房间列表 ==========' as '';
SELECT id, name, creator_id, invite_code FROM rooms;

SELECT '========== 房间成员 ==========' as '';
SELECT rm.id, r.name as room_name, u.wx_nickname as user_name, rm.custom_nickname
FROM room_members rm
JOIN rooms r ON rm.room_id = r.id
JOIN users u ON rm.user_id = u.id
ORDER BY r.id, u.id;

SELECT '========== 交易记录 ==========' as '';
SELECT 
  t.id,
  r.name as room_name,
  u1.wx_nickname as payer,
  u2.wx_nickname as payee,
  t.amount,
  t.created_at
FROM transactions t
JOIN rooms r ON t.room_id = r.id
JOIN users u1 ON t.payer_id = u1.id
JOIN users u2 ON t.payee_id = u2.id
ORDER BY t.created_at;

SELECT '========== 房间1余额统计 ==========' as '';
SELECT 
  u.wx_nickname,
  COALESCE(received.total, 0) - COALESCE(paid.total, 0) as balance
FROM users u
JOIN room_members rm ON u.id = rm.user_id
LEFT JOIN (
  SELECT payee_id, SUM(amount) as total
  FROM transactions
  WHERE room_id = 1
  GROUP BY payee_id
) received ON u.id = received.payee_id
LEFT JOIN (
  SELECT payer_id, SUM(amount) as total
  FROM transactions
  WHERE room_id = 1
  GROUP BY payer_id
) paid ON u.id = paid.payer_id
WHERE rm.room_id = 1
ORDER BY balance DESC;

