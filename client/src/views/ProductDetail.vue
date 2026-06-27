<template>
  <!-- ============================================
       商品详情页
       包含：图片轮播、商品信息、卖家信息、下单购买
  ============================================ -->
  <div class="detail-page" v-loading="loading">
    <template v-if="product">
      <el-row :gutter="24">
        <!-- 左侧 —— 商品图片 -->
        <el-col :span="12" :xs="24">
          <div class="image-section">
            <div class="main-image">
              <img :src="currentImage" :alt="product.title" />
            </div>
            <div class="image-list" v-if="product.images.length > 1">
              <img
                v-for="(img, i) in product.images"
                :key="i"
                :src="img"
                :class="{ active: img === currentImage }"
                @click="currentImage = img"
              />
            </div>
          </div>
        </el-col>

        <!-- 右侧 —— 商品信息 -->
        <el-col :span="12" :xs="24">
          <div class="info-section">
            <h1 class="product-title">{{ product.title }}</h1>

            <div class="price-row">
              <span class="price-tag" style="font-size: 28px;">{{ product.price }}</span>
              <span class="original-price" v-if="product.original_price" style="font-size: 16px;">
                ¥{{ product.original_price }}
              </span>
            </div>

            <div class="meta-tags">
              <span class="cute-badge blue">{{ product.category_name }}</span>
              <span class="cute-badge orange">{{ product.condition }}</span>
              <span class="cute-badge blue" v-if="product.campus_area">📍 {{ product.campus_area }}</span>
            </div>

            <!-- 分隔线 -->
            <el-divider />

            <!-- 卖家信息 -->
            <div class="seller-info">
              <el-avatar :size="40" icon="UserFilled" />
              <div class="seller-detail">
                <p class="seller-name">{{ product.seller_name }}</p>
                <p class="seller-extra">发布于 {{ formatDate(product.created_at) }}</p>
              </div>
            </div>

            <el-divider />

            <!-- 操作按钮 -->
            <div class="action-buttons" v-if="userStore.isLoggedIn && userStore.userInfo?.id !== product.seller_id">
              <el-button
                type="warning"
                size="large"
                @click="handleAddToCart"
                :disabled="cartStore.isInCart(product.id)"
                class="cart-btn"
              >
                {{ cartStore.isInCart(product.id) ? '已在购物车 ✔' : '🛒 加入购物车' }}
              </el-button>
              <el-button type="primary" size="large" @click="showOrderDialog = true" class="buy-btn">
                ⚡ 立即购买
              </el-button>
            </div>
            <div class="action-buttons" v-else-if="!userStore.isLoggedIn">
              <router-link to="/login">
                <el-button type="primary" size="large">登录后购买 👈</el-button>
              </router-link>
            </div>
            <div v-else class="self-hint">
              <el-tag type="info">这是你发布的商品~</el-tag>
            </div>

            <el-divider />

            <!-- 浏览次数 -->
            <p class="view-count">👀 已有 {{ product.view_count }} 次浏览</p>
          </div>
        </el-col>
      </el-row>

      <!-- 商品描述 -->
      <div class="desc-section">
        <h3>📝 商品描述</h3>
        <el-divider />
        <div class="desc-content">{{ product.description || '卖家很懒，什么都没写...' }}</div>
      </div>

      <!-- 下单弹窗 -->
      <el-dialog v-model="showOrderDialog" title="📋 确认下单" width="580px" destroy-on-close>
        <el-form :model="orderForm" label-position="top">

          <!-- 卖家已指定地点：只读显示 -->
          <el-form-item v-if="product.location_type === 'seller' && product.trade_location" label="交易地点（卖家已指定）">
            <el-input :model-value="product.trade_location" disabled />
          </el-form-item>

          <!-- 卖家未指定：买家自己选 -->
          <el-form-item v-else label="交易地点（点击地图选择）">
            <MapPicker v-model="orderLocation" />
          </el-form-item>

          <el-form-item label="交易时间">
            <el-input v-model="orderForm.trade_time" placeholder="如：明天下午3点" />
          </el-form-item>
          <el-form-item label="留言">
            <el-input v-model="orderForm.buyer_remark" type="textarea" :rows="2" placeholder="给卖家留言..." />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showOrderDialog = false">取消</el-button>
          <el-button type="primary" @click="handleBuy">确认下单 💰</el-button>
        </template>
      </el-dialog>
    </template>

    <!-- 商品不存在 -->
    <div v-else-if="!loading" class="empty-state">
      <span class="icon">😿</span>
      <span class="text">商品不存在或已下架</span>
    </div>
  </div>
</template>

<script setup>
// ============================================
// 商品详情逻辑
// 加载商品、加入购物车、立即下单
// ============================================
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import MapPicker from '../components/MapPicker.vue'
import { getProductDetail, createOrder } from '../api'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const product = ref(null)
const loading = ref(true)
const currentImage = ref('')
const showOrderDialog = ref(false)
const orderLocation = ref({ lng: null, lat: null, address: '' })

const orderForm = reactive({
  trade_location: '',
  trade_time: '',
  buyer_remark: ''
})

onMounted(async () => {
  try {
    const res = await getProductDetail(route.params.id)
    if (res.data.code === 200) {
      product.value = res.data.data
      currentImage.value = product.value.images?.[0] || ''
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function handleAddToCart() {
  if (!product.value) return
  cartStore.addToCart({
    id: product.value.id,
    title: product.value.title,
    price: product.value.price,
    images: product.value.images,
    seller_name: product.value.seller_name
  })
  ElMessage.success('已添加到购物车~ 🛒')
}

async function handleBuy() {
  try {
    // 如果卖家已指定地点，用卖家的；否则用买家选的
    const tradeLoc = product.value.location_type === 'seller'
      ? product.value.trade_location
      : (orderLocation.value.address || '')

    const res = await createOrder({
      product_id: product.value.id,
      trade_location: tradeLoc,
      trade_time: orderForm.trade_time,
      buyer_remark: orderForm.buyer_remark
    })
    if (res.data.code === 200) {
      showOrderDialog.value = false
      ElMessage.success(res.data.message)
      router.push('/orders')
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (e) {
    ElMessage.error('下单失败，请重试')
  }
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : ''
}
</script>

<style scoped>
.detail-page { padding: 10px 0; min-height: 400px; }

/* 图片区域 */
.image-section { position: sticky; top: 80px; }
.main-image {
  width: 100%;
  height: 380px;
  border-radius: var(--radius);
  overflow: hidden;
  background: #f0f4fa;
  display: flex; align-items: center; justify-content: center;
}
.main-image img {
  width: 100%; height: 100%; object-fit: cover;
}
.image-list {
  display: flex; gap: 8px; margin-top: 10px;
}
.image-list img {
  width: 60px; height: 60px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}
.image-list img.active { border-color: var(--primary); }
.image-list img:hover { border-color: var(--primary); }

/* 信息区域 */
.info-section { padding: 0 10px; }
.product-title { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
.price-row { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
.meta-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }

.seller-info {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; background: var(--primary-light); border-radius: var(--radius-sm);
}
.seller-name { font-weight: 600; }
.seller-extra { font-size: 12px; color: var(--text-light); }

.action-buttons { display: flex; gap: 12px; }
.cart-btn, .buy-btn { flex: 1; height: 44px; font-weight: 600; }
.buy-btn { background: linear-gradient(135deg, var(--primary), var(--primary-dark)) !important; border: none !important; }
.self-hint { text-align: center; padding: 16px; }

.view-count { font-size: 13px; color: var(--text-light); text-align: center; }

/* 描述区域 */
.desc-section { margin-top: 40px; }
.desc-section h3 { font-size: 18px; font-weight: 600; }
.desc-content {
  padding: 20px;
  background: #fff;
  border-radius: var(--radius);
  min-height: 100px;
  white-space: pre-wrap;
  line-height: 1.8;
}
</style>
