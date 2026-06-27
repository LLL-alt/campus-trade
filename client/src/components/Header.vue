<template>
  <!-- ============================================
       顶部导航栏 —— 蓝色卡通风格
       Logo + 搜索 + 用户菜单
  ============================================ -->
  <header class="app-header">
    <div class="header-container">
      <router-link to="/" class="logo-area">
        <span class="logo-icon">🔄</span>
        <span class="logo-text">校园二手</span>
      </router-link>

      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="keyword"
          placeholder="搜索你想要的宝贝..."
          size="default"
          @keyup.enter="doSearch"
          class="search-input"
          clearable
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <!-- 右侧操作区 -->
      <div class="header-actions">
        <router-link to="/publish" class="btn-publish" v-if="userStore.isLoggedIn">
          <el-icon><Plus /></el-icon>
          <span>发布</span>
        </router-link>

        <router-link to="/cart" class="cart-icon" v-if="userStore.isLoggedIn">
          <el-badge :value="cartStore.totalCount" :hidden="cartStore.totalCount === 0" class="cart-badge">
            <el-icon :size="22"><ShoppingCart /></el-icon>
          </el-badge>
        </router-link>

        <template v-if="userStore.isLoggedIn">
          <el-dropdown trigger="click">
            <div class="user-avatar">
              <el-avatar :size="34" icon="UserFilled" class="avatar-icon" />
              <span class="user-name">{{ userStore.userInfo?.nickname || '用户' }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <router-link to="/user"><el-dropdown-item>个人中心</el-dropdown-item></router-link>
                <router-link to="/user/products"><el-dropdown-item>我的发布</el-dropdown-item></router-link>
                <router-link to="/orders"><el-dropdown-item>我的订单</el-dropdown-item></router-link>
                <router-link to="/admin" v-if="userStore.userInfo?.role === 'admin'"><el-dropdown-item>🛡️ 管理后台</el-dropdown-item></router-link>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template v-else>
          <router-link to="/login" class="btn-login">
            <el-button type="primary" round size="small">登录</el-button>
          </router-link>
          <router-link to="/register" class="btn-register">
            <el-button round size="small">注册</el-button>
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, ShoppingCart } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const keyword = ref('')

// 页面刷新时恢复用户信息
onMounted(async () => {
  if (userStore.isLoggedIn && !userStore.userInfo) {
    await userStore.fetchUserInfo()
  }
})

// 搜索：跳转首页并带上 keyword 参数
function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  router.push({ path: '/', query: { keyword: kw } })
}

function handleLogout() {
  userStore.logout()
  cartStore.clearCart()
  router.push('/')
}
</script>

<style scoped>
.app-header {
  position: sticky; top: 0; z-index: 1000;
  background: #fff;
  box-shadow: 0 2px 12px rgba(91, 141, 239, 0.12);
  border-bottom: 3px solid #5B8DEF;
}
.header-container {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center;
  padding: 0 20px; height: 60px; gap: 16px;
}
.logo-area { display: flex; align-items: center; gap: 6px; text-decoration: none; flex-shrink: 0; }
.logo-icon { font-size: 28px; }
.logo-text { font-size: 20px; font-weight: 800; color: #5B8DEF; letter-spacing: 1px; }

.search-box { flex: 1; max-width: 360px; }
.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  background: #F5F7FB;
  box-shadow: none;
  border: 2px solid transparent;
  transition: all 0.3s;
}
.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #5B8DEF;
  box-shadow: 0 0 0 3px rgba(91, 141, 239, 0.1);
}

.header-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; flex-shrink: 0; }
.btn-publish {
  display: flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, #FFB74D, #FF9800);
  color: #fff; padding: 6px 16px; border-radius: 20px;
  text-decoration: none; font-size: 13px; font-weight: 600;
  transition: all 0.2s;
}
.btn-publish:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3); }
.cart-icon { color: #666; text-decoration: none; padding: 6px; border-radius: 50%; transition: all 0.2s; }
.cart-icon:hover { background: #EBF1FB; color: #5B8DEF; }

.user-avatar {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; padding: 4px 8px; border-radius: 20px;
}
.user-avatar:hover { background: #EBF1FB; }
.user-name { font-size: 13px; color: #333; font-weight: 500; }

.btn-login, .btn-register { text-decoration: none; }

@media (max-width: 768px) { .logo-text { display: none; } .search-box { max-width: 160px; } }
</style>
