import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CamerasView from '../views/CamerasView.vue'
import CameraDetailView from '../views/CameraDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue')
    },
    {
      path: '/cameras',
      name: 'cameras',
      component: CamerasView,
      meta: { requiresAuth: true }
    },
    {
      path: '/cameras/:id',
      name: 'camera-detail',
      component: CameraDetailView,
      meta: { requiresAuth: true }
    }
  ]
})

export default router
