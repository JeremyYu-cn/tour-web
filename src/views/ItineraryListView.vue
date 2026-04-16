<script setup lang="ts">
import BasicLayout from "@/layouts/BasicLayout.vue";
import { useItineraryStore } from "@/stores/itinerary";
import { useRouter } from "vue-router";
import { exportItineraryExcel } from "@/utils/exportExcel";
import { exportItineraryPdf } from "@/utils/exportPdf";
import {
  Button,
  Card,
  Empty,
  Input,
  List,
  Modal,
  Space,
  message,
} from "ant-design-vue";

const store = useItineraryStore();
const router = useRouter();

const confirmDelete = (id: string) => {
  Modal.confirm({
    title: "删除行程",
    content: "确定要删除该行程吗？",
    okText: "删除",
    okType: "danger",
    cancelText: "取消",
    onOk: () => {
      store.removeItinerary(id);
      message.success("已删除");
    },
  });
};
</script>

<template>
  <BasicLayout>
    <Card class="card" title="推荐行程列表">
      <Input.Search
        class="itinerary-search"
        v-model:value="store.keyword"
        placeholder="搜索目的地 / 国家 / 城市"
        allow-clear
      />

      <Empty
        v-if="store.filteredList.length === 0"
        description="暂无行程，请先去 AI 对话生成"
      />

      <List v-else :data-source="store.filteredList" bordered>
        <template #renderItem="{ item }">
          <List.Item>
            <div class="list-row">
              <div class="list-row__main">
                <div class="list-row__title">{{ item.title }}</div>
                <div class="list-row__meta">
                  {{ item.country }} · {{ item.departureDate }} ~
                  {{ item.returnDate }}
                </div>
                <div class="list-row__desc">{{ item.summary }}</div>
              </div>
              <Space wrap>
                <Button @click="router.push(`/itineraries/${item.id}`)"
                  >详情</Button
                >
                <Button @click="exportItineraryExcel(item)">导出 Excel</Button>
                <Button @click="exportItineraryPdf(item)">导出 PDF</Button>
                <Button danger @click="confirmDelete(item.id)">删除</Button>
              </Space>
            </div>
          </List.Item>
        </template>
      </List>
    </Card>
  </BasicLayout>
</template>

<style scoped>
.card {
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(16, 24, 40, 0.08);
}

.itinerary-search {
  margin-bottom: 16px;
}

.list-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.list-row__main {
  flex: 1;
  min-width: 0;
}

.list-row__title {
  font-size: 16px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.88);
  margin-bottom: 6px;
}

.list-row__meta {
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 6px;
}

.list-row__desc {
  color: rgba(0, 0, 0, 0.7);
}

@media (max-width: 640px) {
  .list-row {
    flex-direction: column;
  }
}
</style>
