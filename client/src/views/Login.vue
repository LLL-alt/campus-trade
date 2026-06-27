<template>
  <!-- ============================================
       登录页面
       包含：表单验证、登录提交、跳转注册
  ============================================ -->
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <span class="auth-icon">🔐</span>
        <h2>欢迎回来~</h2>
        <p>登录你的校园二手交易平台账号</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="submit-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录 🚀' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        <span>还没有账号？</span>
        <router-link to="/register">立即注册 👈</router-link>
      </div>

      <!-- 测试账号提示 -->
      <div class="test-hint">
        <p>💡 测试账号：xiaoming / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// ============================================
// 登录逻辑 —— 表单验证 + 调用登录接口
// ============================================
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const result = await userStore.login(form.username, form.password)
    if (result.success) {
      ElMessage.success(result.message)
      // 跳转到登录前的页面或首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      ElMessage.error(result.message)
    }
  } catch (e) {
    ElMessage.error('登录失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 240px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #EBF1FB 0%, #F5F7FB 50%, #FFF3E0 100%);
}

.auth-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-hover);
  padding: 40px;
  width: 420px;
  max-width: 90vw;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}
.auth-icon { font-size: 48px; display: block; margin-bottom: 10px; }
.auth-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}
.auth-header p {
  font-size: 13px;
  color: var(--text-light);
  margin-top: 6px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--radius-sm) !important;
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: var(--text-light);
}
.auth-footer a {
  color: var(--primary);
  font-weight: 600;
}

.test-hint {
  margin-top: 16px;
  padding: 10px;
  background: var(--primary-light);
  border-radius: var(--radius-sm);
  text-align: center;
  font-size: 12px;
  color: var(--primary);
}
</style>
