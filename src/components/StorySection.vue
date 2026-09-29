<script setup>
/**
 * StorySection —— 一个正文章节
 * ---------------------------------------------------------------------------
 * 数据来自 src/data/story.js 的 sections 数组。
 * 支持两种文字出现方式：
 *   effect: 'fade'        淡入
 *   effect: 'typewriter'  打字机（一段打完，再打下一段）
 * 配图会用很轻微的视差缓慢进入。
 */
import { computed, ref } from 'vue'
import TypewriterText from './TypewriterText.vue'
import { assetUrl } from '../utils/asset.js'

const props = defineProps({
  section: { type: Object, required: true },
  /** 章节序号，用来做轻微的错落延迟 */
  index: { type: Number, default: 0 },
})

const isTypewriter = computed(() => props.section.effect === 'typewriter')

// 打字机模式下，当前可以开始打字的那一段
const activeParagraph = ref(0)

function onParagraphDone(i) {
  if (i + 1 > activeParagraph.value) activeParagraph.value = i + 1
}

/** 章节里的配图：把 image（单张）和 images（多张）统一成一个数组，避免重复代码 */
const pictures = computed(() => {
  const list = []
  if (props.section.image) list.push(props.section.image)
  if (Array.isArray(props.section.images)) list.push(...props.section.images)
  return list.filter((item) => item && item.src)
})
</script>

<template>
  <section :id="section.id" class="story">
    <div class="u-container story__inner">
      <span v-if="section.kicker" class="u-kicker story__kicker" v-reveal="{ type: 'soft' }">
        {{ section.kicker }}
      </span>

      <h2 class="u-title story__title" v-reveal="{ delay: 220, type: 'soft' }">
        {{ section.title }}
      </h2>

      <div class="story__body">
        <!-- 打字机模式 -->
        <template v-if="isTypewriter">
          <TypewriterText
            v-for="(paragraph, i) in section.paragraphs"
            :key="'t' + i"
            :text="paragraph"
            :enabled="i <= activeParagraph"
            :start-delay="i === 0 ? 400 : 320"
            class="story__paragraph"
            @done="onParagraphDone(i)"
          />
        </template>

        <!-- 普通淡入模式 -->
        <template v-else>
          <p
            v-for="(paragraph, i) in section.paragraphs"
            :key="'p' + i"
            class="u-paragraph story__paragraph"
            v-reveal="{ delay: 420 + i * 320, type: 'soft' }"
          >
            {{ paragraph }}
          </p>
        </template>
      </div>

      <!-- 配图 -->
      <figure
        v-for="(picture, i) in pictures"
        :key="'img' + i"
        class="story__figure"
        v-reveal="{ delay: 260, type: 'scale' }"
      >
        <div class="story__frame" v-parallax="16">
          <img
            class="story__image"
            :src="assetUrl(picture.src)"
            :alt="picture.caption || section.title"
            loading="lazy"
            decoding="async"
          />
        </div>
        <figcaption v-if="picture.caption" class="story__caption">
          {{ picture.caption }}
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.story {
  position: relative;
  z-index: 2;
  padding: clamp(3.6rem, 15vw, 6.5rem) 0;
}

.story__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.story__kicker {
  margin-bottom: 1.35rem;
}

.story__title {
  margin-bottom: 2.6rem;
}

.story__body {
  display: flex;
  flex-direction: column;
  gap: 1.55rem;
  max-width: 30rem;
}

.story__paragraph {
  text-align: center;
}

/* --------------------------------------------------------------------------
 * 配图：暗色相框 + 轻微视差，让照片"慢慢浮现"
 * ----------------------------------------------------------------------- */
.story__figure {
  width: 100%;
  max-width: 26rem;
  margin-top: 3.2rem;
}

.story__frame {
  position: relative;
  overflow: hidden;
  border-radius: 3px;
  background: linear-gradient(140deg, #1a1512, #100d0c);
  box-shadow:
    0 24px 60px -28px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(216, 177, 132, 0.12);
  transform: translate3d(0, var(--parallax-y, 0px), 0);
  transition: transform 0.6s var(--ease-out-slow);
}

.story__image {
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  opacity: 0.94;
  filter: saturate(0.92) contrast(1.02);
}

/* 照片上压一层很淡的暖色，让它和整体色调统一 */
.story__frame::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to top, rgba(20, 14, 10, 0.34), transparent 58%);
}

.story__caption {
  margin-top: 1rem;
  font-family: var(--font-serif);
  font-size: 0.82rem;
  font-style: italic;
  letter-spacing: 0.14em;
  color: var(--c-text-faint);
}

@media (min-width: 900px) {
  .story__body {
    max-width: 32rem;
  }
}
</style>
