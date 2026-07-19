<script setup lang="ts">
defineEmits<{
  prevMonth: [];
  nextMonth: [];
  today: [];
  add: [];
  more: [];
}>();
</script>

<template>
  <nav class="dock" aria-label="Навигация">
    <button
      type="button"
      class="icon-btn"
      aria-label="Предыдущий месяц"
      @click="$emit('prevMonth')"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 14.5L12 8.5L18 14.5"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button
      type="button"
      class="icon-btn"
      aria-label="Следующий месяц"
      @click="$emit('nextMonth')"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 9.5L12 15.5L18 9.5"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button type="button" class="today-btn" @click="$emit('today')">
      СЕГОДНЯ
    </button>

    <button
      type="button"
      class="icon-btn"
      aria-label="Новый трекер"
      @click="$emit('add')"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 5V19M5 12H19"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
        />
      </svg>
    </button>

    <button
      type="button"
      class="icon-btn"
      aria-label="Настройки"
      @click="$emit('more')"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="6" cy="12" r="1.7" />
        <circle cx="12" cy="12" r="1.7" />
        <circle cx="18" cy="12" r="1.7" />
      </svg>
    </button>
  </nav>
</template>

<style scoped>
.dock {
  display: flex;
  align-items: center;
  justify-content: stretch;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 0;
}

.icon-btn {
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-surface-3);
  color: var(--color-text-primary);
  transition: opacity 0.12s ease;
}

.icon-btn:active {
  opacity: 0.72;
}

.today-btn {
  flex: 1 1 auto;
  min-width: 0;
  height: 48px;
  padding: 0 20px;
  border-radius: var(--radius-md);
  background: var(--color-cta-bg);
  color: var(--color-cta-fg);
  font-family: var(--font-mono);
  font-size: var(--type-cta);
  font-weight: 600;
  letter-spacing: 0.06em;
  transition: opacity 0.12s ease;
}

.today-btn:active {
  opacity: 0.85;
}
</style>
