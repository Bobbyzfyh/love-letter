<script setup>
/**
 * TypewriterText —— 打字机效果
 * ---------------------------------------------------------------------------
 * 特点：
 *   - 速度慢（默认每个字 82ms），标点符号后会多停一下，读起来更像"在写信"
 *   - 元素滚动进视口之后才开始打，不会白打
 *   - 系统开启"减少动态效果"时直接显示完整文字（无障碍）
 *   - 组件销毁时清掉所有计时器，避免内存泄漏
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  /** 每个字的间隔（毫秒），越大越慢 */
  speed: { type: Number, default: 82 },
  /** 开始打字前额外等待的时间 */
  startDelay: { type: Number, default: 240 },
  /** 标签名，默认 p */
  tag: { type: String, default: 'p' },
  /**
   * 是否允许开始打字。
   * 用途：同一段里有好几行时，可以让它们"一段打完再打下一段"，
   * 而不是全部同时开始。默认 true（进视口就打）。
   */
  enabled: { type: Boolean, default: true },
})

const emit = defineEmits(['done'])

const rootRef = ref(null)
const shown = ref('')
const isTyping = ref(false)
const isDone = ref(false)

let observer = null
let timer = null
let index = 0
let disposed = false
let inView = false

/** 标点后面多停一会儿，制造呼吸感 */
function delayFor(char) {
  if ('。！？…'.includes(char)) return props.speed * 6
  if ('，、；：'.includes(char)) return props.speed * 3.4
  if ('—'.includes(char)) return props.speed * 2.4
  return props.speed
}

function finishInstantly() {
  shown.value = props.text
  isTyping.value = false
  isDone.value = true
  emit('done')
}

function step() {
  if (disposed) return
  if (index >= props.text.length) {
    isTyping.value = false
    isDone.value = true
    timer = null
    emit('done')
    return
  }
  const char = props.text[index]
  shown.value += char
  index += 1
  timer = window.setTimeout(step, delayFor(char))
}

function start() {
  if (isTyping.value || isDone.value) return
  isTyping.value = true
  timer = window.setTimeout(step, props.startDelay)
}

/** 只有"已经进入视口"且"外部允许"时才开始 */
function maybeStart() {
  if (!inView || !props.enabled) return
  start()
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
    finishInstantly()
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          inView = true
          maybeStart()
          observer.disconnect()
          observer = null
        }
      }
    },
    { rootMargin: '0px 0px -14% 0px', threshold: 0.2 }
  )
  if (rootRef.value) observer.observe(rootRef.value)
})

// 外部把 enabled 打开时（上一段打完了），如果已经在视口里就接着打
watch(
  () => props.enabled,
  () => maybeStart()
)

onBeforeUnmount(() => {
  disposed = true
  if (timer !== null) window.clearTimeout(timer)
  if (observer) observer.disconnect()
})
</script>

<template>
  <component
    :is="tag"
    ref="rootRef"
    class="typewriter"
    :class="{ 'is-typing': isTyping, 'is-done': isDone }"
  >
    <span class="typewriter__text">{{ shown }}</span>
    <!-- 打字时闪烁的光标，打完之后保留一条很淡的竖线，像信纸上的笔痕 -->
    <span class="typewriter__caret" aria-hidden="true"></span>
    <!-- 给读屏软件和搜索引擎一份完整文本 -->
    <span class="u-visually-hidden">{{ text }}</span>
  </component>
</template>

<style scoped>
.typewriter {
  position: relative;
  font-size: clamp(0.98rem, 4vw, 1.08rem);
  line-height: 2.15;
  letter-spacing: 0.05em;
  color: var(--c-text-soft);
  min-height: 1.4em;
}

.typewriter__caret {
  display: inline-block;
  width: 1px;
  height: 1.05em;
  margin-left: 0.16em;
  vertical-align: -0.16em;
  background: var(--c-accent);
  opacity: 0;
}

.is-typing .typewriter__caret {
  opacity: 0.85;
  animation: caret-blink 1.05s steps(2, start) infinite;
}

.is-done .typewriter__caret {
  opacity: 0.18;
}

@keyframes caret-blink {
  0%,
  100% {
    opacity: 0.85;
  }
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .typewriter__caret {
    display: none;
  }
}
</style>
