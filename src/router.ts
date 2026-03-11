import { createRouter, createWebHistory } from "vue-router";
import { store } from "@/store";
import { useUserStore } from "@/store/user";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/login",
			name: "login",
			component: () => import("./views/Login.vue"),
			meta: {
				noAuth: true,
			},
		},
		{
			path: "/",
			component: () => import("./views/layout/Default.vue"),
			children: [{
				path: "/",
				name: "home",
				component: () => import("./views/Home.vue"),
			}],
		},
	],
});

router.beforeEach((to) => {
	const userStore = useUserStore(store);
	userStore.initAuth();

	if (userStore.isAuthenticated && to.meta.noAuth) {
		const redirectTarget =
			typeof to.query.redirect === "string" && to.query.redirect
				? to.query.redirect
				: "/";

		return redirectTarget;
	}

	if (!to.meta.noAuth && !userStore.isAuthenticated) {
		return {
			path: "/login",
			query: {
				redirect: to.fullPath,
			},
		};
	}

	return true;
});

export default router;
