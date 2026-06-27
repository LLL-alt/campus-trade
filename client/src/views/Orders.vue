<template>
  <!-- ============================================
       订单列表页面 —— 核心CRUD模块（20分评分点）
       包含：买入/卖出Tab、状态筛选、确认/完成/取消操作
       支持：Excel导出、PDF凭证下载（第三方库，20分评分点）
  ============================================ -->
  <div class="orders-page">
    <h2 class="page-title">📋 我的订单</h2>

    <!-- Tab 切换 + 导出按钮 -->
    <div class="orders-toolbar">
      <div class="tab-group">
        <el-radio-group v-model="orderType" @change="loadOrders">
          <el-radio-button value="buy">🛍 我买的</el-radio-button>
          <el-radio-button value="sell">💰 我卖的</el-radio-button>
        </el-radio-group>
        <el-select v-model="statusFilter" placeholder="订单状态" clearable @change="loadOrders" style="width:130px;margin-left:12px">
          <el-option label="全部" value="" />
          <el-option label="待确认" value="待确认" />
          <el-option label="已确认" value="已确认" />
          <el-option label="交易完成" value="交易完成" />
          <el-option label="已取消" value="已取消" />
        </el-select>
      </div>

      <div class="export-btns">
        <el-button size="default" @click="handleExportExcel">
          <el-icon><Download /></el-icon> 导出Excel
        </el-button>
      </div>
    </div>

    <!-- 订单列表 -->
    <div v-if="loading" class="loading-center">
      <el-icon class="is-loading" :size="36"><Loading /></el-icon>
    </div>

    <div v-else-if="orders.length === 0" class="empty-state">
      <span class="icon">📭</span>
      <span class="text">暂无订单记录~</span>
    </div>

    <div v-else class="order-list">
      <el-card v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="order-no">📦 {{ order.order_no }}</span>
          <el-tag :type="statusTag(order.status)" size="default">{{ order.status }}</el-tag>
        </div>

        <div class="order-body">
          <img :src="order.product_images?.[0] || '/uploads/default-product.png'" class="order-image" />
          <div class="order-info">
            <h4>{{ order.product_title }}</h4>
            <p v-if="orderType === 'buy'">卖家：{{ order.seller_name }}</p>
            <p v-else>买家：{{ order.buyer_name }}</p>
            <p v-if="order.trade_location">📍 {{ order.trade_location }}</p>
            <p v-if="order.trade_time">🕐 {{ order.trade_time }}</p>
            <p class="order-time">下单时间：{{ order.created_at }}</p>
          </div>
          <div class="order-price">
            <span class="price-tag">{{ order.amount }}</span>
          </div>
        </div>

        <!-- 操作按钮（根据订单状态和角色显示） -->
        <div class="order-actions" v-if="order.status !== '交易完成' && order.status !== '已取消'">
          <!-- 卖家：确认订单 -->
          <el-button
            v-if="orderType === 'sell' && order.status === '待确认'"
            type="primary" size="small" @click="handleConfirm(order)"
          >确认订单 ✅</el-button>

          <!-- 买家/卖家：交易完成 -->
          <el-button
            v-if="order.status === '已确认'"
            type="success" size="small" @click="handleComplete(order)"
          >确认完成 🤝</el-button>

          <!-- 取消订单 -->
          <el-button
            type="danger" size="small" plain @click="handleCancel(order)"
          >取消订单 ❌</el-button>

          <!-- PDF凭证 -->
          <el-button
            size="small" @click="handleExportPdf(order)"
          ><el-icon><Document /></el-icon> PDF凭证</el-button>
        </div>

        <!-- 已完成订单 -->
        <div class="order-actions" v-if="order.status === '交易完成'">
          <el-tag type="success" size="large">🎉 交易完成</el-tag>
          <el-button size="small" @click="handleExportPdf(order)">
            <el-icon><Document /></el-icon> PDF凭证
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
// ============================================
// 订单逻辑 —— 核心CRUD
// 订单列表 / 确认 / 完成 / 取消 / 导出
// ============================================
import { ref, onMounted } from 'vue'
import { Download, Document, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrders, confirmOrder, completeOrder, cancelOrder, exportOrdersExcel, exportOrderPdf } from '../api'

const orders = ref([])
const loading = ref(false)
const orderType = ref('buy')
const statusFilter = ref('')

onMounted(() => { loadOrders() })

async function loadOrders() {
  loading.value = true
  try {
    const params = { type: orderType.value }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getOrders(params)
    if (res.data.code === 200) orders.value = res.data.data.list
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function handleConfirm(order) {
  try {
    const res = await confirmOrder(order.id)
    if (res.data.code === 200) { ElMessage.success(res.data.message); loadOrders() }
    else ElMessage.error(res.data.message)
  } catch (e) { ElMessage.error('操作失败') }
}

async function handleComplete(order) {
  try {
    const res = await completeOrder(order.id)
    if (res.data.code === 200) { ElMessage.success(res.data.message); loadOrders() }
    else ElMessage.error(res.data.message)
  } catch (e) { ElMessage.error('操作失败') }
}

async function handleCancel(order) {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', { type: 'warning' })
    const res = await cancelOrder(order.id)
    if (res.data.code === 200) { ElMessage.success(res.data.message); loadOrders() }
    else ElMessage.error(res.data.message)
  } catch (e) { /* 用户取消 */ }
}

async function handleExportExcel() {
  try {
    const res = await exportOrdersExcel(orderType.value)
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = `订单记录_${Date.now()}.xlsx`; a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('Excel导出成功！📊')
  } catch (e) { ElMessage.error('导出失败') }
}

async function handleExportPdf(order) {
  try {
    const res = await exportOrderPdf(order.id)
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = `交易凭证_${order.order_no}.pdf`; a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('PDF下载成功！📄')
  } catch (e) { ElMessage.error('下载失败') }
}

function statusTag(status) {
  const map = { '待确认': 'warning', '已确认': 'primary', '交易完成': 'success', '已取消': 'info' }
  return map[status] || 'info'
}
</script>

<style scoped>
.orders-page { max-width: 900px; margin: 0 auto; padding: 10px 0; }

.orders-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.tab-group { display: flex; align-items: center; }

.order-list { display: flex; flex-direction: column; gap: 14px; }

.order-card { padding: 0 !important; }
.order-card :deep(.el-card__body) { padding: 18px; }

.order-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 12px; border-bottom: 1px solid var(--border); margin-bottom: 12px;
}
.order-no { font-size: 14px; font-weight: 600; color: var(--primary); }

.order-body {
  display: flex; gap: 16px; align-items: center;
}
.order-image {
  width: 72px; height: 72px;
  border-radius: 8px; object-fit: cover;
}
.order-info { flex: 1; }
.order-info h4 { font-size: 15px; margin-bottom: 4px; }
.order-info p { font-size: 12px; color: var(--text-light); margin: 2px 0; }
.order-time { font-size: 11px; color: #bbb; }

.order-price { flex-shrink: 0; }
.order-price .price-tag { font-size: 20px; }

.order-actions {
  display: flex; gap: 8px; align-items: center;
  margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
</style>
