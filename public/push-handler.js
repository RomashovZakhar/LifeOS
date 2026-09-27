self.addEventListener('push', (event) => {
  let title = 'LifeOS'
  let body = ''
  try {
    const data = event.data ? event.data.json() : null
    const note =
      data && typeof data.notification === 'object' && data.notification
        ? data.notification
        : data
    if (note && typeof note.title === 'string' && note.title.trim()) {
      title = note.title.trim()
    }
    if (note && typeof note.body === 'string') body = note.body
  } catch {
    /* keep fallback title */
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      lang: 'ru',
      icon: new URL('pwa-192.png', self.registration.scope).href,
      data: { url: self.registration.scope },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(self.registration.scope).href
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.startsWith(target) && 'focus' in client) {
            return client.focus()
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target)
      }),
  )
})
