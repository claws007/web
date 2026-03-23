import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/views/layout/Default.vue"),
      children: [
        {
          path: "",
          name: "home",
          component: () => import("@/views/Home.vue"),
        },
      ],
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/Login.vue"),
      meta: { public: true },
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.public) return true;

  const token =
    localStorage.getItem("auth_token") ?? sessionStorage.getItem("auth_token");

  if (!token) return { name: "login" };
  return true;
});

export default router;
