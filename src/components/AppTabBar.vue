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

    <nav v-else class="app-tabbar__bottom" aria-label="Tab bar">
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

