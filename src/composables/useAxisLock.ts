import { onScopeDispose, watch, type Ref } from 'vue'

/**
 * Один жест — одна ось. Направление берётся по первым пикселям
 * и держится до конца инерции. Позицию пишет сам браузер, лишняя ось
 * возвращается на место до отрисовки кадра.
 */
const SLOP_PX = 6
const FORCE_PX = 18
const AXIS_RATIO = 1.5
const IDLE_MS = 180

type Axis = 'x' | 'y'
type Source = 'touch' | 'wheel'

function pickAxis(
  dx: number,
  dy: number,
  canX: boolean,
  canY: boolean,
): Axis | null {
  if (!canX && !canY) return null
  if (!canX) return 'y'
  if (!canY) return 'x'
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  const dist = Math.hypot(ax, ay)
  if (dist < SLOP_PX) return null
  if (ax >= ay * AXIS_RATIO) return 'x'
  if (ay >= ax * AXIS_RATIO) return 'y'
  if (dist < FORCE_PX) return null
  return ax >= ay ? 'x' : 'y'
}

export function useAxisLock(target: Ref<HTMLElement | null>) {
  let node: HTMLElement | null = null
  let finger = false
  let session = false
  let source: Source | null = null
  let axis: Axis | null = null
  let originX = 0
  let originY = 0
  let correcting = false
  let releaseTimer = 0

  function canScroll(el: HTMLElement) {
    return {
      x: el.scrollWidth - el.clientWidth > 1,
      y: el.scrollHeight - el.clientHeight > 1,
    }
  }

  function release() {
    window.clearTimeout(releaseTimer)
    untrackFingerUp()
    session = false
    source = null
    axis = null
    finger = false
  }

  function scheduleRelease() {
    if (finger) return
    window.clearTimeout(releaseTimer)
    releaseTimer = window.setTimeout(() => {
      if (!finger) {
        session = false
        source = null
        axis = null
      }
    }, IDLE_MS)
  }

  function trackFingerUp() {
    window.addEventListener('touchend', onTouchEnd, true)
    window.addEventListener('touchcancel', onTouchEnd, true)
  }

  function untrackFingerUp() {
    window.removeEventListener('touchend', onTouchEnd, true)
    window.removeEventListener('touchcancel', onTouchEnd, true)
  }

  function onTouchStart(e: TouchEvent) {
    if (!node) return
    if (e.touches.length !== 1) {
      release()
      return
    }
    window.clearTimeout(releaseTimer)
    finger = true
    source = 'touch'
    session = true
    axis = null
    originX = node.scrollLeft
    originY = node.scrollTop
    trackFingerUp()
  }

  function onTouchEnd() {
    if (!finger) return
    finger = false
    untrackFingerUp()
    scheduleRelease()
  }

  function onWheel(e: WheelEvent) {
    if (!node || e.ctrlKey) return
    // Колесо и палец не бывают одним жестом. Залипший touch не должен
    // оставлять ось закрытой.
    if (finger) onTouchEnd()
    if (!session || source !== 'wheel') {
      source = 'wheel'
      session = true
      axis = null
      originX = node.scrollLeft
      originY = node.scrollTop
    }
    scheduleRelease()
  }

  function onScroll() {
    if (!session || !node || correcting) return
    const dx = node.scrollLeft - originX
    const dy = node.scrollTop - originY
    if (!axis) {
      const ability = canScroll(node)
      axis = pickAxis(dx, dy, ability.x, ability.y)
      if (!axis) {
        scheduleRelease()
        return
      }
    }
    const freezeX = axis === 'y'
    const current = freezeX ? node.scrollLeft : node.scrollTop
    const frozen = freezeX ? originX : originY
    if (Math.abs(current - frozen) >= 0.5) {
      correcting = true
      if (freezeX) node.scrollLeft = originX
      else node.scrollTop = originY
      correcting = false
    }
    scheduleRelease()
  }

  function bind(el: HTMLElement) {
    node = el
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: true })
    el.addEventListener('scroll', onScroll, { passive: true })
  }

  function unbind(el: HTMLElement | null) {
    if (!el) return
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchend', onTouchEnd)
    el.removeEventListener('touchcancel', onTouchEnd)
    el.removeEventListener('wheel', onWheel)
    el.removeEventListener('scroll', onScroll)
    if (node === el) node = null
    release()
  }

  watch(target, (el, prev) => {
    if (prev && prev !== el) unbind(prev)
    if (el && el !== node) bind(el)
  })

  onScopeDispose(() => unbind(node))

  return { release }
}
