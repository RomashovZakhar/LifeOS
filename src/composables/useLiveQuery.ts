import { liveQuery } from 'dexie'
import { onScopeDispose, ref, type Ref, watchEffect } from 'vue'

/** Dexie liveQuery → Vue ref; re-runs when `deps` change. */
export function useLiveQuery<T>(
  querier: () => Promise<T> | T,
  initial: T,
  deps?: () => unknown,
): Ref<T> {
  const data = ref(initial) as Ref<T>
  let unsubscribe: (() => void) | undefined

  watchEffect((onCleanup) => {
    deps?.()
    unsubscribe?.()
    const observable = liveQuery(querier)
    const sub = observable.subscribe({
      next: (value) => {
        data.value = value
      },
      error: (err: unknown) => {
        console.error('[liveQuery]', err)
      },
    })
    unsubscribe = () => sub.unsubscribe()
    onCleanup(() => unsubscribe?.())
  })

  onScopeDispose(() => unsubscribe?.())

  return data
}
