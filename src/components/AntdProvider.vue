<template>
  <ConfigProvider
    :locale
    :theme="{
      algorithm: systemStore.isDarkMode
        ? theme.darkAlgorithm
        : theme.defaultAlgorithm,
      token: {
        colorPrimary: 'hsl(0, 0%, 40%)',
        colorSuccess: 'hsl(99, 80%, 44%)',
        colorError: 'hsl(2, 80%, 63%)',
        wireframe: false,
        borderRadius: 6,
        fontFamily,
      },
    }"
    ><slot></slot
  ></ConfigProvider>
</template>

<script setup lang="ts">
import { useSystemStore } from "@/store/system";
import { ConfigProvider, theme } from "ant-design-vue";
import type { Locale } from "ant-design-vue/es/locale";

defineProps<{
  locale?: Locale;
}>();

// const fontFamily =
//   '"LXGW WenKai", -apple-system, "Microsoft YaHei", BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important'
// const fontFamily =
//   '-apple-system, "Micro?soft YaHei", BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important'
// apple web font
// const fontFamily =
//   '"SF Pro SC","SF Pro Text","SF Pro Icons","PingFang SC","Helvetica Neue","Helvetica","Arial",sans-serif !important';
const fontFamily =
  '"Huninn", "Microsoft Yahei", "fantasy", "monospace", "cursive", "serif", "sans-serif" !important';

const systemStore = useSystemStore();
</script>
