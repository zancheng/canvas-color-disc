[English](./README.md) | [简体中文](./README.cn.md)

# canvas-color-disc

> A circular color picker built with Vue 2 + Canvas, works on both desktop and mobile (Pointer Events).

![avatar](https://udfs.unisiot.com/group1/M00/03/85/rBEBA2FqlXOAfw1hAAECEWBl9Kc837.png)

## Install

```bash
npm install canvas-color-disc
```

```bash
yarn add canvas-color-disc
```

> Vue 2 is a peer dependency (`^2.5.0`) and must be installed by yourself. There is no other runtime dependency.

## Import

The package exports the component itself with an `install` method attached, so both global and local registration work.

### Global registration

```js
import Vue from 'vue'
import CanvasColorDisc from 'canvas-color-disc'
import 'canvas-color-disc/dist/style.css'

Vue.use(CanvasColorDisc)
```

The component is registered as `CanvasColorDisc`, use it as `<canvas-color-disc />` in templates.

### Local registration

```js
import CanvasColorDisc from 'canvas-color-disc'
import 'canvas-color-disc/dist/style.css'

export default {
    components: { CanvasColorDisc }
}
```

### Use via CDN (UMD)

```html
<link rel="stylesheet" href="https://unpkg.com/canvas-color-disc/dist/style.css">
<script src="https://unpkg.com/vue@2.7.16/dist/vue.js"></script>
<script src="https://unpkg.com/canvas-color-disc/dist/canvas-color-disc.umd.js"></script>

<script>
    // Without Vue.use, it can also be used directly as a component option
    new Vue({
        el: '#app',
        components: { CanvasColorDisc: window.CanvasColorDisc }
    })
</script>
```

## Usage

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

`v-model` binds an RGB object. Updating that object from the parent moves the selector accordingly.

## API

### Props

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| value | Current color, supports `v-model` | Object `{ r, g, b }` | `{ r: 255, g: 255, b: 255 }` |
| width | Canvas width (CSS pixels) | Number | 300 |
| height | Canvas height (CSS pixels) | Number | 300 |

### Events

| Event | Description | Payload |
| --- | --- | --- |
| input | Fired in real time while the color changes (throttled per frame, used by `v-model`) | `{ r, g, b }` |
| change | Fired when a pick gesture (press then release) ends | `{ r, g, b }` |

### Notes

- The disc uses the HSV model: hue comes from the angle, saturation from the distance to the center ratio, value is fixed to maximum, and the center is white
- `width` / `height` are logical canvas sizes in CSS pixels. The disc radius is `min(width, height) / 2 - 18` and the origin is centered; they do not have to be equal
- The canvas is rendered with `devicePixelRatio` scaling, so it stays sharp on high-DPI screens
- Pointer coordinates are converted back to logical canvas coordinates: even if the canvas is scaled by external CSS (e.g. a global `canvas { max-width: 100% }`, a squeezed parent, or a `transform` scale), the picked position still matches the visual position
- Clicking or dragging outside the disc pins the selector to the circumference and takes the color at that point
- Built on Pointer Events, so mouse and touch behave the same; dragging uses `setPointerCapture`, so it continues even when the pointer leaves the canvas

## Local development

```bash
# install dependencies
npm install

# serve the demo at localhost:5173
npm run dev

# build the library (ES + UMD) to dist/
npm run build
```

## License

[MIT](./LICENSE)
