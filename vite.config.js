import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

const LIB_NAME = 'canvas-color-disc'

// 开发模式直接运行 src/main.js 的 demo；
// 构建走库模式：vue 作为外部依赖不打进产物，输出 ES 与 UMD 双格式
export default defineConfig({
    plugins: [vue()],
    build: {
        target: 'es2015',
        lib: {
            entry: 'src/index.js',
            name: 'CanvasColorDisc',
            formats: ['es', 'umd'],
            fileName: (format) => `${LIB_NAME}.${format}.js`
            // 样式产物固定为 dist/style.css（Vite 5 lib 模式默认名）
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
