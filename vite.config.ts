import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置：构建产物输出到 dist/，CI 会同步到 S3 并刷新 CloudFront 缓存
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // 把 React 相关依赖拆成独立 chunk，便于浏览器长期缓存
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
