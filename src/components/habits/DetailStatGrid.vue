<script setup lang="ts">
import type { StatCardModel } from "@/lib/detailStats";

defineProps<{
  cards: [StatCardModel, StatCardModel, StatCardModel, StatCardModel];
}>();
</script>

<template>
  <section class="grid" aria-label="Статистика">
    <article v-for="(card, i) in cards" :key="i" class="card">
      <p class="label">{{ card.label }}</p>
      <p class="value-row">
        <span class="value mono">{{ card.value }}</span>
        <span v-if="card.unit" class="unit">{{ card.unit }}</span>
      </p>
      <p v-if="card.subline" class="subline">{{ card.subline }}</p>
    </article>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 16px;
}

.card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--color-surface-3);
  min-width: 0;
  min-height: 120px;
}

.label {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.value-row {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.value {
  font-size: clamp(1.5rem, 6vw, 2rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--color-text-primary);
}

.unit {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
}

.subline {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
}
</style>
