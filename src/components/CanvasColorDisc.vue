<template>
    <div class="canvas-color-disc">
        <canvas
            ref="discCanvas"
            class="disc-canvas"
            :width="width"
            :height="height"
        />
        <canvas
            ref="selectorCanvas"
            class="disc-canvas disc-selector"
            :width="width"
            :height="height"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
        />
    </div>
</template>

<script>
import {
    discToPoint,
    drawColorDisc,
    hsvToRgb,
    pointToDisc,
    rgbToHsv
} from '../util'

// 选择器圆环的外径与内径
const SELECTOR_RADIUS = 15
const SELECTOR_INNER_RADIUS = 12
// 色盘与画布边缘的留白，避免选择器圆环被裁切
const DISC_PADDING = 18
// 圆心白色死区半径
const CENTER_WHITE_RADIUS = 8

function normalizeRgb(rgb) {
    const source = rgb || {}
    return {
        r: typeof source.r === 'number' ? source.r : 255,
        g: typeof source.g === 'number' ? source.g : 255,
        b: typeof source.b === 'number' ? source.b : 255
    }
}

function isSameRgb(a, b) {
    return !!a && !!b && a.r === b.r && a.g === b.g && a.b === b.b
}

export default {
    name: 'CanvasColorDisc',
    props: {
        // 当前颜色 {r, g, b}，支持 v-model
        value: {
            type: Object,
            default: () => ({ r: 255, g: 255, b: 255 })
        },
        // 画布宽高（CSS 像素）
        width: {
            type: Number,
            default: 300
        },
        height: {
            type: Number,
            default: 300
        }
    },
    data() {
        return {
            rgb: normalizeRgb(this.value),
            centerX: 0,
            centerY: 0,
            radius: 0,
            dragging: false
        }
    },
    watch: {
        value: {
            deep: true,
            handler(val) {
                if (!isSameRgb(val, this.rgb)) {
                    this.rgb = normalizeRgb(val)
                    this.drawSelector()
                }
            }
        },
        width() {
            this.rebuildCanvas()
        },
        height() {
            this.rebuildCanvas()
        }
    },
    mounted() {
        this.canvasRect = null
        this.rafId = 0
        // 画布被外部 CSS 缩放/容器尺寸变化时，使坐标缓存失效，下次取色重新测量
        if (typeof ResizeObserver !== 'undefined') {
            this.canvasResizeObserver = new ResizeObserver(() => {
                this.canvasRect = null
            })
            this.canvasResizeObserver.observe(this.$refs.selectorCanvas)
        }
        this.rebuildCanvas()
    },
    beforeDestroy() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId)
            this.rafId = 0
        }
        if (this.canvasResizeObserver) {
            this.canvasResizeObserver.disconnect()
            this.canvasResizeObserver = null
        }
    },
    methods: {
        // 初始化画布尺寸并重绘色盘与选择器
        rebuildCanvas() {
            this.$nextTick(() => {
                this.setupCanvas()
                this.drawSelector()
            })
        },
        setupCanvas() {
            const dpr = window.devicePixelRatio || 1
            const discCanvas = this.$refs.discCanvas
            const selectorCanvas = this.$refs.selectorCanvas
            const canvases = [discCanvas, selectorCanvas]
            canvases.forEach((canvas) => {
                canvas.style.width = this.width + 'px'
                canvas.style.height = this.height + 'px'
                canvas.width = Math.round(this.width * dpr)
                canvas.height = Math.round(this.height * dpr)
            })
            this.centerX = this.width / 2
            this.centerY = this.height / 2
            this.radius = Math.max(Math.min(this.width, this.height) / 2 - DISC_PADDING, 1)
            this.discCtx = discCanvas.getContext('2d')
            this.selectorCtx = selectorCanvas.getContext('2d')
            this.discCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
            this.selectorCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
            drawColorDisc(this.discCtx, this.centerX, this.centerY, this.radius, dpr)
            this.canvasRect = null
        },
        // 绘制选择器圆环
        drawSelector() {
            const ctx = this.selectorCtx
            if (!ctx) {
                return
            }
            const hsv = rgbToHsv(this.rgb.r, this.rgb.g, this.rgb.b)
            const point = discToPoint(hsv.h, hsv.s, this.centerX, this.centerY, this.radius)
            ctx.clearRect(0, 0, this.width, this.height)
            ctx.save()
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 3
            ctx.shadowColor = 'rgba(100, 100, 100, 0.5)'
            ctx.shadowBlur = 5
            ctx.beginPath()
            ctx.arc(point.x, point.y, SELECTOR_RADIUS, 0, Math.PI * 2)
            ctx.fillStyle = '#eee'
            ctx.fill()
            ctx.restore()
            ctx.save()
            ctx.beginPath()
            ctx.arc(point.x, point.y, SELECTOR_INNER_RADIUS, 0, Math.PI * 2)
            ctx.fillStyle = 'rgb(' + this.rgb.r + ', ' + this.rgb.g + ', ' + this.rgb.b + ')'
            ctx.fill()
            ctx.restore()
        },
        onPointerDown(e) {
            e.preventDefault()
            const canvas = this.$refs.selectorCanvas
            this.canvasRect = canvas.getBoundingClientRect()
            this.dragging = true
            try {
                canvas.setPointerCapture(e.pointerId)
            } catch (err) {
                // 部分环境下 pointerId 非活跃时会抛错（如合成事件），不影响取色
            }
            this.pickColor(e.clientX, e.clientY)
        },
        onPointerMove(e) {
            if (!this.dragging) {
                return
            }
            this.pickColor(e.clientX, e.clientY)
        },
        onPointerUp() {
            if (!this.dragging) {
                return
            }
            this.dragging = false
            this.flushUpdate()
            this.$emit('change', { ...this.rgb })
        },
        // 根据触点坐标更新当前颜色
        pickColor(clientX, clientY) {
            if (!this.canvasRect) {
                this.canvasRect = this.$refs.selectorCanvas.getBoundingClientRect()
            }
            const rect = this.canvasRect
            if (!rect || rect.width === 0 || rect.height === 0) {
                return
            }
            // 画布可能被外部 CSS 缩放（max-width: 100%、transform scale 等），
            // 先把显示坐标换算回画布逻辑坐标，否则取色位置会随缩放整体偏移
            const x = (clientX - rect.left) * this.width / rect.width
            const y = (clientY - rect.top) * this.height / rect.height
            const disc = pointToDisc(x, y, this.centerX, this.centerY, this.radius)
            this.rgb = disc.dist < CENTER_WHITE_RADIUS
                ? { r: 255, g: 255, b: 255 }
                : hsvToRgb(disc.h, disc.s, 100)
            this.scheduleUpdate()
        },
        // 用 requestAnimationFrame 合并高频的 pointermove 更新
        scheduleUpdate() {
            if (this.rafId) {
                return
            }
            this.rafId = requestAnimationFrame(() => {
                this.rafId = 0
                this.drawSelector()
                this.$emit('input', { ...this.rgb })
            })
        },
        // 立即提交尚未执行的更新（交互结束时调用）
        flushUpdate() {
            if (!this.rafId) {
                return
            }
            cancelAnimationFrame(this.rafId)
            this.rafId = 0
            this.drawSelector()
            this.$emit('input', { ...this.rgb })
        }
    }
}
</script>

<style scoped>
.canvas-color-disc {
    position: relative;
    display: inline-block;
}
.disc-canvas {
    display: block;
}
.disc-selector {
    position: absolute;
    top: 0;
    left: 0;
    cursor: crosshair;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
}
</style>
