import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  applyThemeToDocument,
  ensureSettings,
  setTheme as persistTheme,
  type Theme,
} from '@/db'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>('dark')
  const lastViewedMonth = ref('')
  const lastSelectedDate = ref('')
  const ready = ref(false)

  async function hydrate() {
    const s = await ensureSettings()
    theme.value = s.theme
    lastViewedMonth.value = s.lastViewedMonth
    lastSelectedDate.value = s.lastSelectedDate
    applyThemeToDocument(s.theme)
    ready.value = true
  }

  async function setTheme(next: Theme) {
    theme.value = next
    applyThemeToDocument(next)
    await persistTheme(next)
  }

  return {
    theme,
    lastViewedMonth,
    lastSelectedDate,
    ready,
    hydrate,
    setTheme,
  }
})
