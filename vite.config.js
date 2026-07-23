import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { resolve, join } from 'path'

// Post-build plugin: reads the CSS and JS from dist/assets/, injects them as
// inline <style> and <script> tags into index.html by replacing the </head>
// marker — avoiding any regex against the minified JS body (which contains
// embedded HTML strings from the xlsx library that confuse naive regex).
function inlineAssetsPlugin() {
  return {
    name: 'inline-assets',
    enforce: 'post',
    apply: 'build',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      const assetsDir = join(distDir, 'assets')
      const htmlPath = join(distDir, 'index.html')

      const files = readdirSync(assetsDir)
      const cssFile = files.find(f => f.endsWith('.css'))
      const jsFile  = files.find(f => f.endsWith('.js'))

      if (!cssFile || !jsFile) {
        console.warn('[inline-assets] Could not find CSS or JS in dist/assets/')
        return
      }

      const css = readFileSync(join(assetsDir, cssFile), 'utf8')
      const js  = readFileSync(join(assetsDir, jsFile),  'utf8')

      // Read the original index.html and split on </head>
      const html = readFileSync(htmlPath, 'utf8')
      const headEnd = html.indexOf('</head>')
      if (headEnd === -1) {
        console.warn('[inline-assets] </head> not found in index.html')
        return
      }

      // Build new HTML: everything before </head>, then inline style+script, then the rest
      const before = html.slice(0, headEnd)
      const after  = html.slice(headEnd)    // includes </head><body>...</body></html>

      // Strip the now-redundant <link> and <script src> tags from the head section
      const cleanBefore = before
        .replace(/<link rel="stylesheet"[^>]+>/g, '')
        .replace(/<script [^>]*src="[^"]*"[^>]*><\/script>/g, '')
        .replace(/<link rel="modulepreload"[^>]+>/g, '')

      const inlined = `${cleanBefore}<style>${css}</style>\n<script type="module">${js}</script>\n</head>${after.slice('</head>'.length)}`

      writeFileSync(htmlPath, inlined)
      console.log(`[inline-assets] ✔ Inlined ${cssFile} + ${jsFile} into index.html`)
    },
  }
}

export default defineConfig({
  plugins: [react(), inlineAssetsPlugin()],
  base: '/Abhishek-Kumar141/work-tracker/',
  build: {
    cssCodeSplit: false,
  },
})
