<template>
  <div :class="['app-tabbar', `app-tabbar--${variant}`]">
    <nav v-if="variant === 'top'" class="app-tabbar__top" aria-label="Primary navigation">
      <button
        v-for="t in tabs"
        :key="t.value"
        type="button"
        :class="['app-tabbar__topItem', isActive(t) && 'is-active']"
        @click="emit('select', t.value)"
      >
        <span class="app-tabbar__label">{{ t.label }}</span>
      </button>
    </nav>

    <Segmented v-else-if="variant === 'segmented'" v-model:value="selectedValue" :options="segmentedOptions" size="large" @change="onChange" />

    <nav v-else class="app-tabbar__bottom" :style="bottomGridStyle" aria-label="Tab bar">
      <button
        v-for="t in tabs"
        :key="t.value"
        type="button"
        :class="['app-tabbar__item', isActive(t) && 'is-active']"
        @click="emit('select', t.value)"
      >
        <span class="app-tabbar__label">{{ t.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Segmented } from 'ant-design-vue'

type TabValue = string

export type AppTab = {
  label: string
  value: TabValue
  match?: (currentPath: string) => boolean
}

const props = withDefaults(
  defineProps<{
    tabs: AppTab[]
    currentPath: string
    variant?: 'segmented' | 'top' | 'bottom'
  }>(),
  { variant: 'segmented' },
)

const emit = defineEmits<{
  (e: 'select', value: TabValue): void
}>()

const segmentedOptions = computed(() => props.tabs.map((t) => ({ label: t.label, value: t.value })))
const bottomGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.max(props.tabs.length, 1)}, minmax(0, 1fr))`,
}))

const isActive = (tab: AppTab) => {
  if (tab.match) return tab.match(props.currentPath)
  if (tab.value === '/') return props.currentPath === '/'
  return props.currentPath === tab.value || props.currentPath.startsWith(`${tab.value}/`)
}

const selectedValue = computed<TabValue>({
  get() {
    const active = props.tabs.find(isActive)
    return active?.value ?? props.tabs[0]?.value ?? '/'
  },
  set() {},
})

const onChange = (val: string | number) => {
  emit('select', String(val))
}
</script>

<style scoped>
.app-tabbar--top {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.app-tabbar__top {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px;
  border-radius: 999px;
  background: transparent;
  border: 0;
}

.app-tabbar__topItem {
  appearance: none;
  border: 0;
  background: transparent;
  min-width: 74px;
  height: 34px;
  padding: 0 14px;
  border-radius: 14px;
  cursor: pointer;
  color: var(--text-muted);
  font-weight: 750;
  position: relative;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    transform 0.08s ease;
}

.app-tabbar__topItem:hover {
  color: var(--text-strong);
  background: var(--surface-soft);
}

.app-tabbar__topItem:active {
  transform: scale(0.98);
}

.app-tabbar__topItem.is-active {
  color: var(--brand);
  background: var(--brand-soft);
  box-shadow: none;
}

@media (max-width: 640px) {
  .app-tabbar {
    width: 100%;
    max-width: 420px;
    pointer-events: auto;
  }

  .app-tabbar__bottom {
    width: 100%;
    display: grid;
    gap: 8px;
    padding: 7px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.96) !important;
    border: 1px solid var(--line);
    backdrop-filter: blur(14px);
    box-shadow: 0 16px 42px rgba(16, 24, 40, 0.12);
  }

  .app-tabbar__item {
    appearance: none;
    border: 0;
    background: transparent;
    min-height: 42px;
    padding: 8px 6px;
    border-radius: 16px;
    font-weight: 800;
    color: var(--text-muted);
    cursor: pointer;
    transition: background 0.15s ease, transform 0.08s ease, color 0.15s ease;
  }

  .app-tabbar__item:active {
    transform: scale(0.98);
  }

  .app-tabbar__item.is-active {
    background: var(--brand-soft);
    color: var(--brand);
  }

  .app-tabbar__label {
    display: inline-block;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
  }
}

.app-tabbar__topItem .app-tabbar__label {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
</style>
