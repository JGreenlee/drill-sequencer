import { createRouter, createWebHistory } from 'vue-router'
import Editor from './views/Editor.vue'

const router = createRouter({
  history: createWebHistory(import.meta.url),
  routes: [
    {
      path: '/',
      name: 'editor',
      component: Editor
    }
  ]
})

export default router
