<template>
  <div id="app-root">
    <Header />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
</script>

<style scoped>
.main-content {
  min-height: calc(100vh - 60px - 180px);
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>
