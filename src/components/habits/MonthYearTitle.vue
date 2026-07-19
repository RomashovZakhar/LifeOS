<script setup lang="ts">
defineProps<{
  name: string;
  year: string;
}>();
</script>

<template>
  <h1 class="month-title">
    <span class="name">{{ name }}</span>
    <span class="year">{{ year }}</span>
  </h1>
</template>

<style scoped>
.month-title {
  margin: 0;
  padding: 4px var(--space-1) var(--space-3);
  font-family: var(--font-sans);
  font-size: clamp(2rem, 7.2vw, 2.375rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.name {
  color: var(--color-text-primary);
  font-weight: 400;
}

.year {
  margin-left: 0.15em;
  color: var(--color-text-secondary);
  font-weight: 400;
}
</style>
