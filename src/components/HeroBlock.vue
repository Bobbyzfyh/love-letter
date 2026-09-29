<script setup>
/**
 * HeroBlock —— 开场页淡出之后出现的第一个小标题区
 * ---------------------------------------------------------------------------
 * 内容全部来自 src/data/config.js 的 hero 配置。
 */
import { hero, site } from '../data/config.js'
</script>

<template>
  <header class="hero">
    <div class="u-container hero__inner">
      <span class="u-kicker hero__kicker" v-reveal="{ type: 'soft' }">{{ hero.kicker }}</span>

      <h1 class="hero__title" v-reveal="{ delay: 320, type: 'soft' }">{{ hero.title }}</h1>

      <p class="hero__names" v-reveal="{ delay: 720 }">
        <span>{{ site.fromName }}</span>
        <span class="hero__arrow" aria-hidden="true">—</span>
        <span>{{ site.toName }}</span>
      </p>

      <div v-if="hero.lines && hero.lines.length" class="hero__lines">
        <p
          v-for="(line, index) in hero.lines"
          :key="index"
          class="hero__line"
          v-reveal="{ delay: 1100 + index * 620 }"
        >
          {{ line }}
        </p>
      </div>

      <div class="u-divider hero__divider" v-reveal="{ delay: 1800 }"></div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  position: relative;
  z-index: 2;
  padding: calc(5rem + env(safe-area-inset-top)) 0 2rem;
  text-align: center;
}

.hero__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero__kicker {
  margin-bottom: 1.6rem;
}

.hero__title {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: clamp(1.72rem, 7.6vw, 2.6rem);
  line-height: 1.55;
  letter-spacing: 0.14em;
  text-shadow: 0 0 40px rgba(216, 177, 132, 0.16);
}

.hero__names {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-top: 1.5rem;
  font-family: var(--font-serif);
  font-size: 0.84rem;
  letter-spacing: 0.34em;
  color: var(--c-text-faint);
}

.hero__arrow {
  color: var(--c-accent);
  opacity: 0.6;
}

.hero__lines {
  margin-top: 2.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 24rem;
}

.hero__line {
  font-size: 0.94rem;
  line-height: 2.05;
  letter-spacing: 0.06em;
  color: var(--c-text-soft);
}

.hero__divider {
  margin-top: 3.4rem;
}
</style>
