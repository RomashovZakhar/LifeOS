import type { InjectionKey } from 'vue'

/** Injected by BottomSheet — lock swipe-dismiss during nested drag. */
export type SheetDismissLock = {
  lock: () => void
  unlock: () => void
}

export const SHEET_DISMISS_LOCK_KEY: InjectionKey<SheetDismissLock> =
  Symbol('sheetDismissLock')
