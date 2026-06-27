<template>
  <!-- ============================================
       我的发布页面
       管理自己发布的商品：编辑、下架、删除
  ============================================ -->
  <div class="my-products-page">
    <h2 class="page-title">📦 我的发布</h2>

    <div v-if="loading" class="loading-center">
      <el-icon class="is-loading" :size="36"><Loading /></el-icon>
    </div>

    <div v-else-if="products.length === 0" class="empty-state">
      <span class="icon">📦</span>
      <span class="text">还没有发布过商品哦~</span>
      <router-link to="/publish">
        <el-button type="primary" style="margin-top:16px">去发布 🚀</el-button>
      </router-link>
    </div>

    <div v-else class="product-list">
      <el-card v-for="product in products" :key="product.id" class="product-card">
        <div class="product-row">
          <img :src="product.images?.[0] || '/uploads/default-product.png'" class="product-img" />
          <div class="product-info">
            <router-link :to="`/product/${product.id}`" class="product-title">{{ product.title }}</router-link>
            <p class="product-meta">
              <span class="cute-badge blue">{{ product.category_name }}</span>
              <span class="cute-badge orange">{{ product.condition }}</span>
              <span>{{ product.campus_area }}</span>
            </p>
            <p class="product-time">发布于 {{ product.created_at }}</p>
          </div>
          <div class="product-price">
            <span class="price-tag">{{ product.price }}</span>
            <el-tag :type="statusColor(product.status)" size="small">{{ product.status }}</el-tag>
          </div>
          <div class="product-actions">
            <router-link :to="`/publish?edit=${product.id}`">
              <el-button size="small">✏️ 编辑</el-button>
            </router-link>
            <el-button
              v-if="product.status === '在售'"
              size="small" type="warning"
              @click="handleOffline(product)"
            >下架</el-button>
            <el-button size="small" type="danger" @click="handleDelete(product)">🗑 删除</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
// ============================================
// 我的发布逻辑
// 加载、下架、删除商品
// ============================================
import { ref, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyProducts, updateProduct, deleteProduct } from '../api'

const products = ref([])
const loading = ref(false)

onMounted(() => { loadProducts() })

async function loadProducts() {
  loading.value = true
  try {
    const res = await getMyProducts()
    if (res.data.code === 200) products.value = res.data.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function handleOffline(product) {
  try {
    await ElMessageBox.confirm('确定下架这个商品？', '提示', { type: 'warning' })
    const res = await updateProduct(product.id, { ...product, status: '已下架' })
    if (res.data.code === 200) { ElMessage.success('商品已下架'); loadProducts() }
    else ElMessage.error(res.data.message)
  } catch (e) { /* 取消 */ }
}

async function handleDelete(product) {
  try {
    await ElMessageBox.confirm('删除后不可恢复，确定删除？', '警告', { type: 'error' })
    const res = await deleteProduct(product.id)
    if (res.data.code === 200) { ElMessage.success(res.data.message); loadProducts() }
    else ElMessage.error(res.data.message)
  } catch (e) { /* 取消 */ }
}

function statusColor(status) {
  const map = { '在售': 'success', '已售出': 'info', '已下架': 'warning' }
  return map[status] || 'info'
}
</script>

<style scoped>
.my-products-page { max-width: 900px; margin: 0 auto; padding: 10px 0; }
.product-list { display: flex; flex-direction: column; gap: 12px; }
.product-card :deep(.el-card__body) { padding: 16px; }
.product-row {
  display: flex; align-items: center; gap: 16px;
}
.product-img {
  width: 80px; height: 80px;
  border-radius: 8px; object-fit: cover;
}
.product-info { flex: 1; min-width: 0; }
.product-title {
  font-size: 15px; font-weight: 600;
  color: var(--text);
}
.product-meta {
  display: flex; gap: 8px; align-items: center;
  margin: 6px 0;
  font-size: 12px; color: var(--text-light);
}
.product-time { font-size: 11px; color: #bbb; }
.product-price {
  display: flex; flex-direction: column;
  align-items: flex-end; gap: 6px;
  flex-shrink: 0;
}
.product-actions {
  display: flex; flex-direction: column;
  gap: 6px; flex-shrink: 0;
}
@media (max-width: 768px) {
  .product-row { flex-wrap: wrap; }
}
</style>
