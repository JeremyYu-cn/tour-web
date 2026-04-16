<script setup lang="ts">
import { ref } from "vue";
import BasicLayout from "@/layouts/BasicLayout.vue";
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
          :selected-prompt="selectedPrompt"
          :selected-prompt-version="selectedPromptVersion"
          @update:selectedPrompt="selectedPrompt = $event"
          @update:selectedPromptVersion="selectedPromptVersion = $event"
        />
      </div>
    </div>
  </BasicLayout>
</template>

<style scoped>
.chatgpt {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: start;
}

.chatgpt__main {
  min-width: 0;
}

@media (max-width: 640px) {
  .chatgpt {
    grid-template-columns: 1fr;
  }
}
</style>
