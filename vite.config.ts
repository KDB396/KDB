import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vercel sert à la racine. (Pour GitHub Pages il faudrait repasser à '/KDB/'.)
  base: '/',
})