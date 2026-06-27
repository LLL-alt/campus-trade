// ============================================
// 用户相关路由：注册、登录、个人信息
// ============================================
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken, authMiddleware } = require('../middleware/auth');

/**
 * POST /api/user/register — 用户注册
 * Body: { username, password, nickname, phone }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname, phone } = req.body;

    // 参数校验
    if (!username || !password || !nickname) {
      return res.json({ code: 400, message: '用户名、密码和昵称不能为空' });
    }
    if (password.length < 6) {
      return res.json({ code: 400, message: '密码长度不能少于6位' });
    }

    // 检查用户名是否已存在
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
      return res.json({ code: 400, message: '该用户名已被注册' });
    }

    // 密码加密
    const hashedPwd = await bcrypt.hash(password, 10);

    // 插入用户
    const [result] = await pool.query(
      'INSERT INTO users (username, password, nickname, phone) VALUES (?, ?, ?, ?)',
      [username, hashedPwd, nickname, phone || '']
    );

    // 生成 token
    const token = generateToken({ id: result.insertId, username, role: 'user' });

    res.json({
      code: 200,
      message: '注册成功！欢迎加入校园二手交易~ 🎉',
      data: {
        token,
        user: { id: result.insertId, username, nickname, role: 'user', phone: phone || '' }
      }
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ code: 500, message: '注册失败，请稍后重试' });
  }
});

/**
 * POST /api/user/login — 用户登录
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ code: 400, message: '请输入用户名和密码' });
    }

    // 查找用户
    const [rows] = await pool.query(
      'SELECT id, username, password, nickname, phone, role FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }

    const user = rows[0];

    // 验证密码
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }

    // 生成 token
    const token = generateToken(user);

    res.json({
      code: 200,
      message: '登录成功！欢迎回来~ 👋',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ code: 500, message: '登录失败，请稍后重试' });
  }
});

/**
 * GET /api/user/info — 获取当前登录用户信息
 */
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, nickname, avatar, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 200, data: rows[0] });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ code: 500, message: '获取用户信息失败' });
  }
});

/**
 * PUT /api/user/info — 更新个人信息
 */
router.put('/info', authMiddleware, async (req, res) => {
  try {
    const { nickname, phone } = req.body;
    await pool.query(
      'UPDATE users SET nickname = ?, phone = ? WHERE id = ?',
      [nickname || '', phone || '', req.user.id]
    );
    res.json({ code: 200, message: '个人信息更新成功~ ✨' });
  } catch (err) {
    console.error('更新用户信息错误:', err);
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

module.exports = router;
