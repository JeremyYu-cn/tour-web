import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
  },
  {
    path: "/chat/:sessionId?",
    name: "chat",
    component: () => import("../views/Chat/ChatView.vue"),
  },
  {
    path: "/recommendations",
    redirect: "/itineraries",
  },
  {
    path: "/itineraries",
    name: "recommendations",
    component: () => import("../views/RecommendView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
