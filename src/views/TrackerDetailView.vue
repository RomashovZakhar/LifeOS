<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const id = route.params.trackerId
  void router.replace({
    path: '/',
    query: { detail: String(id) },
  })
})
</script>

<template>
  <div />
</template>
