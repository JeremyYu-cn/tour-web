# Easy Tour 项目方案（Vue3 + Pinia + Ant Design Vue + Vite + Vue Router）

## 1. 项目概述

**项目名称：** Easy Tour  
**项目定位：** 面向旅游签证申请场景的智能行程规划平台，帮助用户通过 AI 生成旅游计划、查看推荐行程、导出行程单，并通过 MCP 接入多个机票供应商进行价格查询。

### 核心目标
- 帮用户快速生成适合签证申请的旅游行程
- 将 AI 行程结果结构化，便于展示与导出
- 提供可下载的 Excel / PDF 行程单
- 集成 MCP，实现多来源机票价格比对

---

## 2. 技术栈

### 前端
- Vue 3
- Vite
- Vue Router
- Pinia
- Ant Design Vue

### 推荐附加库
- axios：接口请求
- xlsx：导出 Excel
- jspdf + jspdf-autotable：导出 PDF
- dayjs：日期处理

安装命令：

```bash
npm create vite@latest easy-tour -- --template vue-ts
cd easy-tour
npm install
npm install vue-router pinia ant-design-vue axios dayjs xlsx jspdf jspdf-autotable
```

---

## 3. 功能模块设计

### 3.1 首页
用于介绍网站功能与使用流程。

**展示内容：**
- 网站简介：用于旅游签证申请的 AI 行程规划
- 功能亮点：AI 生成计划、推荐行程、导出材料、机票比价
- 使用步骤：输入目的地与日期 → AI 生成行程 → 保存/导出 → 查询机票价格
- 引导按钮：开始规划

### 3.2 AI 对话页面
用户通过自然语言输入需求，AI 返回结构化旅游计划。

**输入示例：**
- 我要申请日本旅游签证，计划 7 天东京大阪行程，预算 8000 元
- 帮我生成法国 10 日旅游签证用行程，包含酒店建议与每日安排

**输出目标：**
- 目的地
- 出行日期
- 天数
- 每日行程安排
- 住宿建议
- 交通建议
- 预算摘要
- 适合签证材料展示的行程摘要

### 3.3 推荐行程列表页
展示 AI 生成并保存的行程，支持查看详情、导出、删除。

**功能：**
- 行程卡片列表
- 按目的地搜索
- 查看详情
- 导出 Excel
- 导出 PDF
- 查询该行程对应的机票价格

### 3.4 行程导出
根据 AI 返回的结构化数据导出签证申请材料。

**Excel 内容建议：**
- 基础信息（申请国家、出发时间、返程时间、预算）
- 每日计划表
- 酒店与交通建议

**PDF 内容建议：**
- Easy Tour 标题
- 申请人旅游计划摘要
- 每日行程表
- 签证辅助说明（可选）

### 3.5 MCP 机票比价
通过 MCP 服务聚合多个机票公司报价。

**预期流程：**
1. 前端提交出发地、目的地、出发日期、返程日期
2. 后端或 MCP 网关调用多个供应商工具
3. 返回统一格式的报价列表
4. 前端列表展示最低价、航司、时间、经停信息

---

## 4. 页面结构

```text
/src
  /api
    ai.ts
    itinerary.ts
    flight.ts
  /components
    AppHeader.vue
    FeatureCard.vue
    ChatMessage.vue
    ItineraryCard.vue
    FlightPriceTable.vue
  /layouts
    BasicLayout.vue
  /router
    index.ts
  /stores
    chat.ts
    itinerary.ts
    flight.ts
  /types
    itinerary.ts
    chat.ts
    flight.ts
  /utils
    exportExcel.ts
    exportPdf.ts
  /views
    HomeView.vue
    ChatView.vue
    ItineraryListView.vue
    ItineraryDetailView.vue
  App.vue
  main.ts
```

---

## 5. 路由设计

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('../views/ChatView.vue'),
  },
  {
    path: '/itineraries',
    name: 'itineraries',
    component: () => import('../views/ItineraryListView.vue'),
  },
  {
    path: '/itineraries/:id',
    name: 'itinerary-detail',
    component: () => import('../views/ItineraryDetailView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

---

## 6. 类型设计

```ts
// src/types/itinerary.ts
export interface ItineraryDay {
  day: number
  date: string
  city: string
  activities: string[]
  hotel?: string
  transport?: string
  notes?: string
}

export interface Itinerary {
  id: string
  title: string
  country: string
  cities: string[]
  departureDate: string
  returnDate: string
  duration: number
  budget: number
  summary: string
  visaPurposeNote?: string
  days: ItineraryDay[]
  createdAt: string
}
```

```ts
// src/types/chat.ts
export interface ChatMessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
```

```ts
// src/types/flight.ts
export interface FlightOffer {
  vendor: string
  airline: string
  flightNo: string
  departTime: string
  arriveTime: string
  origin: string
  destination: string
  price: number
  currency: string
  stops: number
}
```

---

## 7. Pinia Store 设计

### 7.1 chat store

```ts
// src/stores/chat.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessageItem } from '../types/chat'
import { generateItineraryByAI } from '../api/ai'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessageItem[]>([])
  const loading = ref(false)
  const lastStructuredItinerary = ref<any>(null)

  const sendMessage = async (content: string) => {
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    })

    loading.value = true
    try {
      const res = await generateItineraryByAI(content)
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.text,
        createdAt: new Date().toISOString(),
      })
      lastStructuredItinerary.value = res.itinerary
      return res.itinerary
    } finally {
      loading.value = false
    }
  }

  return {
    messages,
    loading,
    lastStructuredItinerary,
    sendMessage,
  }
})
```

### 7.2 itinerary store

```ts
// src/stores/itinerary.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Itinerary } from '../types/itinerary'

export const useItineraryStore = defineStore('itinerary', () => {
  const itineraries = ref<Itinerary[]>([])
  const keyword = ref('')

  const saveItinerary = (item: Itinerary) => {
    itineraries.value.unshift(item)
  }

  const removeItinerary = (id: string) => {
    itineraries.value = itineraries.value.filter(item => item.id !== id)
  }

  const getById = (id: string) => itineraries.value.find(item => item.id === id)

  const filteredList = computed(() => {
    const key = keyword.value.trim().toLowerCase()
    if (!key) return itineraries.value
    return itineraries.value.filter(item =>
      item.title.toLowerCase().includes(key) ||
      item.country.toLowerCase().includes(key) ||
      item.cities.join(',').toLowerCase().includes(key)
    )
  })

  return {
    itineraries,
    keyword,
    filteredList,
    saveItinerary,
    removeItinerary,
    getById,
  }
})
```

### 7.3 flight store

```ts
// src/stores/flight.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FlightOffer } from '../types/flight'
import { queryFlightOffers } from '../api/flight'

export const useFlightStore = defineStore('flight', () => {
  const offers = ref<FlightOffer[]>([])
  const loading = ref(false)

  const searchFlights = async (params: {
    origin: string
    destination: string
    departDate: string
    returnDate?: string
  }) => {
    loading.value = true
    try {
      offers.value = await queryFlightOffers(params)
    } finally {
      loading.value = false
    }
  }

  return {
    offers,
    loading,
    searchFlights,
  }
})
```

---

## 8. API 设计

### 8.1 AI 行程生成接口

```ts
// src/api/ai.ts
import axios from 'axios'

export async function generateItineraryByAI(prompt: string) {
  const { data } = await axios.post('/api/ai/plan', { prompt })
  return data
}
```

### 8.2 行程持久化接口（可选）

```ts
// src/api/itinerary.ts
import axios from 'axios'

export async function fetchItineraries() {
  const { data } = await axios.get('/api/itineraries')
  return data
}

export async function createItinerary(payload: unknown) {
  const { data } = await axios.post('/api/itineraries', payload)
  return data
}
```

### 8.3 MCP 机票查询接口

```ts
// src/api/flight.ts
import axios from 'axios'

export async function queryFlightOffers(params: {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
}) {
  const { data } = await axios.post('/api/mcp/flights/search', params)
  return data.offers
}
```

---

## 9. 页面实现骨架

### 9.1 main.ts

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Antd)
app.mount('#app')
```

### 9.2 App.vue

```vue
<template>
  <router-view />
</template>
```

### 9.3 基础布局

```vue
<!-- src/layouts/BasicLayout.vue -->
<template>
  <a-layout style="min-height: 100vh;">
    <a-layout-header>
      <div style="color: white; font-size: 20px; font-weight: bold;">Easy Tour</div>
    </a-layout-header>
    <a-layout-content style="padding: 24px; max-width: 1200px; margin: 0 auto; width: 100%;">
      <slot />
    </a-layout-content>
  </a-layout>
</template>
```

### 9.4 首页

```vue
<!-- src/views/HomeView.vue -->
<script setup lang="ts">
import BasicLayout from '../layouts/BasicLayout.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <BasicLayout>
    <a-card :bordered="false">
      <h1>Easy Tour 旅游签证智能规划平台</h1>
      <p>通过 AI 自动生成适合旅游签证申请的行程计划，并导出行程单材料。</p>
      <a-row :gutter="16" style="margin-top: 24px;">
        <a-col :span="8">
          <a-card title="AI 行程规划">
            输入目的地、预算、日期，快速得到签证申请用行程方案。
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card title="导出材料">
            支持导出 Excel 和 PDF 行程单，方便提交签证材料。
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card title="机票比价">
            对接 MCP 聚合多个机票供应商报价。
          </a-card>
        </a-col>
      </a-row>
      <a-space style="margin-top: 24px;">
        <a-button type="primary" @click="router.push('/chat')">开始规划</a-button>
        <a-button @click="router.push('/itineraries')">查看推荐行程</a-button>
      </a-space>
    </a-card>
  </BasicLayout>
</template>
```

### 9.5 AI 对话页

```vue
<!-- src/views/ChatView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import BasicLayout from '../layouts/BasicLayout.vue'
import { useChatStore } from '../stores/chat'
import { useItineraryStore } from '../stores/itinerary'

const chatStore = useChatStore()
const itineraryStore = useItineraryStore()
const input = ref('')

const handleSend = async () => {
  if (!input.value.trim()) return
  const itinerary = await chatStore.sendMessage(input.value)
  if (itinerary) {
    itineraryStore.saveItinerary({
      ...itinerary,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })
    message.success('AI 行程已生成并保存')
  }
  input.value = ''
}
</script>

<template>
  <BasicLayout>
    <a-card title="AI 旅游计划助手">
      <a-space direction="vertical" style="width: 100%;">
        <div style="min-height: 320px; border: 1px solid #f0f0f0; padding: 16px; border-radius: 8px;">
          <div v-for="item in chatStore.messages" :key="item.id" style="margin-bottom: 12px;">
            <b>{{ item.role === 'user' ? '我' : 'AI' }}：</b>{{ item.content }}
          </div>
        </div>
        <a-textarea
          v-model:value="input"
          :rows="4"
          placeholder="请输入你的签证旅游计划需求，比如：我要申请日本旅游签证，生成7天东京大阪行程"
        />
        <a-button type="primary" :loading="chatStore.loading" @click="handleSend">发送并生成计划</a-button>
      </a-space>
    </a-card>
  </BasicLayout>
</template>
```

### 9.6 行程列表页

```vue
<!-- src/views/ItineraryListView.vue -->
<script setup lang="ts">
import BasicLayout from '../layouts/BasicLayout.vue'
import { useItineraryStore } from '../stores/itinerary'
import { useRouter } from 'vue-router'
import { exportItineraryExcel } from '../utils/exportExcel'
import { exportItineraryPdf } from '../utils/exportPdf'

const store = useItineraryStore()
const router = useRouter()
</script>

<template>
  <BasicLayout>
    <a-card title="推荐行程列表">
      <a-input-search
        v-model:value="store.keyword"
        placeholder="搜索目的地 / 国家 / 城市"
        style="margin-bottom: 16px;"
      />

      <a-list :data-source="store.filteredList" bordered>
        <template #renderItem="{ item }">
          <a-list-item>
            <a-space direction="vertical" style="width: 100%;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.country }} | {{ item.departureDate }} ~ {{ item.returnDate }}</p>
                  <p>{{ item.summary }}</p>
                </div>
                <a-space>
                  <a-button @click="router.push(`/itineraries/${item.id}`)">详情</a-button>
                  <a-button @click="exportItineraryExcel(item)">导出 Excel</a-button>
                  <a-button @click="exportItineraryPdf(item)">导出 PDF</a-button>
                </a-space>
              </div>
            </a-space>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </BasicLayout>
</template>
```

---

## 10. 导出工具

### 10.1 导出 Excel

```ts
// src/utils/exportExcel.ts
import * as XLSX from 'xlsx'
import type { Itinerary } from '../types/itinerary'

export function exportItineraryExcel(itinerary: Itinerary) {
  const rows = itinerary.days.map(day => ({
    Day: `Day ${day.day}`,
    Date: day.date,
    City: day.city,
    Activities: day.activities.join('；'),
    Hotel: day.hotel || '',
    Transport: day.transport || '',
    Notes: day.notes || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Itinerary')
  XLSX.writeFile(workbook, `${itinerary.title}.xlsx`)
}
```

### 10.2 导出 PDF

```ts
// src/utils/exportPdf.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Itinerary } from '../types/itinerary'

export function exportItineraryPdf(itinerary: Itinerary) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Easy Tour Itinerary', 14, 20)
  doc.setFontSize(12)
  doc.text(`Title: ${itinerary.title}`, 14, 30)
  doc.text(`Country: ${itinerary.country}`, 14, 38)
  doc.text(`Date: ${itinerary.departureDate} ~ ${itinerary.returnDate}`, 14, 46)
  doc.text(`Summary: ${itinerary.summary}`, 14, 54)

  autoTable(doc, {
    startY: 64,
    head: [['Day', 'Date', 'City', 'Activities', 'Hotel', 'Transport']],
    body: itinerary.days.map(day => [
      `Day ${day.day}`,
      day.date,
      day.city,
      day.activities.join(' / '),
      day.hotel || '',
      day.transport || '',
    ]),
  })

  doc.save(`${itinerary.title}.pdf`)
}
```

---

## 11. MCP 接入设计

### 前端请求示例

```ts
await queryFlightOffers({
  origin: 'TPE',
  destination: 'NRT',
  departDate: '2026-05-01',
  returnDate: '2026-05-07',
})
```

### MCP 后端统一返回格式建议

```json
{
  "offers": [
    {
      "vendor": "Ctrip",
      "airline": "EVA Air",
      "flightNo": "BR184",
      "departTime": "2026-05-01 09:20",
      "arriveTime": "2026-05-01 13:35",
      "origin": "TPE",
      "destination": "NRT",
      "price": 1350,
      "currency": "CNY",
      "stops": 0
    },
    {
      "vendor": "Qunar",
      "airline": "China Airlines",
      "flightNo": "CI100",
      "departTime": "2026-05-01 08:10",
      "arriveTime": "2026-05-01 12:25",
      "origin": "TPE",
      "destination": "NRT",
      "price": 1420,
      "currency": "CNY",
      "stops": 0
    }
  ]
}
```

### MCP 服务职责建议
- 封装多个票务平台工具
- 标准化入参
- 统一返回价格、航班号、起降时间、经停次数
- 可增加排序能力：最低价 / 最短耗时 / 最早出发

---

## 12. AI 返回数据格式建议

前端最好要求后端 AI 接口直接返回结构化 JSON，避免纯文本难以渲染。

```json
{
  "text": "已为你生成日本7日旅游签证行程",
  "itinerary": {
    "title": "日本东京大阪7日签证行程",
    "country": "日本",
    "cities": ["东京", "大阪"],
    "departureDate": "2026-05-01",
    "returnDate": "2026-05-07",
    "duration": 7,
    "budget": 8000,
    "summary": "适合日本旅游签证申请的7日观光行程",
    "visaPurposeNote": "本次出行以旅游观光为目的，行程清晰完整，符合短期旅游签证申请材料要求。",
    "days": [
      {
        "day": 1,
        "date": "2026-05-01",
        "city": "东京",
        "activities": ["抵达东京", "入住酒店", "浅草寺游览"],
        "hotel": "东京市区酒店",
        "transport": "机场快线",
        "notes": "保留机酒订单用于签证材料"
      }
    ]
  }
}
```

---

## 13. 项目亮点（适合写到简历/答辩）

- 基于 Vue3 + Pinia 构建旅游签证申请行程管理前端
- 通过 AI 对话式交互生成结构化旅游行程
- 支持签证申请材料一键导出 Excel / PDF
- 基于 MCP 聚合多个机票供应商，提供统一航班比价能力
- 具备较强的业务完整性，覆盖“生成 → 管理 → 导出 → 比价”全链路

---

## 14. 后续可扩展功能

### 可继续增加
- 登录注册
- 行程收藏
- 历史记录云端同步
- 酒店推荐接入
- 签证材料清单生成
- 多语言支持
- AI 自动生成签证说明信

---

## 15. 推荐你下一步直接做的事情

### 第一阶段
1. 初始化 Vue3 项目
2. 配置 Router / Pinia / Ant Design Vue
3. 完成首页、聊天页、列表页路由跳转

### 第二阶段
1. 对接 AI 接口
2. 规范 itinerary JSON 结构
3. 列表页支持保存与详情查看

### 第三阶段
1. 实现 Excel/PDF 导出
2. 接入 MCP 机票查询
3. 美化界面与异常处理

---

## 16. 可直接复用的后端接口约定

### POST /api/ai/plan
请求：
```json
{
  "prompt": "我要申请日本旅游签证，生成7天东京大阪行程"
}
```

响应：
```json
{
  "text": "已生成行程",
  "itinerary": {}
}
```

### POST /api/mcp/flights/search
请求：
```json
{
  "origin": "TPE",
  "destination": "NRT",
  "departDate": "2026-05-01",
  "returnDate": "2026-05-07"
}
```

响应：
```json
{
  "offers": []
}
```

---

## 17. 一句话总结

Easy Tour 是一个围绕“旅游签证申请”场景打造的智能行程规划平台，前端使用 Vue3 技术栈，实现 AI 行程生成、推荐行程管理、材料导出以及通过 MCP 聚合的机票比价功能。

