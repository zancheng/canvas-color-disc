import { defineConfig } from 'vite'
import vue3Sfc from './config/vue3-sfc'

const LIB_NAME = 'canvas-color-disc'

// Vue 3 构建：与 vite.config.js 共用 src/ 源码，产物输出到 dist/vue3
export default defineConfig({
    plugins: [vue3Sfc()],
    build: {
        target: 'es2015',
        outDir: 'dist/vue3',
        emptyOutDir: true,
        lib: {
            entry: 'src/index.js',
            name: 'CanvasColorDisc',
            formats: ['es', 'umd'],
            fileName: (format) => `${LIB_NAME}.${format}.js`
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue'
                }
            }
        }
    }
})
