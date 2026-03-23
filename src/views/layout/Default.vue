<template>
  <div class="size-full v bg-[rgb(247 249 251)]">
    <Navbar />
    <div class="stretch overflow-auto">
      <!-- Main Content -->
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
</script>

<style scoped></style>
