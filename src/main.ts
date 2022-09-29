import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './main.css'

const app = createApp(App)

const pinia = createPinia();
// pinia.use(PiniaUndo)
app.use(pinia)
app.use(router)

app.mount('#app')
