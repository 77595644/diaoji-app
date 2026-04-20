import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import 'vant/lib/index.css'
import './style.css'
import { Swipe, SwipeItem, Loading, Button, Overlay, ImagePreview } from 'vant'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Swipe)
app.use(SwipeItem)
app.use(Loading)
app.use(Button)
app.use(Overlay)
app.use(ImagePreview)

app.mount('#app')
