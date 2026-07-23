import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IBM GHE Pages serves at: /Abhishek-Kumar141/work-tracker/
export default defineConfig({
  plugins: [react()],
  base: '/Abhishek-Kumar141/work-tracker/',
  build: {
    rollupOptions: {
      output: {
        // Fixed filenames — no content hash — so the same URL is reused on every deploy.
        // IBM GHE Pages SSO session caches the old hashed filename; fixed names avoid that.
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/index.js',
        assetFileNames: 'assets/index[extname]',
      },
    },
  },
})
