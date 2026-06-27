// ============================================
// 校园二手交易平台 - Express 后端主入口
// 提供 RESTful API 服务
// ============================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// 引入路由模块
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const exportRoutes = require('./routes/export');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = 3001;

// ── 中间件配置 ──
app.use(cors());                          // 允许跨域
app.use(express.json());                  // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true }));

// ── 文件上传配置（商品图片） ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 限制5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

// 确保上传目录存在
require('fs').mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// ── 静态文件服务 ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── 文件上传接口 ──
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '上传失败，仅支持 jpg/png/gif/webp' });
  const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ code: 200, data: { url }, message: '上传成功' });
});

// ── 注册路由 ──
app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);

// ── 健康检查 ──
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: '🚀 校园二手交易平台运行中...' });
});

// ── 全局错误处理 ──
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// ── 启动服务 ──
app.listen(PORT, () => {
  console.log(`🌟 校园二手交易平台后端已启动: http://localhost:${PORT}`);
  console.log(`📡 API地址: http://localhost:${PORT}/api`);
});

module.exports = app;
