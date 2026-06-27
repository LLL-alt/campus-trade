// ============================================
// Vue 应用入口
// ============================================
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import './assets/styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 等待路由就绪后再挂载
router.isReady().then(() => {
  app.mount('#app')
})
