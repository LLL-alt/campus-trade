// ============================================
// 商品相关路由：CRUD、列表、搜索、详情
// ============================================
const router = require('express').Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/product/list — 商品列表（支持分类筛选、关键词搜索、排序）
 */
router.get('/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 12, category_id, keyword, sort = 'newest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let sql = `
      SELECT p.*, c.name AS category_name, u.nickname AS seller_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.status = '在售'
    `;
    const params = [];

    // 分类筛选
    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    // 关键词搜索（标题和描述）
    if (keyword) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 排序
    switch (sort) {
      case 'price_asc':  sql += ' ORDER BY p.price ASC'; break;
      case 'price_desc': sql += ' ORDER BY p.price DESC'; break;
      default:           sql += ' ORDER BY p.created_at DESC'; break;  // 默认最新
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));

    const [rows] = await pool.query(sql, params);

    // 统计总数
    let countSql = 'SELECT COUNT(*) AS total FROM products p WHERE p.status = ?';
    const countParams = ['在售'];
    if (category_id) { countSql += ' AND p.category_id = ?'; countParams.push(category_id); }
    if (keyword) { countSql += ' AND (p.title LIKE ? OR p.description LIKE ?)'; countParams.push(`%${keyword}%`, `%${keyword}%`); }

    const [countResult] = await pool.query(countSql, countParams);

    res.json({
      code: 200,
      data: {
        list: rows.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })),
        total: countResult[0].total
      }
    });
  } catch (err) {
    console.error('商品列表错误:', err);
    res.status(500).json({ code: 500, message: '获取商品列表失败' });
  }
});

/**
 * GET /api/product/detail/:id — 商品详情
 */
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 查询商品并关联卖家和分类信息
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, u.nickname AS seller_name, u.avatar AS seller_avatar
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.json({ code: 404, message: '商品不存在或已下架 😿' });
    }

    // 增加浏览次数
    await pool.query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);

    const product = {
      ...rows[0],
      images: JSON.parse(rows[0].images || '[]')
    };

    res.json({ code: 200, data: product });
  } catch (err) {
    console.error('商品详情错误:', err);
    res.status(500).json({ code: 500, message: '获取商品详情失败' });
  }
});

/**
 * POST /api/product/create — 发布商品（需登录）
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, original_price, category_id, images, campus_area, condition } = req.body;

    if (!title || !price || !category_id) {
      return res.json({ code: 400, message: '请填写商品标题、价格和分类' });
    }
    if (parseFloat(price) <= 0) {
      return res.json({ code: 400, message: '价格必须大于0' });
    }

    const [result] = await pool.query(
      `INSERT INTO products (title, description, price, original_price, category_id, seller_id, images, campus_area, \`condition\`, trade_location, location_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || '',
        price,
        original_price || null,
        category_id,
        req.user.id,
        JSON.stringify(images || []),
        campus_area || '',
        condition || '正常使用',
        req.body.trade_location || '',
        req.body.location_type || 'buyer'
      ]
    );

    res.json({ code: 200, message: '发布成功！🎉', data: { id: result.insertId } });
  } catch (err) {
    console.error('发布商品错误:', err);
    res.status(500).json({ code: 500, message: '发布失败，请稍后重试' });
  }
});

/**
 * PUT /api/product/update/:id — 更新商品（仅卖家本人）
 */
router.put('/update/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, original_price, category_id, images, campus_area, condition, status, trade_location, location_type } = req.body;

    // 验证所有权
    const [owner] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [id]);
    if (owner.length === 0) return res.json({ code: 404, message: '商品不存在' });
    if (owner[0].seller_id !== req.user.id) {
      return res.json({ code: 403, message: '只能修改自己发布的商品哦~' });
    }

    await pool.query(
      `UPDATE products SET title=?, description=?, price=?, original_price=?, category_id=?, images=?, campus_area=?, \`condition\`=?, \`status\`=?, trade_location=?, location_type=?
       WHERE id=?`,
      [title, description, price, original_price, category_id, JSON.stringify(images || []), campus_area, condition, status || '在售', trade_location || '', location_type || 'buyer', id]
    );

    res.json({ code: 200, message: '商品信息已更新~ ✨' });
  } catch (err) {
    console.error('更新商品错误:', err);
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

/**
 * DELETE /api/product/delete/:id — 删除商品（仅卖家本人或管理员）
 */
router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [owner] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [id]);
    if (owner.length === 0) return res.json({ code: 404, message: '商品不存在' });
    if (owner[0].seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.json({ code: 403, message: '无权删除此商品' });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ code: 200, message: '商品已删除~' });
  } catch (err) {
    console.error('删除商品错误:', err);
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

/**
 * GET /api/product/my — 我发布的商品（需登录）
 */
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({
      code: 200,
      data: rows.map(p => ({ ...p, images: JSON.parse(p.images || '[]') }))
    });
  } catch (err) {
    console.error('我的商品错误:', err);
    res.status(500).json({ code: 500, message: '获取失败' });
  }
});

/**
 * GET /api/product/categories — 获取所有分类
 */
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order');
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取分类失败' });
  }
});

module.exports = router;
