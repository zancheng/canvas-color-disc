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
        <p>changing RGB: {{changingRGB}}</p>
        <CanvasColorDisc
            vals="0"
            :rgb="RGB"
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
        }
    },
    methods: {
        changeColor(newRgb, utils) {
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
