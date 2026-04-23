<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import BasicLayout from "@/layouts/BasicLayout.vue";
import { getRecommendList } from "@/api/recommend";
import type { RecommendChatHistoryFile } from "@/types/recommend";
import { renderMarkdown } from "@/utils/markdown";
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Result,
  Skeleton,
  Space,
  Tag,
  message,
} from "ant-design-vue";

const router = useRouter();

const pageSize = 12;
const keyword = ref("");
const items = ref<RecommendChatHistoryFile[]>([]);
const pageIndex = ref(1);
const hasMore = ref(true);
const initialLoading = ref(false);
const loadingMore = ref(false);
const errorMessage = ref("");

const detailOpen = ref(false);
const detailLoading = ref(false);
const detailHtml = ref("");
const activeItem = ref<RecommendChatHistoryFile | null>(null);

const getCoverSource = (item: RecommendChatHistoryFile) =>
  item.coverImageUrl ||
  item.imageUrl ||
  item.coverImage ||
  item.coverUrl ||
  item.cover ||
  "";

const toPlainText = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractConversationTitle = (value: string) => {
  const match = value.match(
    /##\s*1\.\s*Conversation Title[\s\S]*?-\s*(.+?)(?:\n|$)/i,
  );

  return match?.[1]?.trim() || "";
};

const getDisplayTitle = (item: RecommendChatHistoryFile) =>
  item.summary?.trim() ||
  item.fileName?.trim() ||
  extractConversationTitle(item.data) ||
  "未命名行程";

const getDisplaySummary = (item: RecommendChatHistoryFile) =>
  item.summary?.trim() || toPlainText(item.data).slice(0, 120) || "暂无摘要";

const extractMetaValue = (value: string, pattern: RegExp) =>
  value.match(pattern)?.[1]?.trim() || "";

const getDestinationLabel = (item: RecommendChatHistoryFile) =>
  item.coverCity?.trim() ||
  item.cities?.join(" / ").trim() ||
  extractMetaValue(
    item.data,
    /Main Destination\s*\/\s*主要停留国:\s*(.+?)(?:\n|$)/i,
  ) ||
  extractMetaValue(
    item.data,
    /Countries to Visit\s*\/\s*计划前往的国家:\s*(.+?)(?:\n|$)/i,
  ) ||
  "精选行程";

const getDurationLabel = (item: RecommendChatHistoryFile) => {
  const duration = extractMetaValue(
    item.data,
    /Total Days\s*\/\s*总天数:\s*(.+?)(?:\n|$)/i,
  );

  return duration ? `${duration} Days` : "Travel Pick";
};

const getImageCredit = (item: RecommendChatHistoryFile) => {
  if (item.imagePhotographer) {
    return item.imagePhotographer;
  }

  if (item.imageAttribution) {
    return item.imageAttribution;
  }

  if (item.imageProvider) {
    return item.imageProvider;
  }

  return "";
};

const formatCreateTime = (value: string) => {
  if (!value) {
    return "未知时间";
  }

  const next = dayjs(value);
  return next.isValid() ? next.format("YYYY-MM-DD HH:mm") : value;
};

const filteredItems = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();
  if (!normalizedKeyword) {
    return items.value;
  }

  return items.value.filter((item) =>
    [
      getDisplayTitle(item),
      getDisplaySummary(item),
      item.coverCity,
      item.cities?.join(" "),
      item.data,
    ].some((field) =>
      field?.toLowerCase().includes(normalizedKeyword),
    ),
  );
});

const fetchRecommendItems = async (reset = false) => {
  if (reset) {
    initialLoading.value = true;
    errorMessage.value = "";
  } else {
    loadingMore.value = true;
  }

  const nextPage = reset ? 1 : pageIndex.value;

  try {
    const res = await getRecommendList(nextPage, pageSize);
    if (!res.data.ok) {
      throw new Error(res.data.msg || "推荐行程加载失败");
    }

    const nextItems = res.data.data ?? [];
    items.value = reset ? nextItems : [...items.value, ...nextItems];
    pageIndex.value = nextPage + 1;
    hasMore.value = nextItems.length >= pageSize;
    errorMessage.value = "";
  } catch (err) {
    const nextMessage =
      err instanceof Error ? err.message : "推荐行程加载失败";
    errorMessage.value = nextMessage;

    if (!reset) {
      message.error(nextMessage);
    }
  } finally {
    initialLoading.value = false;
    loadingMore.value = false;
  }
};

const openDetail = async (item: RecommendChatHistoryFile) => {
  activeItem.value = item;
  detailOpen.value = true;
  detailLoading.value = true;
  detailHtml.value = "";

  try {
    detailHtml.value = await renderMarkdown(item.data || item.summary || "");
  } catch (err) {
    console.log(err);
    detailHtml.value = item.data || item.summary || "";
  } finally {
    detailLoading.value = false;
  }
};

watch(detailOpen, (open) => {
  if (!open) {
    activeItem.value = null;
    detailHtml.value = "";
    detailLoading.value = false;
  }
});

onMounted(() => {
  void fetchRecommendItems(true);
});
</script>

<template>
  <BasicLayout>
    <div class="recommend-page">
      <Card class="recommend-hero" :bordered="false">
        <div class="recommend-hero__copy">
          <div class="recommend-hero__title">推荐行程</div>
          <div class="recommend-hero__desc">
            用瀑布流查看系统推荐的旅行方案。当前展示 `summary / data /
            createTime`，后续可以直接扩展封面图。
          </div>
        </div>

        <Space wrap :size="12">
          <Button type="primary" @click="router.push('/chat')">
            去 AI 定制
          </Button>
        </Space>
      </Card>

      <Card class="recommend-toolbar" :bordered="false">
        <div class="recommend-toolbar__inner">
          <div class="recommend-toolbar__copy">
            <div class="recommend-toolbar__title">Explore Picks</div>
            <div class="recommend-toolbar__desc">
              搜索标题、摘要或完整行程内容
            </div>
          </div>
          <Input.Search
            v-model:value="keyword"
            allow-clear
            placeholder="搜索推荐行程"
            class="recommend-toolbar__search"
          />
        </div>
      </Card>

      <div
        v-if="initialLoading && items.length === 0"
        class="recommend-waterfall"
      >
        <div v-for="index in 6" :key="index" class="recommend-waterfall__item">
          <Card class="recommend-card" :bordered="false">
            <Skeleton active :paragraph="{ rows: 5 }" />
          </Card>
        </div>
      </div>

      <Result
        v-else-if="errorMessage && items.length === 0"
        status="warning"
        title="推荐行程加载失败"
        :sub-title="errorMessage"
      >
        <template #extra>
          <Button type="primary" @click="fetchRecommendItems(true)">
            重新加载
          </Button>
        </template>
      </Result>

      <Empty
        v-else-if="filteredItems.length === 0"
        description="暂无可展示的推荐行程"
      />

      <template v-else>
        <div class="recommend-waterfall">
          <article
            v-for="item in filteredItems"
            :key="item.id"
            class="recommend-waterfall__item"
          >
            <Card class="recommend-card" :bordered="false">
              <div class="recommend-card__cover">
                <img
                  v-if="getCoverSource(item)"
                  :src="getCoverSource(item)"
                  :alt="getDisplayTitle(item)"
                  class="recommend-card__coverImage"
                />
                <div
                  v-else
                  class="recommend-card__coverImage recommend-card__coverImage--fallback"
                  aria-hidden="true"
                />

                <div class="recommend-card__coverShade" />
                <div class="recommend-card__coverTop">
                  <span class="recommend-card__chip recommend-card__chip--primary">
                    {{ getDestinationLabel(item) }}
                  </span>
                  <span class="recommend-card__chip">
                    {{ getDurationLabel(item) }}
                  </span>
                </div>
                <div class="recommend-card__coverBottom">
                  <div class="recommend-card__eyebrow">Easy Tour Picks</div>
                  <div class="recommend-card__title">
                    {{ getDisplayTitle(item) }}
                  </div>
                </div>
              </div>

              <div class="recommend-card__body">
                <div class="recommend-card__meta">
                  <span class="recommend-card__dateLabel">Published</span>
                  <span class="recommend-card__dateValue">
                    {{ formatCreateTime(item.createTime) }}
                  </span>
                </div>

                <div class="recommend-card__actions">
                  <Button
                    class="recommend-card__button"
                    @click="openDetail(item)"
                  >
                    Open Trip
                  </Button>
                </div>
              </div>
            </Card>
          </article>
        </div>

        <div class="recommend-footer">
          <Button
            v-if="hasMore"
            :loading="loadingMore"
            @click="fetchRecommendItems(false)"
          >
            加载更多
          </Button>
        </div>
      </template>
    </div>

    <Modal
      v-model:open="detailOpen"
      :title="activeItem ? getDisplayTitle(activeItem) : '推荐行程详情'"
      width="960px"
      :footer="null"
      destroy-on-close
    >
      <div v-if="activeItem" class="recommend-detail">
        <img
          v-if="getCoverSource(activeItem)"
          :src="getCoverSource(activeItem)"
          :alt="activeItem.fileName"
          class="recommend-detail__cover"
        />

        <div class="recommend-detail__meta">
          <Tag color="blue">推荐行程</Tag>
          <span>{{ formatCreateTime(activeItem.createTime) }}</span>
        </div>

        <div
          v-if="getImageCredit(activeItem)"
          class="recommend-detail__credit"
        >
          {{ getImageCredit(activeItem) }}
        </div>

        <div class="recommend-detail__summary">
          {{ getDisplaySummary(activeItem) }}
        </div>

        <Skeleton v-if="detailLoading" active :paragraph="{ rows: 10 }" />
        <div
          v-else
          class="recommend-detail__content"
          v-html="detailHtml || activeItem.data"
        />
      </div>
    </Modal>
  </BasicLayout>
</template>

<style scoped>
.recommend-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommend-hero,
.recommend-toolbar,
.recommend-card {
  border-radius: 20px;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.08);
}

.recommend-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.16), transparent 34%),
    radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.14), transparent 26%),
    linear-gradient(135deg, rgba(255, 251, 235, 0.98), rgba(255, 255, 255, 0.98));
  border: 1px solid rgba(251, 191, 36, 0.16);
}

.recommend-hero__copy {
  max-width: 760px;
}

.recommend-hero__title {
  font-family:
    "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif;
  font-size: 34px;
  font-weight: 900;
  color: rgba(15, 23, 42, 0.96);
  letter-spacing: -0.6px;
}

.recommend-hero__desc {
  margin-top: 8px;
  color: rgba(51, 65, 85, 0.82);
  line-height: 1.7;
}

.recommend-toolbar {
  background: rgba(255, 255, 255, 0.94);
}

.recommend-toolbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.recommend-toolbar__copy {
  min-width: 0;
}

.recommend-toolbar__title {
  font-size: 15px;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.92);
}

.recommend-toolbar__desc {
  margin-top: 4px;
  color: rgba(100, 116, 139, 0.92);
  font-size: 13px;
}

.recommend-toolbar__search {
  width: min(420px, 100%);
}

.recommend-waterfall {
  column-count: 3;
  column-gap: 18px;
}

.recommend-waterfall__item {
  break-inside: avoid;
  margin-bottom: 18px;
}

.recommend-card {
  background: linear-gradient(180deg, #fffdf8, #ffffff 38%, #fffefb);
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.65);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.recommend-card:hover {
  transform: translateY(-4px);
  border-color: rgba(245, 158, 11, 0.24);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.14);
}

.recommend-card__cover {
  margin: -24px -24px 16px;
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  border-radius: 20px 20px 0 0;
}

.recommend-waterfall__item:nth-child(3n + 2) .recommend-card__cover {
  aspect-ratio: 4 / 4.3;
}

.recommend-waterfall__item:nth-child(4n) .recommend-card__cover {
  aspect-ratio: 4 / 5.6;
}

.recommend-card__coverImage {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommend-card__coverImage--fallback {
  background:
    linear-gradient(145deg, #dbeafe, #eff6ff 45%, #fff7ed);
}

.recommend-card__coverShade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.08), transparent 32%),
    linear-gradient(180deg, transparent 35%, rgba(15, 23, 42, 0.78));
}

.recommend-card__coverTop,
.recommend-card__coverBottom {
  position: absolute;
  left: 18px;
  right: 18px;
  z-index: 1;
}

.recommend-card__coverTop {
  top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recommend-card__coverBottom {
  bottom: 18px;
}

.recommend-card__chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18px;
}

.recommend-card__chip--primary {
  background: rgba(15, 23, 42, 0.3);
}

.recommend-card__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 8px;
}

.recommend-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.recommend-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.recommend-card__dateLabel {
  color: rgba(148, 163, 184, 0.96);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.48px;
  text-transform: uppercase;
}

.recommend-card__title {
  font-family:
    "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif;
  font-size: 26px;
  font-weight: 900;
  line-height: 1.12;
  color: rgba(255, 255, 255, 0.98);
  letter-spacing: -0.5px;
  text-shadow: 0 8px 26px rgba(15, 23, 42, 0.5);
}

.recommend-card__dateValue {
  color: rgba(51, 65, 85, 0.9);
  font-size: 12px;
  font-weight: 700;
}

.recommend-card__actions {
  display: flex;
}

:deep(.recommend-card__button) {
  width: 100%;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  background: linear-gradient(135deg, #f8fbff, #eef4ff) !important;
  color: #1d4ed8 !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.74);
  font-weight: 700;
}

.recommend-footer :deep(.ant-btn) {
  height: 42px;
  padding-inline: 20px;
  border-radius: 999px;
}

.recommend-footer {
  display: flex;
  justify-content: center;
  padding-bottom: 8px;
}

.recommend-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.recommend-detail__cover {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: 16px;
}

.recommend-detail__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: rgba(100, 116, 139, 0.9);
  font-size: 13px;
}

.recommend-detail__summary {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(241, 245, 249, 0.8);
  color: rgba(30, 41, 59, 0.9);
  font-weight: 700;
  line-height: 1.75;
}

.recommend-detail__credit {
  color: rgba(100, 116, 139, 0.86);
  font-size: 12px;
}

.recommend-detail__content {
  color: rgba(30, 41, 59, 0.96);
  line-height: 1.8;
}

.recommend-detail__content :deep(p:first-child) {
  margin-top: 0;
}

.recommend-detail__content :deep(.markdown-table-wrap) {
  margin: 14px 0;
  overflow-x: auto;
  border: 1px solid rgba(203, 213, 225, 0.92);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
}

.recommend-detail__content :deep(.markdown-table) {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.recommend-detail__content :deep(.markdown-table th),
.recommend-detail__content :deep(.markdown-table td) {
  padding: 10px 12px;
  border-right: 1px solid rgba(226, 232, 240, 0.88);
  border-bottom: 1px solid rgba(226, 232, 240, 0.88);
  vertical-align: top;
  white-space: normal;
  overflow-wrap: break-word;
}

.recommend-detail__content :deep(.markdown-table th) {
  background: #f8fafc;
  color: #0f172a;
  font-weight: 800;
  text-align: left;
}

.recommend-detail__content :deep(.markdown-table tr:last-child td) {
  border-bottom: 0;
}

.recommend-detail__content :deep(.markdown-table th:last-child),
.recommend-detail__content :deep(.markdown-table td:last-child) {
  border-right: 0;
}

@media (max-width: 1080px) {
  .recommend-waterfall {
    column-count: 2;
  }
}

@media (max-width: 640px) {
  .recommend-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .recommend-hero__title {
    font-size: 24px;
  }

  .recommend-waterfall {
    column-count: 1;
  }

  .recommend-toolbar__inner {
    flex-direction: column;
    align-items: stretch;
  }

  .recommend-card__cover {
    aspect-ratio: 16 / 10;
  }
}
</style>
