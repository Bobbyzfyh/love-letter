/**
 * v-reveal 指令
 * ---------------------------------------------------------------------------
 * 元素滚动进入视口时，柔和地淡入 / 上浮出现。只触发一次，不做花哨效果。
 *
 * 用法：
 *   <p v-reveal>文字</p>
 *   <p v-reveal="{ delay: 300 }">延迟 300ms 出现</p>
 *   <p v-reveal="{ type: 'soft' }">带一点点模糊消散的效果</p>
 *
 * 可选参数：
 *   delay  毫秒，出现前等多久（用来做"一句接一句"的层次）
 *   type   'up'（默认，向上浮）| 'soft'（模糊消散）| 'left' | 'scale'
 *   once   是否只出现一次，默认 true
 */

const VISIBLE_CLASS = 'is-visible'

// 全站共用一个 IntersectionObserver，页面元素再多也不会卡
let observer = null
let listenerCount = 0

function getObserver() {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return null
  }
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target
          const delay = Number(el.dataset.revealDelay || 0)
          if (delay > 0) {
            window.setTimeout(() => el.classList.add(VISIBLE_CLASS), delay)
          } else {
            el.classList.add(VISIBLE_CLASS)
          }
          if (el.dataset.revealOnce !== 'false') {
            observer.unobserve(el)
          }
        }
      },
      {
        // 元素进入视口下方一点点就开始动画，看起来更从容
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.01,
      }
    )
  }
  return observer
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export const reveal = {
  mounted(el, binding) {
    const options = binding.value || {}

    el.classList.add('reveal')
    el.classList.add('reveal--' + (options.type || 'up'))

    if (options.delay) {
      el.dataset.revealDelay = String(options.delay)
    }
    if (options.once === false) {
      el.dataset.revealOnce = 'false'
    }

    // 用户系统里开了"减少动态效果"：直接显示，不做动画
    if (prefersReducedMotion()) {
      el.classList.add(VISIBLE_CLASS)
      return
    }

    const ob = getObserver()
    if (!ob) {
      // 极老的浏览器不支持 IntersectionObserver：直接显示，保证内容可读
      el.classList.add(VISIBLE_CLASS)
      return
    }

    listenerCount += 1
    ob.observe(el)
  },

  unmounted(el) {
    if (observer) {
      observer.unobserve(el)
      listenerCount = Math.max(0, listenerCount - 1)
      if (listenerCount === 0) {
        observer.disconnect()
        observer = null
      }
    }
  },
}

export default reveal
