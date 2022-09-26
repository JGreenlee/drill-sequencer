import { createRouter, createWebHistory } from 'vue-router'
import Field from './views/Field.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'field',
      component: Field
    }
  ]
})

export default router
