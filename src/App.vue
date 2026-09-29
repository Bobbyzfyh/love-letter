<script setup>
/**
 * App —— 把各个组件按"读一封信"的顺序串起来
 * ---------------------------------------------------------------------------
 * 阅读顺序：
 *   开场页（IntroScreen）
 *     -> 小标题（HeroBlock）
 *     -> 正文章节 x N（StorySection）
 *     -> 照片墙（PhotoGallery）
 *     -> 最后的一封信（Letter）
 *     -> 结尾（Ending）
 *   全程漂浮：背景（AmbientBackground）、音乐按钮（MusicPlayer）、彩蛋（EasterEgg）
 *
 * ★ 所有文字都在 src/data/ 里，本文件只负责"排列顺序"。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

import AmbientBackground from './components/AmbientBackground.vue'
import IntroScreen from './components/IntroScreen.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import HeroBlock from './components/HeroBlock.vue'
import StorySection from './components/StorySection.vue'
import PhotoGallery from './components/PhotoGallery.vue'
import PhotoLightbox from './components/PhotoLightbox.vue'
import Letter from './components/Letter.vue'
import Ending from './components/Ending.vue'
import EasterEgg from './components/EasterEgg.vue'

import { theme } from './data/config.js'
import { sections, gallery } from './data/story.js'
import { useBackgroundMusic } from './composables/useBackgroundMusic.js'

/** 是否已经点过"打开这封信" */
const entered = ref(false)
/** 当前放大查看的照片（null = 没有） */
const activePhoto = ref(null)
/** 顶部那条很细的阅读进度（0 ~ 1） */
const progress = ref(0)
/** "向下滑动"的小提示 */
const showScrollHint = ref(false)

const { prepare, start } = useBackgroundMusic()

let hintTimer = null

function handleOpen() {
  // ★★ 关键点 ★★
  // 音乐必须在"用户点击"这个事件里同步开始播放。
  // iOS Safari 和安卓 Chrome 都会拦截没有用户交互的自动播放，
  // 所以这里不能放到 setTimeout 或者 onMounted 里。
  start()

  entered.value = true
  window.scrollTo({ top: 0, behavior: 'auto' })

  hintTimer = window.setTimeout(() => {
    showScrollHint.value = true
  }, 2600)
}

function openPhoto(index) {
  activePhoto.value = gallery.photos[index] || null
}

/* --------------------------------------------------------------------------
 * 顶部阅读进度条（很细、很淡，只是给一点"读到哪里了"的感觉）
 * ----------------------------------------------------------------------- */
let ticking = false

function updateProgress() {
  ticking = false
  const doc = document.documentElement
  const max = doc.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
  if (window.scrollY > 60) showScrollHint.value = false
}

function onScroll() {
  if (ticking) return
  ticking = true
  window.requestAnimationFrame(updateProgress)
}

onMounted(() => {
  // 1) 把 config.js 里的配色注入成 CSS 变量（--c-bg / --c-accent ...）
  const rootEl = document.documentElement
  Object.entries(theme.colors || {}).forEach(([key, value]) => {
    const varName = '--c-' + key.replace(/[A-Z]/g, (char) => '-' + char.toLowerCase())
    rootEl.style.setProperty(varName, value)
  })

  // 2) 手机浏览器地址栏的颜色也跟着走
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta && theme.colors && theme.colors.bg) {
    meta.setAttribute('content', theme.colors.bg)
  }

  // 3) 提前把音频建好并预加载（此时不会出声）。
  //    这样万一是 background.mp3 不存在，也能在用户点击之前切到备用音源。
  prepare()

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  updateProgress()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (hintTimer !== null) window.clearTimeout(hintTimer)
})
</script>

<template>
  <div class="app">
    <!-- 背景：光斑 / 星点 / 颗粒 / 暗角，永远在最底层 -->
    <AmbientBackground :active="entered" />

    <!-- 开场页：只有一句邀请和一颗按钮 -->
    <Transition name="intro-out">
      <IntroScreen v-if="!entered" @open="handleOpen" />
    </Transition>

    <!-- 正式内容 -->
    <Transition name="fade-up" appear>
      <main v-if="entered" class="app__main">
        <div class="app__progress" aria-hidden="true">
          <span class="app__progress-bar" :style="{ transform: 'scaleX(' + progress + ')' }"></span>
        </div>

        <HeroBlock />

        <StorySection
          v-for="(section, index) in sections"
          :key="section.id || index"
          :section="section"
          :index="index"
        />

        <PhotoGallery :gallery="gallery" @open="openPhoto" />

        <Letter />

        <Ending />
      </main>
    </Transition>

    <!-- 右下角的音乐按钮 -->
    <MusicPlayer v-if="entered" />

    <!-- 左下角那颗很小的星星 -->
    <EasterEgg v-if="entered" />

    <!-- 照片放大查看 -->
    <PhotoLightbox :photo="activePhoto" @close="activePhoto = null" />

    <!-- "向下滑动"的小提示，滚动之后自己消失 -->
    <Transition name="hint-fade">
      <div v-if="entered && showScrollHint" class="app__hint" aria-hidden="true">
        <span class="app__hint-text">向下滑动</span>
        <span class="app__hint-line"></span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
}

.app__main {
  position: relative;
  z-index: 1;
}

/* 顶部那条极细的阅读进度 */
.app__progress {
  position: fixed;
  z-index: 50;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  pointer-events: none;
}

.app__progress-bar {
  display: block;
  height: 100%;
  width: 100%;
  transform-origin: 0 50%;
  background: linear-gradient(to right, transparent, var(--c-accent));
  opacity: 0.5;
}

/* 开场页淡出 */
.intro-out-leave-active {
  transition: opacity 0.9s var(--ease-soft);
}

.intro-out-leave-to {
  opacity: 0;
}

/* "向下滑动"提示 */
.app__hint {
  position: fixed;
  z-index: 30;
  left: 50%;
  bottom: calc(1.5rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  pointer-events: none;
}

.app__hint-text {
  font-size: 0.68rem;
  letter-spacing: 0.34em;
  color: var(--c-text-faint);
}

.app__hint-line {
  width: 1px;
  height: 34px;
  background: linear-gradient(to bottom, var(--c-accent-soft), transparent);
  animation: hint-drop 3.4s var(--ease-soft) infinite;
}

@keyframes hint-drop {
  0%,
  100% {
    opacity: 0.25;
    transform: translateY(-4px) scaleY(0.8);
  }
  50% {
    opacity: 0.8;
    transform: translateY(0) scaleY(1);
  }
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 1.4s var(--ease-soft);
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .app__hint-line {
    animation: none !important;
  }
}
</style>
