<script setup lang="ts">
import { onMounted } from "vue";
import { authAPI } from "./api/auth";
import { setLocalstorage } from "./localStorage";

onMounted(async () => {
  const res = await authAPI();
  if (res.ok) {
    setLocalstorage("token", JSON.stringify(res.data));
  }
});
</script>

<template>
  <router-view />
</template>
