// ============================================
// Vue Router 路由配置
// 页面路由 + 登录鉴权守卫
// 使用静态导入，避免动态加载问题
// ============================================
import { createRouter, createWebHashHistory } from 'vue-router'

// 静态导入所有页面组件
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Publish from '../views/Publish.vue'
import Cart from '../views/Cart.vue'
import Orders from '../views/Orders.vue'
import UserCenter from '../views/UserCenter.vue'
import MyProducts from '../views/MyProducts.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/product/:id', name: 'ProductDetail', component: ProductDetail },
  { path: '/publish', name: 'Publish', component: Publish, meta: { requiresAuth: true } },
  { path: '/cart', name: 'Cart', component: Cart, meta: { requiresAuth: true } },
  { path: '/orders', name: 'Orders', component: Orders, meta: { requiresAuth: true } },
  { path: '/user', name: 'UserCenter', component: UserCenter, meta: { requiresAuth: true } },
  { path: '/user/products', name: 'MyProducts', component: MyProducts, meta: { requiresAuth: true } },
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard, meta: { requiresAuth: true, requiresAdmin: true } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫 —— 未登录重定向到登录页，管理员页面检查角色
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin) {
    // 简单解析 token 获取角色（非严格验证，后端会做双重校验）
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'admin') {
        next({ path: '/' })
      } else {
        next()
      }
    } catch (e) {
      next({ path: '/' })
    }
  } else {
    next()
  }
})

export default router
