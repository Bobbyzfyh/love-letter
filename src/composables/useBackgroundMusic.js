import { ref, computed } from 'vue'
import { music as musicConfig } from '../data/config.js'
import { assetUrl } from '../utils/asset.js'

/**
 * useBackgroundMusic —— 全站共用的背景音乐管理器（支持多首轮流播放）
 * ---------------------------------------------------------------------------
 * 播放规则（全部由 src/data/config.js 里的 music 控制）：
 *   - sources 是一份"播放列表"，按顺序一首一首往下播；
 *   - music.loop === true 时，最后一首播完再从第一首开始（整份列表循环）；
 *   - 某一首文件缺失 / 浏览器放不出来时，自动跳到下一首，不报错；
 *   - 整份列表都放不出来时，音乐按钮自动隐藏，页面照常使用。
 *
 * 为什么要在点击"打开这封信"时才调用 play()？
 * 因为 iOS Safari 和安卓 Chrome 都禁止网页自动播放声音，
 * 只有在"用户真实点击"的事件里触发的 play() 才会被允许。
 *
 * 另外所有播放相关操作都包了 try/catch：
 * 音频出任何问题都不能影响页面正常浏览。
 */

/** 是否正在播放 */
const isPlaying = ref(false)
/** 是否还有可用的音源（都没有就把按钮藏起来） */
const isAvailable = ref(true)
/** 当前播到第几首（从 0 开始） */
const currentTrack = ref(0)

/** 自动切到下一首时的渐入时长，比"第一次响起"短一些，衔接更自然 */
const TRACK_FADE_IN_MS = 900

let audio = null
let fadeRafId = null
let fadeGuardTimer = null
let pauseTimer = null
let hasUserInteracted = false
/** 连续失败的次数：等于列表长度说明一首也放不出来 */
let failedCount = 0
/** 网络错误原地重试的次数 */
let networkRetries = 0

/* --------------------------------------------------------------------------
 * 小工具
 * ----------------------------------------------------------------------- */

function clampVolume(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0.45
  return Math.max(0, Math.min(1, number))
}

/**
 * 配置里的播放列表。每一项支持两种写法：
 *   'music/track-1.m4a'                      —— 只写文件名
 *   { src: 'music/xxx.m4a', gain: 1.5 }      —— 顺便单独调这一段的音量
 * 用 gain 拉平几段录音的响度，比重新编码音频文件好得多（那样会二次损失音质）。
 */
function playlist() {
  const list = Array.isArray(musicConfig.sources) ? musicConfig.sources : []
  return list
    .map((item) => (typeof item === 'string' ? { src: item, gain: 1 } : item))
    .filter((item) => item && typeof item.src === 'string' && item.src.trim() !== '')
    .map((item) => {
      const gain = Number(item.gain)
      return { src: item.src, gain: Number.isFinite(gain) && gain > 0 ? gain : 1 }
    })
}

/** 当前这一首该用多大音量：基础音量 × 这一首自己的倍数 */
function baseVolume() {
  const list = playlist()
  const item = list[currentTrack.value]
  const gain = item ? item.gain : 1
  return Math.max(0, Math.min(1, clampVolume(musicConfig.volume) * gain))
}

function cancelFadeRaf() {
  if (fadeRafId !== null) {
    window.cancelAnimationFrame(fadeRafId)
    fadeRafId = null
  }
  if (fadeGuardTimer !== null) {
    window.clearTimeout(fadeGuardTimer)
    fadeGuardTimer = null
  }
}

function cancelPauseTimer() {
  if (pauseTimer !== null) {
    window.clearTimeout(pauseTimer)
    pauseTimer = null
  }
}

/** 音量平滑过渡，避免音乐"啪"地一下开始或停下 */
function fadeTo(target, duration) {
  const el = audio
  if (!el) return
  cancelFadeRaf()

  const to = clampVolume(target)
  const ms = Math.max(0, Number(duration) || 0)
  const from = clampVolume(el.volume)

  if (ms === 0 || from === to) {
    el.volume = to
    return
  }

  const startAt = performance.now()
  const step = (now) => {
    const progress = Math.min(1, (now - startAt) / ms)
    // easeOutQuad，听起来更自然
    const eased = 1 - (1 - progress) * (1 - progress)
    el.volume = from + (to - from) * eased
    if (progress < 1) {
      fadeRafId = window.requestAnimationFrame(step)
    } else {
      fadeRafId = null
    }
  }
  fadeRafId = window.requestAnimationFrame(step)

  // 保险：浏览器把标签页切到后台时会暂停 requestAnimationFrame，
  // 音量可能永远停在半路（听感上就是"音乐忽然变得很小"）。
  // 这里兜一个定时器，时间一到无论如何把音量设到位。
  fadeGuardTimer = window.setTimeout(() => {
    fadeGuardTimer = null
    if (fadeRafId !== null) {
      window.cancelAnimationFrame(fadeRafId)
      fadeRafId = null
    }
    el.volume = to
  }, ms + 400)
}

/* --------------------------------------------------------------------------
 * <audio> 元素：第一次需要时才创建
 * ----------------------------------------------------------------------- */

function ensureAudio() {
  if (audio || typeof window === 'undefined' || typeof Audio === 'undefined') {
    return audio
  }

  const list = playlist()
  if (list.length === 0) {
    isAvailable.value = false
    return null
  }

  audio = new Audio()
  audio.preload = 'auto'
  // 循环由我们自己控制（要支持多首轮流），所以关掉浏览器自带的单曲循环
  audio.loop = false
  audio.volume = 0
  audio.src = assetUrl(list[currentTrack.value].src)

  audio.addEventListener('error', handleError)
  audio.addEventListener('ended', handleEnded)
  // 真的开始出声了：说明这一段没问题，把重试计数清零
  audio.addEventListener('playing', () => {
    isPlaying.value = true
    networkRetries = 0
    failedCount = 0
  })

  return audio
}

/** 播放某一首（index 会自动绕回到列表范围内） */
function loadTrack(index, autoplay) {
  const list = playlist()
  if (list.length === 0) return
  const count = list.length
  currentTrack.value = ((index % count) + count) % count

  const el = ensureAudio()
  if (!el) return

  cancelFadeRaf()
  networkRetries = 0
  el.src = assetUrl(list[currentTrack.value].src)
  try {
    el.load()
  } catch (error) {
    /* 忽略：加载失败会走 error 事件 */
  }

  if (autoplay) safePlay(TRACK_FADE_IN_MS)
}

async function safePlay(fadeMs) {
  const el = ensureAudio()
  if (!el) return false

  const duration = Number.isFinite(Number(fadeMs)) ? Number(fadeMs) : musicConfig.fadeInMs
  cancelPauseTimer()

  try {
    el.volume = 0
    await el.play()
    isPlaying.value = true
    // 注意：这里不要重置 failedCount。
    // 必须等一首真正播完（ended）才能说明它是好的，
    // 否则"文件全都缺失"时会一边报错一边清零，变成无限重试。
    fadeTo(baseVolume(), duration)
    return true
  } catch (error) {
    // 自动播放被拦截，或者文件加载失败。
    // 静默处理，绝不把错误抛给页面。
    isPlaying.value = false
    return false
  }
}

/** 一首放完了：接着放下一首；到末尾就绕回第一首 */
function handleEnded() {
  cancelFadeRaf()
  // 能完整播完一首，说明音源没问题，失败计数清零
  failedCount = 0
  networkRetries = 0
  const list = playlist()
  if (list.length === 0) return

  const isLast = currentTrack.value >= list.length - 1
  if (isLast && musicConfig.loop === false) {
    // 配置成不循环：放完最后一段就停下
    isPlaying.value = false
    return
  }
  loadTrack(currentTrack.value + 1, true)
}

/**
 * 播放出错时的处理。
 *
 * ★ 这里曾经有个会"吃掉歌曲结尾"的 bug：
 *   原来是不管什么错误都直接跳到下一首。但浏览器在换歌、缓冲中断、
 *   页面切到后台再回来时，都会抛出 error（code 1 = 被中止）。
 *   结果就是一首歌听一半突然跳到下一首 —— 听起来像"这首没播完"。
 *
 * 现在按错误类型区别对待：
 *   code 1 (ABORTED)         我们自己造成的，忽略
 *   code 2 (NETWORK)         网络抖了一下，原地重试两次再考虑跳歌
 *   code 3 (DECODE)          文件真的解不开，跳到下一首
 *   code 4 (NOT_SUPPORTED)   浏览器放不了这种文件，跳到下一首
 */
function handleError() {
  const el = audio
  if (!el) return

  const code = el.error ? el.error.code : 0

  // 被中止：不是文件的问题，什么都不要做
  if (code === 1) return

  // 网络问题：先原地重试，不要急着跳歌
  if (code === 2 && networkRetries < 2) {
    networkRetries += 1
    const currentSrc = el.src
    cancelFadeRaf()
    try {
      el.src = currentSrc
      el.load()
    } catch (error) {
      /* 忽略 */
    }
    if (hasUserInteracted) safePlay(TRACK_FADE_IN_MS)
    return
  }

  cancelFadeRaf()

  // 到这里说明这一段确实没法播了：跳到下一段
  const list = playlist()
  if (list.length === 0) {
    isAvailable.value = false
    isPlaying.value = false
    return
  }

  failedCount += 1
  if (failedCount >= list.length) {
    // 整份列表都不行：把按钮藏起来，页面照常使用
    isAvailable.value = false
    isPlaying.value = false
    return
  }

  currentTrack.value = (currentTrack.value + 1) % list.length
  el.src = assetUrl(list[currentTrack.value].src)
  try {
    el.load()
  } catch (error) {
    /* 忽略 */
  }
  if (hasUserInteracted) safePlay(TRACK_FADE_IN_MS)
}

/* --------------------------------------------------------------------------
 * 对外暴露的方法
 * ----------------------------------------------------------------------- */

export function useBackgroundMusic() {
  /**
   * 提前把 <audio> 建好并开始预加载（在用户点击之前调用）。
   * 好处：如果某个文件不存在，浏览器的 error 事件会提前触发，
   * 我们就能在用户点"打开这封信"之前切到下一个音源，
   * 避免"播放动作发生在用户手势之外"而被手机浏览器拦截。
   */
  function prepare() {
    const el = ensureAudio()
    if (!el) return
    try {
      el.load()
    } catch (error) {
      /* 忽略：预加载失败不影响页面 */
    }
  }

  /** 用户点击"打开这封信"时调用 */
  async function start() {
    hasUserInteracted = true
    return safePlay(musicConfig.fadeInMs)
  }

  /** 暂停（音量先渐出，再真正停） */
  function pause() {
    const el = audio
    if (!el) return
    cancelPauseTimer()
    fadeTo(0, musicConfig.fadeOutMs)
    pauseTimer = window.setTimeout(() => {
      pauseTimer = null
      try {
        el.pause()
      } catch (error) {
        /* 忽略：暂停失败不影响页面 */
      }
    }, Math.max(0, Number(musicConfig.fadeOutMs) || 0))
    isPlaying.value = false
  }

  /** 右下角小按钮：播放 / 暂停 */
  function toggle() {
    hasUserInteracted = true
    if (isPlaying.value) {
      pause()
    } else {
      safePlay(musicConfig.fadeInMs)
    }
  }

  return {
    isPlaying,
    isAvailable,
    currentTrack,
    canShow: computed(() => isAvailable.value),
    prepare,
    start,
    pause,
    toggle,
  }
}

export default useBackgroundMusic
