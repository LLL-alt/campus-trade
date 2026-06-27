// ============================================
// 数据库连接配置
// 使用 mysql2 连接 MySQL 8.0
// ============================================
const mysql = require('mysql2/promise');

// 数据库连接池 —— 重用连接，提高性能
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123123',
  database: 'campus_trade',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,      // 最大连接数
  queueLimit: 0,            // 排队不限
  charset: 'utf8mb4'        // 支持emoji
});

// 测试连接
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL 数据库连接成功！');
    conn.release();
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
    console.error('请确保MySQL已启动，且已执行 database/init.sql');
  });

module.exports = pool;
