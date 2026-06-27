<template>
  <!-- ============================================
       购物车页面
       展示已收藏的商品，支持一键下单
       同步 location_type：卖家指定地点则只读显示
  ============================================ -->
  <div class="cart-page">
    <h2 class="page-title">🛒 我的购物车</h2>

    <div v-if="cartStore.items.length === 0" class="empty-state">
      <span class="icon">🛒</span>
      <span class="text">购物车空空如也~ 去逛逛发现好物吧！</span>
      <router-link to="/">
        <el-button type="primary" style="margin-top:16px">去逛逛 🏃</el-button>
      </router-link>
    </div>

    <template v-else>
      <div class="cart-list">
        <el-card v-for="item in cartStore.items" :key="item.id" class="cart-item">
          <div class="item-main">
            <img :src="item.images?.[0] || '/uploads/default-product.png'" class="item-image" />
            <div class="item-info">
              <router-link :to="`/product/${item.id}`" class="item-title">{{ item.title }}</router-link>
              <p class="item-seller">卖家：{{ item.seller_name }}</p>
            </div>
            <div class="item-price">
              <span class="price-tag">{{ item.price }}</span>
            </div>
            <div class="item-actions">
              <el-button type="primary" size="default" @click="handleBuy(item)">⚡ 立即购买</el-button>
              <el-button size="default" @click="cartStore.removeFromCart(item.id)">🗑 移出</el-button>
            </div>
          </div>

          <!-- 下单弹窗 -->
          <el-dialog v-model="dialogs[item.id]" title="📋 确认下单" width="580px" destroy-on-close :append-to-body="true">
            <el-form label-position="top">

              <!-- 卖家已指定地点：只读 -->
              <el-form-item v-if="itemDetails[item.id]?.location_type === 'seller' && itemDetails[item.id]?.trade_location" label="交易地点（卖家已指定）">
                <el-input :model-value="itemDetails[item.id].trade_location" disabled />
              </el-form-item>

              <!-- 买家自己选 -->
              <el-form-item v-else label="交易地点（点击地图选择）">
                <MapPicker v-model="orderLocations[item.id]" />
              </el-form-item>

              <el-form-item label="交易时间">
                <el-input v-model="orderForms[item.id].trade_time" placeholder="如：明天下午3点" />
              </el-form-item>
              <el-form-item label="留言">
                <el-input v-model="orderForms[item.id].buyer_remark" type="textarea" :rows="2" placeholder="给卖家留言..." />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="dialogs[item.id] = false">取消</el-button>
              <el-button type="primary" :loading="buying === item.id" @click="confirmBuy(item)">确认下单 💰</el-button>
            </template>
          </el-dialog>
        </el-card>
      </div>
    </template>
  </div>
</template>

<script setup>
// ============================================
// 购物车逻辑 —— 同步 location_type
// ============================================
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import MapPicker from '../components/MapPicker.vue'
import { createOrder, getProductDetail } from '../api'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const dialogs = reactive({})
const orderForms = reactive({})
const orderLocations = reactive({})
const itemDetails = reactive({})  // 缓存商品详情
const buying = ref(null)

// 点击购买：先加载商品详情（含 location_type），再弹窗
async function handleBuy(item) {
  // 初始化表单
  if (!orderForms[item.id]) {
    orderForms[item.id] = { trade_time: '', buyer_remark: '' }
  }
  if (!orderLocations[item.id]) {
    orderLocations[item.id] = { lng: null, lat: null, address: '' }
  }

  // 加载商品详情（获取 location_type 和 trade_location）
  if (!itemDetails[item.id]) {
    try {
      const res = await getProductDetail(item.id)
      if (res.data.code === 200) {
        itemDetails[item.id] = res.data.data
      }
    } catch (e) { console.error(e) }
  }

  dialogs[item.id] = true
}

async function confirmBuy(item) {
  buying.value = item.id
  try {
    const detail = itemDetails[item.id] || {}
    const form = orderForms[item.id] || {}
    const loc = orderLocations[item.id] || {}

    // 如果卖家指定了地点，用卖家的；否则用买家选的地点
    const tradeLoc = detail.location_type === 'seller'
      ? (detail.trade_location || '')
      : (loc.address || '')

    const res = await createOrder({
      product_id: item.id,
      trade_location: tradeLoc,
      trade_time: form.trade_time || '',
      buyer_remark: form.buyer_remark || ''
    })
    if (res.data.code === 200) {
      dialogs[item.id] = false
      cartStore.removeFromCart(item.id)
      delete itemDetails[item.id]
      ElMessage.success(res.data.message)
      router.push('/orders')
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (e) {
    ElMessage.error('下单失败，请重试')
  } finally {
    buying.value = null
  }
}
</script>

<style scoped>
.cart-page { max-width: 800px; margin: 0 auto; padding: 10px 0; }
.cart-list { display: flex; flex-direction: column; gap: 14px; }
.cart-item { padding: 0 !important; }
.cart-item :deep(.el-card__body) { padding: 16px; }
.item-main {
  display: flex; align-items: center; gap: 16px;
}
.item-image {
  width: 80px; height: 80px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}
.item-info { flex: 1; min-width: 0; }
.item-title {
  font-size: 15px; font-weight: 600;
  color: var(--text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  display: block; margin-bottom: 6px;
}
.item-seller { font-size: 12px; color: var(--text-light); }
.item-price { flex-shrink: 0; }
.item-actions { display: flex; gap: 8px; flex-shrink: 0; }
</style>
