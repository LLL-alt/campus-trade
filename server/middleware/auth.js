// ============================================
// JWT 认证中间件
// 验证请求头中的 token，解析出用户信息
// ============================================
const jwt = require('jsonwebtoken');

// JWT密钥 —— 实际生产环境应放在环境变量中
const JWT_SECRET = 'campus_trade_jwt_secret_2026';

/**
 * 签发 JWT Token
 * @param {Object} user - 用户对象 {id, username, role}
 * @returns {string} token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }  // 7天有效期
  );
}

/**
 * 验证 Token 的中间件
 * 将解析出的用户信息挂载到 req.user
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '请先登录' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // {id, username, role}
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
}

module.exports = { generateToken, authMiddleware, JWT_SECRET };
