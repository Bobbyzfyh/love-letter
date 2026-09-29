<script setup>
/**
 * EasterEgg —— 角落里的那颗小星星
 * ---------------------------------------------------------------------------
 * 很轻的一个彩蛋：
 *   页面左下角有一颗几乎看不见的小星星，点够 N 次会出现一句话。
 *   次数、文字都在 src/data/config.js 的 easterEgg.star 里改。
 *
 * 另一个彩蛋（长按照片看隐藏留言）在 PhotoGallery.vue 里，
 * 留言内容写在 src/data/story.js 每张照片的 note 字段。
 */
import { onBeforeUnmount, ref } from 'vue'
import { easterEgg } from '../data/config.js'

const config = easterEgg.star || {}
const required = Number(config.clicks) || 5

const clicks = ref(0)
const message = ref('')
const visible = ref(false)

let hideTimer = null

function clearHideTimer() {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
}

function handleClick() {
  clicks.value += 1

  if (clicks.value >= required) {
    clicks.value = 0
    message.value = config.message || '被你发现了。'
    visible.value = true
    clearHideTimer()
    hideTimer = window.setTimeout(() => {
      visible.value = false
      hideTimer = null
    }, 8000)
  }
}

onBeforeUnmount(clearHideTimer)
</script>

<template>
  <div v-if="config.enabled !== false" class="egg">
    <button
      class="egg__star"
      type="button"
      aria-label="一颗很小的星星"
      title=""
      @click="handleClick"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.6l2.1 5.3 5.7.4-4.4 3.6 1.4 5.5L12 15.5l-4.8 2.9 1.4-5.5-4.4-3.6 5.7-.4z"
          fill="currentColor"
        />
      </svg>
    </button>

    <Transition name="egg-fade">
      <p v-if="visible" class="egg__message">{{ message }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.egg {
  position: fixed;
  z-index: 45;
  left: calc(1.05rem + env(safe-area-inset-left));
  bottom: calc(1.25rem + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
  pointer-events: none;
}

.egg__star {
  pointer-events: auto;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-accent);
  opacity: 0.16;
  transition: opacity 1.4s var(--ease-soft), transform 1.4s var(--ease-out-slow);
}

.egg__star svg {
  width: 12px;
  height: 12px;
  animation: egg-twinkle 6.5s ease-in-out infinite;
}

.egg__star:hover,
.egg__star:focus-visible {
  opacity: 0.5;
  outline: none;
}

.egg__star:active {
  transform: scale(0.9);
}

@keyframes egg-twinkle {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.egg__message {
  pointer-events: none;
  max-width: 15rem;
  padding: 0.65rem 0.9rem;
  border-left: 1px solid var(--c-accent-soft);
  font-family: var(--font-serif);
  font-size: 0.78rem;
  line-height: 1.9;
  letter-spacing: 0.06em;
  color: var(--c-accent);
  background: rgba(12, 10, 9, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.egg-fade-enter-active,
.egg-fade-leave-active {
  transition: opacity 1.6s var(--ease-soft), transform 1.6s var(--ease-out-slow);
}

.egg-fade-enter-from,
.egg-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .egg__star svg {
    animation: none !important;
  }
}
</style>
