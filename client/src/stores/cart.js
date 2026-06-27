// ============================================
// 购物车状态管理 (Pinia Store)
// localStorage 持久化，跨会话保留
// ============================================
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // ── 状态（从 localStorage 恢复） ──
  const items = ref(JSON.parse(localStorage.getItem('cart_items') || '[]'))

  // ── 计算属性 ──
  const totalCount = computed(() => items.value.length)

  // ── 持久化辅助 ──
  function save() {
    localStorage.setItem('cart_items', JSON.stringify(items.value))
  }

  // ── 方法 ──

  /** 加入购物车 */
  function addToCart(product) {
    if (!items.value.find(item => item.id === product.id)) {
      items.value.push(product)
      save()
    }
  }

  /** 从购物车移除 */
  function removeFromCart(productId) {
    items.value = items.value.filter(item => item.id !== productId)
    save()
  }

  /** 清空购物车 */
  function clearCart() {
    items.value = []
    save()
  }

  /** 判断是否在购物车中 */
  function isInCart(productId) {
    return items.value.some(item => item.id === productId)
  }

  return { items, totalCount, addToCart, removeFromCart, clearCart, isInCart }
})
