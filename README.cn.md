[English](./README.md) | [简体中文](./README.cn.md)

# canvas-color-disc

> 基于 Vue + Canvas 的圆形色盘取色组件，支持 PC 与移动端（Pointer Events），同时支持 Vue 2 与 Vue 3

![avatar](https://udfs.unisiot.com/group1/M00/03/85/rBEBA2FqlXOAfw1hAAECEWBl9Kc837.png)

## Vue 版本支持

| Vue 版本 | 引入路径 | v-model 的 prop / 事件 | 样式 |
| --- | --- | --- | --- |
| Vue 2（`^2.5.0`） | `canvas-color-disc`（或 `canvas-color-disc/vue2`） | `value` / `input` | `canvas-color-disc/dist/style.css` |
| Vue 3（`^3.0.0`） | `canvas-color-disc/vue3` | `modelValue` / `update:modelValue` | `canvas-color-disc/vue3/style.css` |

两份产物来自同一份源码（`src/components/CanvasColorDisc.vue`），只是 SFC 编译目标不同；默认入口 `.` 保持为 Vue 2 构建以兼容旧版本。

## 安装

```bash
npm install canvas-color-disc
```

```bash
yarn add canvas-color-disc
```

> Vue 为 peer 依赖（`^2.5.0 || ^3.0.0`），需自行安装；不依赖任何第三方运行时库。

## 引入

包内导出的是组件本身，同时挂载了 `install` 方法，因此全局注册与局部注册都支持。

### Vue 2

```js
import Vue from 'vue'
import CanvasColorDisc from 'canvas-color-disc'
import 'canvas-color-disc/dist/style.css'

Vue.use(CanvasColorDisc)
```

### Vue 3

```js
import { createApp } from 'vue'
import CanvasColorDisc from 'canvas-color-disc/vue3'
import 'canvas-color-disc/vue3/style.css'
import App from './App.vue'

createApp(App).use(CanvasColorDisc).mount('#app')
```

### 局部注册

```js
// Vue 2
import CanvasColorDisc from 'canvas-color-disc'
import 'canvas-color-disc/dist/style.css'

// Vue 3
import CanvasColorDisc from 'canvas-color-disc/vue3'
import 'canvas-color-disc/vue3/style.css'

export default {
    components: { CanvasColorDisc }
}
```

注册后组件名为 `CanvasColorDisc`，模板中可使用 `<canvas-color-disc />`。

### 浏览器直接引入（UMD）

```html
<link rel="stylesheet" href="https://unpkg.com/canvas-color-disc/dist/style.css">
<script src="https://unpkg.com/vue@2.7.16/dist/vue.js"></script>
<script src="https://unpkg.com/canvas-color-disc"></script>

<script>
    // 未调用 Vue.use 时，也可直接作为组件选项使用
    new Vue({
        el: '#app',
        components: { CanvasColorDisc: window.CanvasColorDisc }
    })
</script>
```

Vue 3 请使用 `dist/vue3/canvas-color-disc.umd.js` 搭配 `dist/vue3/style.css`，全局变量同样是 `window.CanvasColorDisc`，且支持 `app.use(...)`。

## 使用

Vue 2 与 Vue 3 的模板写法完全一致：

```vue
<template>
    <div id="app">
        <p>RGB: {{ rgb }}</p>
        <canvas-color-disc
            v-model="rgb"
            :width="300"
            :height="300"
            @change="onChange"
        />
    </div>
</template>

<script>
export default {
    data () {
        return {
            rgb: { r: 255, g: 255, b: 255 }
        }
    },
    methods: {
        onChange (rgb) {
            console.log('change:', rgb)
        }
    }
}
</script>
```

`v-model` 绑定的是 RGB 对象，父组件修改该对象时色盘选择器会同步移动。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 | 适用版本 |
| --- | --- | --- | --- | --- |
| value | 当前颜色，配合 `v-model` 使用 | Object `{ r, g, b }` | `{ r: 255, g: 255, b: 255 }` | Vue 2 |
| modelValue | 当前颜色，配合 `v-model` 使用 | Object `{ r, g, b }` | `undefined`（回退到 `value`） | Vue 3 |
| width | 画布宽度（CSS 像素） | Number | 300 | 通用 |
| height | 画布高度（CSS 像素） | Number | 300 | 通用 |

### Events

| 事件名 | 说明 | 回调参数 | 适用版本 |
| --- | --- | --- | --- |
| input | 颜色变化时实时触发（按帧节流，配合 `v-model`） | `{ r, g, b }` | Vue 2 |
| update:modelValue | 同 `input`，配合 `v-model` 使用 | `{ r, g, b }` | Vue 3 |
| change | 一次选择（按下后抬起）结束时触发 | `{ r, g, b }` | 通用 |

`input` 与 `update:modelValue` 会同时派发，未被监听的一方会被忽略。

### 说明

- 色盘为 HSV 模型：色相取角度、饱和度取离圆心的半径比例，明度固定为最高，圆心为白色
- `width`/`height` 为画布逻辑尺寸（CSS 像素），色盘半径自动按 `min(width, height) / 2 - 18` 适配，圆心居中；两者可以不相等
- 画布按 `devicePixelRatio` 放大绘制，高清屏下不会模糊
- 取色坐标会自动换算回画布逻辑坐标：即使画布被外部 CSS 缩放（如全局 `canvas { max-width: 100% }`、父容器压缩、transform 缩放），取色位置仍与视觉位置一致
- 点击或拖动超出色盘范围时，选择器会钉在圆周上（取圆周对应位置的颜色）
- 基于 Pointer Events，鼠标与触摸的操作方式一致；拖动通过 `setPointerCapture` 捕获，指针移出画布也不中断
- 样式为普通 CSS，通过 `.canvas-color-disc` 后代选择器限定作用域，每个应用引入一次对应版本的 `style.css` 即可

## 本地开发

```bash
# 安装依赖
npm install

# 启动 Vue 2 demo（localhost:5173）
npm run dev

# 同时构建 Vue 2（dist/）与 Vue 3（dist/vue3/）产物
npm run build

# 单独构建某一版本
npm run build:vue2
npm run build:vue3
```

## 许可证

[MIT](./LICENSE)
