/**
 * scripts/make-placeholder-music.mjs
 * ---------------------------------------------------------------------------
 * 生成一段"占位背景音乐"（public/music/background.wav）。
 *
 * 用法：  node scripts/make-placeholder-music.mjs
 *
 * 说明：
 *   它是一段非常轻的暖色环境音，没有版权问题，循环播放不会有明显的接缝。
 *   你以后把自己的 mp3 放到 public/music/background.mp3 之后，
 *   mp3 会优先被播放，这个 wav 可以留着当备用，也可以直接删掉。
 *
 * 实现：所有频率都对齐到"循环长度"的整数分之一，
 *       这样整段音频在首尾是严格连续的，循环时听不到断点。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(projectRoot, 'public', 'music')
const outputFile = path.join(outputDir, 'background.wav')

const SAMPLE_RATE = 16000
const LOOP_SECONDS = 32
const TOTAL_SAMPLES = SAMPLE_RATE * LOOP_SECONDS

// 四个和弦（根音 Hz），缓慢循环
const CHORDS = [
  { root: 110.0, ratios: [1, 1.5, 2, 2.5, 3, 4] }, // A
  { root: 92.5, ratios: [1, 1.5, 2, 2.5, 3, 4] }, // F#
  { root: 123.47, ratios: [1, 1.5, 2, 2.5, 3, 4] }, // B
  { root: 82.41, ratios: [1, 1.5, 2, 2.5, 3, 4] }, // E
]

/** 把频率吸附到"循环长度"的整数分之一，保证首尾无缝 */
function snap(frequency) {
  return Math.round(frequency * LOOP_SECONDS) / LOOP_SECONDS
}

/** 循环的三角权重：第 index 个和弦在整体中的音量（相邻和弦交叉淡入淡出） */
function chordWeight(index, progress) {
  const count = CHORDS.length
  const position = progress * count
  const distance = Math.abs(((position - index + count / 2 + count * 2) % count) - count / 2)
  return Math.max(0, 1 - distance)
}

function buildSamples() {
  const samples = new Float32Array(TOTAL_SAMPLES)
  const partials = CHORDS.map((chord, chordIndex) =>
    chord.ratios.map((ratio, partialIndex) => ({
      frequency: snap(chord.root * ratio),
      amplitude: 0.5 / (partialIndex + 1.4),
      phase: (chordIndex * 1.7 + partialIndex * 0.9) % (Math.PI * 2),
    }))
  )

  // 低频呼吸，周期也是循环长度的整数分之一
  const lfoFrequency = snap(1 / 8)

  for (let i = 0; i < TOTAL_SAMPLES; i += 1) {
    const time = i / SAMPLE_RATE
    const progress = i / TOTAL_SAMPLES
    const breathe = 0.82 + 0.18 * Math.sin(2 * Math.PI * lfoFrequency * time)
    let value = 0

    for (let c = 0; c < CHORDS.length; c += 1) {
      const weight = chordWeight(c, progress)
      if (weight <= 0) continue
      for (const partial of partials[c]) {
        value += weight * partial.amplitude * Math.sin(2 * Math.PI * partial.frequency * time + partial.phase)
      }
    }

    samples[i] = value * breathe
  }

  // 归一化到 0.28，留足余量，听起来更"轻"
  let peak = 0
  for (let i = 0; i < TOTAL_SAMPLES; i += 1) peak = Math.max(peak, Math.abs(samples[i]))
  const gain = peak > 0 ? 0.28 / peak : 0
  for (let i = 0; i < TOTAL_SAMPLES; i += 1) samples[i] *= gain

  return samples
}

function toWav(samples) {
  const bytesPerSample = 2
  const dataSize = samples.length * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8, 'ascii')
  buffer.write('fmt ', 12, 'ascii')
  buffer.writeUInt32LE(16, 16) // fmt chunk 长度
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(1, 22) // 单声道
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28)
  buffer.writeUInt16LE(bytesPerSample, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36, 'ascii')
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * bytesPerSample)
  }

  return buffer
}

function main() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  if (fs.existsSync(outputFile)) {
    console.log('- 已存在，跳过：public/music/background.wav')
    return
  }

  console.log('正在合成占位背景音乐（大约需要几秒）...')
  const samples = buildSamples()
  const wav = toWav(samples)
  fs.writeFileSync(outputFile, wav)
  console.log('✓ 已生成 public/music/background.wav（' + Math.round(wav.length / 1024) + ' KB）')
  console.log('  换成自己的音乐：把 mp3 放到 public/music/background.mp3 即可，会自动优先播放。')
}

main()
