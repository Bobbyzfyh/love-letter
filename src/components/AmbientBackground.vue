<script setup>
/**
 * AmbientBackground —— 全站背景
 * ---------------------------------------------------------------------------
 * 组成（全部是纯 CSS，不依赖任何动画库，性能开销很小）：
 *   1. 几团缓慢漂移的模糊光斑（暖色，速度极慢）
 *   2. 一层很淡的暗角 vignette，让画面有"电影"的收束感
 *   3. 一层胶片颗粒（用 SVG 噪声生成的 data URI，不需要图片文件）
 *   4. 少量几乎看不见的星点，轻微闪烁
 *   5. 底部一条极淡的地平线光晕
 *
 * props.active：进入正式页面后光斑会稍微变亮一点点。
 */
const props = defineProps({
  active: { type: Boolean, default: false },
})

// 星点位置写死，保证每次刷新都一样（不会随机跳动）
const stars = [
  { x: 8, y: 14, size: 1.4, delay: 0 },
  { x: 22, y: 32, size: 1.1, delay: 1.6 },
  { x: 37, y: 11, size: 1.6, delay: 3.1 },
  { x: 54, y: 26, size: 1.2, delay: 0.8 },
  { x: 68, y: 9, size: 1.5, delay: 2.4 },
  { x: 81, y: 21, size: 1.1, delay: 4.2 },
  { x: 92, y: 38, size: 1.3, delay: 1.1 },
  { x: 16, y: 58, size: 1, delay: 3.7 },
  { x: 74, y: 63, size: 1.2, delay: 2 },
  { x: 45, y: 76, size: 1, delay: 5 },
  { x: 88, y: 82, size: 1.3, delay: 2.9 },
  { x: 30, y: 90, size: 1.1, delay: 4.6 },
]

const starStyle = (star) => ({
  left: star.x + '%',
  top: star.y + '%',
  width: star.size + 'px',
  height: star.size + 'px',
  animationDelay: star.delay + 's',
})
</script>

<template>
  <div class="ambient" :class="{ 'is-active': props.active }" aria-hidden="true">
    <!-- 光斑 -->
    <div class="ambient__glow ambient__glow--a"></div>
    <div class="ambient__glow ambient__glow--b"></div>
    <div class="ambient__glow ambient__glow--c"></div>

    <!-- 星点 -->
    <div class="ambient__stars">
      <span v-for="(star, i) in stars" :key="i" class="ambient__star" :style="starStyle(star)"></span>
    </div>

    <!-- 底部地平线光 -->
    <div class="ambient__horizon"></div>

    <!-- 暗角 -->
    <div class="ambient__vignette"></div>

    <!-- 胶片颗粒 -->
    <div class="ambient__grain"></div>
  </div>
</template>

<style scoped>
.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(120% 90% at 50% 0%, var(--c-bg-warm) 0%, transparent 62%),
    linear-gradient(180deg, #0b0a09 0%, #0d0b0a 45%, #0a0908 100%);
  transition: opacity 2s var(--ease-soft);
}

/* --------------------------------------------------------------------------
 * 光斑：用 radial-gradient + blur 做，比滤镜动画便宜很多
 * ----------------------------------------------------------------------- */
.ambient__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.5;
  will-change: transform;
  transition: opacity 2.4s var(--ease-soft);
}

.is-active .ambient__glow {
  opacity: 0.62;
}

.ambient__glow--a {
  width: 62vmax;
  height: 62vmax;
  top: -22vmax;
  left: -18vmax;
  background: radial-gradient(circle, rgba(168, 108, 63, 0.5) 0%, rgba(168, 108, 63, 0) 68%);
  animation: drift-a 68s var(--ease-soft) infinite alternate;
}

.ambient__glow--b {
  width: 54vmax;
  height: 54vmax;
  bottom: -20vmax;
  right: -16vmax;
  background: radial-gradient(circle, rgba(126, 74, 92, 0.42) 0%, rgba(126, 74, 92, 0) 70%);
  animation: drift-b 86s var(--ease-soft) infinite alternate;
}

.ambient__glow--c {
  width: 46vmax;
  height: 46vmax;
  top: 34%;
  left: 42%;
  background: radial-gradient(circle, rgba(196, 148, 96, 0.3) 0%, rgba(196, 148, 96, 0) 72%);
  animation: drift-c 104s var(--ease-soft) infinite alternate;
}

@keyframes drift-a {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(6vmax, 4vmax, 0) scale(1.12);
  }
}

@keyframes drift-b {
  from {
    transform: translate3d(0, 0, 0) scale(1.06);
  }
  to {
    transform: translate3d(-7vmax, -5vmax, 0) scale(1);
  }
}

@keyframes drift-c {
  from {
    transform: translate3d(-4vmax, 2vmax, 0) scale(1);
  }
  to {
    transform: translate3d(4vmax, -3vmax, 0) scale(1.15);
  }
}

/* --------------------------------------------------------------------------
 * 星点
 * ----------------------------------------------------------------------- */
.ambient__stars {
  position: absolute;
  inset: 0;
}

.ambient__star {
  position: absolute;
  border-radius: 50%;
  background: #f6e6cf;
  opacity: 0;
  box-shadow: 0 0 6px rgba(246, 230, 207, 0.7);
  animation: twinkle 7.5s ease-in-out infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.7);
  }
  45% {
    opacity: 0.55;
    transform: scale(1);
  }
  70% {
    opacity: 0.18;
  }
}

/* --------------------------------------------------------------------------
 * 底部地平线 + 暗角
 * ----------------------------------------------------------------------- */
.ambient__horizon {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 46vh;
  background: linear-gradient(to top, rgba(216, 177, 132, 0.09), transparent 78%);
}

.ambient__vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    115% 78% at 50% 46%,
    transparent 34%,
    rgba(0, 0, 0, 0.42) 78%,
    rgba(0, 0, 0, 0.72) 100%
  );
}

/* --------------------------------------------------------------------------
 * 胶片颗粒：SVG 噪声（下面的 %23 是 # 的转义），然后让它每帧跳一下
 * 手机上把透明度调低一点，避免看起来"脏"
 * ----------------------------------------------------------------------- */
.ambient__grain {
  position: absolute;
  inset: -60px;
  opacity: 0.16;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px 180px;
  animation: grain 1.2s steps(6) infinite;
}

@keyframes grain {
  0% {
    transform: translate3d(0, 0, 0);
  }
  20% {
    transform: translate3d(-8px, 6px, 0);
  }
  40% {
    transform: translate3d(6px, -8px, 0);
  }
  60% {
    transform: translate3d(-5px, -6px, 0);
  }
  80% {
    transform: translate3d(7px, 5px, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}

@media (max-width: 480px) {
  .ambient__grain {
    opacity: 0.12;
  }
  .ambient__glow {
    filter: blur(52px);
  }
}

/* 减少动态效果：停掉所有运动，只留静态光晕 */
@media (prefers-reduced-motion: reduce) {
  .ambient__glow,
  .ambient__star,
  .ambient__grain {
    animation: none !important;
  }
  .ambient__star {
    opacity: 0.22;
  }
}
</style>
