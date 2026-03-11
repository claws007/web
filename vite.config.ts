import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    AutoImport({
      imports: ["vue", "vue-router", "vue-i18n"],
      dts: "src/auto-imports.d.ts",
    }),
    Components({
      resolvers: [AntDesignVueResolver({
        importStyle: "css-in-js",
      })],
      dts: "src/components.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
