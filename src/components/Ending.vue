<script setup>
/**
 * Ending —— 结尾
 * ---------------------------------------------------------------------------
 * 三句话依次出现，中间有停顿，最后整体缓缓淡下去。
 * 文案在 src/data/config.js 的 ending 里改。
 *
 * 之所以用 JS 计时器而不是纯 CSS：
 * 因为这些停顿是"一句一句"的，用 JS 更容易精确控制顺序和节奏，
 * 而且只在滚动到这一屏时才启动（不会白白计时）。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ending, site } from '../data/config.js'

const rootRef = ref(null)
const shownCount = ref(0)
const showFooter = ref(false)
const dimmed = ref(false)

let observer = null
let timers = []
let started = false

function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id))
  timers = []
}

function play() {
  if (started) return
  started = true

  const lines = ending.lines || []
  const gaps = Array.isArray(ending.gaps) ? ending.gaps : []
  let elapsed = 500 // 进入视口后先静静等一下

  lines.forEach((_, index) => {
    if (index > 0) {
      const gap = Number(gaps[index])
      elapsed += Number.isFinite(gap) && gap > 0 ? gap : 1400
    }
    const at = elapsed
    timers.push(
      window.setTimeout(() => {
        shownCount.value = index + 1
      }, at)
    )
  })

  // 最后一行之后停顿一下，再出现年份
  elapsed += 2400
  timers.push(
    window.setTimeout(() => {
      showFooter.value = true
    }, elapsed)
  )

  // "整个结尾慢慢淡出"
  if (ending.fadeAway !== false) {
    const dimAt = elapsed + 2600
    timers.push(
      window.setTimeout(() => {
        dimmed.value = true
      }, dimAt)
    )
  }
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    shownCount.value = (ending.lines || []).length
    showFooter.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          play()
          observer.disconnect()
          observer = null
        }
      }
    },
    { threshold: 0.35 }
  )
  if (rootRef.value) observer.observe(rootRef.value)
})

onBeforeUnmount(() => {
  clearTimers()
  if (observer) observer.disconnect()
})
</script>

<template>
  <footer ref="rootRef" class="ending" :class="{ 'is-dimmed': dimmed }">
    <div class="u-container ending__inner">
      <p
        v-for="(line, index) in ending.lines"
        :key="index"
        class="ending__line"
        :class="{ 'is-visible': index < shownCount, 'is-last': index === ending.lines.length - 1 }"
      >
        {{ line }}
      </p>

      <p class="ending__footer" :class="{ 'is-visible': showFooter }">{{ site.footer }}</p>
    </div>
  </footer>
</template>

<style scoped>
.ending {
  position: relative;
  z-index: 2;
  min-height: 78vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(4.5rem, 20vw, 9rem) 0 calc(6rem + env(safe-area-inset-bottom));
  text-align: center;
  transition: opacity 3.4s var(--ease-soft);
}

/* 最后整体缓缓淡下去，像电影片尾 */
.ending.is-dimmed {
  opacity: 0.55;
}

.ending__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.ending__line {
  font-family: var(--font-serif);
  font-size: clamp(1rem, 4.3vw, 1.28rem);
  line-height: 2;
  letter-spacing: 0.11em;
  color: var(--c-text-soft);
  opacity: 0;
  transform: translate3d(0, 14px, 0);
  filter: blur(6px);
  transition: opacity 2.2s var(--ease-soft), transform 2.2s var(--ease-out-slow),
    filter 2.2s var(--ease-soft);
}

.ending__line.is-visible {
  opacity: 1;
  transform: none;
  filter: none;
}

.ending__line.is-last {
  color: var(--c-text);
  letter-spacing: 0.13em;
}

.ending__footer {
  margin-top: 3.2rem;
  font-family: var(--font-latin-serif);
  font-size: 0.72rem;
  letter-spacing: 0.42em;
  color: var(--c-text-faint);
  opacity: 0;
  transition: opacity 2.6s var(--ease-soft);
}

.ending__footer.is-visible {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .ending__line,
  .ending__footer,
  .ending {
    transition: none !important;
  }
}
</style>
