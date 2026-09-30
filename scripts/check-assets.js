/**
 * scripts/check-assets.js
 * ---------------------------------------------------------------------------
 * 在打包之前自动跑一遍，检查"配置文件"和"实际文件"对不对得上。
 * 由 package.json 里的 prebuild 自动触发，你不需要手动运行。
 *
 * 它会检查两种情况：
 *   1. 配置里写了某个音乐 / 照片，但 public 里其实没有这个文件
 *      -> 网页上那首歌会被自动跳过、那张照片会显示不出来
 *   2. public 里有文件，但配置里没写
 *      -> 这个文件永远不会出现在网页上（比如"我明明加了歌，怎么没播"）
 *
 * 只是提醒，不会让打包失败 —— 少一首歌不影响整封情书正常打开。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { music, site } from '../src/data/config.js'
import { sections, gallery } from '../src/data/story.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(projectRoot, 'public')

const problems = []
const notices = []

function exists(relativePath) {
  const clean = String(relativePath).replace(/^(\/|\.\/)+/, '')
  return fs.existsSync(path.join(publicDir, clean))
}

/* --------------------------------------------------------------------------
 * 1. 音乐
 * ----------------------------------------------------------------------- */
function checkMusic() {
  const list = Array.isArray(music.sources) ? music.sources : []
  const configured = list
    .map((item) => (typeof item === 'string' ? item : item && item.src))
    .filter(Boolean)
    .map((item) => String(item).replace(/^(\/|\.\/)+/, ''))

  configured.forEach((item) => {
    if (!exists(item)) {
      problems.push({
        type: '音乐',
        file: item,
        hint: '配置文件里还写着它，但 public 里已经没有这个文件了。要么把文件放回去，要么把 src/data/config.js 里 music.sources 的对应那一行删掉。',
      })
    }
  })

  const musicDir = path.join(publicDir, 'music')
  if (fs.existsSync(musicDir)) {
    const onDisk = fs
      .readdirSync(musicDir)
      .filter((name) => /\.(m4a|mp3|wav|ogg|aac|flac)$/i.test(name))
      .map((name) => 'music/' + name)

    onDisk.forEach((item) => {
      if (!configured.includes(item)) {
        notices.push({
          type: '音乐',
          file: item,
          hint: '文件在 public/music 里，但没有写进 src/data/config.js 的 music.sources，所以永远不会被播放。',
        })
      }
    })
  }
}

/* --------------------------------------------------------------------------
 * 2. 照片
 * ----------------------------------------------------------------------- */
function checkImages() {
  const configured = []
  for (const section of sections) {
    if (section.image) configured.push(section.image.src)
    if (Array.isArray(section.images)) section.images.forEach((item) => configured.push(item.src))
  }
  for (const photo of gallery.photos) configured.push(photo.src)

  configured
    .filter(Boolean)
    .map((item) => String(item).replace(/^(\/|\.\/)+/, ''))
    .forEach((item) => {
      if (!exists(item)) {
        problems.push({
          type: '照片',
          file: item,
          hint: '配置文件里引用了它，但 public 里没有这个文件，网页上会显示不出来。',
        })
      }
    })
}

/* --------------------------------------------------------------------------
 * 运行
 * ----------------------------------------------------------------------- */
console.log('检查资源文件……')
checkMusic()
checkImages()

if (problems.length === 0 && notices.length === 0) {
  console.log('  ✓ 配置和实际文件完全对得上（' + site.title + '）')
} else {
  if (problems.length > 0) {
    console.log('')
    console.log('  ✗ 有 ' + problems.length + ' 个文件"配置里有、实际没有"：')
    problems.forEach((item) => {
      console.log('      [' + item.type + '] ' + item.file)
      console.log('        ' + item.hint)
    })
  }
  if (notices.length > 0) {
    console.log('')
    console.log('  ! 有 ' + notices.length + ' 个文件"在文件夹里、但配置里没写"：')
    notices.forEach((item) => {
      console.log('      [' + item.type + '] ' + item.file)
      console.log('        ' + item.hint)
    })
  }
  console.log('')
  console.log('  （不影响打包，网页照常能用，只是上面这些地方对不上）')
}
console.log('')
