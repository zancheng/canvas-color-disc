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
npm i canvas-color-disc --save
```
yarn
``` bash
# install dependencies
yarn add canvas-color-disc
```
main.js添加组件
```
import CanvasColorDisc from 'canvas-color-disc'
Vue.use(CanvasColorDisc)

```

```vue
<template>
    <div id="app">
        <p>RGB: {{RGB}}</p>
        <p>Hex: {{Hex}}</p>
        <p>changing RGB: {{changingRGB}}</p>
        <p>changing Hex: {{changingHex}}</p>
        <CanvasColorDisc
            id="0"
            :color="RGB"
            :width="300"
            :height="240"
            @changing="changing"
            @change="changeColor"></CanvasColorDisc>
    </div>
</template>

<script>
export default {
    name: 'App',
    data() {
        return {
            RGB: { r: 255, g:255, b:255 },
            changingRGB: '',
            changingHex: '',
            Hex: '',
        }
    },
    methods: {
        changeColor(newRgb, utils) {
            this.RGB = newRgb
            this.Hex = `#${utils.RGBToHex(`(${newRgb.r}, ${newRgb.g}, ${newRgb.b})`)}`.toUpperCase()
        },
        changing(newRgb, utils) {
            this.changingRGB = JSON.stringify(newRgb)
            this.changingHex = `#${utils.RGBToHex(`(${newRgb.r}, ${newRgb.g}, ${newRgb.b})`)}`.toUpperCase()
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

| 参数        | 说明    | 类型                                        | 默认值 |
| ------------- | ----------- | ----------------------------------------------- | ------ |
| id | canvas id拼接  | String                              | "0" |
| color | 默认颜色 | Object | {"r": 255, "g": 255, "b": 255} |
| width | canvas画板宽度 |    Number                      | window.innerWidth * 0.7 |
| height | canvas画板高度 | Number                         | window.innerWidth * 0.78 |



| 事件        | 说明    | 回调参数 |
| ------------- | ----------- | ----------------------------------------------- |
| changing | 滑动选择回调  | rgb: 颜色, Util: 内置util，可以转换颜色（Util.hvsToRGB、Util.RGBToHvs、Util.RGBToHex、Util.hexToRGB、Util.RGBToHsv、Util.hsvToRgb） |
| change | 选择结束回调 | rgb: 颜色, Util: 内置util，可以转换颜色（Util.hvsToRGB、Util.RGBToHvs、Util.RGBToHex、Util.hexToRGB、Util.RGBToHsv、Util.hsvToRgb） |
