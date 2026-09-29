// 本地开发 demo 入口（不随 npm 包发布，发布内容见 package.json files 字段）
// Vite 下 `import Vue from 'vue'` 解析到 runtime-only 构建（无模板编译器），
// 挂载根组件需使用 render 函数
import Vue from 'vue'
import CanvasColorDisc from '../src/index'
import App from './App.vue'

Vue.config.productionTip = false

Vue.use(CanvasColorDisc)
/* eslint-disable no-new */
new Vue({
    el: '#app',
    render: h => h(App)
})
