<script setup>
/**
 * MusicPlayer —— 右下角悬浮的小音乐按钮
 * ---------------------------------------------------------------------------
 * 只做两件事：播放 / 暂停。
 * 播放中时按钮外面有一圈很轻微的旋转 + 呼吸动画，暂停时静止。
 * 音乐文件缺失（isAvailable=false）时按钮会自动隐藏，页面不会报错。
 */
import { computed } from 'vue'
import { useBackgroundMusic } from '../composables/useBackgroundMusic.js'
import { music } from '../data/config.js'

const { isPlaying, canShow, toggle } = useBackgroundMusic()

const label = computed(() => (isPlaying.value ? '暂停背景音乐' : '播放背景音乐'))
const volumePercent = computed(() => Math.round((Number(music.volume) || 0) * 100))
</script>

<template>
  <Transition name="music-fade">
    <div v-if="canShow" class="music" :class="{ 'is-playing': isPlaying }">
      <button
        class="music__button"
        type="button"
        :aria-label="label"
        :title="label"
        :aria-pressed="isPlaying"
        @click="toggle"
      >
        <!-- 播放中时缓慢旋转的光环 -->
        <span class="music__ring" aria-hidden="true"></span>

        <svg class="music__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4.5 9.5h3l4-3.4v11.8l-4-3.4h-3z"
            stroke="currentColor"
            stroke-width="1.25"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <template v-if="isPlaying">
            <path
              d="M15.4 9.2a4 4 0 0 1 0 5.6"
              stroke="currentColor"
              stroke-width="1.25"
              stroke-linecap="round"
            />
            <path
              d="M17.8 6.8a7.4 7.4 0 0 1 0 10.4"
              stroke="currentColor"
              stroke-width="1.25"
              stroke-linecap="round"
              opacity="0.55"
            />
          </template>
          <template v-else>
            <path
              d="M15.8 9.8l4.4 4.4M20.2 9.8l-4.4 4.4"
              stroke="currentColor"
              stroke-width="1.25"
              stroke-linecap="round"
            />
          </template>
        </svg>
      </button>

      <span class="u-visually-hidden">音量 {{ volumePercent }}%</span>
    </div>
  </Transition>
</template>

<style scoped>
.music {
  position: fixed;
  z-index: 40;
  right: calc(1.1rem + env(safe-area-inset-right));
  bottom: calc(1.1rem + env(safe-area-inset-bottom));
}

.music__button {
  position: relative;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--c-line);
  background: rgba(12, 10, 9, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--c-accent);
  opacity: 0.72;
  transition: opacity 0.8s var(--ease-soft), border-color 0.8s var(--ease-soft),
    transform 0.6s var(--ease-out-slow), background-color 0.8s var(--ease-soft);
}

.music__button:hover,
.music__button:focus-visible {
  opacity: 1;
  border-color: rgba(216, 177, 132, 0.5);
  outline: none;
}

.music__button:active {
  transform: scale(0.93);
}

.music__icon {
  position: relative;
  z-index: 1;
  width: 22px;
  height: 22px;
}

/* 播放中：光环缓慢旋转 + 呼吸 */
.music__ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1px solid transparent;
  opacity: 0;
  transition: opacity 0.8s var(--ease-soft);
}

.is-playing .music__ring {
  opacity: 0.9;
  border-top-color: rgba(216, 177, 132, 0.6);
  border-right-color: rgba(216, 177, 132, 0.16);
  animation: ring-spin 14s linear infinite;
}

.is-playing .music__button {
  opacity: 0.95;
  border-color: rgba(216, 177, 132, 0.42);
  animation: music-breathe 5.5s ease-in-out infinite;
}

@keyframes ring-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes music-breathe {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(216, 177, 132, 0);
  }
  50% {
    box-shadow: 0 0 20px rgba(216, 177, 132, 0.2);
  }
}

/* 出现 / 消失 */
.music-fade-enter-active,
.music-fade-leave-active {
  transition: opacity 1s var(--ease-soft), transform 1s var(--ease-out-slow);
}

.music-fade-enter-from,
.music-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

@media (prefers-reduced-motion: reduce) {
  .is-playing .music__ring,
  .is-playing .music__button {
    animation: none !important;
  }
}
</style>
