<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref, toRef } from "vue";
import {
  SHEET_DISMISS_LOCK_KEY,
  type SheetDismissLock,
} from "@/composables/sheetDismissLock";
import {
  isTopSheet,
  registerSheet,
  unregisterSheet,
} from "@/composables/sheetStack";
import { useSwipeDismiss } from "@/composables/useSwipeDismiss";

const props = withDefaults(
  defineProps<{
    title?: string;
    /** tall = 90vh (New tracker); auto = content height capped */
    size?: "tall" | "auto";
    ariaLabel?: string;
    /** Stacking above nested sheets (default 40). */
    layer?: number;
  }>(),
  { size: "tall", layer: 40 },
);

const emit = defineEmits<{
  close: [];
}>();

const sheetId = Symbol("sheet");
const open = ref(false);
const leaving = ref(false);
const dismissLocked = ref(false);
const bodyEl = ref<HTMLElement | null>(null);
let leaveTimer: number | undefined;

const { dragY, dragging, onTouchStart, onTouchMove, onTouchEnd, reset } =
  useSwipeDismiss(() => requestClose(), 72, { canBegin: canBeginDismiss });

const dismissLockApi: SheetDismissLock = {
  lock: () => {
    dismissLocked.value = true;
    reset();
  },
  unlock: () => {
    dismissLocked.value = false;
  },
};
provide(SHEET_DISMISS_LOCK_KEY, dismissLockApi);

const panelStyle = computed(() => {
  if (leaving.value) {
    return {
      transform: "translateY(100%)",
      transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
    };
  }
  if (dragging.value || dragY.value > 0) {
    return {
      transform: `translateY(${dragY.value}px)`,
      transition: dragging.value
        ? "none"
        : "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
    };
  }
  return undefined;
});

function requestClose() {
  if (leaving.value || dismissLocked.value) return;
  leaving.value = true;
  open.value = false;
  dragging.value = false;
  window.clearTimeout(leaveTimer);
  leaveTimer = window.setTimeout(() => {
    reset();
    emit("close");
  }, 300);
}

provide("sheetClose", requestClose);

function canBeginDismiss(e: TouchEvent): boolean {
  if (dismissLocked.value) return false;
  if (!isTopSheet(sheetId)) return false;
  const target = e.target;
  if (!(target instanceof Element)) return true;

  if (
    target.closest(
      ".handle, .sortable-chosen, .sortable-drag, input, textarea, select",
    )
  ) {
    return false;
  }

  if (target.closest(".chrome")) return true;

  const body = bodyEl.value;
  if (body && body.scrollHeight > body.clientHeight + 1) {
    return body.scrollTop <= 0;
  }
  return true;
}

function onPanelTouchStart(e: TouchEvent) {
  onTouchStart(e);
}

function onPanelTouchMove(e: TouchEvent) {
  onTouchMove(e);
}

function onPanelTouchEnd() {
  onTouchEnd();
}

function onKey(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  if (!isTopSheet(sheetId)) return;
  e.stopPropagation();
  requestClose();
}

onMounted(() => {
  registerSheet({
    id: sheetId,
    layer: props.layer,
    close: requestClose,
  });
  document.addEventListener("keydown", onKey);
  requestAnimationFrame(() => {
    open.value = true;
  });
});

onUnmounted(() => {
  unregisterSheet(sheetId);
  document.removeEventListener("keydown", onKey);
  window.clearTimeout(leaveTimer);
});

defineExpose({ requestClose });

// keep layer reactive for template
const layer = toRef(props, "layer");
</script>

<template>
  <div
    class="sheet-root"
    :class="{ open, leaving, dragging }"
    :style="{ '--sheet-z': layer }"
  >
    <button
      type="button"
      class="backdrop"
      aria-label="Закрыть"
      @click="requestClose"
    />
    <div
      class="panel"
      :class="size"
      role="dialog"
      aria-modal="true"
      :aria-label="ariaLabel || title || 'Sheet'"
      :style="panelStyle"
      @touchstart.passive="onPanelTouchStart"
      @touchmove="onPanelTouchMove"
      @touchend="onPanelTouchEnd"
      @touchcancel="onPanelTouchEnd"
    >
      <div class="chrome">
        <div class="grab" aria-hidden="true" />
        <header v-if="title" class="header">
          <h2 class="title">{{ title }}</h2>
          <button
            type="button"
            class="close"
            aria-label="Закрыть"
            @click="requestClose"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 2L12 12M12 2L2 12"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </header>
        <div v-if="$slots.header" class="header-slot">
          <slot name="header" />
        </div>
      </div>
      <div ref="bodyEl" class="body">
        <slot />
      </div>
      <div v-if="$slots.footer" class="footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet-root {
  position: fixed;
  inset: 0;
  z-index: var(--sheet-z, 40);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: var(--color-overlay);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sheet-root.open .backdrop {
  opacity: 1;
}

.sheet-root.leaving .backdrop {
  opacity: 0;
}

.panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--layout-max);
  margin: 0 auto;
  border-radius: 20px 20px 0 0;
  background: var(--color-surface-2);
  padding-bottom: var(--safe-bottom);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.35);
  transform: translateY(100%);
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  touch-action: pan-y;
}

.sheet-root.open .panel {
  transform: translateY(0);
}

.sheet-root.leaving .panel {
  transform: translateY(100%);
}

.sheet-root.dragging .panel {
  transition: none;
}

.panel.tall {
  height: 90dvh;
  max-height: 90dvh;
}

.panel.auto {
  max-height: min(88dvh, 100%);
}

.chrome {
  flex: 0 0 auto;
}

.grab {
  width: 36px;
  height: 4px;
  margin: 8px auto 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-text-secondary) 45%, transparent);
  flex: 0 0 auto;
}

.header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 4px var(--layout-gutter) 8px;
  flex: 0 0 auto;
}

.title {
  margin: 0;
  font-size: 1.125rem;
  color: var(--color-text-primary);
  font-weight: 400;
}

.close {
  position: absolute;
  right: var(--layout-gutter);
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--color-surface-3);
  color: var(--color-text-primary);
}

.close:active {
  opacity: 0.75;
}

.header-slot {
  flex: 0 0 auto;
  padding: 4px var(--layout-gutter) 8px;
}

.body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 4px var(--layout-gutter) 12px;
  -webkit-overflow-scrolling: touch;
}

.panel.auto .body {
  flex: 0 1 auto;
  overflow: visible;
}

.footer {
  flex: 0 0 auto;
  padding: 8px var(--layout-gutter) 12px;
}
</style>
