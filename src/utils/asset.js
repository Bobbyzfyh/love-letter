/**
 * 把 public/ 目录里的相对路径变成可以真正访问的 URL。
 *
 * 为什么要这么做？
 * 因为项目打包后可能部署在 https://xxx.github.io/my-letter/ 这样的子目录里，
 * 直接写 "/images/1.jpg" 会指向根域名而 404。
 * 这个函数会自动加上 Vite 的 base 前缀。
 *
 * 用法：assetUrl('images/1.jpg') 或 assetUrl('/images/1.jpg') 都可以。
 * 完整的网址（http://...）会原样返回。
 */
export function assetUrl(path) {
  if (!path) return ''
  const value = String(path).trim()
  if (!value) return ''
  // 完整网址、data URL、以 . 或 ~ 开头的特殊写法都原样返回
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : base + '/'
  return normalizedBase + value.replace(/^[./]+/, '').replace(/^\//, '')
}

/**
 * 根据屏幕宽度和缩放比生成更清晰的 srcset，手机加载小图更省流量。
 * 之所以做成函数，是为了以后想加多尺寸图片时不用改组件。
 */
export function imageAttrs(src, alt) {
  return {
    src: assetUrl(src),
    alt: alt || '',
    loading: 'lazy',
    decoding: 'async',
  }
}
