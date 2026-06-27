<template>
  <!-- ============================================
       页脚组件 —— 展示版权信息、项目说明
  ============================================ -->
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="brand-icon">🔄</span>
          <span class="brand-name">校园二手交易平台</span>
          <span class="brand-desc">让闲置流转，让温暖传递 💙</span>
        </div>
        <div class="footer-links">
          <div class="link-group">
            <h4>关于我们</h4>
            <span>校园二手交易平台致力于为同学们提供安全、便捷的二手交易服务。</span>
          </div>
          <div class="link-group">
            <h4>技术栈</h4>
            <span>Vue3 + Element Plus + Express + MySQL</span>
          </div>
          <div class="link-group">
            <h4>特色功能</h4>
            <span>高德地图 | Excel导出 | PDF凭证</span>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 校园二手交易平台 | AI工程师学院 Web开发技术综合实训</p>
      </div>
    </div>
    <!-- 波浪SVG装饰 -->
    <div class="wave-decoration">
      <svg viewBox="0 0 1200 30" preserveAspectRatio="none">
        <path d="M0,15 C200,0 400,30 600,15 C800,0 1000,30 1200,15 L1200,30 L0,30 Z" fill="#F5F7FB" />
      </svg>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: linear-gradient(180deg, #3B5E8D 0%, #2C4A6E 100%);
  color: #fff;
  margin-top: 60px;
  position: relative;
}
.wave-decoration {
  position: absolute; top: -29px; left: 0; right: 0;
  overflow: hidden; height: 30px;
}
.wave-decoration svg { width: 100%; height: 100%; }

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px 20px;
}
.footer-top {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 30px;
}
.footer-brand { display: flex; flex-direction: column; gap: 6px; }
.brand-icon { font-size: 32px; }
.brand-name { font-size: 18px; font-weight: 700; }
.brand-desc { font-size: 13px; color: rgba(255,255,255,0.7); }
.footer-links { display: flex; gap: 40px; flex-wrap: wrap; }
.link-group h4 {
  font-size: 14px; margin-bottom: 8px;
  display: flex; align-items: center; gap: 6px;
}
.link-group h4::before {
  content: ''; display: inline-block;
  width: 4px; height: 14px;
  background: var(--accent, #FFB74D);
  border-radius: 2px;
}
.link-group span { font-size: 13px; color: rgba(255,255,255,0.65); }
.footer-bottom {
  text-align: center;
  padding-top: 24px;
  margin-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.15);
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}
</style>
