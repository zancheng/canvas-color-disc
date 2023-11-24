<!--
 * @Descripttion: 
 * @version: 
 * @Author: chengzan
 * @Date: 2021-10-16 10:32:19
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-10-16 15:50:58
-->
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
