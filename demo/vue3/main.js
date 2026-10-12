// Vue 3 本地 demo 入口（不随 npm 包发布，发布内容见 package.json files 字段）
// vue 已在 vite.config.demo3.js 中别名到 vue3
import { createApp } from 'vue';
import CanvasColorDisc from '../../src/index';
import App from './App.vue';

createApp(App).use(CanvasColorDisc).mount('#app');
