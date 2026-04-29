<script setup lang="ts">
import BasicLayout from "@/layouts/BasicLayout.vue";
import { useRouter } from "vue-router";
import {
  CompassOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  FileExcelOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons-vue";
import { Button, Card, Col, Divider, Row, Space, Tag } from "ant-design-vue";

const router = useRouter();

const samplePrompts = [
  "我要去日本旅游，请帮我规划 7 天游览行程（东京 + 大阪），预算 8000 元",
  "帮我生成法国 10 日签证用行程，包含每日安排与酒店建议",
  "计划 5 天新加坡自由行，请帮我规划行程并展示的行程单",
];

const trustStats = [
  { value: "1 min", label: "快速出结果", tone: "blue", icon: ThunderboltOutlined },
  { value: "Excel / PDF", label: "材料导出", tone: "violet", icon: FileExcelOutlined },
  { value: "结构化", label: "可检索可管理", tone: "mint", icon: DatabaseOutlined },
];
</script>

<template>
  <BasicLayout>
    <div class="hero hero--landing">
      <div class="hero__grid">
        <div class="hero__copy">
          <div class="hero__badge">
            <Tag color="blue">签证行程</Tag>
            <Tag color="green">结构化</Tag>
            <Tag color="purple">一键导出</Tag>
          </div>
          <div class="hero__title hero__title--landing">
            把签证行程做成“可提交材料”
          </div>
          <div class="hero__subtitle">
            Easy Tour 用 AI
            生成更符合签证场景的行程：每日安排、住宿建议、交通建议、预算摘要，自动结构化保存，并可导出
            Excel/PDF。
          </div>

          <Space class="hero__actions" wrap :size="12">
            <Button type="primary" size="large" @click="router.push('/chat')"
              >免费生成行程</Button
            >
            <Button
              class="hero__btn-secondary"
              size="large"
              @click="router.push('/itineraries')"
            >
              查看推荐行程
            </Button>
          </Space>

          <div class="hero__trust">
            <div
              v-for="stat in trustStats"
              :key="stat.label"
              :class="['hero__stat', `hero__stat--${stat.tone}`]"
            >
              <div class="hero__statTop">
                <span class="hero__statIcon">
                  <component :is="stat.icon" />
                </span>
                <div class="hero__statNum">{{ stat.value }}</div>
              </div>
              <div class="hero__statText">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <div class="hero__panel">
          <Card class="card hero-panel" :bordered="false">
            <div class="section-title">一句话给我你的需求</div>
            <div class="muted hero-panel__hint">
              复制下面任意示例，去 AI 对话页即可生成并保存。
            </div>

            <Space
              direction="vertical"
              class="hero-panel__promptList"
              :size="10"
            >
              <div
                v-for="p in samplePrompts"
                :key="p"
                class="prompt-chip"
                @click="router.push('/chat')"
              >
                {{ p }}
              </div>
            </Space>

            <Divider class="hero-panel__divider" />
            <Space wrap>
              <Button type="primary" @click="router.push('/chat')"
                >开始生成</Button
              >
              <Button @click="router.push('/itineraries')">
                看看推荐行程
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    </div>

    <Row :gutter="[16, 16]">
      <Col :xs="24" :md="8">
        <Card
          class="card home-feature-card home-feature-card--visa"
          :bordered="false"
        >
          <div class="feature">
            <div class="feature__icon feature__icon--visa">
              <RobotOutlined />
            </div>
            <div class="feature__title">签证友好行程</div>
            <div class="feature__desc">
              行程更“像材料”：日期、城市、活动、住宿、交通、预算，一目了然。
            </div>
          </div>
        </Card>
      </Col>
      <Col :xs="24" :md="8">
        <Card
          class="card home-feature-card home-feature-card--export"
          :bordered="false"
        >
          <div class="feature">
            <div class="feature__icon feature__icon--export">
              <FileDoneOutlined />
            </div>
            <div class="feature__title">一键导出</div>
            <div class="feature__desc">
              Excel/PDF 自动排版，适合打印/提交，减少整理时间。
            </div>
          </div>
        </Card>
      </Col>
      <Col :xs="24" :md="8">
        <Card
          class="card home-feature-card home-feature-card--flight"
          :bordered="false"
        >
          <div class="feature">
            <div class="feature__icon feature__icon--flight">
              <CompassOutlined />
            </div>
            <div class="feature__title">机票比价</div>
            <div class="feature__desc">
              后续接入多供应商报价，统一展示最低价与航班信息。
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <Card class="card section section--steps" :bordered="false">
      <div class="section-title">3 步完成签证行程</div>
      <Row :gutter="[16, 16]" class="steps-row">
        <Col :xs="24" :md="8">
          <div class="step step--home">
            <div class="step__num">01</div>
            <div class="step__title">输入需求</div>
            <div class="step__desc">
              国家/城市、天数、预算、偏好（博物馆/购物/亲子等）。
            </div>
          </div>
        </Col>
        <Col :xs="24" :md="8">
          <div class="step step--home">
            <div class="step__num">02</div>
            <div class="step__title">AI 生成并结构化</div>
            <div class="step__desc">
              自动生成每天的安排与建议，保存到你的行程列表。
            </div>
          </div>
        </Col>
        <Col :xs="24" :md="8">
          <div class="step step--home">
            <div class="step__num">03</div>
            <div class="step__title">导出提交</div>
            <div class="step__desc">
              一键导出 Excel/PDF，直接用于整理签证材料。
            </div>
          </div>
        </Col>
      </Row>

      <Divider class="section--steps__divider" />
      <Space wrap :size="12">
        <Button type="primary" size="large" @click="router.push('/chat')"
          >立即体验</Button
        >
      </Space>
    </Card>
  </BasicLayout>
</template>

<style scoped>
.card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--line);
}

.section-title {
  font-size: 17px;
  font-weight: 850;
  margin-bottom: 8px;
  color: var(--text-strong);
}

.muted {
  color: var(--text-muted);
}

.hero {
  border-radius: 30px;
  padding: 34px;
  margin-bottom: 18px;
  background: #ffffff;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
}

.hero--landing {
  padding: 34px;
}

.hero__grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 22px;
  align-items: stretch;
}

.hero__copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.hero__badge {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.hero__title {
  font-size: 38px;
  font-weight: 900;
  letter-spacing: 0;
  color: var(--text-strong);
  line-height: 1.12;
}

.hero__title--landing {
  max-width: 620px;
  font-size: 46px;
}

.hero__subtitle {
  max-width: 650px;
  margin-top: 16px;
  color: var(--text);
  font-size: 16px;
  line-height: 1.75;
}

.hero__actions {
  margin: 18px 0 0 !important;
}

.hero__btn-secondary {
  border-color: var(--line-strong) !important;
  background: #ffffff !important;
  color: var(--text-strong) !important;
  font-weight: 700;
  box-shadow: none;
}

.hero__btn-secondary:hover,
.hero__btn-secondary:focus {
  border-color: rgba(37, 99, 235, 0.28) !important;
  color: var(--brand) !important;
  transform: translateY(-1px);
}

.hero__trust {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.hero__stat {
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 14px;
  background: var(--surface-soft);
  transition:
    transform 0.16s ease,
    border-color 0.16s ease;
}

.hero__stat:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
}

.hero__statTop {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero__statIcon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  border-radius: 12px;
  background: #ffffff;
}

.hero__stat--blue {
  background: var(--brand-soft);
  border-color: rgba(37, 99, 235, 0.1);
}

.hero__stat--violet {
  background: var(--violet-soft);
  border-color: rgba(124, 58, 237, 0.1);
}

.hero__stat--mint {
  background: var(--mint-soft);
  border-color: rgba(18, 185, 129, 0.12);
}

.hero__stat--blue .hero__statIcon {
  color: var(--brand);
}

.hero__stat--violet .hero__statIcon {
  color: var(--violet);
}

.hero__stat--mint .hero__statIcon {
  color: var(--mint);
}

.hero__statNum {
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0;
}

.hero__statText {
  margin-top: 10px;
  color: var(--text);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.35;
}
.hero-panel__hint {
  margin-bottom: 14px;
}

.hero__panel {
  display: flex;
}

.hero-panel {
  width: 100%;
  background: var(--surface-soft);
  box-shadow: none;
}

.hero-panel__promptList {
  width: 100%;
}

.hero-panel__divider {
  margin: 14px 0;
}

.prompt-chip {
  padding: 12px 14px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid var(--line);
  cursor: pointer;
  user-select: none;
  transition:
    transform 0.12s ease,
    border-color 0.12s ease,
    background 0.12s ease;
  color: var(--text);
  font-size: 13px;
  line-height: 1.5;
}

.prompt-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.28);
  background: #f9fbff;
}

.feature {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature__icon {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 18px;
  background: var(--brand-soft);
  color: var(--brand);
}

.feature__title {
  font-size: 16px;
  font-weight: 850;
  color: var(--text-strong);
}

.feature__desc {
  color: var(--text);
  line-height: 1.65;
}

.section--steps {
  margin-top: 16px;
  background: #ffffff;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
}

.home-feature-card {
  background: #ffffff;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-soft);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease;
}

.home-feature-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
}

.home-feature-card--visa {
  background: var(--mint-soft);
}

.home-feature-card--export {
  background: var(--violet-soft);
}

.home-feature-card--flight {
  background: var(--coral-soft);
}

.feature__icon--visa {
  background: #ffffff;
  color: var(--mint);
}

.feature__icon--export {
  background: #ffffff;
  color: var(--violet);
}

.feature__icon--flight {
  background: #ffffff;
  color: var(--coral);
}

.step--home {
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 16px;
  height: 100%;
  background: var(--surface-soft);
}

.step--home .step__num {
  font-weight: 900;
  letter-spacing: 0;
  font-size: 12px;
  color: var(--brand);
  background: var(--brand-soft);
  border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 4px 10px;
}

.step--home .step__title {
  font-weight: 900;
  margin-top: 10px;
  color: var(--text-strong);
}

.step--home .step__desc {
  margin-top: 6px;
  color: var(--text);
  line-height: 1.65;
}

.steps-row {
  margin-top: 8px;
}

.section--steps__divider {
  margin: 18px 0 12px;
}

@media (max-width: 640px) {
  .hero,
  .hero--landing {
    padding: 18px;
    border-radius: 24px;
  }

  .hero__title {
    font-size: 27px;
    line-height: 1.18;
  }

  .hero__grid {
    grid-template-columns: 1fr;
  }

  .hero__title--landing {
    font-size: 29px;
  }

  .hero__trust {
    grid-template-columns: 1fr;
  }

  .hero__subtitle {
    margin-top: 12px;
    font-size: 14px;
    line-height: 1.7;
  }

  .hero__actions {
    width: 100%;
  }

  .hero__actions :deep(.ant-space-item),
  .hero__actions :deep(.ant-btn) {
    width: 100%;
  }

  .hero__badge {
    gap: 6px;
    margin-bottom: 12px;
  }

  .hero__badge :deep(.ant-tag) {
    margin-inline-end: 0;
    font-size: 12px;
  }

  .hero-panel {
    border-radius: 20px;
  }

  .prompt-chip {
    padding: 11px 12px;
  }

  .feature {
    gap: 7px;
  }

  .section--steps {
    margin-top: 14px;
  }

  .step--home {
    padding: 14px;
  }
}
</style>
