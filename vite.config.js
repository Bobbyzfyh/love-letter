import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Vite 配置：故意保持极简，方便以后自己改。
// base: './' 让打包后的资源使用相对路径，
// 这样无论是 Vercel、Netlify 还是 GitHub Pages 的子目录都能直接跑。
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true, // 允许用手机连同一个 Wi-Fi 直接访问电脑上的开发服务器
    port: 5173,
    watch: {
      // 1) 忽略"保存文件"时产生的临时目录：
      //    有些工具会把文件先写到临时目录再改名，监听器可能正好锁住那个临时文件，
      //    导致开发服务器直接崩掉（EBUSY）。
      ignored: ['**/.*.tmpdir/**', '**/*.tmpdir/**', '**/*.tmp'],
      // 2) 用轮询代替事件监听：
      //    某些文件系统（虚拟磁盘 / 网络盘）对"改名式保存"的事件通知不可靠，
      //    会出现"改了文件网页却不刷新"的情况。轮询更稳，代价可以忽略。
      usePolling: true,
      interval: 300,
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
})
