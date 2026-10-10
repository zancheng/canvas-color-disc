[English](./README.md) | [简体中文](./README.cn.md)

# canvas-color-disc

> A circular color picker built with Vue + Canvas, works on both desktop and mobile (Pointer Events). Supports Vue 2 and Vue 3.

![avatar](https://udfs.unisiot.com/group1/M00/03/85/rBEBA2FqlXOAfw1hAAECEWBl9Kc837.png)

## Vue version support

| Vue version | Import path | v-model prop / event | Style |
| --- | --- | --- | --- |
| Vue 2 (`^2.5.0`) | `canvas-color-disc` (or `canvas-color-disc/vue2`) | `value` / `input` | `canvas-color-disc/dist/style.css` |
| Vue 3 (`^3.0.0`) | `canvas-color-disc/vue3` | `modelValue` / `update:modelValue` | `canvas-color-disc/vue3/style.css` |

Both builds come from the same source (`src/components/CanvasColorDisc.vue`); only the SFC compile target differs. The default entry `.` stays on the Vue 2 build for backward compatibility.

## Install

```bash
npm install canvas-color-disc
```

```bash
yarn add canvas-color-disc
```

> Vue is a peer dependency (`^2.5.0 || ^3.0.0`) and must be installed by yourself. There is no other runtime dependency.

## Import

The package exports the component itself with an `install` method attached, so both global and local registration work.

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

### Local registration

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

The component is registered as `CanvasColorDisc`, use it as `<canvas-color-disc />` in templates.

### Use via CDN (UMD)

```html
<link rel="stylesheet" href="https://unpkg.com/canvas-color-disc/dist/style.css">
<script src="https://unpkg.com/vue@2.7.16/dist/vue.js"></script>
<script src="https://unpkg.com/canvas-color-disc"></script>

<script>
    // Without Vue.use, it can also be used directly as a component option
    new Vue({
        el: '#app',
        components: { CanvasColorDisc: window.CanvasColorDisc }
    })
</script>
```

For Vue 3 use `dist/vue3/canvas-color-disc.umd.js` together with `dist/vue3/style.css`; the global is still `window.CanvasColorDisc` and it accepts an app instance via `app.use(...)`.

## Usage

The same template works for Vue 2 and Vue 3:

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

| Prop | Description | Type | Default | Vue version |
| --- | --- | --- | --- | --- |
| value | Current color, used by `v-model` | Object `{ r, g, b }` | `{ r: 255, g: 255, b: 255 }` | Vue 2 |
| modelValue | Current color, used by `v-model` | Object `{ r, g, b }` | `undefined` (falls back to `value`) | Vue 3 |
| width | Canvas width (CSS pixels) | Number | 300 | both |
| height | Canvas height (CSS pixels) | Number | 300 | both |

### Events

| Event | Description | Payload | Vue version |
| --- | --- | --- | --- |
| input | Fired in real time while the color changes (throttled per frame, used by `v-model`) | `{ r, g, b }` | Vue 2 |
| update:modelValue | Same as `input`, used by `v-model` | `{ r, g, b }` | Vue 3 |
| change | Fired when a pick gesture (press then release) ends | `{ r, g, b }` | both |

Both `input` and `update:modelValue` are always emitted, so the unused one is simply ignored.

### Notes

- The disc uses the HSV model: hue comes from the angle, saturation from the distance to the center ratio, value is fixed to maximum, and the center is white
- `width` / `height` are logical canvas sizes in CSS pixels. The disc radius is `min(width, height) / 2 - 18` and the origin is centered; they do not have to be equal
- The canvas is rendered with `devicePixelRatio` scaling, so it stays sharp on high-DPI screens
- Pointer coordinates are converted back to logical canvas coordinates: even if the canvas is scaled by external CSS (e.g. a global `canvas { max-width: 100% }`, a squeezed parent, or a `transform` scale), the picked position still matches the visual position
- Clicking or dragging outside the disc pins the selector to the circumference and takes the color at that point
- Built on Pointer Events, so mouse and touch behave the same; dragging uses `setPointerCapture`, so it continues even when the pointer leaves the canvas
- Styles are shipped as plain CSS scoped by the `.canvas-color-disc` ancestor selector; import the matching `style.css` once per app

## Local development

```bash
# install dependencies
npm install

# serve the Vue 2 demo at localhost:5173
npm run dev

# build both Vue 2 (dist/) and Vue 3 (dist/vue3/) bundles
npm run build

# build a single target
npm run build:vue2
npm run build:vue3
```

## License

[MIT](./LICENSE)
