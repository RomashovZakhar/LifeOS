<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="page">
    <RouterLink class="back" to="/workout">✕</RouterLink>
    <h1 class="title">Шаблоны</h1>
    <p class="helper">Заглушка Phase 0 — W4/W5 позже.</p>
  </main>
</template>

<style scoped>
.page {
  padding: var(--space-4);
  max-width: 480px;
  margin: 0 auto;
}
.back {
  display: inline-block;
  margin-bottom: var(--space-4);
  font-size: var(--type-title);
  color: var(--color-text-secondary);
}
.title {
  margin: 0 0 var(--space-3);
  font-size: var(--type-title);
}
</style>
