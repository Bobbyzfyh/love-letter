<script setup>
/**
 * PhotoCard —— 一张宝丽来风格的照片卡片
 * ---------------------------------------------------------------------------
 * 交互：
 *   点击   -> 让父组件放大这张照片
 *   长按   -> 出现这张照片的隐藏留言（note 字段，彩蛋之一）
 * 长按逻辑复用 src/composables/useLongPress.js，避免每个组件各写一遍。
 */
import { onBeforeUnmount, ref } from 'vue'
import { useLongPress } from '../composables/useLongPress.js'
import { assetUrl } from '../utils/asset.js'

const props = defineProps({
  photo: { type: Object, required: true },
  index: { type: Number, default: 0 },
})

const emit = defineEmits(['open'])

const loaded = ref(false)
const noteVisible = ref(false)

let hideTimer = null

const { pressing, consumeIfFired, handlers } = useLongPress(() => {
  if (!props.photo.note) return
  noteVisible.value = true
  if (hideTimer !== null) window.clearTimeout(hideTimer)
  // 看几秒之后自己轻轻消失
  hideTimer = window.setTimeout(() => {
    noteVisible.value = false
    hideTimer = null
  }, 5200)
})

function handleClick() {
  // 刚刚触发过长按：这次点击不再放大照片
  if (consumeIfFired()) return
  emit('open', props.index)
}

const tilt = { '--tilt': (Number(props.photo.rotate) || 0) + 'deg' }

onBeforeUnmount(() => {
  if (hideTimer !== null) window.clearTimeout(hideTimer)
})
</script>

<template>
  <button
    class="photo-card"
    :class="{ 'is-holding': pressing }"
    :style="tilt"
    type="button"
    :aria-label="photo.caption ? '查看照片：' + photo.caption : '查看照片'"
    v-on="handlers"
    @click="handleClick"
    @contextmenu.prevent
  >
    <span class="photo-card__frame" :class="{ 'is-loaded': loaded }">
      <img
        class="photo-card__image"
        :src="assetUrl(photo.src)"
        :alt="photo.caption || '照片'"
        loading="lazy"
        decoding="async"
        @load="loaded = true"
      />
      <span class="photo-card__sheen" aria-hidden="true"></span>
    </span>

    <!-- 相纸下方的文字区：标题（可选）+ 配文（可选） -->
    <span v-if="photo.title || photo.caption" class="photo-card__text">
      <span v-if="photo.title" class="photo-card__title">{{ photo.title }}</span>
      <span v-if="photo.caption" class="photo-card__caption">{{ photo.caption }}</span>
    </span>

    <!-- 长按出现的隐藏留言 -->
    <Transition name="note-fade">
      <span v-if="noteVisible && photo.note" class="photo-card__note">{{ photo.note }}</span>
    </Transition>
  </button>
</template>

<style scoped>
.photo-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0.55rem 0.55rem 0;
  border-radius: 2px;
  background: linear-gradient(160deg, #f4ece0, #e6d9c7);
  box-shadow:
    0 18px 34px -20px rgba(0, 0, 0, 0.9),
    0 2px 6px rgba(0, 0, 0, 0.4);
  transform: rotate(var(--tilt, 0deg));
  transition: transform 0.9s var(--ease-out-slow), box-shadow 0.9s var(--ease-soft);
  text-align: center;
  /* 手机上长按不要弹出"保存图片/复制"菜单 */
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
}

.photo-card:hover,
.photo-card:focus-visible {
  transform: rotate(0deg) translateY(-6px);
  box-shadow:
    0 26px 44px -22px rgba(0, 0, 0, 0.95),
    0 0 0 1px rgba(216, 177, 132, 0.28);
  outline: none;
}

.photo-card:active {
  transform: rotate(0deg) scale(0.985);
}

/* 长按时轻微"按下去"的反馈 */
.photo-card.is-holding {
  transform: rotate(0deg) scale(0.97);
}

.photo-card__frame {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: linear-gradient(140deg, #241d18, #17120f);
}

.photo-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.03);
  filter: saturate(0.94) contrast(1.02) sepia(0.06);
  transition: opacity 1.1s var(--ease-soft), transform 1.4s var(--ease-out-slow);
}

.photo-card__frame.is-loaded .photo-card__image {
  opacity: 1;
  transform: scale(1);
}

/* 相纸上的一点点反光，模拟实体照片 */
.photo-card__sheen {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(118deg, rgba(255, 255, 255, 0.16) 0%, transparent 42%);
  mix-blend-mode: screen;
}

/* 照片下方的文字区（标题 + 配文），像写在宝丽来白边上的字 */
.photo-card__text {
  display: block;
  padding: 0.68rem 0.32rem 0.8rem;
}

/* 标题：可选字段，写了才显示，比配文更重一点，像这张照片的名字 */
.photo-card__title {
  display: block;
  font-family: var(--font-serif);
  font-size: 0.79rem;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 0.1em;
  color: #3a2f28;
}

.photo-card__caption {
  display: block;
  font-family: var(--font-serif);
  font-size: 0.72rem;
  line-height: 1.75;
  letter-spacing: 0.03em;
  color: #4a3d33;
  opacity: 0.85;
}

/* 标题和配文同时存在时，让它们之间有一点呼吸 */
.photo-card__title + .photo-card__caption {
  margin-top: 0.3rem;
}

/* 隐藏留言：压在照片上的一层柔和暗色 */
.photo-card__note {
  position: absolute;
  inset: 0.55rem 0.55rem auto 0.55rem;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.9rem;
  background: linear-gradient(to top, rgba(12, 9, 8, 0.9), rgba(12, 9, 8, 0.72));
  font-family: var(--font-serif);
  font-size: 0.74rem;
  line-height: 1.85;
  letter-spacing: 0.06em;
  color: #f0e2cd;
}

.note-fade-enter-active,
.note-fade-leave-active {
  transition: opacity 0.9s var(--ease-soft);
}

.note-fade-enter-from,
.note-fade-leave-to {
  opacity: 0;
}

@media (min-width: 640px) {
  .photo-card__title {
    font-size: 0.83rem;
  }
  .photo-card__caption {
    font-size: 0.76rem;
  }
}
</style>
