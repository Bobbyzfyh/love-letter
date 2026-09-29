/**
 * v-parallax 指令
 * ---------------------------------------------------------------------------
 * 非常轻微的视差：元素随页面滚动上下浮动几个像素，制造"慢"的感觉。
 * 幅度很小（默认 18px），不会晕，也不会影响阅读。
 *
 * 用法：
 *   <div v-parallax>默认强度</div>
 *   <div v-parallax="34">强度 34（数字越大浮动越明显）</div>
 *
 * 实现要点：
 *   - 只注册一个全局 scroll 监听，用 requestAnimationFrame 节流
 *   - 不支持 transform 或用户要求减少动效时自动跳过
 */

const items = new Set()
let ticking = false
let bound = false

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function update() {
  ticking = false
  const viewportHeight = window.innerHeight || 1
  items.forEach((item) => {
    const rect = item.el.getBoundingClientRect()
    // 元素中心相对屏幕中心的偏移，范围大约 -1 ~ 1
    const progress = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight
    const offset = Math.max(-1, Math.min(1, progress)) * item.strength
    item.el.style.setProperty('--parallax-y', offset.toFixed(2) + 'px')
  })
}

function onScroll() {
  if (ticking) return
  ticking = true
  window.requestAnimationFrame(update)
}

function bind() {
  if (bound || typeof window === 'undefined') return
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  bound = true
}

function unbind() {
  if (!bound) return
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  bound = false
}

export const parallax = {
  mounted(el, binding) {
    if (prefersReducedMotion()) return
    const strength = Number(binding.value)
    items.add({ el, strength: Number.isFinite(strength) && strength !== 0 ? strength : 18 })
    bind()
    onScroll()
  },

  unmounted(el) {
    for (const item of items) {
      if (item.el === el) items.delete(item)
    }
    if (items.size === 0) unbind()
  },
}

export default parallax
