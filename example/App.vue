<!--
 * @Descripttion: 
 * @version: 
 * @Author: chengzan
 * @Date: 2021-10-13 14:19:59
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-10-13 14:25:02
-->
<template>
  <div id="app">
    <a class="github-fork-ribbon" href="https://github.com/zancheng/canvas-color-disc" title="Fork me on GitHub">Fork me on GitHub</a>
    <canvas-color-disc
       vals="1"
       :rgb="rgb"
       @change="handleColorSelector"
    ></canvas-color-disc>
    </div>
  </div>
</template>

<script>
import canvasColorDisc from '../src/components/canvasColorDisc.vue'
export default {
  components: {
    'canvas-color-disc': canvasColorDisc,
  },
  data () {
    return {
        rgb: {},
    }
  },
  methods: {
    handleColorSelector(val) { // 色盘
      window.console.log('v', val);
    },
  },
  created () {
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
}
html {
  font-family: 'Source Sans Pro', 'Helvetica Neue', Arial, sans-serif;
}
</style>