<template>
  <!-- ============================================
       首页 —— 商品展示、分类筛选、搜索
       包含：轮播Banner、分类标签、商品卡片网格、分页
  ============================================ -->
  <div class="home-page">
    <!-- 可爱的Banner区域 -->
    <div class="hero-banner">
      <div class="banner-content">
        <h1>🔄 校园二手交易平台</h1>
        <p>让闲置流转，让温暖传递 💙 在这里发现学长学姐的宝藏好物~</p>
        <div class="banner-stats">
          <div class="stat-item"><span class="num">📦</span> 海量好物</div>
          <div class="stat-item"><span class="num">🤝</span> 当面交易</div>
          <div class="stat-item"><span class="num">🛡️</span> 安全可靠</div>
        </div>
      </div>
      <!-- 波浪分隔 -->
      <div class="banner-wave">
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none"><path d="M0,20 C300,0 600,40 900,20 C1050,10 1150,15 1200,20 L1200,40 L0,40 Z" fill="#F5F7FB"/></svg>
      </div>
    </div>

    <div class="container">
      <!-- 分类标签 -->
      <div class="category-tabs">
        <button
          :class="['cat-btn', { active: !currentCategory }]"
          @click="switchCategory(null)"
        >🌟 全部</button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="['cat-btn', { active: currentCategory === cat.id }]"
          @click="switchCategory(cat.id)"
        >
          <span>{{ cat.icon }}</span> {{ cat.name }}
        </button>
      </div>

      <!-- 排序 -->
      <div class="sort-bar">
        <span class="total-text">共 <b>{{ total }}</b> 件宝贝</span>
        <div class="sort-options">
          <button :class="{ active: sort === 'newest' }" @click="changeSort('newest')">🕐 最新</button>
          <button :class="{ active: sort === 'price_asc' }" @click="changeSort('price_asc')">💰 价格↑</button>
          <button :class="{ active: sort === 'price_desc' }" @click="changeSort('price_desc')">💰 价格↓</button>
        </div>
      </div>

      <!-- 商品网格 -->
      <div v-if="loading" class="loading-center">
        <el-icon class="is-loading" :size="36"><Loading /></el-icon>
      </div>

      <div v-else-if="products.length === 0" class="empty-state">
        <span class="icon">📭</span>
        <span class="text">暂无商品，快去发布第一件宝贝吧~</span>
      </div>

      <div v-else class="card-grid">
        <el-card v-for="product in products" :key="product.id" shadow="hover" class="product-card">
          <router-link :to="`/product/${product.id}`">
            <div class="product-image">
              <img :src="product.images?.[0] || '/uploads/default-product.png'" :alt="product.title" />
              <span class="condition-tag cute-badge blue">{{ product.condition }}</span>
            </div>
            <div class="product-info">
              <h3 class="product-title">{{ product.title }}</h3>
              <p class="product-meta">
                <span class="cute-badge orange">{{ product.category_name }}</span>
                <span class="seller">by {{ product.seller_name }}</span>
              </p>
              <div class="product-bottom">
                <span class="price-tag">{{ product.price }}</span>
                <span class="original-price" v-if="product.original_price">¥{{ product.original_price }}</span>
                <span class="views">👀 {{ product.view_count }}</span>
              </div>
            </div>
          </router-link>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="loadProducts"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
// ============================================
// 首页逻辑 —— 加载商品列表、分类筛选、搜索
// ============================================
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { getProducts, getCategories } from '../api'

const route = useRoute()
const router = useRouter()

const products = ref([])
const categories = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 12
const loading = ref(false)
const currentCategory = ref(null)
const sort = ref('newest')
const keyword = ref('')

// 监听路由 query 变化（关键词搜索 + 分类筛选）
watch(() => route.query, () => {
  keyword.value = route.query.keyword || ''
  currentCategory.value = route.query.category_id ? parseInt(route.query.category_id) : null
  page.value = 1
  loadProducts()
}, { deep: true })

// 加载分类
onMounted(async () => {
  try {
    const res = await getCategories()
    if (res.data.code === 200) categories.value = res.data.data
  } catch (e) { console.error(e) }
  // 读取URL参数
  keyword.value = route.query.keyword || ''
  currentCategory.value = route.query.category_id ? parseInt(route.query.category_id) : null
  loadProducts()
})

async function loadProducts() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize, sort: sort.value }
    if (currentCategory.value) params.category_id = currentCategory.value
    if (keyword.value) params.keyword = keyword.value
    const res = await getProducts(params)
    if (res.data.code === 200) {
      products.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function switchCategory(id) {
  currentCategory.value = id
  page.value = 1
  router.replace({ query: { ...route.query, category_id: id || undefined } })
  loadProducts()
}

function changeSort(s) {
  sort.value = s
  loadProducts()
}
</script>

<style scoped>
/* Banner */
.hero-banner {
  background: linear-gradient(135deg, #5B8DEF 0%, #7BA8FF 40%, #A0C4FF 70%, #C5DEFF 100%);
  padding: 50px 20px 0;
  text-align: center;
  position: relative;
  margin-bottom: -1px;
}
.banner-content h1 {
  font-size: 32px;
  color: #fff;
  font-weight: 800;
  text-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.banner-content p {
  font-size: 15px;
  color: rgba(255,255,255,0.9);
  margin: 10px 0 20px;
}
.banner-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
}
.stat-item {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.2);
  padding: 8px 20px;
  border-radius: 24px;
}
.stat-item .num { font-size: 20px; }
.banner-wave { margin-top: 20px; }

/* 分类标签 */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 24px 0;
}
.cat-btn {
  border: 2px solid var(--border);
  background: #fff;
  padding: 8px 18px;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  color: #666;
}
.cat-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.cat-btn.active {
  background: var(--primary-gradient);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(91,141,239,0.3);
}

/* 排序 */
.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.total-text { font-size: 14px; color: var(--text-light); }
.total-text b { color: var(--primary); }
.sort-options { display: flex; gap: 6px; }
.sort-options button {
  border: none;
  background: transparent;
  padding: 6px 14px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  color: #888;
  transition: all 0.2s;
}
.sort-options button:hover, .sort-options button.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

/* 商品卡片 */
.product-card {
  cursor: pointer;
}
.product-card a { color: inherit; text-decoration: none; }
.product-image {
  height: 200px;
  overflow: hidden;
  position: relative;
  background: #f0f4fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}
.product-card:hover .product-image img { transform: scale(1.06); }
.condition-tag {
  position: absolute;
  top: 10px;
  right: 10px;
}

.product-info { padding: 14px; }
.product-title {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}
.product-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.seller { font-size: 12px; color: var(--text-light); }
.product-bottom {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.views { font-size: 12px; color: #ccc; margin-left: auto; }

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-bottom: 20px;
}
</style>
