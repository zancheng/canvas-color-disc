import { defineConfig } from 'vite'
import vue3Sfc from './config/vue3-sfc'

/**
 * Vue 3 本地 demo：与库构建共用同一份 src 源码
 *
 * 根目录的 vue 是 2.7（供 Vue 2 demo 与 Vue 2 构建使用），
 * 这里把 vue 别名指向 npm alias 安装的 vue3，避免版本冲突。
 */
export default defineConfig({
    root: 'demo/vue3',
    plugins: [vue3Sfc()],
    resolve: {
        alias: {
            vue: 'vue3'
        }
    },
    server: {
        port: 5174
    }
})
