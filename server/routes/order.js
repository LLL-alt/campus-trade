// ============================================
// 支持创建订单、确认、完成、取消、列表查询
// ============================================
const router = require('express').Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

/**
 * 生成订单编号（格式：CT + 日期 + 序号）
 */
async function generateOrderNo() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM orders WHERE order_no LIKE ?",
    [`CT${date}%`]
  );
  const seq = String((rows[0].cnt || 0) + 1).padStart(4, '0');
  return `CT${date}${seq}`;
}

/**
 * POST /api/order/create — 创建订单（买家下单）
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { product_id, trade_location, trade_time, buyer_remark } = req.body;

    if (!product_id) {
      return res.json({ code: 400, message: '请选择要购买的商品' });
    }

    // 查询商品信息
    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND status = ?',
      [product_id, '在售']
    );
    if (products.length === 0) {
      return res.json({ code: 404, message: '该商品已售出或下架' });
    }

    const product = products[0];

    // 不能买自己的商品
    if (product.seller_id === req.user.id) {
      return res.json({ code: 400, message: '不能购买自己发布的商品哦~ 😅' });
    }

    // 防止重复下单
    const [dup] = await pool.query(
      'SELECT id FROM orders WHERE product_id = ? AND buyer_id = ? AND status != ?',
      [product_id, req.user.id, '已取消']
    );
    if (dup.length > 0) {
      return res.json({ code: 400, message: '你已经对该商品下过单了，请耐心等待卖家确认~' });
    }

    const orderNo = await generateOrderNo();

    const [result] = await pool.query(
      `INSERT INTO orders (order_no, product_id, buyer_id, seller_id, amount, trade_location, trade_time, buyer_remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNo, product_id, req.user.id, product.seller_id, product.price, trade_location || product.trade_location || '', trade_time || '', buyer_remark || '']
    );

    // 商品状态改为已售出（锁定）
    await pool.query('UPDATE products SET status = ? WHERE id = ?', ['已售出', product_id]);

    res.json({ code: 200, message: '下单成功！等待卖家确认~ 🎉', data: { order_no: orderNo, id: result.insertId } });
  } catch (err) {
    console.error('创建订单错误:', err);
    res.status(500).json({ code: 500, message: '下单失败' });
  }
});

/**
 * GET /api/order/list — 我的订单列表（买家视角 + 卖家视角）
 * Query: { type: 'buy' | 'sell', status: '待确认'|'已确认'|'交易完成'|'已取消' }
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { type = 'buy', status, page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let sql, params = [];

    if (type === 'sell') {
      // 我卖出的订单
      sql = `
        SELECT o.*, p.title AS product_title, p.images AS product_images,
               u.nickname AS buyer_name
        FROM orders o
        JOIN products p ON o.product_id = p.id
        JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = ?`;
      params.push(req.user.id);
    } else {
      // 我买入的订单
      sql = `
        SELECT o.*, p.title AS product_title, p.images AS product_images,
               u.nickname AS seller_name
        FROM orders o
        JOIN products p ON o.product_id = p.id
        JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ?`;
      params.push(req.user.id);
    }

    if (status) { sql += ' AND o.status = ?'; params.push(status); }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));

    const [rows] = await pool.query(sql, params);

    // 统计各状态数量
    let countSql = sql.replace(/o\.\*.*?FROM/, 'SELECT COUNT(*) AS total FROM').replace(/ ORDER BY.*/, '').replace(/ LIMIT.*/, '');
    const pureCountSql = countSql.includes('SELECT COUNT') ? countSql :
      (type === 'sell'
        ? `SELECT COUNT(*) AS total FROM orders o WHERE o.seller_id = ?${status ? ' AND o.status = ?' : ''}`
        : `SELECT COUNT(*) AS total FROM orders o WHERE o.buyer_id = ?${status ? ' AND o.status = ?' : ''}`);
    const [countResult] = await pool.query(pureCountSql, status ? [req.user.id, status] : [req.user.id]);

    res.json({
      code: 200,
      data: {
        list: rows.map(o => ({ ...o, product_images: JSON.parse(o.product_images || '[]') })),
        total: countResult[0].total
      }
    });
  } catch (err) {
    console.error('订单列表错误:', err);
    res.status(500).json({ code: 500, message: '获取订单列表失败' });
  }
});

/**
 * GET /api/order/detail/:id — 订单详情
 */
router.get('/detail/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, p.title AS product_title, p.images AS product_images, p.description AS product_desc,
              buyer.nickname AS buyer_name, buyer.phone AS buyer_phone,
              seller.nickname AS seller_name, seller.phone AS seller_phone
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users buyer ON o.buyer_id = buyer.id
       JOIN users seller ON o.seller_id = seller.id
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) return res.json({ code: 404, message: '订单不存在' });

    // 验证访问权限
    const order = rows[0];
    if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.json({ code: 403, message: '无权查看此订单' });
    }

    res.json({
      code: 200,
      data: { ...order, product_images: JSON.parse(order.product_images || '[]') }
    });
  } catch (err) {
    console.error('订单详情错误:', err);
    res.status(500).json({ code: 500, message: '获取订单详情失败' });
  }
});

/**
 * PUT /api/order/confirm/:id — 卖家确认订单
 */
router.put('/confirm/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.json({ code: 404, message: '订单不存在' });
    if (orders[0].seller_id !== req.user.id) return res.json({ code: 403, message: '只有卖家才能确认订单' });
    if (orders[0].status !== '待确认') return res.json({ code: 400, message: '当前订单状态不可确认' });

    await pool.query("UPDATE orders SET status = '已确认' WHERE id = ?", [id]);

    res.json({ code: 200, message: '订单已确认，请尽快与买家完成交易~ 🤝' });
  } catch (err) {
    console.error('确认订单错误:', err);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
});

/**
 * PUT /api/order/complete/:id — 交易完成（买家或卖家确认完成）
 */
router.put('/complete/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.json({ code: 404, message: '订单不存在' });
    if (orders[0].buyer_id !== req.user.id && orders[0].seller_id !== req.user.id) {
      return res.json({ code: 403, message: '无权操作此订单' });
    }
    if (orders[0].status !== '已确认') return res.json({ code: 400, message: '订单需要先确认才能完成' });

    await pool.query("UPDATE orders SET status = '交易完成' WHERE id = ?", [id]);

    res.json({ code: 200, message: '交易完成！感谢使用校园二手交易平台~ 🎉' });
  } catch (err) {
    console.error('完成订单错误:', err);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
});

/**
 * PUT /api/order/cancel/:id — 取消订单
 */
router.put('/cancel/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.json({ code: 404, message: '订单不存在' });
    if (orders[0].buyer_id !== req.user.id && orders[0].seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.json({ code: 403, message: '无权取消此订单' });
    }
    if (orders[0].status === '交易完成') {
      return res.json({ code: 400, message: '已完成的订单不能取消' });
    }

    await pool.query("UPDATE orders SET status = '已取消' WHERE id = ?", [id]);

    // 恢复商品为在售状态
    await pool.query("UPDATE products SET status = '在售' WHERE id = ?", [orders[0].product_id]);

    res.json({ code: 200, message: '订单已取消~' });
  } catch (err) {
    console.error('取消订单错误:', err);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
});

module.exports = router;
