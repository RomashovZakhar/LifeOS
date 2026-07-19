import { ref, type Ref } from 'vue'

/** Swipe-down to dismiss; returns bindable handlers + drag style offset. */
export function useSwipeDismiss(onDismiss: () => void, threshold = 72) {
  const dragY: Ref<number> = ref(0)
  const dragging = ref(false)
  let startY: number | null = null
  let startX: number | null = null
  let locked: 'h' | 'v' | null = null

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0]
    if (!t) return
    startY = t.clientY
    startX = t.clientX
    locked = null
    dragging.value = false
    dragY.value = 0
  }

  function onTouchMove(e: TouchEvent) {
    if (startY == null || startX == null) return
    const t = e.touches[0]
    if (!t) return
    const dy = t.clientY - startY
    const dx = t.clientX - startX
    if (!locked) {
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return
      locked = Math.abs(dy) >= Math.abs(dx) ? 'v' : 'h'
    }
    if (locked !== 'v') return
    if (dy > 0) {
      dragging.value = true
      dragY.value = dy
      e.preventDefault()
    }
  }

  function onTouchEnd() {
    const shouldDismiss = dragging.value && dragY.value >= threshold
    const y = dragY.value
    dragging.value = false
    startY = null
    startX = null
    locked = null
    if (shouldDismiss) {
      // keep dragY so host can animate from current offset
      dragY.value = y
      onDismiss()
      return
    }
    dragY.value = 0
  }

  function reset() {
    dragY.value = 0
    dragging.value = false
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
