import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// IBM GHE Pages SSO intercepts every sub-resource request (JS/CSS/images).
// viteSingleFile inlines ALL assets into index.html so there is only one request.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: '/Abhishek-Kumar141/work-tracker/',
  build: {
    // Needed by viteSingleFile — disables separate chunk files
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
  },
})
