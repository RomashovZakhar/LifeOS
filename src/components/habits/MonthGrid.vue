<script setup lang="ts">
import { computed, nextTick, watch } from "vue";
import type { Tracker } from "@/db";
import type { GridDay } from "@/lib/calendar";

const props = withDefaults(
  defineProps<{
    days: GridDay[];
    trackers: Tracker[];
    selectedDate: string;
    todayDate: string;
    cellText: (trackerId: string, date: string) => string;
    /** Soft wash на выбранной строке (split + Today, как эталон) */
    highlightSelected?: boolean;
  }>(),
  { highlightSelected: false },
);

const emit = defineEmits<{
  selectDate: [date: string];
  openSymbol: [tracker: Tracker];
  openCell: [payload: { tracker: Tracker; date: string }];
  dismiss: [];
}>();

/** Минимальная ширина колонки трекера; ниже — горизонтальный скролл. */
const COL_MIN_PX = 64;
/** left 14 + content ~32 + right 12 */
const DAY_W_PX = 66;
const ROW_H_PX = 34;
const HEAD_H_PX = 40;

const rowRefs = new Map<string, HTMLElement>();

function setRowRef(date: string, el: Element | null) {
  if (el instanceof HTMLElement) rowRefs.set(date, el);
  else rowRefs.delete(date);
}

const hasTrackers = computed(() => props.trackers.length > 0);
const trackerCount = computed(() => props.trackers.length);

const trackStyle = computed(() => {
  const n = trackerCount.value;
  return {
    "--day-w": `${DAY_W_PX}px`,
    "--col-min": `${COL_MIN_PX}px`,
    "--n": String(n),
    "--row-h": `${ROW_H_PX}px`,
    "--head-h": `${HEAD_H_PX}px`,
  } as Record<string, string>;
});

function showAccentBadge(date: string) {
  return date === props.todayDate;
}

function isSelected(date: string) {
  return props.highlightSelected && date === props.selectedDate;
}

function onWellClick(e: MouseEvent) {
  const t = e.target as HTMLElement | null;
  if (!t) return;
  if (t.closest("button")) return;
  emit("dismiss");
}

function isEmptyGlyph(text: string) {
  return text === "·";
}

async function scrollSelectedIntoView() {
  await nextTick();
  const el = rowRefs.get(props.selectedDate);
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
}

watch(
  () => props.selectedDate,
  () => {
    void scrollSelectedIntoView();
  },
);

watch(
  () => props.days,
  () => {
    void scrollSelectedIntoView();
  },
);

defineExpose({ scrollSelectedIntoView });
</script>

<template>
  <div class="grid-well" @click="onWellClick">
    <div class="grid-scroll">
      <div
        class="track"
        :class="{ 'has-trackers': hasTrackers }"
        :style="trackStyle"
      >
        <!-- Отдельный sticky-rail: символы никогда не рисуются поверх дней -->
        <div class="day-rail">
          <div v-if="hasTrackers" class="day-rail-head" aria-hidden="true" />
          <button
            v-for="d in days"
            :key="d.date"
            type="button"
            class="day-label"
            :class="{ weekend: d.isWeekend, selected: isSelected(d.date) }"
            @click="emit('selectDate', d.date)"
          >
            <span
              class="day-num mono"
              :class="{ badge: showAccentBadge(d.date) }"
              >{{ d.dayLabel }}</span
            >
            <span class="weekday mono">{{ d.weekdayLetter }}</span>
          </button>
        </div>

        <div v-if="hasTrackers" class="data-rail">
          <div class="data-head">
            <div class="cols">
              <button
                v-for="t in trackers"
                :key="t.id"
                type="button"
                class="col-header mono"
                :aria-label="`Открыть ${t.name}`"
                @click="emit('openSymbol', t)"
              >
                {{ t.symbol }}
              </button>
            </div>
            <div class="end-pad" aria-hidden="true" />
          </div>

          <div
            v-for="d in days"
            :key="d.date"
            :ref="(el) => setRowRef(d.date, el as Element | null)"
            class="data-row"
            :class="{ weekend: d.isWeekend, selected: isSelected(d.date) }"
          >
            <div class="cols">
              <button
                v-for="t in trackers"
                :key="`${t.id}-${d.date}`"
                type="button"
                class="cell mono"
                :class="{ empty: isEmptyGlyph(cellText(t.id, d.date)) }"
                @click="emit('openCell', { tracker: t, date: d.date })"
              >
                {{ cellText(t.id, d.date) }}
              </button>
            </div>
            <div class="end-pad" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-well {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 20px;
  background: var(--color-surface-1);
  overflow: hidden;
}

.grid-scroll {
  height: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.track {
  box-sizing: border-box;
  width: 100%;
  min-width: 100%;
  padding: 0 0 12px;
}

.track.has-trackers {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  min-width: max(100%, calc(var(--day-w) + var(--n) * var(--col-min) + 16px));
}

.day-rail {
  position: sticky;
  left: 0;
  z-index: 5;
  flex: 0 0 var(--day-w);
  width: var(--day-w);
  box-sizing: border-box;
  background: var(--color-surface-1);
}

.day-rail-head {
  position: sticky;
  top: 0;
  z-index: 6;
  height: var(--head-h);
  background: var(--color-surface-1);
}

.day-label {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: var(--row-h);
  min-height: var(--row-h);
  padding: 0 12px 0 12px;
  box-sizing: border-box;
  text-align: left;
  background: var(--color-surface-1);
  color: var(--color-text-secondary);
}

.day-label.weekend {
  background: var(--color-weekend-row);
}

.day-label.selected {
  background: var(--color-accent-soft);
}

.day-label.weekend.selected {
  background: color-mix(
    in srgb,
    var(--color-accent-soft) 88%,
    var(--color-weekend-row)
  );
}

.day-num {
  display: inline-grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  padding: 0 2px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 7px;
  line-height: 1;
}

.day-num.badge {
  background: var(--color-accent);
  color: #fff;
  font-weight: 600;
}

.weekday {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.data-rail {
  flex: 1 1 auto;
  min-width: calc(var(--n) * var(--col-min) + 16px);
}

.data-head {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  height: var(--head-h);
  background: var(--color-surface-1);
}

.data-row {
  display: flex;
  align-items: stretch;
  height: var(--row-h);
  min-height: var(--row-h);
}

.data-row.weekend {
  background: var(--color-weekend-row);
}

.data-row.selected {
  background: var(--color-accent-soft);
}

.data-row.weekend.selected {
  background: color-mix(
    in srgb,
    var(--color-accent-soft) 88%,
    var(--color-weekend-row)
  );
}

.cols {
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  min-width: calc(var(--n) * var(--col-min));
  box-sizing: border-box;
}

.end-pad {
  flex: 0 0 16px;
  width: 16px;
}

.col-header {
  flex: 1 1 0;
  min-width: var(--col-min);
  padding: 0 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell {
  flex: 1 1 0;
  min-width: var(--col-min);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1;
}

.cell.empty {
  color: var(--color-grid-empty);
}
</style>
