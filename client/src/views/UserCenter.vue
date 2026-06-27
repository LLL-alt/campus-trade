<template>
  <!-- ============================================
       个人中心页面
       查看和编辑个人信息
  ============================================ -->
  <div class="user-page">
    <h2 class="page-title">👤 个人中心</h2>

    <el-row :gutter="24">
      <!-- 左侧导航 -->
      <el-col :span="6" :xs="24" class="sidebar-col">
        <el-card class="sidebar-card">
          <div class="user-avatar-area">
            <el-avatar :size="72" icon="UserFilled" />
            <h3>{{ userStore.userInfo?.nickname || '用户' }}</h3>
            <span class="role-badge cute-badge blue">{{ userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户' }}</span>
          </div>
          <el-menu :default-active="activeMenu" router class="side-menu">
            <el-menu-item index="/user">
              <el-icon><User /></el-icon> 个人信息
            </el-menu-item>
            <el-menu-item index="/user/products">
              <el-icon><Goods /></el-icon> 我的发布
            </el-menu-item>
            <el-menu-item index="/orders">
              <el-icon><List /></el-icon> 我的订单
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <!-- 右侧内容 -->
      <el-col :span="18" :xs="24">
        <el-card class="info-card">
          <h3 class="card-title">📝 编辑资料</h3>
          <el-form :model="form" label-position="top" style="max-width:460px">
            <el-form-item label="用户名">
              <el-input :model-value="userStore.userInfo?.username" disabled />
            </el-form-item>

            <el-form-item label="昵称">
              <el-input v-model="form.nickname" placeholder="设置你的昵称" maxlength="20" />
            </el-form-item>

            <el-form-item label="手机号">
              <el-input v-model="form.phone" placeholder="绑定手机号" />
            </el-form-item>

            <el-form-item label="注册时间">
              <el-input :model-value="userStore.userInfo?.created_at" disabled />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">
                {{ saving ? '保存中...' : '💾 保存修改' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// ============================================
// 个人中心逻辑
// 加载用户信息、编辑保存
// ============================================
import { ref, reactive, onMounted } from 'vue'
import { User, Goods, List } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const saving = ref(false)
const activeMenu = '/user'

const form = reactive({
  nickname: '',
  phone: ''
})

onMounted(async () => {
  await userStore.fetchUserInfo()
  form.nickname = userStore.userInfo?.nickname || ''
  form.phone = userStore.userInfo?.phone || ''
})

async function handleSave() {
  saving.value = true
  try {
    await userStore.updateInfo({ nickname: form.nickname, phone: form.phone })
    ElMessage.success('个人信息更新成功~ ✨')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.user-page { padding: 10px 0; }

.sidebar-card { text-align: center; }
.user-avatar-area { padding: 20px 0 10px; }
.user-avatar-area h3 { font-size: 16px; margin-top: 10px; }
.role-badge { margin-top: 6px; }
.side-menu { border-right: none; margin-top: 10px; }
.side-menu .el-menu-item { border-radius: 8px; margin: 4px 8px; }

.info-card { min-height: 360px; }
.card-title { font-size: 16px; font-weight: 600; margin-bottom: 20px; }

@media (max-width: 768px) {
  .sidebar-col { margin-bottom: 16px; }
}
</style>
