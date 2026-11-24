import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // /api requests are forwarded to the Laravel backend (php artisan serve)
    proxy: { '/api': 'http://localhost:8000' },
  },
})
