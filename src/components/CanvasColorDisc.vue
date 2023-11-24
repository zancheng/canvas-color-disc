<template>
    <div class="rgb-color" style="width:100%;">
        <div class="colorPalatte" :class="`colorPalatte${id}`">
            <canvas
                class="cans"
                :width="width"
                :id="`canvasBg${id}`"
                :height="height" />
            <canvas
                class="cans ids" :width="width" :id="`canvasSelector${id}`" :height="height" @touchmove="handle"
                @touchend="endhandle" @mousedown="mouseDown" @mousemove="mouseMove" @mouseup="mouseUp" />
        </div>
    </div>
</template>

<script>
/* eslint-disable */
import Util from './../uitl.js';

export default {
  name: 'CanvasColorDisc',
  props: {
    // canvas id
    id: {
      type: String,
      default: '0',
    },
    // 颜色值，可以是rgb的JSON格式，也可以是String
    color: {
      type: [Object, String],
      default: () => {
        return { r: 255, g: 255, b: 255 };
      },
    },
    // 画布宽度
    width: {
      type: Number,
      default: window.innerWidth * 0.7, // 画布宽
    },
    // 画布高度
    height: {
      type: Number,
      default: window.innerWidth * 0.78, // 画布高
    },
  },
  watch: {
    color: {
      handler: function (val) {
        if (typeof val === 'string') {
          const rgb = Util.hexToRGB(val)
          this.r = rgb.r;
          this.g = rgb.g;
          this.b = rgb.b;
        } else {
          this.r = val.r;
          this.g = val.g;
          this.b = val.b;
        }
        this.getRedToXy();
      },
      deep: true,
    },
  },
  data() {
    return {
      canvasBg: '',
      canvasSelector: '',
      cstor: '',
      centerX: window.innerWidth / 2,
      centerY: window.innerWidth / 2,
      radius: window.innerWidth / 2 * 0.6 > 100 ? 100 : window.innerWidth / 2 * 0.6,
      r: 255,
      g: 255,
      b: 255,
      leftColor: 0,
      topColor: 0,
      // rgb: {r: 255,g: 255,b:255},
      selectY: 100,
      finishRGB: {
        r: 0,
        g: 0,
        b: 0,
      },
      // 鼠标左键按下，判断鼠标事件改变值
      mouseStart: false,
    };
  },
  mounted() {
    const cpt = window.document.querySelector(`#canvasSelector${this.id}`);
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    // this.leftColor = (document.body.clientWidth-this.width)/2;
    this.canvasBg = window.document.querySelector(`#canvasBg${this.id}`).getContext('2d');
    this.cstor = window.document.querySelector(`#canvasSelector${this.id}`);
    this.canvasSelector = window.document.querySelector(`#canvasSelector${this.id}`).getContext('2d');

    //解决锯齿
    var canvas = window.document.querySelector(`#canvasBg${this.id}`);
    var width = canvas.width;
    var height = canvas.height;
    if (window.devicePixelRatio) {
      devicePixelRatio = window.devicePixelRatio;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.height = height * devicePixelRatio;
      canvas.width = width * devicePixelRatio;
      this.canvasBg.scale(devicePixelRatio, devicePixelRatio);
    }
    var width2 = this.cstor.width;
    var height2 = this.cstor.height;
    if (window.devicePixelRatio) {
      devicePixelRatio = window.devicePixelRatio;
      this.cstor.style.width = width2 + 'px';
      this.cstor.style.height = height2 + 'px';
      this.cstor.height = height2 * devicePixelRatio;
      this.cstor.width = width2 * devicePixelRatio;
      this.canvasSelector.scale(devicePixelRatio, devicePixelRatio);
    }

    Util.drawColorDisk(this.canvasBg, this.centerX, this.centerY, this.radius);

    if (typeof this.color === 'string') {
      const rgb = Util.hexToRGB(this.color)
      this.r = rgb.r;
      this.g = rgb.g;
      this.b = rgb.b;
    } else {
      this.r = this.color.r;
      this.g = this.color.g;
      this.b = this.color.b;
    }
    this.getRedToXy();
  },
  methods: {
    huanxing(ctx, x, y) {
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#eee';
      ctx.beginPath();
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 3;
      ctx.shadowColor = 'rgba(100,100,100,0.5)';
      ctx.shadowBlur = 5;
      ctx.arc(x, y, 15, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
      this.finishRGB.r = this.r;
      this.finishRGB.g = this.g;
      this.finishRGB.b = this.b;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.closePath();
      // ctx.clearRect(0,0,this.width,this.height);
      // ctx.strokeStyle = '#cccccc';
      // ctx.beginPath();
      // ctx.arc(x,y,5,0,Math.PI*2,false);
      // ctx.stroke();
      // ctx.strokeStyle = '#cccccc';
      // ctx.beginPath();
      // ctx.arc(x,y,10,0,Math.PI*2,false);
      // ctx.stroke();
      // ctx.closePath();
      // for (let i = 5; i <= 10; i += 1) {
      //   ctx.strokeStyle = 'rgb('+this.rgb.r+','+this.rgb.g+','+this.rgb.b+')';
      //   ctx.beginPath();
      //   ctx.arc(x,y,i,0,2*Math.PI,false);
      //   ctx.stroke();
      // }
    },
    handle(e) {
      e.preventDefault();
      const xl = e.changedTouches[0].clientX;
      const yl = e.changedTouches[0].clientY;
      let nx = xl - this.cstor.getBoundingClientRect().left;
      let ny = yl - this.cstor.getBoundingClientRect().top;
      this.getRgbbyxy(nx, ny);
    },
    endhandle(e) {
      e.preventDefault();
      const xl = e.changedTouches[0].clientX;
      const yl = e.changedTouches[0].clientY;
      let nx = xl - this.cstor.getBoundingClientRect().left;
      let ny = yl - this.cstor.getBoundingClientRect().top;
      this.getRgbbyxyend(nx, ny);
    },
    mouseDown(e) {
      this.mouseStart = true;
      this.endClick(e)
    },
    mouseMove(e) {
      if (this.mouseStart) {
        e.preventDefault();
        const xl = e.clientX;
        const yl = e.clientY;
        let nx = xl - this.cstor.getBoundingClientRect().left;
        let ny = yl - this.cstor.getBoundingClientRect().top;
        this.getRgbbyxy(nx, ny);
      }
    },
    mouseUp(e) {
      this.mouseStart = false;
      e.preventDefault();
      const xl = e.clientX;
      const yl = e.clientY;
      let nx = xl - this.cstor.getBoundingClientRect().left;
      let ny = yl - this.cstor.getBoundingClientRect().top;
      this.getRgbbyxyend(nx, ny);
    },
    endClick(e) {
      e.preventDefault();
      const xl = e.clientX;
      const yl = e.clientY;
      let nx = xl - this.cstor.getBoundingClientRect().left;
      let ny = yl - this.cstor.getBoundingClientRect().top;
      this.getRgbbyxyend(nx, ny);
    },
    getRgbbyxyend(xt, yt) {
      const rad = Util.getSelectorRadians(xt, yt, this.centerX, this.centerY, this.radius);
      if (rad.r > this.radius) return;
      const rgbs = Util.hvsToRGB(rad.radian, 255, rad.r);
      if (rad.r < 8) {
        rgbs.r = 255; rgbs.g = 255; rgbs.b = 255;
      }
      if (rad.r >= this.radius) {
        const xy = Util.rMax(rgbs);
        xt = xy.x + this.centerX;
        yt = xy.y + this.centerY;
      }

      this.r = rgbs.r;
      this.g = rgbs.g;
      this.b = rgbs.b;
      if ((rad.maxr - this.radius) > 30) {
        this.$emit('change', this.finishRGB, Util);
        return;
      }
      this.changeHandle();
      this.huanxing(this.canvasSelector, xt, yt);
    },
    getRgbbyxy(xt, yt) {
      const rad = Util.getSelectorRadians(xt, yt, this.centerX, this.centerY, this.radius);
      if (rad.r > this.radius) return;
      const rgbs = Util.hvsToRGB(rad.radian, 255, rad.r);
      if (rad.r < 8) {
        rgbs.r = 255; rgbs.g = 255; rgbs.b = 255;
      }
      if (rad.r >= this.radius) {
        const xy = Util.rMax(rgbs);
        xt = xy.x + this.centerX;
        yt = xy.y + this.centerY;
      }
      this.r = rgbs.r;
      this.g = rgbs.g;
      this.b = rgbs.b;
      if ((rad.maxr - this.radius) > 30) {
        return;
      }
      this.huanxing(this.canvasSelector, xt, yt);
      // this.$emit('changing', {
      //   r: this.r,
      //   g: this.g,
      //   b: this.r,
      // }, Util);
    },
    getRedToXy() {
      const objxy = Util.selectorLocation({ r: this.r, g: this.g, b: this.b });
      const xls = this.centerX + objxy.x;
      const yls = this.centerY + objxy.y;
      this.huanxing(this.canvasSelector, xls, yls);
    },
    changeHandle() {
      this.$emit('change', { r: this.r, g: this.g, b: this.b }, Util);
    },
  },
}
</script>

<style scoped>
.rgb-color {
  /* border: 1px solid red; */
  width: 100%;
  /* height: 100%; */
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.colorPalatte {
  /* border: 1px solid red; */
  position: relative;
  width: 100%;
  left: 0;
  top: 0;
  /* left: 20%; */
  /* let */
}

.cans {
  position: absolute;
  z-index: 10;
  left: 0;
  top: 0;
}

.ids {
  /* width: 50%;
   height: 50%; */
  /* width: 100%;
   margin:0.35rem auto; */
  z-index: 20;
}
</style>
