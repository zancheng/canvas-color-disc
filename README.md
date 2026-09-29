# canvas-color-disc

> 一个基于 Vue + Canvas 的圆形色盘选择组件，支持移动端和 PC 端


![avatar](https://udfs.unisiot.com/group1/M00/03/85/rBEBA2FqlXOAfw1hAAECEWBl9Kc837.png)

<img src="https://udfs.unisiot.com/group1/M00/03/85/rBEBA2FqlXOAfw1hAAECEWBl9Kc837.png" width="50%">

## Build Setup

``` bash
# install dependencies
npm install
```

``` bash
# serve examples at localhost:5173
npm run dev
```

``` bash
# library build (ES + UMD) to dist/
npm run build
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
| input | 颜色变化时实时触发（配合 `v-model` 使用） | `{ r, g, b }` |
| change | 一次选择（拖动/点击）结束时触发 | `{ r, g, b }` |

### 说明

- 色盘为 HSV 模型：色相取角度、饱和度取离圆心的半径比例，明度固定为最高，圆心为白色
- `width`/`height` 为画布逻辑尺寸（CSS 像素），色盘半径自动按 `min(width, height) / 2 - 18` 适配，圆心居中
- 取色坐标会自动换算回画布逻辑坐标：即使画布被外部 CSS 缩放（如全局 `canvas { max-width: 100% }`、父容器压缩、transform 缩放），取色位置仍与视觉位置一致
- 点击或拖动超出色盘范围时，选择器会钉在圆周上（取圆周对应位置的颜色）
- 基于 Pointer Events，鼠标与触摸的操作方式一致
