<script setup lang="ts">
import { ref } from "vue";
import BasicLayout from "../../layouts/BasicLayout.vue";
import Chatbox from "./Chatbox.vue";
import Chatmenu from "./Chatmenu.vue";

const selectedPrompt = ref("");
const selectedPromptVersion = ref(0);
</script>

<template>
  <BasicLayout>
    <div class="chatgpt">
      <Chatmenu
        :selected-prompt="selectedPrompt"
        :selected-prompt-version="selectedPromptVersion"
        @update:selectedPrompt="selectedPrompt = $event"
        @update:selectedPromptVersion="selectedPromptVersion = $event"
      />
      <div class="chatgpt__main">
        <Chatbox
          :prefill-text="selectedPrompt"
          :prefill-version="selectedPromptVersion"
        />
      </div>
    </div>
  </BasicLayout>
</template>

<style scoped>
.sidebar__tags {
  margin-top: 10px;
}

.sidebar__divider {
  margin: 14px 0;
}

.sidebar__promptList {
  width: 100%;
}
</style>
