import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Serve artifacts and baseline directories in dev mode
    {
      name: 'serve-artifacts',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Serve artifacts directory
          if (req.url?.startsWith('/artifacts/')) {
            const filePath = path.resolve(__dirname, '..', req.url)
            if (fs.existsSync(filePath)) {
              return fs.createReadStream(filePath).pipe(res)
            }
          }
          // Serve baseline directory
          if (req.url?.startsWith('/baseline/')) {
            const filePath = path.resolve(__dirname, '..', req.url)
            if (fs.existsSync(filePath)) {
              return fs.createReadStream(filePath).pipe(res)
            }
          }
          // Serve root-level image files (e.g., GameEngine.jpg) in dev mode
          // These are image files in the project root directory
          if (req.url && req.url.startsWith('/') && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules')) {
            const fileName = req.url.slice(1).split('?')[0]
            // Only serve common image file extensions
            if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName)) {
              const filePath = path.resolve(__dirname, '..', fileName)
              if (fs.existsSync(filePath)) {
                return fs.createReadStream(filePath).pipe(res)
              }
            }
          }
          // Serve artifacts/graph.json directly (avoid need to copy to public/)
          if (req.url === '/graph.json') {
            const filePath = path.resolve(__dirname, '..', 'artifacts', 'graph.json')
            if (fs.existsSync(filePath)) {
              return fs.createReadStream(filePath).pipe(res)
            }
          }
          next()
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
