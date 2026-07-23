import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path for GitHub Pages: /<repo-name>/
// Change 'work-tracker' if you rename the repo.
export default defineConfig({
  plugins: [react()],
  base: '/work-tracker/',
})
