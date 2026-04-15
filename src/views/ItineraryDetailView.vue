<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BasicLayout from '../layouts/BasicLayout.vue'
import { useItineraryStore } from '../stores/itinerary'
import { exportItineraryExcel } from '../utils/exportExcel'
import { exportItineraryPdf } from '../utils/exportPdf'
import { Button, Card, Descriptions, Divider, Result, Space, Timeline } from 'ant-design-vue'

const route = useRoute()
const router = useRouter()
const store = useItineraryStore()

const itinerary = computed(() => {
  const id = String(route.params.id || '')
  return store.getById(id)
})
</script>

<template>
  <BasicLayout>
    <Card v-if="!itinerary" class="card" title="行程详情">
      <Result
        status="404"
        title="未找到行程"
        sub-title="请返回列表页查看已保存的行程"
      >
        <template #extra>
          <Button type="primary" @click="router.push('/itineraries')">返回列表</Button>
        </template>
      </Result>
    </Card>

    <Card v-else class="card" :title="itinerary.title">
      <Space direction="vertical" class="detail-stack" :size="16">
        <Descriptions bordered :column="1" size="middle">
          <Descriptions.Item label="国家">{{ itinerary.country }}</Descriptions.Item>
          <Descriptions.Item label="城市">{{ itinerary.cities.join(' / ') }}</Descriptions.Item>
          <Descriptions.Item label="日期">{{ itinerary.departureDate }} ~ {{ itinerary.returnDate }}</Descriptions.Item>
          <Descriptions.Item label="天数">{{ itinerary.duration }}</Descriptions.Item>
          <Descriptions.Item label="预算">{{ itinerary.budget }}</Descriptions.Item>
          <Descriptions.Item label="摘要">{{ itinerary.summary }}</Descriptions.Item>
          <Descriptions.Item v-if="itinerary.visaPurposeNote" label="签证说明">
            {{ itinerary.visaPurposeNote }}
          </Descriptions.Item>
        </Descriptions>

        <Space wrap>
          <Button @click="router.push('/itineraries')">返回列表</Button>
          <Button @click="exportItineraryExcel(itinerary)">导出 Excel</Button>
          <Button @click="exportItineraryPdf(itinerary)">导出 PDF</Button>
        </Space>

        <Divider class="detail-divider" />

        <Timeline>
          <Timeline.Item v-for="day in itinerary.days" :key="day.day">
            <div class="day-title">
              Day {{ day.day }} · {{ day.date }} · {{ day.city }}
            </div>
            <ul class="day-activities">
              <li v-for="(act, idx) in day.activities" :key="idx">{{ act }}</li>
            </ul>
            <div v-if="day.hotel"><b>酒店：</b>{{ day.hotel }}</div>
            <div v-if="day.transport"><b>交通：</b>{{ day.transport }}</div>
            <div v-if="day.notes"><b>备注：</b>{{ day.notes }}</div>
          </Timeline.Item>
        </Timeline>
      </Space>
    </Card>
  </BasicLayout>
</template>

<style scoped>
.detail-stack {
  width: 100%;
}

.detail-divider {
  margin: 8px 0;
}

.day-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.day-activities {
  margin: 0 0 8px 18px;
}
</style>

