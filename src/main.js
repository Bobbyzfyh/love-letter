import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

import { reveal } from './directives/reveal.js'
import { parallax } from './directives/parallax.js'
import { site } from './data/config.js'

// 浏览器标签页标题取自 config.js 的 site.title
document.title = site.title || '写给你的信'

const app = createApp(App)

// v-reveal    : 元素滚动到视口内时柔和出现
// v-parallax  : 很轻微的视差（上下浮动几个像素）
app.directive('reveal', reveal)
app.directive('parallax', parallax)

app.mount('#app')
