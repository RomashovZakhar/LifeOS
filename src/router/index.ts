import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'habits-home',
      component: () => import('@/views/HabitsHomeView.vue'),
    },
    {
      path: '/habits/new',
      redirect: { path: '/', query: { new: '1' } },
    },
    {
      path: '/t/:trackerId',
      redirect: (to) => ({
        path: '/',
        query: { detail: String(to.params.trackerId) },
      }),
    },
    {
      path: '/workout',
      name: 'workout',
      component: () => import('@/views/WorkoutView.vue'),
    },
    {
      path: '/workout/templates',
      name: 'workout-templates',
      component: () => import('@/views/WorkoutTemplatesView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/settings/appearance',
      name: 'appearance',
      component: () => import('@/views/AppearanceView.vue'),
    },
  ],
})

export default router
