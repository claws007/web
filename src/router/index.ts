import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			redirect: "/home",
		},
		{
			path: "/login",
			name: "login",
			component: () => import("@/views/Login.vue"),
			meta: { public: true },
		},
		{
			path: "/home",
			name: "home",
			component: () => import("@/views/Home.vue"),
		},
	],
});

router.beforeEach((to) => {
	if (to.meta.public) return true;

	const token = localStorage.getItem("auth_token") ??
		sessionStorage.getItem("auth_token");

	if (!token) return { name: "login" };
	return true;
});

export default router;
