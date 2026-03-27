import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "node:path";
import { dialogsPlugin } from "./plugins/dialogs-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "/api";
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8000";

  const proxy = apiBaseUrl.startsWith("/")
    ? {
        [apiBaseUrl]: {
          target: apiProxyTarget,
          changeOrigin: true,
          ws: true,
          rewrite: (path: string) =>
            path.replace(new RegExp(`^${apiBaseUrl}`), ""),
        },
      }
    : undefined;

  return {
    plugins: [
      tailwindcss(),
      vue(),
      dialogsPlugin({
        dir: resolve(__dirname, "src/components/dialog"),
        dts: "src/dialogs.d.ts",
      }),
      AutoImport({
        imports: ["vue", "vue-router", "vue-i18n"],
        dts: "src/auto-imports.d.ts",
      }),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: "css-in-js",
          }),
        ],
        dirs: ["src/components", "src/bizComponents"],
        deep: true,
        dts: "src/components.d.ts",
      }),
    ],
    server: {
      proxy,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };
});
