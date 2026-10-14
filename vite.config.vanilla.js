import { defineConfig } from 'vite'

const LIB_NAME = 'canvas-color-disc'

// 框架无关构建：纯 JS 核心 + Web Component，无 vue 依赖；
// 样式以 ?inline 内联进产物，运行时按需注入（ShadowRoot 或文档）
export default defineConfig({
    build: {
        target: 'es2015',
        outDir: 'dist/vanilla',
        emptyOutDir: true,
        lib: {
            entry: 'src/vanilla.js',
            name: 'CanvasColorDisc',
            formats: ['es', 'umd'],
            fileName: (format) => `${LIB_NAME}.${format}.js`
        }
    }
})
