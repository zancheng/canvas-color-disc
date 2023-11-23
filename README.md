<!--
 * @Descripttion: 
 * @version: 
 * @Author: chengzan
 * @Date: 2021-10-16 15:40:48
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-10-16 17:04:00
-->
# production

> 一个Vue的canvas色盘选择组件,支持移动端和PC端


![avatar](https://udfs.unisiot.com/group1/M00/03/85/rBEBA2FqlXOAfw1hAAECEWBl9Kc837.png)

<img src="https://udfs.unisiot.com/group1/M00/03/85/rBEBA2FqlXOAfw1hAAECEWBl9Kc837.png" width="50%">
## Build Setup

``` bash
# install dependencies
npm install
```

``` bash
# serve examples at localhost:8080
npm run start
```

```vue
<template>
    <div id="app">
        <p>RGB: {{RGB}}</p>
        <p>changing RGB: {{changingRGB}}</p>
        <canvas-color-disc
            vals="0"
            :rgb="RGB"
            :width="300"
            :height="240"
            @changing="changing"
            @change="change"></canvas-color-disc>
    </div>
</template>

<script>
import CanvasColorDisc from './components/CanvasColorDisc.vue'
export default {
    name: 'App',
    components: {
        CanvasColorDisc,
    },
    data() {
        return {
            RGB: { r: 255, g:255, b:255 },
            changingRGB: '',
        }
    },
    methods: {
        change(newRgb, utils) {
            this.RGB = newRgb
        },
        changing(newRgb, utils) {
            this.changingRGB = JSON.stringify(newRgb)
        },
    },
}
</script>

<style>
    html {
        font-family: "Microsoft Sans Serif", Arial, Helvetica, sans-serif
    }
</style>
```

