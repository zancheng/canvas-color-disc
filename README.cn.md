English | [简体中文](./README.cn.md)

# canvas-color-disc

> 基于 Vue 2 + Canvas 的圆形色盘取色组件，支持 PC 与移动端（Pointer Events）

![avatar](https://udfs.unisiot.com/group1/M00/03/85/rBEBA2FqlXOAfw1hAAECEWBl9Kc837.png)

## 安装

```bash
npm install canvas-color-disc
```

```bash
yarn add canvas-color-disc
```

> Vue 2 为 peer 依赖（^2.5.0），需自行安装；不依赖任何第三方运行时库。

## 引入

包内导出的是组件本身，同时挂载了 `install` 方法，因此全局注册与局部注册都支持。

### 全局注册

```js
import Vue from 'vue'
import CanvasColorDisc from 'canvas-color-disc'
import 'canvas-color-disc/dist/style.css'

Vue.use(CanvasColorDisc)
```

注册后组件名为 `CanvasColorDisc`，模板中可使用 `<canvas-color-disc />`。

### 局部注册

```js
import CanvasColorDisc from 'canvas-color-disc'
import 'canvas-color-disc/dist/style.css'

export default {
    components: { CanvasColorDisc }
}
```

### 浏览器直接引入（UMD）

```html
<link rel="stylesheet" href="https://unpkg.com/canvas-color-disc/dist/style.css">
<script src="https://unpkg.com/vue@2.7.16/dist/vue.js"></script>
<script src="https://unpkg.com/canvas-color-disc/dist/canvas-color-disc.umd.js"></script>

<script>
    // 未调用 Vue.use 时，也可直接作为组件选项使用
    new Vue({
        el: '#app',
        components: { CanvasColorDisc: window.CanvasColorDisc }
    })
</script>
```

## 使用

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

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 当前颜色，支持 `v-model` | Object `{ r, g, b }` | `{ r: 255, g: 255, b: 255 }` |
| width | 画布宽度（CSS 像素） | Number | 300 |
| height | 画布高度（CSS 像素） | Number | 300 |

### Events

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| input | 颜色变化时实时触发（配合 `v-model` 使用，已按帧节流） | `{ r, g, b }` |
| change | 一次选择（按下后抬起）结束时触发 | `{ r, g, b }` |

### 说明

- 色盘为 HSV 模型：色相取角度、饱和度取离圆心的半径比例，明度固定为最高，圆心为白色
- `width`/`height` 为画布逻辑尺寸（CSS 像素），色盘半径自动按 `min(width, height) / 2 - 18` 适配，圆心居中；两者可以不相等
- 画布按 `devicePixelRatio` 放大绘制，高清屏下不会模糊
- 取色坐标会自动换算回画布逻辑坐标：即使画布被外部 CSS 缩放（如全局 `canvas { max-width: 100% }`、父容器压缩、transform 缩放），取色位置仍与视觉位置一致
- 点击或拖动超出色盘范围时，选择器会钉在圆周上（取圆周对应位置的颜色）
- 基于 Pointer Events，鼠标与触摸的操作方式一致；拖动通过 `setPointerCapture` 捕获，指针移出画布也不中断

## 本地开发

```bash
# 安装依赖
npm install

# 启动 demo（localhost:5173）
npm run dev

# 构建库产物（ES + UMD）到 dist/
npm run build
```

## 许可证

[MIT](./LICENSE)
