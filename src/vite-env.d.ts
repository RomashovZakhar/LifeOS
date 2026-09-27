/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_PUSH_ENDPOINT?: string
  readonly VITE_VAPID_PUBLIC_KEY?: string
  readonly VITE_PUSH_TOKEN?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
