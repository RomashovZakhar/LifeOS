/** Keep --app-height in sync (iOS PWA often lies about 100dvh until rotate). */
export function installAppHeight(): void {
  const root = document.documentElement

  const sync = () => {
    const h = window.visualViewport?.height ?? window.innerHeight
    if (!(h > 0)) return
    root.style.setProperty('--app-height', `${Math.round(h)}px`)
  }

  sync()
  window.addEventListener('resize', sync)
  window.visualViewport?.addEventListener('resize', sync)
  window.visualViewport?.addEventListener('scroll', sync)
  window.addEventListener('orientationchange', () => {
    // Insets/height settle after orientation animation
    window.setTimeout(sync, 50)
    window.setTimeout(sync, 300)
  })
}
