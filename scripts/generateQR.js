/**
 * scripts/generateQR.js
 * ---------------------------------------------------------------------------
 * 根据配置里的网址生成二维码 PNG。
 *
 * 用法（两种，随便挑一种）：
 *
 *   方式一（最省事，不用改文件）：把网址直接写在命令后面
 *       npm run qr -- https://my-letter.vercel.app
 *
 *   方式二：打开 scripts/qr.config.js，把 url 改成你的网址，然后
 *       npm run qr
 *
 *   生成的二维码在 public/qr-code.png（同时还有 qr-code.svg，打印用）。
 *
 * 说明：二维码保持纯黑白、高容错、四周留白充足，
 *       这样可以印在卡片上、贴在礼物上，也能在暗光下扫出来。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'
import { qrConfig } from './qr.config.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function resolveFromRoot(target) {
  return path.isAbsolute(target) ? target : path.join(projectRoot, target)
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

async function main() {
  // 命令行里带了网址就用命令行的，否则用 qr.config.js 里的
  const urlFromArgv = process.argv.slice(2).find((arg) => /^https?:\/\//i.test(arg) || arg.includes('.'))
  const url = String(urlFromArgv || qrConfig.url || '').trim()

  if (!url) {
    console.error('✗ 请先在 scripts/qr.config.js 里填写你的网站地址（url）')
    process.exitCode = 1
    return
  }

  if (!/^https?:\/\//i.test(url)) {
    console.warn('! 提示：网址建议以 http:// 或 https:// 开头，否则部分相机扫不出来。')
  }

  if (url.includes('your-project')) {
    console.warn('! 你还没有把 url 换成自己的网址（现在还是示例地址 your-project.vercel.app）。')
  }

  const pngPath = resolveFromRoot(qrConfig.output)
  ensureDir(pngPath)

  const options = {
    width: Number(qrConfig.width) || 1024,
    margin: Number.isFinite(qrConfig.margin) ? qrConfig.margin : 4,
    errorCorrectionLevel: qrConfig.errorCorrectionLevel || 'H',
    color: qrConfig.color || { dark: '#000000', light: '#FFFFFF' },
    type: 'png',
  }

  await QRCode.toFile(pngPath, url, options)
  console.log('✓ 二维码已生成：' + path.relative(projectRoot, pngPath))
  console.log('  内容：' + url)
  console.log('  尺寸：' + options.width + 'px，容错率：' + options.errorCorrectionLevel)

  if (qrConfig.outputSvg) {
    const svgPath = resolveFromRoot(qrConfig.outputSvg)
    ensureDir(svgPath)
    const svg = await QRCode.toString(url, { ...options, type: 'svg', width: undefined })
    fs.writeFileSync(svgPath, svg, 'utf8')
    console.log('✓ 矢量版也生成好了：' + path.relative(projectRoot, svgPath) + '（打印用）')
  }

  console.log('')
  console.log('接下来：把图片发给打印店 / 直接显示在手机上让对方扫，就可以了。')
}

main().catch((error) => {
  console.error('✗ 生成二维码失败：' + (error && error.message ? error.message : error))
  process.exitCode = 1
})
