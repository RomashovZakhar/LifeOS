import { ref, type Ref } from 'vue'

export type SwipeDismissOptions = {
  /** Return false to ignore this gesture (e.g. body scrolled, drag handle). */
  canBegin?: (e: TouchEvent) => boolean
}

/** Swipe-down to dismiss; returns bindable handlers + drag style offset. */
export function useSwipeDismiss(
  onDismiss: () => void,
  threshold = 72,
  options?: SwipeDismissOptions,
) {
  const dragY: Ref<number> = ref(0)
  const dragging = ref(false)
  let startY: number | null = null
  let startX: number | null = null
  let locked: 'h' | 'v' | null = null
  let active = false

  function onTouchStart(e: TouchEvent) {
    if (options?.canBegin && !options.canBegin(e)) {
      active = false
      startY = null
      startX = null
      return
    }
    const t = e.touches[0]
    if (!t) return
    active = true
    startY = t.clientY
    startX = t.clientX
    locked = null
    dragging.value = false
    dragY.value = 0
  }

  function onTouchMove(e: TouchEvent) {
    if (!active || startY == null || startX == null) return
    const t = e.touches[0]
    if (!t) return
    const dy = t.clientY - startY
    const dx = t.clientX - startX
    if (!locked) {
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return
      locked = Math.abs(dy) >= Math.abs(dx) ? 'v' : 'h'
      // Pulling up while at top → let scroll handle it; cancel dismiss track
      if (locked === 'v' && dy < 0) {
        active = false
        return
      }
    }
    if (locked !== 'v') return
    if (dy > 0) {
      dragging.value = true
      dragY.value = dy
      e.preventDefault()
    }
  }

  function onTouchEnd() {
    if (!active) {
      reset()
      return
    }
    const shouldDismiss = dragging.value && dragY.value >= threshold
    const y = dragY.value
    dragging.value = false
    startY = null
    startX = null
    locked = null
    active = false
    if (shouldDismiss) {
      dragY.value = y
      onDismiss()
      return
    }
    dragY.value = 0
  }

  function reset() {
    dragY.value = 0
    dragging.value = false
    startY = null
    startX = null
    locked = null
    active = false
  }

  return {
    dragY,
    dragging,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    reset,
  }
}
