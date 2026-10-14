[English](./README.md) | [简体中文](./README.cn.md)

# canvas-color-disc

> 基于 Canvas 的圆形色盘取色组件，支持 PC 与移动端（Pointer Events）；同时提供 Vue 2 / Vue 3 组件与框架无关的 Web Component / 纯 JS 版本

![预览](https://cdn.jsdelivr.net/gh/zancheng/canvas-color-disc@main/preview.png)

## 使用方式速查

| 环境 | 引入 | 用法 | 样式 |
| --- | --- | --- | --- |
| 纯 HTML | `<script src="https://unpkg.com/canvas-color-disc/dist/vanilla/canvas-color-disc.umd.js">` | 写 `<canvas-color-disc>` 标签，监听 `change` 事件 | 自动注入，无需引入 |
| React | `import 'canvas-color-disc/vanilla'` | 同上；React 19 直接写 JSX 属性与 `onchange`，React 18 用 `ref` 桥接 | 自动注入，无需引入 |
| Vue 2（`^2.5.0`） | `import CanvasColorDisc from 'canvas-color-disc/vue2'` | `v-model`：`value` / `input` | `canvas-color-disc/dist/style.css` |
| Vue 3（`^3.0.0`） | `import CanvasColorDisc from 'canvas-color-disc'`（或 `canvas-color-disc/vue3`） | `v-model`：`modelValue` / `update:modelValue` | `canvas-color-disc/vue3/style.css` |

完整示例见下方「框架无关版本」（纯 HTML / React）与「引入」（Vue 2 / Vue 3）章节。
Vue 2 与 Vue 3 产物来自同一份源码（`src/components/CanvasColorDisc.vue`），只是 SFC 编译目标不同；默认入口 `.` 为 Vue 3 构建，Vue 2 请引入 `canvas-color-disc/vue2`，非 Vue 工程请引入 `canvas-color-disc/vanilla`。

## 框架无关版本（Web Component / 纯 JS）

不依赖 Vue 的独立构建：`CanvasColorDiscCore`（纯 JS 核心）+ `<canvas-color-disc>`（Web Component）。
引入即自动注册标签，样式通过 Shadow DOM 注入（无需再引入 CSS），HTML / React / Vue / Angular 等任意环境通用。

| 引入方式 | 路径 | 说明 |
| --- | --- | --- |
| ES 模块 | `canvas-color-disc/vanilla` | 非 Vue 工程（React / Svelte / 原生打包环境）使用 |
| 浏览器直接引入（UMD） | `dist/vanilla/canvas-color-disc.umd.js` | 全局变量 `window.CanvasColorDisc`，自动注册 `<canvas-color-disc>`，零依赖 |

### 纯 HTML

```html
<!-- unpkg；也可换成等价的 jsDelivr 镜像：
     https://cdn.jsdelivr.net/npm/canvas-color-disc/dist/vanilla/canvas-color-disc.umd.js -->
<script src="https://unpkg.com/canvas-color-disc/dist/vanilla/canvas-color-disc.umd.js"></script>

<canvas-color-disc width="300" height="300"></canvas-color-disc>

<script>
    const disc = document.querySelector('canvas-color-disc')
    disc.addEventListener('change', (event) => console.log(event.detail))
</script>
```

### React

React 19 原生支持自定义元素，属性与事件直接写：

```jsx
import 'canvas-color-disc/vanilla' // 引入即注册 <canvas-color-disc>

function ColorPicker() {
    return (
        <canvas-color-disc
            format="hex"
            width="300"
            height="300"
            onchange={(event) => console.log(event.detail)}
        />
    )
}
```

React 18 及以下用 `ref` 桥接属性与事件：

```jsx
import { useEffect, useRef } from 'react'
import 'canvas-color-disc/vanilla'

function ColorPicker({ color, onChange }) {
    const ref = useRef(null)

    useEffect(() => {
        const el = ref.current
        const handleChange = (event) => onChange(event.detail)
        el.addEventListener('change', handleChange)
        return () => el.removeEventListener('change', handleChange)
    }, [onChange])

    // 对象值通过 property 传入（attribute 只支持字符串）
    useEffect(() => {
        ref.current.value = color
    }, [color])

    return <canvas-color-disc ref={ref} format="rgb" width="300" height="300"></canvas-color-disc>
}
```

TSX 项目如需通过类型检查，为该标签补充 `JSX.IntrinsicElements` 声明即可。

完整可运行示例见 [demo/react](demo/react)：`npm run dev:react` 后访问 localhost:5175，左右两个色盘分别演示上述两种写法。

### 命令式（纯 JS）

```js
import { CanvasColorDiscCore } from 'canvas-color-disc/vanilla'

const disc = new CanvasColorDiscCore('#app', { value: { r: 255, g: 0, b: 0 } })

disc.addEventListener('change', (event) => console.log(event.detail))
disc.setColor({ r: 0, g: 0, b: 255 })
```

### 选项、事件与方法

选项与 Vue 版一致：`value` / `width` / `height` / `format` / `alpha` / `disabled` / `keyboardStep`
（attribute 名为 `keyboard-step`；`value` 为对象时只能通过 property 设置）。
事件 `input` / `change` 冒泡且穿透影子树，`event.detail` 为当前颜色；
实例方法：`getColor()` / `setColor(value)` / `reset()` / `setOptions(options)` / `destroy()`。
预设色板等附加内容写在 `<canvas-color-disc>` 内部并加 `slot="palette"`。

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
import CanvasColorDisc from 'canvas-color-disc/vue2'
import 'canvas-color-disc/dist/style.css'

Vue.use(CanvasColorDisc)
```

### Vue 3

```js
import { createApp } from 'vue'
import CanvasColorDisc from 'canvas-color-disc'
import 'canvas-color-disc/vue3/style.css'
import App from './App.vue'

createApp(App).use(CanvasColorDisc).mount('#app')
```

### 局部注册

```js
// Vue 2
import CanvasColorDisc from 'canvas-color-disc/vue2'
import 'canvas-color-disc/dist/style.css'

// Vue 3
import CanvasColorDisc from 'canvas-color-disc'
import 'canvas-color-disc/vue3/style.css'

export default {
    components: { CanvasColorDisc }
}
```

注册后组件名为 `CanvasColorDisc`，模板中可使用 `<canvas-color-disc />`。

### 浏览器直接引入（Vue 版 UMD）

```html
<!-- unpkg；也可换成等价的 jsDelivr 镜像（样式与脚本两处都换）：
     https://cdn.jsdelivr.net/npm/canvas-color-disc/dist/style.css
     https://cdn.jsdelivr.net/npm/canvas-color-disc/dist/canvas-color-disc.umd.js -->
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

`v-model` 绑定的形状由 `format` 决定，父组件修改绑定值时色盘选择器会同步移动。

### 颜色格式

`format` 决定绑定值的形状（默认 `rgb`）：

| format | 绑定值 | 示例 |
| --- | --- | --- |
| `rgb` | `{ r, g, b }`，通道 0~255 | `{ r: 255, g: 0, b: 0 }` |
| `hex` | 字符串，支持 3/4/6/8 位 | `'#ff0000'` |
| `hsv` | `{ h, s, v }`，h 0~360、s/v 0~100 | `{ h: 0, s: 100, v: 100 }` |
| `hsl` | `{ h, s, l }`，h 0~360、s/l 0~100 | `{ h: 0, s: 100, l: 50 }` |

字符串一律按 hex 解析；对象会先按 `format` 解析，未指定 `format` 时按字段推断。

`alpha` 为 `true` 时额外读写 `a` 分量（0~1），hex 格式下输出 8 位（如 `#ff000080`）。色盘是二维的，本身不调节透明度与明度，这两项需要由外部控件或绑定值给出。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 | 适用版本 |
| --- | --- | --- | --- | --- |
| value | 当前颜色，配合 `v-model` 使用 | Object / String | `{ r: 255, g: 255, b: 255 }` | Vue 2 |
| modelValue | 当前颜色，配合 `v-model` 使用 | Object / String | `undefined`（回退到 `value`） | Vue 3 |
| width | 画布宽度（CSS 像素），`'auto'` 表示跟随容器 | Number / String | 300 | 通用 |
| height | 画布高度（CSS 像素），`'auto'` 表示跟随容器 | Number / String | 300 | 通用 |
| format | 绑定值格式：`rgb` / `hex` / `hsv` / `hsl` | String | `rgb` | 通用 |
| alpha | 是否保留并输出 alpha 分量 | Boolean | `false` | 通用 |
| disabled | 禁用指针与键盘交互 | Boolean | `false` | 通用 |
| keyboardStep | 方向键步进（饱和度百分点 / 色相度数），按住 Shift 时 ×10 | Number | 1 | 通用 |

### Events

| 事件名 | 说明 | 回调参数 | 适用版本 |
| --- | --- | --- | --- |
| input | 颜色变化时实时触发（按帧节流，配合 `v-model`） | 与 `format` 一致 | Vue 2 |
| update:modelValue | 同 `input`，配合 `v-model` 使用 | 与 `format` 一致 | Vue 3 |
| change | 一次选择（按下后抬起，或一次键盘调整）结束时触发 | 与 `format` 一致 | 通用 |

`input` 与 `update:modelValue` 会同时派发，未被监听的一方会被忽略。

### 插槽

| 名称 | 作用域参数 | 说明 |
| --- | --- | --- |
| palette | `color`（当前颜色）、`setColor(value)` | 渲染在色盘下方的附加区域，常用于预设色板 |

```vue
<canvas-color-disc v-model="rgb">
    <template #palette="{ setColor }">
        <button @click="setColor({ r: 255, g: 0, b: 0 })">红</button>
    </template>
</canvas-color-disc>
```

### 实例方法

通过 `ref` 调用（Vue 3 下经由 `expose` 暴露，Vue 2 下直接从 `$refs` 取到）：

| 方法 | 说明 |
| --- | --- |
| `getColor()` | 取当前颜色，对象格式为副本 |
| `setColor(value)` | 设置颜色，值需符合当前 `format`，非法值被忽略；会同时派发 `change` |
| `reset()` | 重置为白色 |

### 键盘操作

色盘的交互元素可被聚焦（`tabindex="0"`，带 `role="slider"` 与 `aria-valuetext`），聚焦后：

| 按键 | 行为 |
| --- | --- |
| ← / → | 色相 ∓/± `keyboardStep` 度 |
| ↑ / ↓ | 饱和度 ±/∓ `keyboardStep` |
| Home / End | 饱和度归零 / 拉满 |
| Shift + 方向键 | 步进 ×10 |

### 说明

- 色盘为 HSV 模型：色相取角度、饱和度取离圆心的半径比例；明度（V）取自绑定值并原样保留，因此传入灰色不会被拉成纯色
- `width`/`height` 为画布逻辑尺寸（CSS 像素），色盘半径自动按「短边半径减去比例留白（收敛在 8~18px）」适配，圆心居中；两者可以不相等。选择器圆环与圆心白色死区同样随半径缩放，因此极小与极大的色盘都能保持一致的观感
- 画布按 `devicePixelRatio` 放大绘制，高清屏下不会模糊
- 取色坐标会自动换算回画布逻辑坐标：即使画布被外部 CSS 缩放（如全局 `canvas { max-width: 100% }`、父容器压缩、transform 缩放），取色位置仍与视觉位置一致
- 点击或拖动超出色盘范围时，选择器会钉在圆周上（取圆周对应位置的颜色）
- 基于 Pointer Events，鼠标与触摸的操作方式一致；拖动通过 `setPointerCapture` 捕获，指针移出画布也不中断；若捕获失败（部分浏览器/合成事件），window 上的兜底监听仍会正常结束一次选择
- 只响应主键与主指针：右键/中键不会取色，多指触摸时后续手指不会打断正在进行的拖动
- 拖动过程中页面滚动会立即使缓存的画布位置失效，避免出现取色偏移
- `width`/`height` 传 `'auto'` 时画布尺寸跟随容器，容器尺寸变化会自动重绘；该方向需要父容器有确定尺寸
- `devicePixelRatio` 变化（跨屏拖动窗口、修改系统缩放）时会自动按新比例重建画布
- 色盘像素按几何参数缓存，尺寸与 dpr 未变时不会重算；圆周做 1 物理像素的透明度渐变，避免锯齿
- Vue 版的样式为普通 CSS，通过 `.canvas-color-disc` 后代选择器限定作用域，每个应用引入一次对应版本的 `style.css` 即可；框架无关版本的样式随 JS 自动注入，无需引入
- 包内附带 `src/index.d.ts`，TS 项目可直接获得 props 与实例方法的类型

## 本地开发

```bash
# 安装依赖
npm install

# 启动 Vue 2 demo（localhost:5173）
npm run dev

# 启动 Vue 3 demo（localhost:5174）
npm run dev:vue3

# 启动 React demo（localhost:5175）
npm run dev:react

# 同时构建 Vue 2（dist/）、Vue 3（dist/vue3/）与框架无关（dist/vanilla/）产物
npm run build

# 单独构建某一版本
npm run build:vue2
npm run build:vue3
npm run build:vanilla

# 运行单元测试
npm test
```

## 许可证

[MIT](./LICENSE)
