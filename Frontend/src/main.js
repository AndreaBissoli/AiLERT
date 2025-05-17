import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import * as auth from './utils/auth'

const app = createApp(App)

// Make auth functions available globally
app.config.globalProperties.$auth = auth

app.use(router).mount('#app')
