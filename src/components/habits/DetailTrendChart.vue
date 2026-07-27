<script setup lang="ts">
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { DetailPoint, NumericDetailType } from "@/lib/detailStats";
import {
  formatClockTime,
  formatCountValue,
  formatMeasureValue,
} from "@/lib/cellDisplay";

const props = defineProps<{
  points: DetailPoint[];
  valueType: NumericDetailType;
  timeFormat?: "24h" | "ampm";
}>();

const emit = defineEmits<{
  "select-date": [date: string];
}>();

const rootEl = ref<HTMLElement | null>(null);
let chart: uPlot | null = null;
let dates: string[] = [];
let ro: ResizeObserver | null = null;

function cssVar(name: string, fallback: string): string {
  if (!rootEl.value) return fallback;
  const v = getComputedStyle(rootEl.value).getPropertyValue(name).trim();
  return v || fallback;
}

function monoFont(sizePx = 11): string {
  const stack = cssVar(
    "--font-mono",
    'ui-monospace, "SF Mono", Menlo, monospace',
  );
  return `${sizePx}px ${stack}`;
}

function formatY(y: number): string {
  if (props.valueType === "count") return formatCountValue(y);
  if (props.valueType === "time") {
    const m = ((Math.round(y) % 1440) + 1440) % 1440;
    return formatClockTime(m, props.timeFormat ?? "24h");
  }
  return formatMeasureValue(y);
}

/** Day-of-month labels; blank if same calendar day as previous tick. */
function dedupeDayLabels(splits: number[]): string[] {
  let prevDay: number | null = null;
  return splits.map((ts) => {
    const day = new Date(ts * 1000).getDate();
    if (day === prevDay) return "";
    prevDay = day;
    return String(day);
  });
}

function destroy() {
  chart?.destroy();
  chart = null;
}

function toData(points: DetailPoint[]): uPlot.AlignedData {
  const xs = points.map((p) => {
    const [y, m, d] = p.date.split("-").map(Number);
    return Math.floor(new Date(y, m - 1, d, 12, 0, 0).getTime() / 1000);
  });
  const ys = points.map((p) => p.y);
  return [xs, ys];
}

function buildOpts(width: number, height: number): uPlot.Options {
  const stroke = cssVar("--color-text-primary", "#fafafa");
  const muted = cssVar("--color-text-secondary", "#8e8e93");
  const grid = "rgba(142, 142, 147, 0.18)";
  const font = monoFont(11);

  return {
    width,
    height,
    padding: [8, 8, 0, 0],
    cursor: {
      show: true,
      x: false,
      y: false,
      points: { show: false },
    },
    legend: { show: false },
    scales: {
      x: { time: true },
      y: { auto: true },
    },
    axes: [
      {
        stroke: muted,
        grid: { show: false },
        ticks: { show: false },
        gap: 6,
        font,
        space: 56,
        size: 22,
        values: (_u, splits) => dedupeDayLabels(splits),
      },
      {
        stroke: muted,
        grid: { stroke: grid, width: 1 },
        ticks: { show: false },
        gap: 14,
        font,
        size: 46,
        values: (_u, splits) => splits.map((v) => formatY(v)),
      },
    ],
    series: [
      {},
      {
        stroke,
        width: 1.5,
        points: {
          show: true,
          size: 6,
          width: 0,
          fill: stroke,
        },
      },
    ],
    hooks: {
      ready: [
        (u) => {
          u.over.addEventListener("click", () => {
            const idx = u.cursor.idx;
            if (idx == null || idx < 0 || idx >= dates.length) return;
            emit("select-date", dates[idx]);
          });
        },
      ],
    },
  };
}

function mountChart() {
  destroy();
  const el = rootEl.value;
  if (!el || props.points.length === 0) return;

  dates = props.points.map((p) => p.date);
  const width = Math.max(el.clientWidth, 1);
  const height = 168;
  chart = new uPlot(buildOpts(width, height), toData(props.points), el);
}

function onResize() {
  if (!chart || !rootEl.value) return;
  chart.setSize({
    width: Math.max(rootEl.value.clientWidth, 1),
    height: 168,
  });
}

onMounted(() => {
  mountChart();
  if (rootEl.value) {
    ro = new ResizeObserver(() => onResize());
    ro.observe(rootEl.value);
  }
});

onBeforeUnmount(() => {
  ro?.disconnect();
  destroy();
});

watch(
  () => [props.points, props.valueType, props.timeFormat] as const,
  () => {
    mountChart();
  },
  { deep: true },
);
</script>

<template>
  <section class="wrap" aria-label="График">
    <p v-if="points.length === 0" class="empty">Недостаточно данных</p>
    <div
      ref="rootEl"
      class="chart"
      :class="{ hidden: points.length === 0 }"
      aria-hidden="true"
    />
  </section>
</template>

<style scoped>
.wrap {
  margin-top: 16px;
  min-height: 120px;
}

.empty {
  margin: 0;
  padding: 48px 12px;
  text-align: center;
  font-size: 0.875rem;
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}

.chart {
  width: 100%;
}

.chart.hidden {
  display: none;
}

.chart :deep(.uplot) {
  margin: 0;
}

.chart :deep(.u-over) {
  cursor: pointer;
}
</style>
