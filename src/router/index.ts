import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/store/user";
import { RouteName } from "./route-name";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/views/layout/Default.vue"),
      children: [
        {
          path: "",
          name: RouteName.Home,
          component: () => import("@/views/Home.vue"),
        },
      ],
    },
    {
      path: "/login",
      name: RouteName.Login,
      component: () => import("@/views/Login.vue"),
      meta: { noAuth: true },
    },
    {
      path: "/createFirstCompany",
      name: RouteName.CreateFirstCompany,
      component: () => import("@/views/CreateFirstCompany.vue"),
    },
  ],
});

router.beforeEach((to) => {
  const userStore = useUserStore();
  const isLoggedIn = userStore.isLoggedIn;
  const hasNoCompany = userStore.companies.length === 0;
  const isNoAuthPage = to.meta.noAuth === true;

  if (!isNoAuthPage && !isLoggedIn) {
    return {
      name: RouteName.Login,
      query: {
        redirect: to.fullPath,
      },
    };
  }
  if (
    isLoggedIn &&
    hasNoCompany &&
    to.name !== RouteName.CreateFirstCompany &&
    to.name !== RouteName.Login
  ) {
    return { name: RouteName.CreateFirstCompany };
  }

  if (isLoggedIn && !hasNoCompany && to.name === RouteName.CreateFirstCompany) {
    return { name: RouteName.Home };
  }

  return true;
});

export default router;
