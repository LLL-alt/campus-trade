<template>
  <!-- ============================================
       管理员后台
       包含：统计面板、用户管理、商品管理、订单管理
  ============================================ -->
  <div class="admin-page">
    <h2 class="page-title">🛡️ 管理后台</h2>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card blue"><span class="stat-num">{{ stats.userCount }}</span><span class="stat-label">👥 用户数</span></div>
      <div class="stat-card green"><span class="stat-num">{{ stats.productCount }}</span><span class="stat-label">📦 商品数</span></div>
      <div class="stat-card orange"><span class="stat-num">{{ stats.orderCount }}</span><span class="stat-label">📋 订单数</span></div>
      <div class="stat-card purple"><span class="stat-num">¥{{ stats.totalAmount }}</span><span class="stat-label">💰 交易总额</span></div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="用户管理" name="users">
        <el-table :data="users" stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="nickname" label="昵称" />
          <el-table-column prop="phone" label="手机号" />
          <el-table-column prop="role" label="角色" width="80" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="editUser(row)">编辑</el-button>
              <el-popconfirm title="确定删除？" @confirm="deleteUser(row.id)">
                <template #reference><el-button size="small" type="danger">删除</el-button></template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="商品管理" name="products">
        <el-table :data="products" stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="seller_name" label="卖家" width="100" />
          <el-table-column prop="price" label="价格" width="80" />
          <el-table-column prop="status" label="状态" width="80" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-popconfirm title="确定删除？" @confirm="deleteProduct(row.id)">
                <template #reference><el-button size="small" type="danger">删除</el-button></template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="订单管理" name="orders">
        <el-table :data="orders" stripe>
          <el-table-column prop="order_no" label="订单号" width="160" />
          <el-table-column prop="product_title" label="商品" />
          <el-table-column prop="buyer_name" label="买家" width="80" />
          <el-table-column prop="seller_name" label="卖家" width="80" />
          <el-table-column prop="amount" label="金额" width="80" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-select v-model="row.status" size="small" @change="updateOrderStatus(row)">
                <el-option label="待确认" value="待确认" />
                <el-option label="已确认" value="已确认" />
                <el-option label="交易完成" value="交易完成" />
                <el-option label="已取消" value="已取消" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 编辑用户弹窗 -->
    <el-dialog v-model="showEditUser" title="编辑用户" width="400px">
      <el-form :model="editUserForm" label-position="top">
        <el-form-item label="昵称"><el-input v-model="editUserForm.nickname" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="editUserForm.phone" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editUserForm.role"><el-option label="普通用户" value="user" /><el-option label="管理员" value="admin" /></el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditUser = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const request = axios.create({ baseURL: '/api' })
request.interceptors.request.use(c => {
  c.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
  return c
})

const activeTab = ref('users')
const stats = reactive({ userCount: 0, productCount: 0, orderCount: 0, totalAmount: 0 })
const users = ref([])
const products = ref([])
const orders = ref([])
const showEditUser = ref(false)
const editUserForm = reactive({ id: null, nickname: '', phone: '', role: 'user' })

onMounted(async () => {
  try {
    const [s, u, p, o] = await Promise.all([
      request.get('/admin/stats'), request.get('/admin/users'),
      request.get('/admin/products'), request.get('/admin/orders')
    ])
    Object.assign(stats, s.data.data)
    users.value = u.data.data
    products.value = p.data.data
    orders.value = o.data.data
  } catch (e) { console.error(e) }
})

function editUser(row) {
  editUserForm.id = row.id; editUserForm.nickname = row.nickname; editUserForm.phone = row.phone; editUserForm.role = row.role
  showEditUser.value = true
}
async function saveUser() {
  await request.put(`/admin/users/${editUserForm.id}`, { nickname: editUserForm.nickname, phone: editUserForm.phone, role: editUserForm.role })
  ElMessage.success('用户已更新'); showEditUser.value = false
  const u = await request.get('/admin/users'); users.value = u.data.data
}
async function deleteUser(id) {
  await request.delete(`/admin/users/${id}`)
  ElMessage.success('用户已删除')
  const u = await request.get('/admin/users'); users.value = u.data.data
}
async function deleteProduct(id) {
  await request.delete(`/admin/products/${id}`)
  ElMessage.success('商品已删除')
  const p = await request.get('/admin/products'); products.value = p.data.data
}
async function updateOrderStatus(row) {
  await request.put(`/admin/orders/${row.id}`, { status: row.status })
  ElMessage.success('订单状态已更新')
}
</script>

<style scoped>
.admin-page { max-width: 1100px; margin: 0 auto; padding: 10px 0; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { border-radius: 14px; padding: 20px; text-align: center; color: #fff; display: flex; flex-direction: column; gap: 6px; }
.stat-card.blue { background: linear-gradient(135deg, #5B8DEF, #7BA8FF); }
.stat-card.green { background: linear-gradient(135deg, #67C23A, #85CE61); }
.stat-card.orange { background: linear-gradient(135deg, #FFB74D, #FFA726); }
.stat-card.purple { background: linear-gradient(135deg, #9C27B0, #BA68C8); }
.stat-num { font-size: 28px; font-weight: 800; }
.stat-label { font-size: 13px; opacity: 0.9; }
@media (max-width: 600px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
</style>
