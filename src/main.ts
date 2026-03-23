import { createApp } from "vue";
import { createPinia } from "pinia";
import "./styles/index.css";
import App from "./App.vue";
import router from "./router";
import { useUserStore } from "./store/user";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const userStore = useUserStore(pinia);
await userStore.initialize();

app.use(router).mount("#app");
