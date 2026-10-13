import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

// 测试单独配置：与库构建（vite.config.js）互不影响
// 组件测试跑在 jsdom 下，且用 Vue 2 插件编译同一份 SFC
export default defineConfig({
    plugins: [vue()],
    test: {
        environment: 'jsdom',
        include: ['test/**/*.test.js']
    }
})
