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
    path: "/itineraries",
    name: "itineraries",
    component: () => import("../views/ItineraryListView.vue"),
  },
  {
    path: "/itineraries/:id",
    name: "itinerary-detail",
    component: () => import("../views/ItineraryDetailView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
