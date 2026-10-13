<template>
    <div
        class="canvas-color-disc"
        :class="{ 'is-disabled': disabled }"
        :style="containerStyle"
    >
        <div
            ref="surface"
            class="disc-surface"
            :style="surfaceStyle"
            :tabindex="disabled ? -1 : 0"
            role="slider"
            :aria-label="ariaLabel"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="ariaValueNow"
            :aria-valuetext="ariaValueText"
            :aria-disabled="disabled ? 'true' : 'false'"
            v-bind="$attrs"
            @keydown="onKeyDown"
        >
            <canvas
                ref="discCanvas"
                class="disc-canvas"
            />
            <canvas
                ref="selectorCanvas"
                class="disc-canvas disc-selector"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
            />
        </div>
        <!-- 预设色板等附加内容，可用 setColor 回写当前颜色 -->
        <div v-if="$slots.palette" class="disc-palette">
            <slot
                name="palette"
                :color="outputColor"
                :set-color="setColor"
            />
        </div>
    </div>
</template>

<script>
// 样式独立于 SFC，便于 Vue 2 / Vue 3 两次构建共用（构建产物分别为 dist/style.css、dist/vue3/style.css）
import '../style.css';
import {
    clamp,
    formatColor,
    hsvToRgb,
    isSameHsv,
    normalizeHue,
    parseColor
} from '../color';
import {
    discToPoint,
    drawColorDisc,
    pointToDisc
} from '../util';

// 选择器圆环外径相对色盘半径的比例
const SELECTOR_RADIUS_RATIO = 0.115;
// 极端尺寸下圆环外径的上下限：小色盘不至于糊成一团，大色盘不至于过粗
const SELECTOR_MIN_RADIUS = 6;
const SELECTOR_MAX_RADIUS = 15;
// 圆环内径占外径的比例
const SELECTOR_INNER_RATIO = 0.8;
// 圆心白色死区半径相对色盘半径的比例
const CENTER_WHITE_RATIO = 0.06;
const CENTER_WHITE_MIN_RADIUS = 3;
const CENTER_WHITE_MAX_RADIUS = 8;
// 色盘与画布边缘的留白（相对画布短边半径），需覆盖选择器圆环及其投影
const DISC_PADDING_RATIO = 0.13;
const DISC_PADDING_MIN = 8;
const DISC_PADDING_MAX = 18;

function toSize(value) {
    const size = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(size) && size > 0 ? size : 1;
}

function cloneColor(color) {
    return typeof color === 'string' ? color : { ...color };
}

export default {
    name: 'CanvasColorDisc',
    // 未声明的属性落到交互元素上，便于覆盖 aria-* / data-*
    inheritAttrs: false,
    // Vue 3 下通过 ref 暴露实例方法；Vue 2 下该选项被忽略，直接用 $refs 调用即可
    expose: ['getColor', 'setColor', 'reset'],
    emits: ['input', 'update:modelValue', 'change'],
    props: {
        // 当前颜色，Vue 2 下配合 v-model 使用
        value: {
            type: [Object, String],
            default: () => ({ r: 255, g: 255, b: 255 })
        },
        // 当前颜色，Vue 3 下配合 v-model 使用
        // 默认值为 undefined 用于区分「Vue 2 的 value 模式」与「Vue 3 的 modelValue 模式」
        modelValue: {
            type: [Object, String],
            default: undefined
        },
        // 画布宽高（CSS 像素），'auto' 表示跟随容器对应方向的尺寸
        width: {
            type: [Number, String],
            default: 300
        },
        height: {
            type: [Number, String],
            default: 300
        },
        // 绑定值的格式：rgb / hex / hsv / hsl
        format: {
            type: String,
            default: 'rgb'
        },
        // 是否保留并输出 alpha 分量（色盘本身不调节透明度，需由外部控件给出）
        alpha: {
            type: Boolean,
            default: false
        },
        // 禁用后不再响应指针与键盘操作
        disabled: {
            type: Boolean,
            default: false
        },
        // 方向键每次调整的步进（饱和度百分点 / 色相度数），按住 Shift 时 ×10
        keyboardStep: {
            type: Number,
            default: 1
        }
    },
    data() {
        const initial = parseColor(this.activeValue(), this.format) || { h: 0, s: 0, v: 100, a: 1 };
        return {
            // 内部权威状态：色盘的取色结果是 HSV，V 由外部值决定并原样保留
            hsv: { h: initial.h, s: initial.s, v: initial.v },
            alphaValue: this.alpha ? initial.a : 1,
            // auto 模式下由容器测量得出，见 measure()
            measuredWidth: 0,
            measuredHeight: 0,
            canvasWidth: toSize(this.width),
            canvasHeight: toSize(this.height),
            centerX: 0,
            centerY: 0,
            radius: 0,
            // 随色盘半径换算出的绘制尺寸，见 setupCanvas
            selectorRadius: SELECTOR_MAX_RADIUS,
            selectorInnerRadius: SELECTOR_MAX_RADIUS * SELECTOR_INNER_RATIO,
            centerWhiteRadius: CENTER_WHITE_MAX_RADIUS,
            dpr: 1,
            dragging: false
        };
    },
    computed: {
        // Vue 2 用 value，Vue 3 用 modelValue
        activeColor() {
            return this.modelValue === undefined ? this.value : this.modelValue;
        },
        isAutoWidth() {
            return this.width === 'auto';
        },
        isAutoHeight() {
            return this.height === 'auto';
        },
        isAutoSize() {
            return this.isAutoWidth || this.isAutoHeight;
        },
        resolvedWidth() {
            return this.isAutoWidth ? Math.max(this.measuredWidth, 1) : toSize(this.width);
        },
        resolvedHeight() {
            return this.isAutoHeight ? Math.max(this.measuredHeight, 1) : toSize(this.height);
        },
        containerStyle() {
            const style = {};
            if (this.isAutoSize) {
                style.display = 'block';
            }
            if (this.isAutoWidth) {
                style.width = '100%';
            }
            if (this.isAutoHeight) {
                style.height = '100%';
            }
            return style;
        },
        surfaceStyle() {
            const style = {};
            if (this.isAutoWidth || this.isAutoHeight) {
                style.display = 'block';
            }
            if (this.isAutoWidth) {
                style.width = '100%';
            }
            if (this.isAutoHeight) {
                style.height = '100%';
            }
            return style;
        },
        internalColor() {
            const hsv = this.hsv;
            return { h: hsv.h, s: hsv.s, v: hsv.v, a: this.alphaValue };
        },
        // 对外输出的颜色，格式由 format / alpha 决定
        outputColor() {
            return formatColor(this.hsv, this.alphaValue, this.format, this.alpha);
        },
        currentRgb() {
            return hsvToRgb(this.hsv.h, this.hsv.s, this.hsv.v);
        },
        currentCssColor() {
            const rgb = this.currentRgb;
            return this.alpha && this.alphaValue < 1
                ? 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + this.alphaValue + ')'
                : 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
        },
        ariaLabel() {
            return '颜色选择盘';
        },
        ariaValueNow() {
            return Math.round(this.hsv.s);
        },
        ariaValueText() {
            const hsv = this.hsv;
            return '色相 ' + Math.round(hsv.h) + ' 度，饱和度 ' + Math.round(hsv.s)
                + '%，明度 ' + Math.round(hsv.v) + '%';
        }
    },
    watch: {
        value: {
            deep: true,
            handler(val) {
                // Vue 3 模式下 value 恒为默认值，忽略
                if (this.modelValue === undefined) {
                    this.applyPropValue(val);
                }
            }
        },
        modelValue: {
            deep: true,
            handler(val) {
                this.applyPropValue(val);
            }
        },
        width() {
            this.rebuildCanvas();
        },
        height() {
            this.rebuildCanvas();
        },
        // 格式或 alpha 开关变化后，立刻按新格式回写一次绑定值
        format() {
            this.emitInput();
        },
        alpha() {
            this.emitInput();
        },
        disabled(val) {
            if (val) {
                this.finishDrag();
            }
        }
    },
    mounted() {
        this.canvasRect = null;
        this.rafId = 0;
        this.measure();
        // 容器尺寸变化（含 auto 模式下的父容器缩放）时重新测量并失效坐标缓存
        if (typeof ResizeObserver !== 'undefined') {
            this.canvasResizeObserver = new ResizeObserver(() => {
                this.canvasRect = null;
                this.measure();
            });
            this.canvasResizeObserver.observe(this.$refs.surface);
        }
        // 兜底：setPointerCapture 失败时指针可能在画布外抬起，canvas 本身收不到 pointerup
        this.onWindowPointerEnd = () => this.finishDrag();
        // 拖动期间页面滚动会让缓存的 rect 失效（clientX/Y 与 rect 均为视口坐标）
        this.onWindowScroll = () => {
            if (this.dragging) {
                this.canvasRect = null;
            }
        };
        window.addEventListener('pointerup', this.onWindowPointerEnd);
        window.addEventListener('pointercancel', this.onWindowPointerEnd);
        window.addEventListener('scroll', this.onWindowScroll, true);
        // 跨屏拖动或系统缩放后 devicePixelRatio 会变，需要按新比例重建画布
        this.bindDpr();
        this.rebuildCanvas();
    },
    // Vue 2 生命周期
    beforeDestroy() {
        this.destroy();
    },
    // Vue 3 生命周期（Vue 2 下该选项会被忽略）
    beforeUnmount() {
        this.destroy();
    },
    methods: {
        destroy() {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = 0;
            }
            if (this.canvasResizeObserver) {
                this.canvasResizeObserver.disconnect();
                this.canvasResizeObserver = null;
            }
            if (this.onWindowPointerEnd) {
                window.removeEventListener('pointerup', this.onWindowPointerEnd);
                window.removeEventListener('pointercancel', this.onWindowPointerEnd);
                window.removeEventListener('scroll', this.onWindowScroll, true);
                this.onWindowPointerEnd = null;
                this.onWindowScroll = null;
            }
            this.unbindDpr();
        },
        // Vue 2 用 value，Vue 3 用 modelValue
        activeValue() {
            return this.modelValue === undefined ? this.value : this.modelValue;
        },
        // 监听当前 devicePixelRatio，变化后重建画布并重新监听新比例
        bindDpr() {
            if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
                return;
            }
            const dpr = window.devicePixelRatio || 1;
            this.dprQuery = window.matchMedia('(resolution: ' + dpr + 'dppx)');
            this.onDprChange = () => {
                this.unbindDpr();
                this.rebuildCanvas();
                this.bindDpr();
            };
            if (this.dprQuery.addEventListener) {
                this.dprQuery.addEventListener('change', this.onDprChange);
            } else if (this.dprQuery.addListener) {
                // 旧版 Safari 只有已废弃的 addListener
                this.dprQuery.addListener(this.onDprChange);
            }
        },
        unbindDpr() {
            if (!this.dprQuery) {
                return;
            }
            if (this.dprQuery.removeEventListener) {
                this.dprQuery.removeEventListener('change', this.onDprChange);
            } else if (this.dprQuery.removeListener) {
                this.dprQuery.removeListener(this.onDprChange);
            }
            this.dprQuery = null;
        },
        // 读取容器实际尺寸，供 auto 模式使用
        measure() {
            const surface = this.$refs.surface;
            if (!surface || typeof surface.getBoundingClientRect !== 'function') {
                return;
            }
            const rect = surface.getBoundingClientRect();
            this.measuredWidth = Math.round(rect.width);
            this.measuredHeight = Math.round(rect.height);
        },
        // 外部修改绑定值时同步内部颜色
        applyPropValue(val) {
            const parsed = parseColor(val, this.format);
            if (!parsed || isSameHsv(parsed, this.internalColor)) {
                return;
            }
            this.applyHsv(parsed.h, parsed.s, parsed.v, this.alpha ? parsed.a : 1);
            this.drawSelector();
        },
        applyHsv(h, s, v, a) {
            this.hsv = { h: normalizeHue(h), s: clamp(s, 0, 100), v: clamp(v, 0, 100) };
            this.alphaValue = this.alpha ? clamp(a === undefined ? 1 : a, 0, 1) : 1;
        },
        // 初始化画布尺寸并重绘色盘与选择器
        rebuildCanvas() {
            this.$nextTick(() => {
                this.setupCanvas();
                this.drawSelector();
            });
        },
        setupCanvas() {
            const dpr = window.devicePixelRatio || 1;
            const width = this.resolvedWidth;
            const height = this.resolvedHeight;
            const discCanvas = this.$refs.discCanvas;
            const selectorCanvas = this.$refs.selectorCanvas;
            // 挂载后同一 tick 内就被卸载时，nextTick 回调里 $refs 已被清空
            if (!discCanvas || !selectorCanvas) {
                return;
            }
            // 尺寸与 dpr 都没变时不必重建：canvas.width 赋值会清空画布
            if (this.lastSetup
                && this.lastSetup.width === width
                && this.lastSetup.height === height
                && this.lastSetup.dpr === dpr) {
                return;
            }
            this.lastSetup = { width, height, dpr };
            this.canvasWidth = width;
            this.canvasHeight = height;
            this.dpr = dpr;
            const canvases = [discCanvas, selectorCanvas];
            canvases.forEach((canvas) => {
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
                canvas.width = Math.round(width * dpr);
                canvas.height = Math.round(height * dpr);
            });
            this.centerX = width / 2;
            this.centerY = height / 2;
            // 留白与圆环尺寸都随画布缩放，保证极小/极大尺寸下比例一致
            const halfSize = Math.min(width, height) / 2;
            const padding = clamp(halfSize * DISC_PADDING_RATIO, DISC_PADDING_MIN, DISC_PADDING_MAX);
            this.radius = Math.max(halfSize - padding, 1);
            this.selectorRadius = clamp(
                this.radius * SELECTOR_RADIUS_RATIO, SELECTOR_MIN_RADIUS, SELECTOR_MAX_RADIUS
            );
            this.selectorInnerRadius = this.selectorRadius * SELECTOR_INNER_RATIO;
            this.centerWhiteRadius = clamp(
                this.radius * CENTER_WHITE_RATIO, CENTER_WHITE_MIN_RADIUS, CENTER_WHITE_MAX_RADIUS
            );
            this.discCtx = discCanvas.getContext('2d');
            this.selectorCtx = selectorCanvas.getContext('2d');
            this.discCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.selectorCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawColorDisc(this.discCtx, this.centerX, this.centerY, this.radius, dpr);
            this.buildSelectorSprite();
            this.canvasRect = null;
        },
        // 把选择器圆环（含投影）预渲染到离屏画布，避免每帧重算 shadowBlur
        buildSelectorSprite() {
            if (typeof document === 'undefined') {
                return;
            }
            const outer = this.selectorRadius;
            const offsetY = outer * 0.2;
            const blur = outer * 0.35;
            const size = Math.ceil((outer + blur + offsetY + 1) * 2);
            if (!this.selectorSprite) {
                this.selectorSprite = document.createElement('canvas');
            }
            const sprite = this.selectorSprite;
            sprite.width = Math.round(size * this.dpr);
            sprite.height = Math.round(size * this.dpr);
            const ctx = sprite.getContext('2d');
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.clearRect(0, 0, size, size);
            ctx.shadowOffsetX = outer * 0.07;
            ctx.shadowOffsetY = offsetY;
            ctx.shadowColor = 'rgba(100, 100, 100, 0.5)';
            ctx.shadowBlur = blur;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, outer, 0, Math.PI * 2);
            ctx.fillStyle = '#eee';
            ctx.fill();
            this.selectorSpriteSize = size;
        },
        // 绘制选择器圆环
        drawSelector() {
            const ctx = this.selectorCtx;
            if (!ctx) {
                return;
            }
            const point = discToPoint(this.hsv.h, this.hsv.s, this.centerX, this.centerY, this.radius);
            ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            if (this.selectorSprite) {
                const size = this.selectorSpriteSize;
                ctx.drawImage(
                    this.selectorSprite, point.x - size / 2, point.y - size / 2, size, size
                );
            }
            ctx.save();
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.selectorInnerRadius, 0, Math.PI * 2);
            // 半透明时先铺白底，避免与盘面颜色混淆
            if (this.alpha && this.alphaValue < 1) {
                ctx.fillStyle = '#fff';
                ctx.fill();
            }
            ctx.fillStyle = this.currentCssColor;
            ctx.fill();
            ctx.restore();
        },
        onKeyDown(e) {
            if (this.disabled) {
                return;
            }
            const step = e.shiftKey ? this.keyboardStep * 10 : this.keyboardStep;
            let nextH = this.hsv.h;
            let nextS = this.hsv.s;
            switch (e.key) {
            case 'ArrowLeft':
                nextH -= step;
                break;
            case 'ArrowRight':
                nextH += step;
                break;
            case 'ArrowUp':
                nextS += step;
                break;
            case 'ArrowDown':
                nextS -= step;
                break;
            case 'Home':
                nextS = 0;
                break;
            case 'End':
                nextS = 100;
                break;
            default:
                return;
            }
            e.preventDefault();
            this.applyHsv(nextH, nextS, this.hsv.v, this.alphaValue);
            this.drawSelector();
            this.emitInput();
            this.$emit('change', cloneColor(this.outputColor));
        },
        onPointerDown(e) {
            if (this.disabled) {
                return;
            }
            // 只响应主键（鼠标左键/触摸/笔尖），并忽略多指触摸时的第二根及以上手指
            if ((typeof e.button === 'number' && e.button !== 0) || e.isPrimary === false) {
                return;
            }
            e.preventDefault();
            const canvas = this.$refs.selectorCanvas;
            this.canvasRect = canvas.getBoundingClientRect();
            this.dragging = true;
            try {
                canvas.setPointerCapture(e.pointerId);
            } catch (err) {
                // 部分环境下 pointerId 非活跃时会抛错（如合成事件），不影响取色
            }
            this.pickColor(e.clientX, e.clientY);
        },
        onPointerMove(e) {
            if (!this.dragging) {
                return;
            }
            this.pickColor(e.clientX, e.clientY);
        },
        onPointerUp() {
            this.finishDrag();
        },
        // 结束一次选择：提交未执行的更新并派发 change
        // window 上的兜底监听也会调用，此时 dragging 已置否，不会重复派发
        finishDrag() {
            if (!this.dragging) {
                return;
            }
            this.dragging = false;
            this.flushUpdate();
            this.$emit('change', cloneColor(this.outputColor));
        },
        // 根据触点坐标更新当前颜色（只改变 H/S，V 与 alpha 保留外部值）
        pickColor(clientX, clientY) {
            if (!this.canvasRect) {
                this.canvasRect = this.$refs.selectorCanvas.getBoundingClientRect();
            }
            const rect = this.canvasRect;
            if (!rect || rect.width === 0 || rect.height === 0) {
                return;
            }
            // 画布可能被外部 CSS 缩放（max-width: 100%、transform scale 等），
            // 先把显示坐标换算回画布逻辑坐标，否则取色位置会随缩放整体偏移
            const x = (clientX - rect.left) * this.canvasWidth / rect.width;
            const y = (clientY - rect.top) * this.canvasHeight / rect.height;
            const disc = pointToDisc(x, y, this.centerX, this.centerY, this.radius);
            this.applyHsv(
                disc.dist < this.centerWhiteRadius ? this.hsv.h : disc.h,
                disc.dist < this.centerWhiteRadius ? 0 : disc.s,
                this.hsv.v,
                this.alphaValue
            );
            this.scheduleUpdate();
        },
        // 用 requestAnimationFrame 合并高频的 pointermove 更新
        scheduleUpdate() {
            if (this.rafId) {
                return;
            }
            this.rafId = requestAnimationFrame(() => {
                this.rafId = 0;
                this.drawSelector();
                this.emitInput();
            });
        },
        // 立即提交尚未执行的更新（交互结束时调用）
        flushUpdate() {
            if (!this.rafId) {
                return;
            }
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
            this.drawSelector();
            this.emitInput();
        },
        // 同时派发 Vue 2 与 Vue 3 的 v-model 事件，未监听的一方会被忽略
        emitInput() {
            const color = this.outputColor;
            this.$emit('input', cloneColor(color));
            this.$emit('update:modelValue', cloneColor(color));
        },
        // 暴露给外部的取色/设色方法
        getColor() {
            return cloneColor(this.outputColor);
        },
        setColor(value) {
            const parsed = parseColor(value, this.format);
            if (!parsed) {
                return;
            }
            this.applyHsv(parsed.h, parsed.s, parsed.v, parsed.a);
            this.drawSelector();
            this.emitInput();
            this.$emit('change', cloneColor(this.outputColor));
        },
        reset() {
            this.setColor(formatColor({ h: 0, s: 0, v: 100 }, 1, this.format, this.alpha));
        }
    }
};
</script>
