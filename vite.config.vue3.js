import { defineConfig } from 'vite'
import { compileTemplate, parse } from '@vue/compiler-sfc'

const LIB_NAME = 'canvas-color-disc'

/**
 * 极简 SFC 编译插件（仅处理 <script> + <template>）
 *
 * 仓库根目录的 vue 是 2.7（供 demo 与 Vue 2 构建使用），
 * 为避免再装一套 vue3 + @vitejs/plugin-vue 造成版本冲突，
 * 这里直接用 Vue 3 的 @vue/compiler-sfc 编译同一份 .vue 源码。
 * 组件样式已抽到 src/style.css，因此无需处理 <style> 块。
 */
function vue3Sfc() {
    return {
        name: 'vue3-sfc-lite',
        enforce: 'pre',
        transform(code, id) {
            if (!id.endsWith('.vue')) {
                return null
            }
            const { descriptor, errors } = parse(code, { filename: id })
            if (errors.length) {
                throw new Error(errors.map(e => e.message).join('\n'))
            }
            const script = descriptor.script || descriptor.scriptSetup
            if (!script) {
                throw new Error(`${id} 缺少 <script> 块`)
            }
            const scriptCode = script.content.replace(/export\s+default/, 'const __sfc__ =')
            const { code: templateCode, errors: templateErrors } = compileTemplate({
                id,
                filename: id,
                source: descriptor.template.content,
                compilerOptions: {
                    whitespace: 'condense'
                }
            })
            if (templateErrors.length) {
                throw new Error(templateErrors.map(e => e.message || String(e)).join('\n'))
            }
            return {
                code: [
                    scriptCode,
                    templateCode.replace(/export\s+function\s+render/, 'function __render__'),
                    '__sfc__.render = __render__',
                    `__sfc__.__file = ${JSON.stringify(id)}`,
                    'export default __sfc__'
                ].join('\n'),
                map: null
            }
        }
    }
}

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
