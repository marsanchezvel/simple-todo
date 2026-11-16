/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Client-only static SPA (AD-5): one bundle, one route, no server runtime.
// Production base is `/simple-todo/` (AD-6). Dev stays `/` so localhost:5173 works.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/simple-todo/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
}))
