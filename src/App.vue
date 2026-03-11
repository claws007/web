<script setup lang="ts">
import { ConfigProvider } from "ant-design-vue";
</script>

<template>
  <ConfigProvider
    :theme="{
      token: {},
    }"
  >
    <RouterView />
  </ConfigProvider>
</template>

<style scoped></style>
