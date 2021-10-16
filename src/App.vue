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
// import CanvasColorDisc from './components/CanvasColorDisc.vue'
export default {
    name: 'App',
    // components: {
    //     CanvasColorDisc,
    // },
    data() {
        return {
            RGB: { r: 255, g:255, b:255 },
            changingRGB: '',
        }
    },
    methods: {
        change(newRgb, utils) {
            console.log('change---', newRgb, utils)
            this.RGB = newRgb
        },
        changing(newRgb, utils) {
            console.log('changing---', newRgb, utils)
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
