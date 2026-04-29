<template>
  <Layout class="app-layout">
    <LayoutHeader class="app-header">
      <div class="app-brand" @click="router.push('/')">
        <img class="app-brand__logo" src="/icon/icon.png" alt="Easy Tour logo" />
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
    match: (p) => p.startsWith("/itineraries") || p.startsWith("/recommendations"),
  },
];

const onTabChange = (val: string | number) => {
  router.push(String(val));
};
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: transparent;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 24px;
  height: 60px;
  line-height: 1;
  padding-inline: max(20px, calc((100vw - var(--content-max)) / 2 + 20px));
  background: rgba(255, 255, 255, 0.9) !important;
  border-bottom: 1px solid rgba(228, 234, 241, 0.84);
  backdrop-filter: blur(18px);
}

.app-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-width: max-content;
  cursor: pointer;
  user-select: none;
}

.app-brand__logo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: var(--shadow-soft);
}

.app-brand__text {
  color: var(--text-strong);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0;
}

.app-tabs {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.app-tabs--desktop {
  display: flex;
}

.app-tabs--mobile {
  display: none;
}

.app-container {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
}

.app-content {
  padding: 24px 20px 34px;
  box-sizing: border-box;
}

@media (max-width: 640px) {
  .app-tabs--desktop {
    display: none;
  }

  .app-tabs--mobile {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    justify-content: center;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
    z-index: 20;
    pointer-events: none;
  }

  .app-header {
    height: 58px;
    padding-inline: 16px;
  }

  .app-content {
    padding: 14px 12px 104px;
  }
}
</style>
