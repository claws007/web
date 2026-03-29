import { createApp } from "vue";
import { createPinia } from "pinia";
import "./styles/index.css";
import App from "./App.vue";
import router from "./router";
import { useUserStore } from "./store/user";
import { readStoredActiveCompanyId } from "./api";
import { startCommandProgressRealtime } from "./services/command-progress-realtime";
import { startNotificationRealtime } from "./services/notification-realtime";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const userStore = useUserStore(pinia);
await userStore.initialize();

await startCommandProgressRealtime({
  token: userStore.token,
  companyId: readStoredActiveCompanyId(),
});

await startNotificationRealtime({
  token: userStore.token,
  companyId: readStoredActiveCompanyId(),
});

app.use(router).mount("#app");
