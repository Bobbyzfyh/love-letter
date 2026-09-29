# 二维码电子情书 · QR Love Letter

一个用手机扫码打开的、慢慢读完的电子情书网页。
深色暖调、柔光、胶片颗粒、大片留白，动画很慢，适合安静地看完。

技术栈：**Vue 3 + Vite + 原生 CSS**，没有引入任何 UI 框架，也没有引入动画库
（动画全部用 CSS animation / transition / Intersection Observer 实现）。

---

## 一、快速开始

```bash
# 1. 安装依赖（只需要做一次）
npm install

# 2. 启动本地预览（会自动打开 http://localhost:5173）
npm run dev

# 3. 打包成可以部署的静态文件（输出到 dist/）
npm run build

# 4. 本地预览打包结果
npm run preview
```

> 手机上测试：先让手机和电脑连同一个 Wi-Fi，
> 看 `npm run dev` 输出里的 `Network: http://192.168.x.x:5173` 这个地址，
> 用手机浏览器打开就能看到真实效果。

---

## 二、项目结构

```
qr-love-letter/
├── index.html                    # 网页外壳（标题、手机 viewport 设置）
├── package.json                  # 依赖与命令
├── vite.config.js                # 打包配置（base: './'，任何子目录都能部署）
├── public/                       # ★ 静态资源：不会被编译，直接复制到网站根目录
│   ├── images/                   #   ★ 照片放这里（现在有 6 张自动生成的占位图）
│   ├── music/                    #   ★ 音乐放这里（现在有一个占位的 background.wav）
│   └── qr-code.png               #   npm run qr 生成的二维码
├── vercel.json                   # Vercel 部署配置（自动识别，不用管）
├── netlify.toml                  # Netlify 部署配置（自动识别，不用管）
├── .github/workflows/            # GitHub Pages 自动部署
├── scripts/                      # 辅助脚本
│   ├── qr.config.js              #   ★ 二维码配置：在这里填你的网址
│   ├── generateQR.js             #   npm run qr
│   ├── check-deploy.js           #   npm run check：部署完自检
│   ├── make-placeholder-images.mjs  # 生成占位照片（不装任何图片库）
│   └── make-placeholder-music.mjs   # 生成占位环境音
└── src/
    ├── main.js                   # 入口：注册 v-reveal / v-parallax 指令
    ├── App.vue                   # 只负责"排列顺序"，不写具体文字
    ├── style.css                 # 全局变量、重置、字体、通用动画类
    ├── data/                     # ★★★ 你主要修改的就是这三个文件 ★★★
    │   ├── config.js             #   名字 / 纪念日 / 音乐 / 开场白 / 结尾 / 彩蛋 / 配色
    │   ├── story.js              #   章节正文 / 照片墙
    │   └── letter.js             #   最后那封完整的情书
    ├── components/
    │   ├── AmbientBackground.vue # 背景：光斑 / 星点 / 胶片颗粒 / 暗角
    │   ├── IntroScreen.vue       # 开场页（"打开这封信"）
    │   ├── HeroBlock.vue         # 开场后的小标题
    │   ├── StorySection.vue      # 一个正文章节
    │   ├── TypewriterText.vue    # 打字机文字
    │   ├── PhotoGallery.vue      # 照片墙
    │   ├── PhotoCard.vue         # 单张宝丽来照片卡片（点击放大 / 长按看彩蛋）
    │   ├── PhotoLightbox.vue     # 照片放大查看
    │   ├── Letter.vue            # 最后的一封信
    │   ├── Ending.vue            # 结尾
    │   ├── MusicPlayer.vue       # 右下角悬浮音乐按钮
    │   └── EasterEgg.vue         # 左下角那颗很小的星星
    ├── composables/
    │   ├── useBackgroundMusic.js # 背景音乐（处理手机自动播放限制）
    │   └── useLongPress.js       # 长按识别
    ├── directives/
    │   ├── reveal.js             # v-reveal：滚动到就柔和出现
    │   └── parallax.js           # v-parallax：很轻微的视差
    └── utils/asset.js            # 资源路径处理（部署到子目录也不会 404）
```

---

## 三、我要改什么？改哪里？

### 1. 改名字、纪念日、开场白、结尾

打开 `src/data/config.js`：

```js
export const site = {
  title: '写给你的信',      // 浏览器标签页标题
  toName: '你',             // 对方名字
  fromName: '我',           // 你的名字
  anniversary: '2025.09.21',// 纪念日（显示在开场页底部）
  footer: 'Made for you · 2026',
}
```

同一个文件里还能改：
- `intro`：开场页那句话和按钮文字
- `hero`：开场后的小标题
- `music`：音乐路径、音量、渐入时长
- `ending`：结尾三句话和它们之间的停顿
- `easterEgg`：彩蛋的触发次数和隐藏文字
- `theme.colors`：整套配色（想换成别的气质只改这里）

### 2. 改正文和照片

打开 `src/data/story.js`：

- `sections` 数组 = 正文的每一个章节（标题、段落、配图）
  - `effect: 'fade'` 淡入；`effect: 'typewriter'` 打字机
- `gallery.photos` 数组 = 照片墙的每一张照片

### 3. 改最后那封信

打开 `src/data/letter.js`：
`greeting`（称呼）、`paragraphs`（正文，一个字符串 = 一段）、
`signature`（落款）、`date`（日期）、`postscript`（附言）。

> 三个文件里都有详细中文注释，改完保存页面就会自动刷新。

---

## 四、怎么换照片

1. 把你的照片复制到 `public/images/` 目录。
2. 打开 `src/data/story.js`，把路径写进去：

```js
{
  src: 'images/我的照片.jpg',
  title: '你还记得这里吗',        // 可选：这张照片的标题（不写就不显示）
  caption: '照片下面的小字',      // 可选：照片下方的手写体小字
  note: '长按出现的隐藏留言',      // 可选：长按照片才会出现的留言
  rotate: -3,                     // 倾斜角度
}
```

- `title` 是**可选**的：写了会显示在配文上方（像这张照片的名字），不写就只显示配文
- `caption` 和 `note` 不想要就写 `''`
- `rotate` 是旋转角度，随便给 ±1~4 度，看起来更像随手摆的照片
- 想加照片就在数组里多加一行，想删就删掉那一行
- **还没有照片、但想先占个位置**：`src` 写 `'images/blank.jpg'`
  （一张空白底片，看起来像"这里还空着"，不会显得是坏图）

> 照片建议先压缩到宽度 1600px 以内（手机流量友好），文件名用英文或数字更稳妥。
> 现在的 6 张占位图可以直接删掉。想重新生成占位图：`npm run placeholder:images`

---

## 五、怎么换音乐

1. 把音乐文件放到 `public/music/`，然后在 `src/data/config.js` 的 `music.sources` 里写文件名
   （文件名建议用英文，**不要带空格**，网址里会更干净）。
2. `sources` 是**播放列表**：按顺序一首一首播，全部播完再从第一首开始（`loop: true`）。
   只写一首就是单曲循环；某一首文件缺失会自动跳过，全部都不行时音乐按钮会自动隐藏。

```js
export const music = {
  // 两种写法都行：只写文件名，或者顺便单独调这一段音量
  sources: [
    { src: 'music/track-1.m4a', gain: 1.0 },
    { src: 'music/track-2.m4a', gain: 1.55 },
  ],
  volume: 0.45,   // 基础音量，0 ~ 1
  loop: true,     // 整份列表循环（false = 播完最后一首就停）
}
```

其他细节：
- 右下角的小圆按钮可以随时播放 / 暂停，播放中会有一圈很淡的旋转光环
- 音乐必须在用户点击"打开这封信"之后才开始（手机浏览器禁止网页自动播放，
  这一点已经在代码里处理好了：播放动作发生在点击事件本身里）
- 手机录音的 `.m4a` 完全可以，服务器会以 `audio/mp4` 正常返回
- 全部音源都失败时，音乐按钮会自动隐藏，网页不会报错

### 关于响度：用 `gain`，不要去重压音频

不同时间、不同设备录出来的音量可能差很多。**统一响度的正确做法是在播放器里补音量，
而不是把音频重压一遍** —— 原始文件本来就是压缩过的音频，再压一次就是二次有损压缩，
音质会明显变差（这个项目踩过这个坑）。

`gain` 就是干这个的：`1` = 原样，`1.5` = 比原样大一半。它是**音量倍数**，
作用在 `volume` 之上，最大不能超过 1。

怎么定这个数？先用 ffmpeg 量一下每一段的响度（LUFS）：

```bash
ffmpeg -hide_banner -i 文件.m4a -af loudnorm=print_format=json -f null -
```

以最响的那一段为基准（gain = 1），其余每一段的 gain = 10^(两者 LUFS 之差 / 20)。
例如某段比基准轻 3.8 dB，gain 就是 10^(3.8/20) ≈ 1.55。

> 如果某一段轻得特别离谱（比如轻 15 dB），单靠 gain 补不回来（会超过音量上限 1），
> 那一段才值得单独用**纯线性增益**重压一次 —— 注意是纯增益，**不要用 `loudnorm`**：
> `ffmpeg -i 原文件.m4a -af "volume=10dB" -c:a aac -b:a 128k -movflags +faststart 输出.m4a`
> `loudnorm` 会对整段做动态压缩和限幅，听起来会发闷、发扁。

---

## 六、怎么生成二维码

1. 先部署网站，拿到网址（例如 `https://my-letter.vercel.app`）。
   部署完先跑一次自检，确认首页、照片、音乐都在：`npm run check -- https://你的网址`
2. 生成二维码（两种方式任选）：

   **方式一（最省事，什么都不用改）** —— 网址直接写在命令后面：

   ```bash
   npm run qr -- https://你的网址
   ```

   **方式二** —— 打开 `scripts/qr.config.js`，把 `url` 改成你的网址：

```js
export const qrConfig = {
  url: 'https://my-letter.vercel.app', // ★ 改这里
  output: 'public/qr-code.png',
  width: 1024,                 // 高清
  margin: 4,                   // 留白，不要改小
  errorCorrectionLevel: 'H',   // 容错率最高，最抗污损
  color: { dark: '#000000', light: '#FFFFFF' }, // 纯黑白，最好扫
}
```

   然后运行 `npm run qr` 即可。

3. 生成结果：
   - `public/qr-code.png` —— 手机扫码 / 发图片用
   - `public/qr-code.svg` —— 矢量图，拿去打印店印刷用

> 二维码故意保持"纯黑白 + 高容错 + 充足留白"，
> 不建议加 logo、改颜色或压缩留白，那样很容易扫不出来。

---

## 七、怎么部署

打包命令是 `npm run build`，产物在 `dist/` 目录。

> **先看这一条（很重要）**：如果收到二维码的人主要在**中国大陆**，
> 那么 vercel.app / netlify.app / github.io 这类国外域名经常会**打不开或者极慢**
> （DNS 污染，和你的网站做得好不好没关系）。
> 想让对方一扫就能打开，建议直接用下面的**方案 B（腾讯云 COS）**。

### 方案 A：GitHub Pages（有 GitHub 账号就能做，免费，国内访问不稳定）

1. 把项目推到 GitHub。
2. 仓库 **Settings → Pages → Source** 选 **GitHub Actions**。
3. 推一次代码 —— `.github/workflows/deploy-pages.yml` 已经写好了，会自动打包发布。
4. 一两分钟后网址就有了：`https://用户名.github.io/仓库名/`

### 方案 B：腾讯云 COS 静态网站（国内能稳定打开，免备案，几乎免费）★ 推荐

1. 注册腾讯云（微信扫码，两分钟），完成实名认证。
2. 控制台 → **对象存储 COS** → 创建存储桶：
   - 地域：选离对方近的，例如「广州」
   - 访问权限：**公有读私有写**
   - 名字随便起，例如 `love-letter-123456`
3. 进入存储桶 → **基础配置 → 静态网站** → 开启：
   - 索引文档：`index.html`
   - 错误文档：`index.html`
4. 本地运行 `npm run build`，打开 `dist` 文件夹，
   **把里面的东西（不是 dist 文件夹本身）全部拖进存储桶根目录**。
5. 访问地址就是：
   `https://存储桶名.cos-website.地域.myqcloud.com`
   例如 `https://love-letter-123456.cos-website.ap-guangzhou.myqcloud.com`
6. 费用：整个网站十几 MB，基本用不满免费额度，一个月几分钱。

> 用默认的 `cos-website` 域名**不需要备案**；只有以后想绑自己的域名才需要。

### 方案 C：Vercel（最省事，但国内访问不稳定）

1. 把项目推到 GitHub。
2. 打开 [vercel.com](https://vercel.com) → New Project → 选这个仓库 → Deploy。
   项目里已经有 `vercel.json`，会自动识别成 Vite 项目。
3. 网址是 `https://xxx.vercel.app`。

---

### 部署完一定要做这三步

```bash
# 1. 自检：确认首页、JS/CSS、全部照片、全部音乐都能加载，音乐还支持边下边播
npm run check -- https://你的网址

# 2. 生成二维码（网址直接跟在命令后面）
npm run qr -- https://你的网址
#    产出 public/qr-code.png（发图用）和 public/qr-code.svg（打印用）

# 3. 真机实测：用手机的「流量」打开这个网址（先别连 Wi-Fi），
#    走一遍完整流程 —— 点开信、听音乐、看照片、读到最后。
#    只有流量下能跑通，才等于"别人扫二维码之后"的真实体验。
```

三步都通过，再去做二维码卡片。

### 换了网址怎么办

二维码里存的就是网址本身，**网址一变就必须重新生成**：

```bash
npm run qr -- https://新的网址
```

想固定下来（以后直接 `npm run qr` 就行），就打开 `scripts/qr.config.js` 把 `url` 改掉。

### 几个小提示

- `vite.config.js` 里设了 `base: './'`，所以放在子目录（例如 GitHub Pages 的
  `/仓库名/`）也能正常打开
- `dist/` 不用提交到 git（`.gitignore` 已排除），托管平台会自己打包
- 网站总大小约 8 MB，其中 7.6 MB 是四段录音；手机第一次打开只加载第一段
- 照片建议压到宽度 1600px 以内再放进去

---

## 八、隐藏彩蛋在哪里改

| 彩蛋 | 玩法 | 在哪里改 |
| --- | --- | --- |
| 角落的小星星 | 左下角一颗很淡的星星，点 5 次出现一句话 | `src/data/config.js` 的 `easterEgg.star`（`clicks` 次数、`message` 文字、`enabled` 开关） |
| 长按照片 | 长按任意一张照片，出现这张照片的隐藏留言 | `src/data/story.js` 里每张照片的 `note` 字段；长按时长在 `easterEgg.longPressMs` |
| 放大照片里的留言 | 点开照片放大后，隐藏留言也会显示在下面 | 同上（`note` 字段） |

---

## 九、常见问题

**Q：手机上没有播放音乐？**
先检查 `public/music/background.mp3` 是否真的存在、文件名大小写是否一致。
另外 iOS 的静音开关（侧边的物理开关）会让网页没声音；也确认一下手机音量。
点一下右下角的音乐按钮也能手动开始播放。

**Q：照片不显示？**
确认文件真的在 `public/images/` 里，并且 `story.js` 里写的是 `images/xxx.jpg`
（**不要**写成 `public/images/xxx.jpg`，`public` 是网站的根目录，不用写进去）。
注意大小写，服务器区分大小写。

**Q：想换配色 / 换成浅色？**
改 `src/data/config.js` 里的 `theme.colors` 即可，全站颜色都会跟着变。

**Q：想调整节奏（动画太快或太慢）？**
- 正文出现速度：`src/data/story.js` 里 `effect: 'typewriter'` 的章节，
  在 `StorySection.vue` 里传 `:start-delay`；打字速度在 `TypewriterText.vue` 的 `speed`（默认 82ms/字）
- 结尾停顿：`config.js` 的 `ending.gaps`
- 信纸出现的节奏：`Letter.vue` 里的 `animationDelay`

**Q：用户系统开了"减少动态效果"会怎样？**
所有动画会自动变成"直接显示"，内容照样能读完（代码里已经用
`prefers-reduced-motion` 处理过了）。

---

Made with care. 祝你们好。
