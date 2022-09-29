import { createRouter, createWebHistory } from 'vue-router'
import Editor from './views/Editor.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'editor',
      component: Editor
    }
  ]
})

export default router
