<template>
  <!-- ============================================
       注册页面
       包含：表单验证、密码确认、手机号格式校验
  ============================================ -->
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <span class="auth-icon">🎉</span>
        <h2>加入我们~</h2>
        <p>注册校园二手交易平台账号，开启闲置交易之旅</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleRegister">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="设置登录用户名" :prefix-icon="User" size="large" />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="怎么称呼你？" :prefix-icon="UserFilled" size="large" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="至少6位密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>

        <el-form-item label="确认密码" prop="repassword">
          <el-input v-model="form.repassword" type="password" placeholder="再次输入密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="手机号（选填）" :prefix-icon="Phone" size="large" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" class="submit-btn" @click="handleRegister">
            {{ loading ? '注册中...' : '注 册 🎉' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        <span>已有账号？</span>
        <router-link to="/login">去登录 👈</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// ============================================
// 注册逻辑 —— 密码一致性校验 + 手机号格式校验
// ============================================
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, UserFilled, Lock, Phone } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  nickname: '',
  password: '',
  repassword: '',
  phone: ''
})

// 密码一致性校验
const validateRepassword = (rule, value, callback) => {
  if (value !== form.password) callback(new Error('两次密码输入不一致'))
  else callback()
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 1, max: 20, message: '用户名长度1-20位', trigger: 'blur' }
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  repassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateRepassword, trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$|^$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

async function handleRegister() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const result = await userStore.register(form.username, form.password, form.nickname, form.phone)
    if (result.success) {
      ElMessage.success(result.message)
      router.push('/')
    } else {
      ElMessage.error(result.message)
    }
  } catch (e) {
    ElMessage.error('注册失败，请检查网络连接')
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
  padding: 36px 40px;
  width: 440px;
  max-width: 90vw;
}
.auth-header {
  text-align: center;
  margin-bottom: 26px;
}
.auth-icon { font-size: 48px; display: block; margin-bottom: 8px; }
.auth-header h2 { font-size: 24px; font-weight: 700; }
.auth-header p { font-size: 13px; color: var(--text-light); margin-top: 4px; }
.submit-btn { width: 100%; height: 44px; font-size: 16px; font-weight: 600; }
.auth-footer { text-align: center; font-size: 14px; color: var(--text-light); margin-top: 8px; }
.auth-footer a { color: var(--primary); font-weight: 600; }
</style>
