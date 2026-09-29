/**
 * scripts/make-placeholder-images.mjs
 * ---------------------------------------------------------------------------
 * 生成 6 张"占位照片"，让项目一拿到手就能看到效果。
 *
 * 用法：  npm run placeholder:images
 *
 * 说明：
 *   这里用纯 JavaScript 手写了一个最小的 baseline JPEG 编码器，
 *   目的是"不安装任何图片处理库"就能产出真正的 .jpg 文件。
 *   你自己有照片之后，直接用同名文件覆盖 public/images/ 里的图片即可，
 *   这个脚本以后就不需要再运行了。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(projectRoot, 'public', 'images')

const WIDTH = 800
const HEIGHT = 600

/* ===========================================================================
 * 一、JPEG 编码所需的固定表格（JPEG 标准 Annex K）
 * ======================================================================== */

// 之字形扫描顺序
const ZIGZAG = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20,
  13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59,
  52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63,
]

const DC_BITS = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]
const DC_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

const AC_BITS = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d]
const AC_VALUES = [
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
  0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
  0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
  0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
  0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
  0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
  0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
  0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
  0xf9, 0xfa,
]

// 标准亮度量化表（自然顺序）
const STD_QUANT = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113,
  92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
]

/* ===========================================================================
 * 二、霍夫曼编码表 + DCT
 * ======================================================================== */

function buildHuffmanMap(bits, values) {
  const sizes = []
  for (let i = 0; i < bits.length; i += 1) {
    for (let j = 0; j < bits[i]; j += 1) sizes.push(i + 1)
  }
  const codes = new Array(sizes.length)
  let code = 0
  let k = 0
  let size = sizes[0]
  while (k < sizes.length) {
    while (k < sizes.length && sizes[k] === size) {
      codes[k] = code
      code += 1
      k += 1
    }
    code <<= 1
    size += 1
  }
  const map = new Map()
  for (let i = 0; i < values.length; i += 1) {
    map.set(values[i], { code: codes[i], size: sizes[i] })
  }
  return map
}

const DC_MAP = buildHuffmanMap(DC_BITS, DC_VALUES)
const AC_MAP = buildHuffmanMap(AC_BITS, AC_VALUES)

const COS = []
for (let u = 0; u < 8; u += 1) {
  COS[u] = []
  for (let x = 0; x < 8; x += 1) {
    COS[u][x] = Math.cos(((2 * x + 1) * u * Math.PI) / 16)
  }
}

const cFactor = (u) => (u === 0 ? Math.SQRT1_2 : 1)

/** 8x8 二维 DCT（分离式，先做行再做列） */
function fdct(block, output) {
  const tmp = new Float64Array(64)
  for (let y = 0; y < 8; y += 1) {
    for (let u = 0; u < 8; u += 1) {
      let sum = 0
      for (let x = 0; x < 8; x += 1) sum += block[y * 8 + x] * COS[u][x]
      tmp[y * 8 + u] = sum * 0.5 * cFactor(u)
    }
  }
  for (let u = 0; u < 8; u += 1) {
    for (let v = 0; v < 8; v += 1) {
      let sum = 0
      for (let y = 0; y < 8; y += 1) sum += tmp[y * 8 + u] * COS[v][y]
      output[v * 8 + u] = sum * 0.5 * cFactor(v)
    }
  }
}

function magnitudeBits(value) {
  let magnitude = Math.abs(value)
  let bits = 0
  while (magnitude > 0) {
    magnitude >>= 1
    bits += 1
  }
  return bits
}

class BitWriter {
  constructor() {
    this.chunks = []
    this.buffer = 0
    this.length = 0
  }

  writeBits(value, bits) {
    for (let i = bits - 1; i >= 0; i -= 1) {
      this.buffer = (this.buffer << 1) | ((value >> i) & 1)
      this.length += 1
      if (this.length === 8) this.flushByte()
    }
  }

  flushByte() {
    const byte = this.buffer & 0xff
    this.chunks.push(byte)
    // JPEG 规定：数据里的 0xFF 后面必须补一个 0x00
    if (byte === 0xff) this.chunks.push(0x00)
    this.buffer = 0
    this.length = 0
  }

  finish() {
    if (this.length > 0) {
      const pad = 8 - this.length
      this.buffer = (this.buffer << pad) | ((1 << pad) - 1)
      this.length = 8
      this.flushByte()
    }
    return Buffer.from(this.chunks)
  }
}

/* ===========================================================================
 * 三、编码一张 JPEG
 * ======================================================================== */

function u16(value) {
  return [(value >> 8) & 0xff, value & 0xff]
}

function segment(marker, payload) {
  return Buffer.from([0xff, marker, ...u16(payload.length + 2), ...payload])
}

function encodeJpeg(width, height, rgb, quality = 82) {
  const scale = quality < 50 ? 5000 / quality : 200 - quality * 2
  const quant = STD_QUANT.map((value) => {
    const scaled = Math.floor((value * scale + 50) / 100)
    return Math.max(1, Math.min(255, scaled))
  })

  // RGB -> YCbCr
  const yPlane = new Float32Array(width * height)
  const cbPlane = new Float32Array(width * height)
  const crPlane = new Float32Array(width * height)
  for (let i = 0; i < width * height; i += 1) {
    const r = rgb[i * 3]
    const g = rgb[i * 3 + 1]
    const b = rgb[i * 3 + 2]
    yPlane[i] = 0.299 * r + 0.587 * g + 0.114 * b
    cbPlane[i] = -0.168736 * r - 0.331264 * g + 0.5 * b + 128
    crPlane[i] = 0.5 * r - 0.418688 * g - 0.081312 * b + 128
  }

  const writer = new BitWriter()
  const block = new Float64Array(64)
  const coeffs = new Float64Array(64)
  const zz = new Float64Array(64)
  const dcPred = [0, 0, 0]

  function encodeBlock(plane, mcuX, mcuY, component) {
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const sx = Math.min(width - 1, mcuX * 8 + x)
        const sy = Math.min(height - 1, mcuY * 8 + y)
        block[y * 8 + x] = plane[sy * width + sx] - 128
      }
    }

    fdct(block, coeffs)

    for (let i = 0; i < 64; i += 1) {
      zz[i] = Math.round(coeffs[ZIGZAG[i]] / quant[ZIGZAG[i]])
    }

    // ---- DC ----
    const diff = zz[0] - dcPred[component]
    dcPred[component] = zz[0]
    const dcSize = magnitudeBits(diff)
    const dcCode = DC_MAP.get(dcSize)
    writer.writeBits(dcCode.code, dcCode.size)
    if (dcSize > 0) {
      const value = diff < 0 ? diff + (1 << dcSize) - 1 : diff
      writer.writeBits(value, dcSize)
    }

    // ---- AC ----
    let run = 0
    for (let i = 1; i < 64; i += 1) {
      const value = zz[i]
      if (value === 0) {
        run += 1
        continue
      }
      while (run > 15) {
        const zrl = AC_MAP.get(0xf0)
        writer.writeBits(zrl.code, zrl.size)
        run -= 16
      }
      const size = magnitudeBits(value)
      const code = AC_MAP.get(run * 16 + size)
      writer.writeBits(code.code, code.size)
      const encoded = value < 0 ? value + (1 << size) - 1 : value
      writer.writeBits(encoded, size)
      run = 0
    }
    if (run > 0) {
      const eob = AC_MAP.get(0x00)
      writer.writeBits(eob.code, eob.size)
    }
  }

  const mcuCols = Math.ceil(width / 8)
  const mcuRows = Math.ceil(height / 8)
  for (let mcuY = 0; mcuY < mcuRows; mcuY += 1) {
    for (let mcuX = 0; mcuX < mcuCols; mcuX += 1) {
      encodeBlock(yPlane, mcuX, mcuY, 0)
      encodeBlock(cbPlane, mcuX, mcuY, 1)
      encodeBlock(crPlane, mcuX, mcuY, 2)
    }
  }

  const entropy = writer.finish()

  // ---- 写文件头 ----
  const parts = []

  parts.push(Buffer.from([0xff, 0xd8])) // SOI
  parts.push(
    segment(0xe0, [
      0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
      0x01, 0x01, // 版本 1.1
      0x00, // 单位
      ...u16(1),
      ...u16(1),
      0x00,
      0x00,
    ])
  )

  // DQT（量化表按之字形顺序存放）
  const quantZigzag = []
  for (let i = 0; i < 64; i += 1) quantZigzag.push(quant[ZIGZAG[i]])
  parts.push(segment(0xdb, [0x00, ...quantZigzag]))

  // SOF0
  parts.push(
    segment(0xc0, [
      0x08,
      ...u16(height),
      ...u16(width),
      0x03, // 3 个分量
      0x01, 0x11, 0x00, // Y
      0x02, 0x11, 0x00, // Cb
      0x03, 0x11, 0x00, // Cr
    ])
  )

  // DHT
  parts.push(segment(0xc4, [0x00, ...DC_BITS, ...DC_VALUES]))
  parts.push(segment(0xc4, [0x10, ...AC_BITS, ...AC_VALUES]))

  // SOS
  parts.push(
    segment(0xda, [0x03, 0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x00, 0x3f, 0x00])
  )

  parts.push(entropy)
  parts.push(Buffer.from([0xff, 0xd9])) // EOI

  return Buffer.concat(parts)
}

/* ===========================================================================
 * 四、画一张"照片"
 * ======================================================================== */

const clamp255 = (value) => (value < 0 ? 0 : value > 255 ? 255 : Math.round(value))

/** 简单的确定性随机，保证每次生成的图片都一样 */
function makeRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function renderPhoto(preset) {
  const rgb = new Uint8Array(WIDTH * HEIGHT * 3)
  const random = makeRandom(preset.seed)
  const centerX = preset.cx * WIDTH
  const centerY = preset.cy * HEIGHT
  const radius = preset.radius * Math.max(WIDTH, HEIGHT)

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const i = (y * WIDTH + x) * 3
      const t = Math.min(1, Math.max(0, (x / WIDTH) * preset.dx + (y / HEIGHT) * preset.dy))

      let r = preset.from[0] + (preset.to[0] - preset.from[0]) * t
      let g = preset.from[1] + (preset.to[1] - preset.from[1]) * t
      let b = preset.from[2] + (preset.to[2] - preset.from[2]) * t

      // 柔光斑
      const dx = (x - centerX) / radius
      const dy = (y - centerY) / radius
      const glow = Math.exp(-(dx * dx + dy * dy) * 2.4)
      r += preset.glow[0] * glow
      g += preset.glow[1] * glow
      b += preset.glow[2] * glow

      // 暗角
      const vx = (x / WIDTH - 0.5) * 2
      const vy = (y / HEIGHT - 0.5) * 2
      const vignette = 1 - Math.min(1, (vx * vx + vy * vy) * 0.3)
      r *= vignette
      g *= vignette
      b *= vignette

      // 胶片颗粒（blank 那张要更干净，所以允许单独指定）
      const noise = (random() - 0.5) * (preset.grain === undefined ? 13 : preset.grain)
      r += noise
      g += noise
      b += noise

      rgb[i] = clamp255(r)
      rgb[i + 1] = clamp255(g)
      rgb[i + 2] = clamp255(b)
    }
  }

  return rgb
}

/* 6 张占位图的配色，都是同一个"暖色 + 深色"的家族，保证风格统一 */
const PRESETS = [
  { name: '1.jpg', seed: 11, cx: 0.68, cy: 0.32, radius: 0.6, dx: 0.55, dy: 0.45, from: [46, 26, 20], to: [96, 62, 40], glow: [86, 54, 30] },
  { name: '2.jpg', seed: 22, cx: 0.3, cy: 0.7, radius: 0.55, dx: 0.4, dy: 0.6, from: [22, 20, 26], to: [78, 54, 52], glow: [70, 44, 46] },
  { name: '3.jpg', seed: 33, cx: 0.5, cy: 0.25, radius: 0.5, dx: 0.65, dy: 0.35, from: [38, 24, 16], to: [110, 74, 44], glow: [96, 64, 34] },
  { name: '4.jpg', seed: 44, cx: 0.75, cy: 0.68, radius: 0.62, dx: 0.3, dy: 0.7, from: [30, 22, 24], to: [88, 58, 48], glow: [78, 50, 38] },
  { name: '5.jpg', seed: 55, cx: 0.22, cy: 0.3, radius: 0.58, dx: 0.6, dy: 0.4, from: [26, 22, 22], to: [104, 70, 46], glow: [92, 62, 36] },
  { name: '6.jpg', seed: 66, cx: 0.6, cy: 0.6, radius: 0.66, dx: 0.45, dy: 0.55, from: [20, 18, 20], to: [84, 56, 44], glow: [74, 48, 34] },

  // blank.jpg —— 一张"空白底片"，给还没有照片的位置用（例如"还有很多没拍下来的"）
  { name: 'blank.jpg', seed: 99, cx: 0.5, cy: 0.45, radius: 0.95, dx: 0.5, dy: 0.5, from: [34, 28, 23], to: [19, 15, 13], glow: [17, 13, 10], grain: 6 },
]

function main() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  for (const preset of PRESETS) {
    const filePath = path.join(outputDir, preset.name)
    if (fs.existsSync(filePath)) {
      console.log('- 已存在，跳过：' + preset.name + '（想重新生成就先删掉它）')
      continue
    }
    const rgb = renderPhoto(preset)
    const jpeg = encodeJpeg(WIDTH, HEIGHT, rgb, 82)
    fs.writeFileSync(filePath, jpeg)
    console.log('✓ 生成 ' + preset.name + '（' + Math.round(jpeg.length / 1024) + ' KB）')
  }

  console.log('')
  console.log('占位照片已经放在 public/images/ 里（含一张空白图 blank.jpg）。')
  console.log('换成自己的照片时，直接用同名文件覆盖即可；')
  console.log('照片很多也不怕，只要在 src/data/story.js 里加上对应的路径。')
}

main()
