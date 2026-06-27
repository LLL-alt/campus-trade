// ============================================
// API 请求封装 — Axios 实例 + 所有接口函数
// ============================================
import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器 —— 自动附加 Token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 —— 统一错误处理
request.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── 用户相关 ───
export const login = (data) => request.post('/user/login', data)
export const register = (data) => request.post('/user/register', data)
export const getUserInfo = () => request.get('/user/info')
export const updateUserInfo = (data) => request.put('/user/info', data)

// ─── 商品相关 ───
export const getProducts = (params) => request.get('/product/list', { params })
export const getProductDetail = (id) => request.get(`/product/detail/${id}`)
export const createProduct = (data) => request.post('/product/create', data)
export const updateProduct = (id, data) => request.put(`/product/update/${id}`, data)
export const deleteProduct = (id) => request.delete(`/product/delete/${id}`)
export const getMyProducts = () => request.get('/product/my')

// ─── 分类 ───
export const getCategories = () => request.get('/product/categories')

// ─── 订单相关（核心 CRUD） ───
export const createOrder = (data) => request.post('/order/create', data)
export const getOrders = (params) => request.get('/order/list', { params })
export const getOrderDetail = (id) => request.get(`/order/detail/${id}`)
export const confirmOrder = (id) => request.put(`/order/confirm/${id}`)
export const completeOrder = (id) => request.put(`/order/complete/${id}`)
export const cancelOrder = (id) => request.put(`/order/cancel/${id}`)

// ─── 文件上传 ───
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const exportOrdersExcel = (type) => request.get('/export/orders-excel', {
  params: { type }, responseType: 'blob'
})
export const exportOrderPdf = (id) => request.get(`/export/order-pdf/${id}`, {
  responseType: 'blob'
})
