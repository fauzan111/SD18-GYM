import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` must match the GitHub repo name so asset URLs resolve at
// https://<user>.github.io/sd18-gym/
export default defineConfig({
  base: '/sd18-gym/',
  plugins: [react()],
})
