<script setup>
/**
 * PhotoGallery —— "一些片段" 照片墙
 * ---------------------------------------------------------------------------
 * 这里只负责排版（标题 + 两列网格），每张照片交给 PhotoCard 组件渲染，
 * 这样"照片卡片"的样式和交互只写一次。
 * 照片数据全部来自 src/data/story.js 的 gallery.photos，加照片只需在那里加一行。
 */
import PhotoCard from './PhotoCard.vue'

defineProps({
  gallery: { type: Object, required: true },
})

const emit = defineEmits(['open'])

function openPhoto(index) {
  emit('open', index)
}
</script>

<template>
  <section class="gallery">
    <div class="u-container gallery__inner">
      <span v-if="gallery.kicker" class="u-kicker gallery__kicker" v-reveal="{ type: 'soft' }">
        {{ gallery.kicker }}
      </span>

      <h2 class="u-title gallery__title" v-reveal="{ delay: 220, type: 'soft' }">
        {{ gallery.title }}
      </h2>

      <p v-if="gallery.hint" class="gallery__hint" v-reveal="{ delay: 480 }">{{ gallery.hint }}</p>

      <ul class="gallery__grid">
        <li
          v-for="(photo, index) in gallery.photos"
          :key="index"
          class="gallery__cell"
          v-reveal="{ delay: (index % 2) * 160, type: 'soft' }"
        >
          <PhotoCard :photo="photo" :index="index" @open="openPhoto" />
        </li>
      </ul>

      <div class="u-divider gallery__divider" v-reveal></div>
    </div>
  </section>
</template>

<style scoped>
.gallery {
  position: relative;
  z-index: 2;
  padding: clamp(3.6rem, 15vw, 6.5rem) 0;
}

.gallery__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.gallery__kicker {
  margin-bottom: 1.35rem;
}

.gallery__hint {
  margin-top: 1.2rem;
  font-size: 0.76rem;
  letter-spacing: 0.22em;
  color: var(--c-text-faint);
}

.gallery__grid {
  width: 100%;
  margin-top: 3.1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem 1.15rem;
  align-items: start;
}

.gallery__cell {
  display: flex;
  justify-content: center;
}

.gallery__divider {
  margin-top: 3.6rem;
}

/* 小平板 / 电脑：三列，卡片更大 */
@media (min-width: 640px) {
  .gallery__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem 1.6rem;
  }
}

/* 横屏手机：不要挤成一条 */
@media (orientation: landscape) and (max-height: 520px) {
  .gallery__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
