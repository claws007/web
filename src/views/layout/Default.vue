<template>
  <AuroraBackground>
    <div class="size-full">
      <Navbar />
    </div>

    <!-- Main Content -->
    <main class="layout-main">
      <router-view />
    </main>
  </AuroraBackground>
</template>

<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
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
