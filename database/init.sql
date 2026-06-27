-- ============================================
-- 校园二手交易平台 - 数据库初始化脚本
-- 数据库名称: campus_trade
-- 创建日期: 2026-06-24
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS campus_trade
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE campus_trade;

-- ============================================
-- 用户表 (users)
-- 存储所有用户信息，包括买家和卖家
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名，用于登录',
  password VARCHAR(255) NOT NULL COMMENT '密码，使用bcrypt加密存储',
  nickname VARCHAR(50) NOT NULL COMMENT '昵称，页面显示用',
  avatar VARCHAR(255) DEFAULT '/avatars/default.png' COMMENT '头像URL',
  phone VARCHAR(20) DEFAULT '' COMMENT '手机号',
  role VARCHAR(20) DEFAULT 'user' COMMENT '用户角色：普通用户/管理员',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================
-- 商品分类表 (categories)
-- 商品分类，如：电子数码、书籍教材、生活用品等
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL COMMENT '分类名称',
  icon VARCHAR(50) DEFAULT '📦' COMMENT '分类图标（emoji）',
  sort_order INT DEFAULT 0 COMMENT '排序序号'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- 预置分类数据
INSERT INTO categories (name, icon, sort_order) VALUES
  ('电子数码', '💻', 1),
  ('书籍教材', '📚', 2),
  ('生活用品', '🏠', 3),
  ('服饰鞋包', '👗', 4),
  ('运动户外', '⚽', 5),
  ('其他闲置', '🎁', 6);

-- ============================================
-- 商品表 (products)
-- 二手商品信息，核心业务表
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL COMMENT '商品标题',
  description TEXT COMMENT '商品描述（详细介绍）',
  price DECIMAL(10,2) NOT NULL COMMENT '售价',
  original_price DECIMAL(10,2) DEFAULT NULL COMMENT '原价（可选，用于展示折扣）',
  images VARCHAR(1000) DEFAULT '["/uploads/default-product.png"]' COMMENT '商品图片，JSON数组存储多个URL',
  category_id INT COMMENT '所属分类ID',
  seller_id INT NOT NULL COMMENT '卖家用户ID',
  campus_area VARCHAR(50) DEFAULT '' COMMENT '校区/区域',
  trade_location VARCHAR(200) DEFAULT '' COMMENT '期望交易地点',
  `condition` VARCHAR(20) DEFAULT '正常使用' COMMENT '商品成色',
  `status` VARCHAR(20) DEFAULT '在售' COMMENT '商品状态',
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- ============================================
-- 订单表 (orders)
-- 交易订单，记录买卖双方的交易信息
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(30) NOT NULL UNIQUE COMMENT '订单编号（如：CT202606240001）',
  product_id INT NOT NULL COMMENT '商品ID',
  buyer_id INT NOT NULL COMMENT '买家用户ID',
  seller_id INT NOT NULL COMMENT '卖家用户ID',
  amount DECIMAL(10,2) NOT NULL COMMENT '交易金额',
  status VARCHAR(20) DEFAULT '待确认' COMMENT '订单状态',
  trade_location VARCHAR(200) DEFAULT '' COMMENT '约定交易地点',
  trade_time VARCHAR(50) DEFAULT '' COMMENT '约定交易时间',
  buyer_remark VARCHAR(500) DEFAULT '' COMMENT '买家留言/备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ============================================
-- 收藏表 (favorites)
-- 用户收藏的商品
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  product_id INT NOT NULL COMMENT '商品ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, product_id) COMMENT '同一用户不能重复收藏同一商品'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- ============================================
-- 插入测试用户（密码均为 123456 的bcrypt加密值）
-- ============================================
INSERT INTO users (username, password, nickname, phone, role) VALUES
  ('admin', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Oa5F.HEmT8fGVo7WVnJvQOJ9q', '管理员小蓝', '13800000000', 'admin'),
  ('xiaoming', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Oa5F.HEmT8fGVo7WVnJvQOJ9q', '小明同学', '13900000001', 'user'),
  ('xiaohong', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Oa5F.HEmT8fGVo7WVnJvQOJ9q', '小红同学', '13900000002', 'user');

-- 插入测试商品
INSERT INTO products (title, description, price, original_price, category_id, seller_id, campus_area, `condition`, `status`) VALUES
  ('八成新《JavaScript高级程序设计》', '经典红宝书，前端必读。书角有轻微折痕，内页干净无笔记，适合自学。', 35.00, 99.00, 2, 2, '东校区', '轻微使用', '在售'),
  ('罗技K380蓝牙键盘 白色', '用了半年，换了机械键盘所以出。成色很好，电池仓干净，送两节新电池。', 79.00, 199.00, 1, 2, '西校区', '几乎全新', '在售'),
  ('宿舍用小台灯 LED护眼', '可调节亮度，暖光不伤眼。毕业清仓，功能完好。', 25.00, 69.00, 3, 3, '东校区', '正常使用', '在售'),
  ('小米手环6 NFC版', '功能正常，表带有使用痕迹。NFC刷门禁刷公交超方便。', 68.00, 279.00, 1, 3, '北校区', '正常使用', '在售'),
  ('全新未拆封《三体》套装', '买重了，全新未拆，三本一套不单卖。科幻迷必入。', 45.00, 99.00, 2, 2, '东校区', '全新', '在售'),
  ('九成新尤克里里', '头脑发热买的，弹了不到五次，音色很好送调音器和教材。', 120.00, 350.00, 6, 3, '西校区', '几乎全新', '在售');
  
mysql -u root -p123123 campus_trade -e "UPDATE products SET images = '[\"/uploads/book.jpg\"]' WHERE id = 1"
