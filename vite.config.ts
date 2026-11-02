import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/flowkit/',
  
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true // Чтобы Docker видел изменения файлов из-под Windows
    },
    proxy: {
      '/v1/chat/completions': {
        target: 'https://neurly.ru',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})