import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IBM GHE Pages serves at: /Abhishek-Kumar141/work-tracker/
export default defineConfig({
  plugins: [react()],
  base: '/Abhishek-Kumar141/work-tracker/',
})
