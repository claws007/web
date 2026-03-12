<script setup lang="ts">
import { ConfigProvider } from "ant-design-vue";
</script>

<template>
  <ConfigProvider
    :theme="{
      token: {
        // colorPrimary: `hsl(${defaultPrimaryHue} ${themeHSColorSString} ${themeHSColorLString})`,
        colorError: `#B52023`,
      },
    }"
  >
    <RouterView />
  </ConfigProvider>
</template>

<style scoped></style>
