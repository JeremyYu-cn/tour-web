<template>
  <Layout class="app-layout">
    <LayoutHeader class="app-header">
      <div class="app-brand" @click="router.push('/')">
        <img class="app-brand-logo" src="/icon/icon.png" alt="Easy Tour logo" />
        <span class="app-brand__text">Easy Tour</span>
      </div>
      <div class="app-tabs app-tabs--desktop">
        <AppTabBar
          :tabs="tabs"
          :current-path="route.path"
          variant="top"
          @select="onTabChange"
        />
      </div>
    </LayoutHeader>
    <LayoutContent class="app-content">
      <div class="app-container">
        <slot />
      </div>
    </LayoutContent>

    <div class="app-tabs app-tabs--mobile">
      <AppTabBar
        :tabs="tabs"
        :current-path="route.path"
        variant="bottom"
        @select="onTabChange"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { Layout } from "ant-design-vue";
import AppTabBar, { type AppTab } from "../components/AppTabBar.vue";

const route = useRoute();
const router = useRouter();

const LayoutHeader = Layout.Header;
const LayoutContent = Layout.Content;

const tabs: AppTab[] = [
  { label: "首页", value: "/" },
  { label: "AI 对话", value: "/chat" },
  {
    label: "推荐行程",
    value: "/itineraries",
    match: (p) => p.startsWith("/itineraries"),
  },
];

const onTabChange = (val: string | number) => {
  router.push(String(val));
};
</script>

<style scoped>
.app-brand-logo {
  width: 50px;
  height: 50px;
}
.app-content {
  padding: 20px;
  box-sizing: border-box;
}
</style>
