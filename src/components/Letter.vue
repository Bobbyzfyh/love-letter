<script setup>
/**
 * Letter —— 网页后半部分那封安静的信
 * ---------------------------------------------------------------------------
 * 流程：
 *   1. 屏幕上只出现一行字 "最后，还有一封信。"
 *   2. 点"打开" -> 背景变暗，信纸淡入
 *   3. 信纸上的段落一行一行慢慢浮现
 *   4. 点"轻轻合上" / 按 Esc / 点信纸外面 都可以关掉
 * 文字内容全部在 src/data/letter.js 里改。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { letter } from '../data/letter.js'
import { site } from '../data/config.js'

const isOpen = ref(false)
const paperRef = ref(null)

const intro = computed(() => letter.intro || {})
const paragraphs = computed(() => letter.paragraphs || [])
const signature = computed(() => letter.signature || site.fromName)

/* --------------------------------------------------------------------------
 * 段落浮现的节奏
 *   段落少的时候：每段间隔 0.85 秒，一句一句慢慢来；
 *   段落多的时候：自动缩短间隔，保证整封信大约 9 秒内全部浮现完，
 *                 否则一封几十段的信要等好几十秒才看得完。
 * ----------------------------------------------------------------------- */
const FADE_STEP_MAX = 0.85 // 每段之间最多等多久（秒）
const FADE_TOTAL_BUDGET = 9 // 整封信全部浮现完大约用多少秒

const fadeStep = computed(() => {
  const count = paragraphs.value.length
  if (count <= 2) return FADE_STEP_MAX
  return Math.min(FADE_STEP_MAX, FADE_TOTAL_BUDGET / (count - 1))
})

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function onKeydown(event) {
  if (event.key === 'Escape' && isOpen.value) close()
}

// 打开时锁定页面滚动，并让信纸回到顶部
watch(isOpen, (value) => {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('is-locked', value)
  if (value) {
    requestAnimationFrame(() => {
      if (paperRef.value) paperRef.value.scrollTop = 0
    })
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (typeof document !== 'undefined') document.body.classList.remove('is-locked')
})
</script>

<template>
  <section class="letter">
    <div class="u-container letter__inner">
      <h2 class="letter__line" v-reveal="{ type: 'soft' }">
        {{ intro.line || '最后，还有一封信。' }}
      </h2>

      <button
        class="letter__open"
        type="button"
        v-reveal="{ delay: 620, type: 'soft' }"
        @click="open"
      >
        <span class="letter__open-ring" aria-hidden="true"></span>
        <span class="letter__open-text">{{ intro.button || '打开' }}</span>
      </button>
    </div>
  </section>

  <Teleport to="body">
    <Transition name="envelope">
      <div v-if="isOpen" class="envelope" @click.self="close">
        <article class="paper" role="dialog" aria-modal="true" aria-label="一封信">
          <button class="paper__close" type="button" @click="close">
            {{ intro.close || '轻轻合上' }}
          </button>

          <div ref="paperRef" class="paper__scroll">
            <p class="paper__greeting">{{ letter.greeting }}</p>

            <p
              v-for="(paragraph, i) in paragraphs"
              :key="i"
              class="paper__paragraph"
              :style="{ animationDelay: 0.45 + i * fadeStep + 's' }"
            >
              {{ paragraph }}
            </p>

            <div class="paper__sign">
              <!-- 信末的"——"，自动画出来，不需要写在 letter.js 里 -->
              <span class="paper__dash" aria-hidden="true"></span>
              <p class="paper__signature">{{ signature }}</p>
              <p v-if="letter.date" class="paper__date">{{ letter.date }}</p>
            </div>

            <p
              v-if="letter.postscript"
              class="paper__ps"
              :style="{ animationDelay: 0.6 + paragraphs.length * fadeStep + 's' }"
            >
              {{ letter.postscript }}
            </p>
          </div>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.letter {
  position: relative;
  z-index: 2;
  padding: clamp(4rem, 17vw, 7.5rem) 0;
  text-align: center;
}

.letter__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.letter__line {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(1.16rem, 4.9vw, 1.55rem);
  line-height: 1.9;
  letter-spacing: 0.1em;
  color: var(--c-text);
}

.letter__open {
  position: relative;
  margin-top: 2.6rem;
  min-width: 108px;
  min-height: 50px;
  padding: 0.9rem 1.9rem;
  border: 1px solid var(--c-line);
  border-radius: 999px;
  font-family: var(--font-serif);
  font-size: 0.95rem;
  letter-spacing: 0.3em;
  color: var(--c-accent);
  overflow: hidden;
  transition: border-color 0.9s var(--ease-soft), background-color 0.9s var(--ease-soft),
    transform 0.6s var(--ease-out-slow);
}

.letter__open-text {
  position: relative;
  z-index: 1;
}

.letter__open-ring {
  position: absolute;
  inset: -30%;
  background: radial-gradient(circle at 50% 50%, rgba(216, 177, 132, 0.22), transparent 64%);
  opacity: 0.45;
  animation: letter-glow 8s ease-in-out infinite;
}

.letter__open:hover,
.letter__open:focus-visible {
  border-color: rgba(216, 177, 132, 0.55);
  background: rgba(216, 177, 132, 0.1);
  outline: none;
}

.letter__open:active {
  transform: scale(0.97);
}

@keyframes letter-glow {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

/* --------------------------------------------------------------------------
 * 信纸
 * ----------------------------------------------------------------------- */
.envelope {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(1.25rem + env(safe-area-inset-top)) 1.1rem calc(1.25rem + env(safe-area-inset-bottom));
  /* 背景变暗，让注意力落到信纸上 */
  background: rgba(5, 4, 4, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.paper {
  position: relative;
  width: 100%;
  max-width: 34rem;
  max-height: 88vh;
  max-height: 88dvh;
  border-radius: 2px;
  background: var(--c-paper);
  color: var(--c-paper-text);
  box-shadow:
    0 40px 100px -40px rgba(0, 0, 0, 0.95),
    0 0 0 1px rgba(255, 255, 255, 0.16) inset;
  overflow: hidden;
}

/* 信纸上非常淡的横格线 */
.paper::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 33px,
    rgba(90, 70, 55, 0.055) 33px,
    rgba(90, 70, 55, 0.055) 34px
  );
}

.paper__scroll {
  position: relative;
  max-height: 88vh;
  max-height: 88dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 3.4rem 1.65rem 2.6rem;
}

.paper__close {
  position: absolute;
  top: 0.75rem;
  right: 0.9rem;
  z-index: 2;
  min-height: 38px;
  padding: 0.4rem 0.7rem;
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  color: rgba(59, 49, 42, 0.55);
  transition: color 0.6s var(--ease-soft);
}

.paper__close:hover,
.paper__close:focus-visible {
  color: rgba(59, 49, 42, 0.9);
  outline: none;
}

.paper__greeting {
  font-family: var(--font-serif);
  font-size: 1.02rem;
  letter-spacing: 0.14em;
  margin-bottom: 1.6rem;
}

/* 每一段文字像被慢慢写出来一样浮现 */
.paper__paragraph,
.paper__greeting,
.paper__sign,
.paper__ps {
  animation: paper-line 1.35s var(--ease-soft) both;
}

.paper__greeting {
  animation-delay: 0.15s;
}

.paper__paragraph {
  font-size: 0.96rem;
  line-height: 2.25;
  letter-spacing: 0.04em;
  color: rgba(59, 49, 42, 0.92);
  margin-bottom: 1.25rem;
  text-align: justify;
  text-justify: inter-ideograph;
}

/* 只用 opacity + transform（都能交给 GPU 合成）。
   这封信有几十段，如果用模糊动画会明显拖慢手机，所以这里刻意不用 filter。 */
@keyframes paper-line {
  from {
    opacity: 0;
    transform: translate3d(0, 12px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.paper__sign {
  margin-top: 2.4rem;
  text-align: right;
  animation-delay: 1.2s;
}

.paper__dash {
  display: block;
  width: 3.4rem;
  height: 1px;
  margin: 0 0 0.85rem auto;
  background: rgba(90, 70, 55, 0.4);
}

.paper__signature {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  letter-spacing: 0.18em;
}

.paper__date {
  margin-top: 0.5rem;
  font-size: 0.76rem;
  letter-spacing: 0.16em;
  color: rgba(59, 49, 42, 0.55);
}

.paper__ps {
  margin-top: 2.2rem;
  padding-top: 1.3rem;
  border-top: 1px solid rgba(90, 70, 55, 0.16);
  font-size: 0.84rem;
  line-height: 2;
  letter-spacing: 0.06em;
  color: rgba(59, 49, 42, 0.66);
}

/* 信封展开的过渡 */
.envelope-enter-active,
.envelope-leave-active {
  transition: opacity 1s var(--ease-soft);
}

.envelope-enter-active .paper {
  transition: transform 1.3s var(--ease-out-slow), opacity 1.1s var(--ease-soft);
}

.envelope-enter-from,
.envelope-leave-to {
  opacity: 0;
}

.envelope-enter-from .paper {
  opacity: 0;
  transform: translate3d(0, 26px, 0) scale(0.975);
}

@media (min-width: 700px) {
  .paper__scroll {
    padding: 4rem 3.2rem 3.2rem;
  }
  .paper__paragraph {
    font-size: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .paper__paragraph,
  .paper__greeting,
  .paper__sign,
  .paper__ps {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }
  .letter__open-ring {
    animation: none !important;
  }
}
</style>
