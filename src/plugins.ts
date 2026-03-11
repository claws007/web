import * as $const from "@/const";
import router from "@/router";
import { type App } from "vue";
import { focusPlugin } from "@/directives/focus";
import { i18nPlugin } from "@/i18n";
import { loadingPlugin } from "./directives/loading";
import { wavePlugin } from "./directives/wave";
import { MotionPlugin } from "@vueuse/motion";
// import VueVirtualScroller from "vue-virtual-scroller";
// import { store } from "./store";

export default {
	install(app: App) {
		app.use(i18nPlugin);
		app.use(router);
		app.use(focusPlugin);
		app.use(loadingPlugin);
		app.use(wavePlugin);
		app.use(MotionPlugin);
		// app.use(store);
		// app.use(VueVirtualScroller);
		app.config.globalProperties.$const = $const;
	},
};
