// ============================================
// 用户状态管理 (Pinia Store)
// 管理登录状态、用户信息、Token 持久化
// ============================================
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginAPI, register as registerAPI, getUserInfo } from '../api'

export const useUserStore = defineStore('user', () => {
  // ── 状态 ──
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)

  // ── 计算属性 ──
  const isLoggedIn = computed(() => !!token.value)

  // ── 方法 ──

  /** 用户登录 */
  async function login(username, password) {
    const res = await loginAPI({ username, password })
    if (res.data.code === 200) {
      token.value = res.data.data.token
      userInfo.value = res.data.data.user
      localStorage.setItem('token', token.value)
      return { success: true, message: res.data.message }
    }
    return { success: false, message: res.data.message }
  }

  /** 用户注册 */
  async function register(username, password, nickname, phone) {
    const res = await registerAPI({ username, password, nickname, phone })
    if (res.data.code === 200) {
      token.value = res.data.data.token
      userInfo.value = res.data.data.user
      localStorage.setItem('token', token.value)
      return { success: true, message: res.data.message }
    }
    return { success: false, message: res.data.message }
  }

  /** 拉取用户信息 */
  async function fetchUserInfo() {
    try {
      const res = await getUserInfo()
      if (res.data.code === 200) {
        userInfo.value = res.data.data
      }
    } catch (e) {
      console.error('获取用户信息失败', e)
    }
  }

  /** 更新个人信息 */
  async function updateInfo(data) {
    const { updateUserInfo } = await import('../api')
    await updateUserInfo(data)
    if (userInfo.value) {
      userInfo.value.nickname = data.nickname || userInfo.value.nickname
      userInfo.value.phone = data.phone || userInfo.value.phone
    }
  }

  /** 退出登录 */
  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return { token, userInfo, isLoggedIn, login, register, fetchUserInfo, updateInfo, logout }
})
