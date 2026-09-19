import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Config dedicada do Vitest (separada do vite.config.ts) pra não misturar o proxy de
// dev/API com a config de teste, e pra ficar clara qual das duas o `vitest` está lendo.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
