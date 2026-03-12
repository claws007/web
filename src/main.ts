import { createApp } from "vue";
import "./styles/index.css";
// import "ant-design-vue/dist/reset.css";
import App from "./App.vue";
import plugins from "./plugins";

createApp(App).use(plugins)
	.mount("#app");
