<script setup>
/**
 * IntroScreen —— 开场页
 * ---------------------------------------------------------------------------
 * 整屏只有一句话 + 一个按钮。
 * 点击按钮时只做两件事：告诉父组件"用户要打开信了"（父组件负责淡出 + 开始音乐）。
 * 注意：音乐必须在这次点击里同步开始播放，否则手机的浏览器会拦截。
 */
import { ref } from 'vue'
import { intro, site } from '../data/config.js'

const emit = defineEmits(['open'])

const leaving = ref(false)

function handleOpen() {
  if (leaving.value) return
  leaving.value = true
  // 交给 App.vue：开始播放音乐 + 淡出这一屏
  emit('open')
}
</script>

<template>
  <section class="intro" :class="{ 'is-leaving': leaving }">
    <div class="intro__inner">
      <p class="intro__to" v-reveal="{ type: 'soft' }">
        <span class="intro__to-label">致</span>
        <span class="intro__to-name">{{ site.toName }}</span>
      </p>

      <h1 class="intro__line" v-reveal="{ delay: 420, type: 'soft' }">
        {{ intro.line }}
      </h1>

      <div class="intro__tap" v-reveal="{ delay: 1200, type: 'soft' }">
        <button class="intro__button" type="button" @click="handleOpen">
          <span class="intro__button-text">{{ intro.button }}</span>
          <span class="intro__button-glow" aria-hidden="true"></span>
        </button>
        <p v-if="intro.hint" class="intro__hint">{{ intro.hint }}</p>
      </div>
    </div>

    <p class="intro__date" v-reveal="{ delay: 1800 }">{{ site.anniversary }}</p>
  </section>
</template>

<style scoped>
.intro {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(2.5rem + env(safe-area-inset-top)) 1.5rem calc(2.5rem + env(safe-area-inset-bottom));
  text-align: center;
  transition: opacity 1.15s var(--ease-soft), filter 1.15s var(--ease-soft);
}

/* 点过按钮之后整屏柔和地淡掉 */
.intro.is-leaving {
  opacity: 0;
  filter: blur(4px);
}

.intro__inner {
  width: 100%;
  max-width: 26rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.intro__to {
  display: flex;
  align-items: baseline;
  gap: 0.5em;
  margin-bottom: 1.9rem;
  font-family: var(--font-serif);
  font-size: 0.86rem;
  letter-spacing: 0.5em;
  color: var(--c-text-faint);
}

.intro__to-name {
  font-size: 1.05rem;
  letter-spacing: 0.3em;
  color: var(--c-accent);
}

.intro__line {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(1.34rem, 5.9vw, 1.86rem);
  line-height: 1.95;
  letter-spacing: 0.09em;
  color: var(--c-text);
  text-shadow: 0 0 34px rgba(216, 177, 132, 0.14);
}

/* --------------------------------------------------------------------------
 * 按钮：手指友好的尺寸（>= 48px 高），只有很淡的边框和呼吸光晕
 * ----------------------------------------------------------------------- */
.intro__tap {
  margin-top: 3.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.15rem;
}

.intro__button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 0.95rem 2.35rem;
  border: 1px solid var(--c-line);
  border-radius: 999px;
  background: rgba(216, 177, 132, 0.05);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-family: var(--font-serif);
  font-size: 1rem;
  letter-spacing: 0.26em;
  color: var(--c-text);
  overflow: hidden;
  transition: border-color 0.9s var(--ease-soft), background-color 0.9s var(--ease-soft),
    transform 0.6s var(--ease-out-slow), box-shadow 0.9s var(--ease-soft);
  animation: breathe 6.5s ease-in-out infinite;
}

.intro__button-text {
  position: relative;
  z-index: 1;
}

.intro__button-glow {
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle at 50% 50%, rgba(216, 177, 132, 0.24), transparent 62%);
  opacity: 0.5;
  animation: glow-pulse 7.5s ease-in-out infinite;
}

.intro__button:hover,
.intro__button:focus-visible {
  border-color: rgba(216, 177, 132, 0.55);
  background: rgba(216, 177, 132, 0.12);
  box-shadow: 0 0 38px rgba(216, 177, 132, 0.16);
  outline: none;
}

.intro__button:active {
  transform: scale(0.975);
}

@keyframes breathe {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 0.32;
    transform: scale(0.94);
  }
  50% {
    opacity: 0.62;
    transform: scale(1.06);
  }
}

.intro__hint {
  font-size: 0.74rem;
  letter-spacing: 0.28em;
  color: var(--c-text-faint);
}

.intro__date {
  position: absolute;
  bottom: calc(2rem + env(safe-area-inset-bottom));
  font-family: var(--font-latin-serif);
  font-size: 0.72rem;
  letter-spacing: 0.42em;
  color: var(--c-text-faint);
}

@media (prefers-reduced-motion: reduce) {
  .intro__button,
  .intro__button-glow {
    animation: none !important;
  }
}
</style>
