import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * React 本地 demo：直接引入 src/vanilla 源码
 * （import 即注册 <canvas-color-disc>，样式随 JS 内联注入）
 */
export default defineConfig({
    root: 'demo/react',
    plugins: [react()],
    server: {
        port: 5175
    }
})
