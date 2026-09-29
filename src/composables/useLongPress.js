import { onBeforeUnmount, ref } from 'vue'
import { easterEgg } from '../data/config.js'

/**
 * useLongPress —— 长按识别（用在照片上的隐藏留言彩蛋）
 *
 * 返回：
 *   pressing  是否正在长按（可以用来做轻微的缩放反馈）
 *   handlers  需要绑定到元素上的事件：v-on="handlers"
 *   reset()   手动取消
 *
 * 说明：同时监听鼠标和触摸；手指移动超过 12px 视为"在滚动"，自动取消。
 */
export function useLongPress(onLongPress, options = {}) {
  const duration = Number(options.duration || easterEgg.longPressMs || 600)
  const pressing = ref(false)

  let timer = null
  let startX = 0
  let startY = 0
  let fired = false

  function clear() {
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }
    pressing.value = false
  }

  function begin(event) {
    const point = event.touches ? event.touches[0] : event
    startX = point.clientX
    startY = point.clientY
    fired = false
    clear()
    pressing.value = true
    timer = window.setTimeout(() => {
      timer = null
      fired = true
      pressing.value = false
      if (typeof onLongPress === 'function') onLongPress(event)
    }, duration)
  }

  function move(event) {
    if (timer === null) return
    const point = event.touches ? event.touches[0] : event
    if (Math.abs(point.clientX - startX) > 12 || Math.abs(point.clientY - startY) > 12) {
      clear()
    }
  }

  /** 返回 true 表示这次点击已经被长按吃掉了，调用方不要再处理 click */
  function consumeIfFired() {
    if (fired) {
      fired = false
      return true
    }
    return false
  }

  onBeforeUnmount(clear)

  return {
    pressing,
    consumeIfFired,
    reset: clear,
    /**
     * 注意：这里的键必须写"普通事件名"（mousedown / touchstart），
     * 不能写成 onMousedown 这种形式。
     * 因为模板里是用 v-on="handlers" 绑定的，Vue 编译时会调用 toHandlers()，
     * 遇到带大写字母的键会再加一个 "on:" 前缀，变成 on:onMousedown —— 事件就永远不触发了。
     */
    handlers: {
      mousedown: begin,
      mouseup: clear,
      mouseleave: clear,
      touchstart: begin,
      touchend: clear,
      touchcancel: clear,
      touchmove: move,
    },
  }
}

export default useLongPress
