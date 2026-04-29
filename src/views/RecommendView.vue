<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { RobotOutlined } from "@ant-design/icons-vue";
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
const loadMoreTrigger = ref<HTMLElement | null>(null);

let loadMoreObserver: IntersectionObserver | null = null;

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

const tryLoadMore = () => {
  if (!hasMore.value || initialLoading.value || loadingMore.value) {
    return;
  }

  void fetchRecommendItems(false);
};

const observeLoadMoreTrigger = () => {
  loadMoreObserver?.disconnect();

  if (!loadMoreTrigger.value) {
    return;
  }

  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        tryLoadMore();
      }
    },
    {
      rootMargin: "320px 0px",
      threshold: 0.01,
    },
  );

  loadMoreObserver.observe(loadMoreTrigger.value);
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

watch(
  () => filteredItems.value.length,
  async (length) => {
    if (length > 0) {
      await nextTick();
      observeLoadMoreTrigger();
    }
  },
);

onMounted(async () => {
  await fetchRecommendItems(true);
  await nextTick();
  observeLoadMoreTrigger();
});

onBeforeUnmount(() => {
  loadMoreObserver?.disconnect();
  loadMoreObserver = null;
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
            <template #icon>
              <RobotOutlined />
            </template>
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
              </div>

              <div class="recommend-card__body">
                <div>
                  <div class="recommend-card__eyebrow">Easy Tour Picks</div>
                  <div class="recommend-card__title">
                    {{ getDisplayTitle(item) }}
                  </div>
                  <div class="recommend-card__summary">
                    {{ getDisplaySummary(item) }}
                  </div>
                </div>

                <div class="recommend-card__meta">
                  <span class="recommend-card__dateLabel">发布时间</span>
                  <span class="recommend-card__dateValue">
                    {{ formatCreateTime(item.createTime) }}
                  </span>
                </div>

                <div class="recommend-card__actions">
                  <Button
                    class="recommend-card__button"
                    @click="openDetail(item)"
                  >
                    查看行程
                  </Button>
                </div>
              </div>
            </Card>
          </article>
        </div>

        <div ref="loadMoreTrigger" class="recommend-footer" aria-live="polite">
          <span v-if="loadingMore" class="recommend-footer__status">
            正在加载更多推荐行程…
          </span>
          <span v-else-if="hasMore" class="recommend-footer__status">
            继续下滑加载更多
          </span>
          <span v-else class="recommend-footer__status">
            已加载全部推荐行程
          </span>
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
  gap: 18px;
}

.recommend-hero,
.recommend-toolbar,
.recommend-card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--line);
}

.recommend-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  background: #ffffff;
}

.recommend-hero__copy {
  max-width: 760px;
}

.recommend-hero__title {
  font-size: 34px;
  font-weight: 900;
  color: var(--text-strong);
  letter-spacing: 0;
}

.recommend-hero__desc {
  margin-top: 8px;
  color: var(--text);
  line-height: 1.7;
}

.recommend-toolbar {
  background: #ffffff;
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
  color: var(--text-strong);
}

.recommend-toolbar__desc {
  margin-top: 4px;
  color: var(--text-muted);
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
  background: #ffffff;
  overflow: hidden;
  border: 1px solid var(--line);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.recommend-card:hover {
  transform: translateY(-3px);
  border-color: var(--line-strong);
}

.recommend-card__cover {
  margin: -24px -24px 16px;
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 11;
  border-radius: var(--radius-lg) var(--radius-lg) 18px 18px;
  background: var(--surface-muted);
}

.recommend-waterfall__item:nth-child(3n + 2) .recommend-card__cover {
  aspect-ratio: 16 / 10;
}

.recommend-waterfall__item:nth-child(4n) .recommend-card__cover {
  aspect-ratio: 16 / 12;
}

.recommend-card__coverImage {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommend-card__coverImage--fallback {
  background: var(--brand-soft);
}

.recommend-card__coverShade {
  position: absolute;
  inset: 0;
  background: rgba(16, 24, 40, 0.04);
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
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.8);
  color: var(--text-strong);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
}

.recommend-card__chip--primary {
  background: rgba(232, 240, 255, 0.92);
  color: var(--brand);
}

.recommend-card__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 6px;
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
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
}

.recommend-card__title {
  font-size: 19px;
  font-weight: 900;
  line-height: 1.32;
  color: var(--text-strong);
  letter-spacing: 0;
}

.recommend-card__summary {
  margin-top: 8px;
  color: var(--text);
  line-height: 1.65;
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recommend-card__dateValue {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
}

.recommend-card__actions {
  display: flex;
}

:deep(.recommend-card__button) {
  width: 100%;
  height: 42px;
  border-radius: 16px;
  border: 1px solid rgba(37, 99, 235, 0.14);
  background: var(--brand-soft) !important;
  color: var(--brand) !important;
  font-weight: 700;
  box-shadow: none;
}

:deep(.recommend-card__button:hover) {
  border-color: rgba(37, 99, 235, 0.28);
  color: var(--brand-hover) !important;
}

.recommend-footer {
  display: flex;
  justify-content: center;
  min-height: 48px;
  padding: 6px 0 10px;
}

.recommend-footer__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
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
  border-radius: 20px;
}

.recommend-detail__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--text-muted);
  font-size: 13px;
}

.recommend-detail__summary {
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--surface-soft);
  color: var(--text-strong);
  font-weight: 700;
  line-height: 1.75;
}

.recommend-detail__credit {
  color: var(--text-muted);
  font-size: 12px;
}

.recommend-detail__content {
  color: var(--text-strong);
  line-height: 1.8;
}

.recommend-detail__content :deep(p:first-child) {
  margin-top: 0;
}

.recommend-detail__content :deep(.markdown-table-wrap) {
  margin: 14px 0;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #ffffff;
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
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  vertical-align: top;
  white-space: normal;
  overflow-wrap: break-word;
}

.recommend-detail__content :deep(.markdown-table th) {
  background: var(--surface-soft);
  color: var(--text-strong);
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
  .recommend-page {
    gap: 14px;
  }

  .recommend-hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .recommend-hero__title {
    font-size: 26px;
    line-height: 1.2;
  }

  .recommend-hero__desc {
    font-size: 13px;
    line-height: 1.65;
  }

  .recommend-hero :deep(.ant-space),
  .recommend-hero :deep(.ant-space-item),
  .recommend-hero :deep(.ant-btn) {
    width: 100%;
  }

  .recommend-waterfall {
    column-count: 1;
    column-gap: 0;
  }

  .recommend-toolbar__inner {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .recommend-toolbar__search {
    width: 100%;
  }

  .recommend-card__cover {
    aspect-ratio: 16 / 10;
    margin: -16px -16px 14px;
    border-radius: 20px 20px 16px 16px;
  }

  .recommend-waterfall__item:nth-child(3n + 2) .recommend-card__cover,
  .recommend-waterfall__item:nth-child(4n) .recommend-card__cover {
    aspect-ratio: 16 / 10;
  }

  .recommend-card__coverTop {
    left: 12px;
    right: 12px;
    top: 12px;
  }

  .recommend-card__chip {
    max-width: 100%;
    font-size: 10px;
  }

  .recommend-card__title {
    font-size: 17px;
  }

  .recommend-card__meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .recommend-footer__status {
    width: 100%;
  }

  .recommend-detail__cover {
    max-height: 190px;
    border-radius: 16px;
  }

  .recommend-detail__meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .recommend-detail__summary {
    padding: 12px;
    border-radius: 16px;
    font-size: 13px;
  }
}
</style>
