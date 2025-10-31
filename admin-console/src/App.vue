<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('DaoDaoRV Admin Console Started')
})
</script>

<style scoped>
</style>

