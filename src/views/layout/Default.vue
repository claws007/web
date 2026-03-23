<template>
  <div class="layout-container">
    <!-- Navbar -->
    <header class="layout-header">
      <Navbar />
    </header>

    <!-- Main Content -->
    <main class="layout-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.layout-header {
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.layout-main {
  flex: 1;
  overflow: auto;
  padding: 24px;
}
</style>
