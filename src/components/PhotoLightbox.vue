<script setup>
/**
 * PhotoLightbox —— 点击照片后的全屏查看
 * ---------------------------------------------------------------------------
 * - 背景变暗 + 轻微模糊，聚焦在照片本身
 * - 点击任意位置 / 按 Esc / 点关闭按钮 都可以退出
 * - 打开时锁定页面滚动（避免手机上一滑背景跟着动）
 */
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { assetUrl } from '../utils/asset.js'

const props = defineProps({
  /** 传入照片对象 { src, caption, note }，为 null 表示关闭 */
  photo: { type: Object, default: null },
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

// 打开时锁定 body 滚动
watch(
  () => props.photo,
  (value) => {
    if (typeof document === 'undefined') return
    document.body.classList.toggle('is-locked', Boolean(value))
  }
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (typeof document !== 'undefined') document.body.classList.remove('is-locked')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="photo"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="查看照片"
        @click="close"
      >
        <button class="lightbox__close" type="button" aria-label="关闭" @click.stop="close">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 7l10 10M17 7L7 17"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <figure class="lightbox__figure" @click.stop>
          <img class="lightbox__image" :src="assetUrl(photo.src)" :alt="photo.caption || '照片'" />
          <h3 v-if="photo.title" class="lightbox__title">{{ photo.title }}</h3>
          <figcaption v-if="photo.caption" class="lightbox__caption">{{ photo.caption }}</figcaption>
          <p v-if="photo.note" class="lightbox__note">{{ photo.note }}</p>
        </figure>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(1.5rem + env(safe-area-inset-top)) 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
  background: rgba(6, 5, 5, 0.9);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.lightbox__figure {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox__image {
  max-width: min(92vw, 52rem);
  max-height: 74vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 3px;
  box-shadow: 0 30px 90px -30px rgba(0, 0, 0, 0.95);
}

.lightbox__title {
  margin-top: 1.5rem;
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 1.02rem;
  letter-spacing: 0.14em;
  color: var(--c-text);
  text-align: center;
}

.lightbox__caption {
  margin-top: 0.9rem;
  font-family: var(--font-serif);
  font-size: 0.86rem;
  font-style: italic;
  letter-spacing: 0.16em;
  color: var(--c-text-soft);
  text-align: center;
}

.lightbox__note {
  margin-top: 0.85rem;
  max-width: 24rem;
  font-size: 0.84rem;
  line-height: 1.95;
  letter-spacing: 0.06em;
  color: var(--c-accent);
  opacity: 0.85;
  text-align: center;
}

.lightbox__close {
  position: absolute;
  top: calc(1rem + env(safe-area-inset-top));
  right: calc(1rem + env(safe-area-inset-right));
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--c-line);
  color: var(--c-text-soft);
  background: rgba(10, 9, 8, 0.5);
  transition: color 0.6s var(--ease-soft), border-color 0.6s var(--ease-soft);
}

.lightbox__close svg {
  width: 20px;
  height: 20px;
}

.lightbox__close:hover,
.lightbox__close:focus-visible {
  color: var(--c-accent);
  border-color: rgba(216, 177, 132, 0.5);
  outline: none;
}

.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.85s var(--ease-soft);
}

.lightbox-enter-active .lightbox__image {
  transition: transform 1.1s var(--ease-out-slow), opacity 0.9s var(--ease-soft);
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

.lightbox-enter-from .lightbox__image {
  transform: scale(0.94);
  opacity: 0;
}
</style>
