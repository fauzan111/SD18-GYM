import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` must match the GitHub repo name (case-sensitive) so asset URLs resolve at
// https://fauzan111.github.io/SD18-GYM/
export default defineConfig({
  base: '/SD18-GYM/',
  plugins: [react()],
})
