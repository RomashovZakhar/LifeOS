import { createRouter, createWebHistory } from 'vue-router'
import { todayDate } from '@/db/dates'

function workoutDateFromQuery(query: Record<string, unknown>): string {
  const d = query.date
  return typeof d === 'string' && d ? d : todayDate()
}

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
      redirect: (to) => ({
        path: '/',
        query: { workout: workoutDateFromQuery(to.query) },
      }),
    },
    {
      path: '/workout/add',
      redirect: (to) => ({
        path: '/',
        query: { workout: workoutDateFromQuery(to.query) },
      }),
    },
    {
      path: '/workout/e/:sessionExerciseId',
      redirect: (to) => ({
        path: '/',
        query: { workout: workoutDateFromQuery(to.query) },
      }),
    },
    {
      path: '/workout/templates',
      redirect: (to) => ({
        path: '/',
        query: { workout: workoutDateFromQuery(to.query) },
      }),
    },
    {
      path: '/workout/templates/:templateId',
      redirect: (to) => ({
        path: '/',
        query: { workout: workoutDateFromQuery(to.query) },
      }),
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
