/** Shared stack so only the top sheet handles Escape / body scroll lock. */

export type SheetStackEntry = {
  id: symbol
  layer: number
  close: () => void
}

const stack: SheetStackEntry[] = []

export function registerSheet(entry: SheetStackEntry): void {
  stack.push(entry)
  stack.sort((a, b) => a.layer - b.layer)
  document.body.style.overflow = 'hidden'
}

export function unregisterSheet(id: symbol): void {
  const i = stack.findIndex((e) => e.id === id)
  if (i >= 0) stack.splice(i, 1)
  document.body.style.overflow = stack.length > 0 ? 'hidden' : ''
}

export function isTopSheet(id: symbol): boolean {
  return stack.length > 0 && stack[stack.length - 1]?.id === id
}
