// ============================================
// 管理员路由：用户/商品/订单管理 + 数据统计
// ============================================
const router = require('express').Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 管理员权限检查中间件
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.json({ code: 403, message: '需要管理员权限' });
  }
  next();
}

// ── 数据统计 ──
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[{ userCount }]] = await pool.query('SELECT COUNT(*) AS userCount FROM users');
    const [[{ productCount }]] = await pool.query('SELECT COUNT(*) AS productCount FROM products');
    const [[{ orderCount }]] = await pool.query('SELECT COUNT(*) AS orderCount FROM orders');
    const [[{ completedCount }]] = await pool.query("SELECT COUNT(*) AS completedCount FROM orders WHERE status = '交易完成'");
    const [[{ totalAmount }]] = await pool.query("SELECT COALESCE(SUM(amount), 0) AS totalAmount FROM orders WHERE status = '交易完成'");
    res.json({ code: 200, data: { userCount, productCount, orderCount, completedCount, totalAmount } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取统计失败' });
  }
});

// ── 用户管理 ──
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, nickname, phone, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取用户列表失败' });
  }
});

router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nickname, phone, role } = req.body;
    await pool.query('UPDATE users SET nickname=?, phone=?, role=? WHERE id=?', [nickname || '', phone || '', role || 'user', req.params.id]);
    res.json({ code: 200, message: '用户信息已更新' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.json({ code: 400, message: '不能删除自己' });
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '用户已删除' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

// ── 所有商品管理 ──
router.get('/products', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, u.nickname AS seller_name
       FROM products p LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN users u ON p.seller_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json({ code: 200, data: rows.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })) });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

router.put('/products/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, price, category_id, campus_area, condition, status } = req.body;
    await pool.query(
      `UPDATE products SET title=?, description=?, price=?, category_id=?, campus_area=?, \`condition\`=?, \`status\`=? WHERE id=?`,
      [title, description, price, category_id, campus_area, condition, status, req.params.id]
    );
    res.json({ code: 200, message: '商品已更新' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

router.delete('/products/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '商品已删除' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

// ── 所有订单管理 ──
router.get('/orders', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, p.title AS product_title,
              buyer.nickname AS buyer_name, seller.nickname AS seller_name
       FROM orders o JOIN products p ON o.product_id = p.id
       JOIN users buyer ON o.buyer_id = buyer.id
       JOIN users seller ON o.seller_id = seller.id
       ORDER BY o.created_at DESC`
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

router.put('/orders/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE orders SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ code: 200, message: '订单状态已更新' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

module.exports = router;
