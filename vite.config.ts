import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    root: 'src',
    publicDir: '../public',
    plugins: [tsconfigPaths()],
    server: {
        port: 8000
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        chunkSizeWarningLimit: 4096
    }
})
