<script setup lang="ts">
import BasicLayout from "@/layouts/BasicLayout.vue";
import { useRouter } from "vue-router";
import { Button, Card, Col, Divider, Row, Space, Tag } from "ant-design-vue";

const router = useRouter();

const samplePrompts = [
  "我要去日本旅游，请帮我规划 7 天游览行程（东京 + 大阪），预算 8000 元",
  "帮我生成法国 10 日签证用行程，包含每日安排与酒店建议",
  "计划 5 天新加坡自由行，请帮我规划行程并展示的行程单",
];

const trustStats = [
  { value: "1 min", label: "快速出结果", tone: "sky", icon: "⚡" },
  { value: "Excel / PDF", label: "材料导出", tone: "violet", icon: "📄" },
  { value: "结构化", label: "可检索可管理", tone: "mint", icon: "🧩" },
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
              >免费生成我的行程</Button
            >
            <Button
              class="hero__btn-secondary"
              size="large"
              @click="router.push('/itineraries')"
            >
              查看示例/已保存行程
            </Button>
          </Space>

          <div class="hero__trust">
            <div
              v-for="stat in trustStats"
              :key="stat.label"
              :class="['hero__stat', `hero__stat--${stat.tone}`]"
            >
              <div class="hero__statTop">
                <span class="hero__statIcon">{{ stat.icon }}</span>
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
              <Button @click="router.push('/itineraries')">我先看看成果</Button>
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
            <div class="feature__icon feature__icon--visa">AI</div>
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
            <div class="feature__icon feature__icon--export">📄</div>
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
            <div class="feature__icon feature__icon--flight">✈️</div>
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
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(16, 24, 40, 0.08);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.muted {
  color: rgba(0, 0, 0, 0.45);
}

.hero {
  border-radius: 18px;
  padding: 28px 22px;
  margin-bottom: 16px;
  background: linear-gradient(
    135deg,
    rgba(24, 144, 255, 0.16),
    rgba(255, 255, 255, 0.75)
  );
  box-shadow: 0 10px 30px rgba(16, 24, 40, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.hero--landing {
  padding: 26px;
}

.hero__grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
  align-items: stretch;
}

.hero__badge {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero__title {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.6px;
  color: rgba(0, 0, 0, 0.88);
}

.hero__title--landing {
  font-size: 42px;
}

.hero__subtitle {
  color: rgba(0, 0, 0, 0.65);
  font-size: 15px;
  line-height: 1.6;
}

.hero__actions {
  margin: 10px 0px !important;
}

.hero__btn-secondary {
  border-color: rgba(26, 162, 255, 0.35) !important;
  background: rgba(255, 255, 255, 0.96) !important;
  color: var(--brand-sky-2) !important;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(26, 162, 255, 0.12);
}

.hero__btn-secondary:hover,
.hero__btn-secondary:focus {
  border-color: rgba(26, 162, 255, 0.55) !important;
  color: #0e8fde !important;
  transform: translateY(-1px);
}

.hero__trust {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hero__stat {
  border: 0;
  border-radius: 14px;
  padding: 10px 12px;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
  box-shadow: 0 8px 20px rgba(16, 24, 40, 0.12);
}

.hero__stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(16, 24, 40, 0.18);
}

.hero__statTop {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero__statIcon {
  width: 17px;
  height: 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.28);
}

.hero__stat--sky {
  background: linear-gradient(135deg, #2ca6ff, #1bc7ff);
}

.hero__stat--violet {
  background: linear-gradient(135deg, #7b61ff, #b26fff);
}

.hero__stat--mint {
  background: linear-gradient(135deg, #00b894, #34d399);
}

.hero__statNum,
.hero__statText {
  color: rgba(255, 255, 255, 0.98);
}

.hero__statNum {
  font-size: 15px;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.hero__statText {
  margin-top: 8px;
  opacity: 1;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  line-height: 1.35;
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
}
.hero-panel__hint {
  margin-bottom: 10px;
}

.hero__panel {
  display: flex;
}

.hero-panel {
  width: 100%;
  background: rgba(255, 255, 255, 0.7);
}

.hero-panel__promptList {
  width: 100%;
}

.hero-panel__divider {
  margin: 14px 0;
}

.prompt-chip {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  user-select: none;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
  color: rgba(0, 0, 0, 0.78);
  font-size: 13px;
  line-height: 1.5;
}

.prompt-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(16, 24, 40, 0.08);
}

.feature {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 900;
  background: rgba(24, 144, 255, 0.12);
  color: rgba(0, 0, 0, 0.78);
}

.feature__title {
  font-size: 16px;
  font-weight: 850;
  color: rgba(0, 0, 0, 0.88);
}

.feature__desc {
  color: rgba(0, 0, 0, 0.65);
}

.section--steps {
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.75);
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.96),
    rgba(245, 250, 255, 0.98)
  );
  border: 1px solid rgba(30, 167, 253, 0.12);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
}

.home-feature-card {
  background: linear-gradient(
    155deg,
    rgba(255, 255, 255, 0.98),
    rgba(246, 250, 255, 0.96)
  );
  border: 1px solid rgba(30, 167, 253, 0.12);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.home-feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
}

.home-feature-card--visa {
  border-top: 3px solid rgba(15, 163, 177, 0.78);
}

.home-feature-card--export {
  border-top: 3px solid rgba(92, 107, 192, 0.78);
}

.home-feature-card--flight {
  border-top: 3px solid rgba(255, 159, 67, 0.78);
}

.feature__icon--visa {
  background: linear-gradient(135deg, #0fa3b1, #56d7c4);
  color: #ffffff;
}

.feature__icon--export {
  background: linear-gradient(135deg, #5c6bc0, #917cff);
  color: #ffffff;
}

.feature__icon--flight {
  background: linear-gradient(135deg, #ff9f43, #ffd36e);
  color: #ffffff;
}

.step--home {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 14px 14px 12px;
  height: 100%;
  background: linear-gradient(
    150deg,
    rgba(255, 255, 255, 0.98),
    rgba(248, 251, 255, 0.96)
  );
  border-color: rgba(30, 167, 253, 0.12);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
}

.step--home .step__num {
  font-weight: 900;
  letter-spacing: 0.8px;
  font-size: 12px;
  color: #1677ff;
  background: rgba(22, 119, 255, 0.08);
  border: 1px solid rgba(22, 119, 255, 0.14);
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 4px 10px;
}

.step--home .step__title {
  font-weight: 900;
  margin-top: 6px;
  color: #0f172a;
}

.step--home .step__desc {
  margin-top: 6px;
  color: rgba(15, 23, 42, 0.68);
}

.steps-row {
  margin-top: 8px;
}

.section--steps__divider {
  margin: 18px 0 12px;
}

@media (max-width: 640px) {
  .hero__title {
    font-size: 28px;
  }

  .hero__grid {
    grid-template-columns: 1fr;
  }

  .hero__title--landing {
    font-size: 30px;
  }

  .hero__trust {
    grid-template-columns: 1fr;
  }
}
</style>
