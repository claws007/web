import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/store/user";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/views/layout/Default.vue"),
      meta: { requiresAuth: true },
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
      meta: { guestOnly: true },
    },
  ],
});

router.beforeEach((to) => {
  const userStore = useUserStore();
  const isLoggedIn = userStore.isLoggedIn;

  if (to.meta.requiresAuth && !isLoggedIn) {
    return {
      name: "login",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (to.meta.guestOnly && isLoggedIn) {
    const redirect =
      typeof to.query.redirect === "string" ? to.query.redirect : null;

    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      return redirect;
    }

    return { name: "home" };
  }

  return true;
});

export default router;
