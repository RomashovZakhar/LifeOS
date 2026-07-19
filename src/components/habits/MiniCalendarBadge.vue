<script setup lang="ts">
defineProps<{
  dayLabel: string
  monthLabel: string
}>()
</script>

<template>
  <div class="badge" aria-hidden="true">
    <span class="day mono">{{ dayLabel }}</span>
    <span class="month">{{ monthLabel }}</span>
  </div>
</template>

<style scoped>
.badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-height: 44px;
  padding: 4px 0 5px;
  border-radius: 10px;
  background: var(--color-accent);
  color: #fff;
  line-height: 1;
}

.day {
  font-size: 1.125rem;
  font-weight: 600;
}

.month {
  margin-top: 2px;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
