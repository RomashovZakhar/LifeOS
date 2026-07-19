<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <main class="page">
    <RouterLink class="back" to="/">✕</RouterLink>
    <h1 class="title">Тренировка</h1>
    <p class="mono helper">date={{ route.query.date ?? '—' }}</p>
    <p class="helper">Заглушка Phase 0 — модуль Workouts в Phase 3.</p>
    <RouterLink class="link" to="/workout/templates">Шаблоны</RouterLink>
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
  margin: 0 0 var(--space-2);
  font-size: var(--type-title);
}
.link {
  display: inline-block;
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-surface-3);
}
</style>
