# 校园二手交易平台 🎒

基于 **Vue 3 + Element Plus + Express + MySQL** 的全栈二手商品交易网站，AI 辅助开发实践项目。

## ✨ 功能

- 📝 用户注册/登录（JWT + bcrypt）
- 📦 商品发布/编辑/删除/分类浏览/关键词搜索
- 🛒 购物车
- 📋 订单 CRUD（创建→确认→完成→取消）
- 🗺️ 高德地图交易地点选点
- 📊 Excel 订单导出（ExcelJS）
- 📄 PDF 交易凭证（PDFKit）
- 🛡️ 管理员后台（统计面板 + 用户/商品/订单管理）
- 🎨 蓝色卡通风格 UI

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3, Element Plus, Vue Router, Pinia, Axios, Vite |
| 后端 | Express, jsonwebtoken, bcryptjs, multer |
| 数据库 | MySQL 8.0 |
| 第三方 | 高德地图 JS API, ExcelJS, PDFKit |

## 🚀 快速启动

### 1. 环境要求

- Node.js >= 18
- MySQL >= 8.0

### 2. 配置高德地图

```bash
cd client
cp .env.example .env
```

编辑 `client/.env`，填入你的高德地图 Key 和安全密钥（[申请地址](https://console.amap.com)）：

```
VITE_AMAP_KEY=你的Key
VITE_AMAP_SECURITY_CODE=你的安全密钥
```

### 3. 初始化数据库

```bash
mysql -u root -p < database/init.sql
```

### 4. 启动

```bash
# 终端 1 —— 后端
cd server
npm install
node app.js          # 运行在 localhost:3001

# 终端 2 —— 前端
cd client
npm install
npx vite             # 运行在 localhost:5173
```

浏览器打开 `http://localhost:5173`

### 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 管理员 |
| xiaoming | 123456 | 用户 |
| xiaohong | 123456 | 用户 |

## 📁 项目结构

```
campus-trade/
├── client/                 Vue3 前端
│   ├── src/
│   │   ├── api/            Axios 封装
│   │   ├── router/         路由 + 守卫
│   │   ├── stores/         Pinia 状态管理
│   │   ├── components/     Header, Footer, MapPicker
│   │   └── views/          9 个页面
│   ├── .env.example        环境变量模板
│   └── vite.config.js
├── server/                 Express 后端
│   ├── routes/             user, product, order, export, admin
│   ├── config/db.js        MySQL 连接池
│   └── middleware/auth.js  JWT 认证
├── database/
│   └── init.sql            建表脚本
└── .gitignore
```

## 🤖 AI 开发说明

本项目使用 Claude Code 作为 AI 编程助手，通过结构化提示词驱动 AI 完成从架构设计到代码生成的全流程。详见实验报告。
