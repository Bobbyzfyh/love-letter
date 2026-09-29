/**
 * scripts/check-deploy.js
 * ---------------------------------------------------------------------------
 * 部署自检：确认网址上线之后，"别人用手机扫二维码打开"时每一个功能都能正常工作。
 *
 * 用法：  npm run check -- https://你的网址
 *   例如  npm run check -- https://my-letter.vercel.app
 *
 * 它会一项一项地检查：
 *   1. 首页能不能打开
 *   2. 页面引用的 JS / CSS 资源在不在
 *   3. 所有照片能不能加载
 *   4. 所有背景音乐能不能加载、类型对不对
 *   5. 音乐是否支持"边下边播"（手机的进度拖动依赖它）
 * 最后给出一份清单：哪些正常，哪些有问题。
 */
import { music } from '../src/data/config.js'
import { sections, gallery } from '../src/data/story.js'

const rawBase = process.argv.slice(2).find((arg) => arg.startsWith('http'))
if (!rawBase) {
  console.error('用法：npm run check -- https://你的网址')
  process.exitCode = 1
  process.exit()
}

const base = rawBase.endsWith('/') ? rawBase : rawBase + '/'
const results = []

function ok(label, extra) {
  results.push({ pass: true, label, extra })
}
function bad(label, extra) {
  results.push({ pass: false, label, extra })
}

/** 收集需要检查的资源路径 */
function collectAssets() {
  const list = []
  for (const section of sections) {
    if (section.image) list.push(section.image.src)
    if (Array.isArray(section.images)) section.images.forEach((item) => list.push(item.src))
  }
  for (const photo of gallery.photos) list.push(photo.src)
  return list.filter(Boolean).map((p) => String(p).replace(/^(\/|\.\/)+/, ''))
}

/** 先用 HEAD 探一下（省流量）；有的服务器不支持 HEAD，再退回 GET */
async function head(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (response.status !== 405 && response.status !== 501) return response
  } catch (error) {
    /* 继续用 GET 再试一次 */
  }
  try {
    return await fetch(url, { redirect: 'follow' })
  } catch (error) {
    return { ok: false, status: 0, error }
  }
}

async function main() {
  console.log('正在检查：' + base)
  console.log('')

  // ---- 1. 首页 ----
  let html = ''
  try {
    const response = await fetch(base, { redirect: 'follow' })
    html = await response.text()
    if (response.ok && html.includes('id="app"')) {
      ok('首页可以打开', response.status + ' ' + response.headers.get('content-type'))
    } else {
      bad('首页内容不对', '返回 ' + response.status)
    }
  } catch (error) {
    bad('首页打不开', String(error && error.message ? error.message : error))
  }

  // ---- 2. 页面引用的 JS / CSS ----
  const assetPaths = []
  const scriptMatches = html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)
  for (const match of scriptMatches) assetPaths.push(match[1])

  if (assetPaths.length === 0) {
    bad('首页里找不到打包后的 JS / CSS', 'index.html 可能不对')
  }
  for (const path of assetPaths) {
    const url = new URL(path, base).href
    const response = await head(url)
    if (response.ok) ok('资源可访问 ' + path, response.status)
    else bad('资源缺失 ' + path, '返回 ' + (response.status || '连不上'))
  }

  // ---- 3. 照片 ----
  const assets = collectAssets()
  let photoOk = 0
  for (const path of assets) {
    const url = new URL('images/' + path.replace(/^images\//, ''), base).href
    const response = await head(url)
    if (response.ok) {
      photoOk += 1
    } else {
      bad('照片加载失败 ' + path, '返回 ' + (response.status || '连不上'))
    }
  }
  if (photoOk === assets.length && assets.length > 0) ok('全部 ' + photoOk + ' 张照片都能加载')

  // ---- 4 & 5. 背景音乐 ----
  if (Array.isArray(music.sources)) {
    let musicOk = 0
    let rangeOk = 0
    let totalBytes = 0
    for (const entry of music.sources) {
      // 播放列表里每一项可以是字符串，也可以是 { src, gain } 这种对象
      const raw = typeof entry === 'string' ? entry : entry && entry.src
      if (!raw) continue
      const clean = String(raw).replace(/^(\/|\.\/)+/, '')
      const url = new URL(clean, base).href
      const response = await head(url)
      const type = response.headers ? response.headers.get('content-type') || '' : ''
      const length = Number(response.headers ? response.headers.get('content-length') : 0) || 0
      totalBytes += length

      if (!response.ok) {
        bad('音乐加载失败 ' + clean, '返回 ' + (response.status || '连不上'))
        continue
      }
      if (!type.startsWith('audio/') && !type.includes('mp4') && !type.includes('mpeg')) {
        bad('音乐类型不对 ' + clean, 'Content-Type 是 ' + type)
        continue
      }
      musicOk += 1
      if ((response.headers.get('accept-ranges') || '').includes('bytes')) rangeOk += 1
    }
    if (musicOk > 0) ok('全部 ' + musicOk + ' 段音乐都能加载', '合计 ' + (totalBytes / 1024 / 1024).toFixed(2) + ' MB')
    if (rangeOk === musicOk && musicOk > 0) {
      ok('音乐支持边下边播（Accept-Ranges）', rangeOk + '/' + musicOk)
    } else if (musicOk > 0) {
      bad('音乐可能不支持拖动进度', rangeOk + '/' + musicOk + ' 支持')
    }
  }

  // ---- 汇总 ----
  console.log('')
  let failed = 0
  for (const item of results) {
    if (item.pass) {
      console.log('  ✓ ' + item.label + (item.extra ? '  [' + item.extra + ']' : ''))
    } else {
      failed += 1
      console.log('  ✗ ' + item.label + (item.extra ? '  [' + item.extra + ']' : ''))
    }
  }

  console.log('')
  if (failed === 0) {
    console.log('全部通过：这个网址可以放心拿去生成二维码了。')
    console.log('')
    console.log('下一步：')
    console.log('  npm run qr -- ' + rawBase.replace(/\/$/, ''))
  } else {
    console.log('有 ' + failed + ' 项有问题，先把上面的 ✗ 解决掉再生成二维码。')
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('检查过程出错：' + (error && error.message ? error.message : error))
  process.exitCode = 1
})
