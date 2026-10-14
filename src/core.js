/**
 * 框架无关的色盘核心（命令式 API）
 *
 * 只依赖原生 DOM：把色盘结构渲染进传入的容器（普通元素或 ShadowRoot），
 * 交互与状态机与 Vue 组件版保持一致，供 Web Component 与直接 `new` 使用。
 *
 * 事件（detail 为当前颜色，形状由 format / alpha 决定）：
 * - input：颜色变化时实时触发（按帧节流）
 * - change：一次选择（按下后抬起，或一次键盘调整）结束时触发
 */
import { clamp, formatColor, hsvToRgb, isSameHsv, normalizeHue, parseColor } from './color';
import { discToPoint, drawColorDisc, pointToDisc } from './util';
// 样式内联为字符串：ShadowRoot 注入到影子树，文本内每个文档只注入一次
import discCss from './style.css?inline';

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
// 文档级样式注入标记，避免多个实例重复注入
const STYLE_MARK_ATTRIBUTE = 'data-canvas-color-disc-style';

export const DEFAULTS = {
    value: { r: 255, g: 255, b: 255 },
    width: 300,
    height: 300,
    format: 'rgb',
    alpha: false,
    disabled: false,
    keyboardStep: 1
};

function pick(options, key) {
    const value = options ? options[key] : undefined;
    return value === undefined ? DEFAULTS[key] : value;
}

function toSize(value) {
    const size = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(size) && size > 0 ? size : 1;
}

function cloneColor(color) {
    return typeof color === 'string' ? color : { ...color };
}

// ShadowRoot 每个实例注入一份；普通文档只注入一次，供所有命令式实例共用
function injectStyle(root) {
    const doc = root.ownerDocument || document;
    if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) {
        const style = doc.createElement('style');
        style.textContent = discCss;
        root.appendChild(style);
        return;
    }
    if (doc.head && !doc.head.querySelector('[' + STYLE_MARK_ATTRIBUTE + ']')) {
        const style = doc.createElement('style');
        style.setAttribute(STYLE_MARK_ATTRIBUTE, '');
        style.textContent = discCss;
        doc.head.appendChild(style);
    }
}

export class CanvasColorDiscCore extends EventTarget {
    /**
     * @param {Element|ShadowRoot|string} root 容器元素、ShadowRoot 或选择器
     * @param {object} [options] 初始选项，见 DEFAULTS；value 为初始颜色
     */
    constructor(root, options) {
        super();
        const target = typeof root === 'string' ? document.querySelector(root) : root;
        if (!target || typeof target.appendChild !== 'function') {
            throw new TypeError('CanvasColorDiscCore: 第一个参数需要是容器元素或有效的选择器');
        }
        this.root = target;
        this.destroyed = false;
        this.options = {
            format: pick(options, 'format'),
            width: pick(options, 'width'),
            height: pick(options, 'height'),
            alpha: !!pick(options, 'alpha'),
            disabled: !!pick(options, 'disabled'),
            keyboardStep: pick(options, 'keyboardStep')
        };
        // 内部权威状态：色盘的取色结果是 HSV，V 由外部值决定并原样保留
        const initial = parseColor(pick(options, 'value'), this.options.format)
            || { h: 0, s: 0, v: 100, a: 1 };
        this.hsv = { h: initial.h, s: initial.s, v: initial.v };
        this.alphaValue = this.options.alpha ? initial.a : 1;
        // auto 模式下由容器测量得出，见 measure()
        this.measuredWidth = 0;
        this.measuredHeight = 0;
        this.canvasWidth = toSize(this.options.width);
        this.canvasHeight = toSize(this.options.height);
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 0;
        // 随色盘半径换算出的绘制尺寸，见 setupCanvas
        this.selectorRadius = SELECTOR_MAX_RADIUS;
        this.selectorInnerRadius = SELECTOR_MAX_RADIUS * SELECTOR_INNER_RATIO;
        this.centerWhiteRadius = CENTER_WHITE_MAX_RADIUS;
        this.dpr = 1;
        this.dragging = false;
        this.canvasRect = null;
        this.rafId = 0;

        // 事件处理器固定 this 后缓存，便于 destroy 时移除
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);

        this.buildElement();
        injectStyle(this.root);
        this.bindEvents();
        this.measure();
        this.bindResizeObserver();
        this.bindDpr();
        this.syncDisabled();
        this.syncSizeStyles();
        this.updateAria();
        this.setupCanvas();
        this.drawSelector();
    }

    get isAutoWidth() {
        return this.options.width === 'auto';
    }

    get isAutoHeight() {
        return this.options.height === 'auto';
    }

    get resolvedWidth() {
        return this.isAutoWidth ? Math.max(this.measuredWidth, 1) : toSize(this.options.width);
    }

    get resolvedHeight() {
        return this.isAutoHeight ? Math.max(this.measuredHeight, 1) : toSize(this.options.height);
    }

    get currentCssColor() {
        const rgb = hsvToRgb(this.hsv.h, this.hsv.s, this.hsv.v);
        return this.options.alpha && this.alphaValue < 1
            ? 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + this.alphaValue + ')'
            : 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
    }

    // 生成 DOM 结构，与 Vue 组件模板保持一致
    buildElement() {
        const doc = this.root.ownerDocument || document;
        const element = doc.createElement('div');
        element.className = 'canvas-color-disc';
        element.innerHTML = [
            '<div class="disc-surface" tabindex="0" role="slider" aria-label="颜色选择盘"',
            ' aria-valuemin="0" aria-valuemax="100">',
            '<canvas class="disc-canvas"></canvas>',
            '<canvas class="disc-canvas disc-selector"></canvas>',
            '</div>'
        ].join('');
        this.element = element;
        this.surface = element.querySelector('.disc-surface');
        this.discCanvas = element.querySelector('.disc-canvas');
        this.selectorCanvas = element.querySelector('.disc-selector');
        this.root.appendChild(element);
    }

    bindEvents() {
        // 兜底：setPointerCapture 失败时指针可能在画布外抬起，canvas 本身收不到 pointerup
        this.onWindowPointerEnd = () => this.finishDrag();
        // 拖动期间页面滚动会让缓存的 rect 失效（clientX/Y 与 rect 均为视口坐标）
        this.onWindowScroll = () => {
            if (this.dragging) {
                this.canvasRect = null;
            }
        };
        this.surface.addEventListener('keydown', this.onKeyDown);
        this.selectorCanvas.addEventListener('pointerdown', this.onPointerDown);
        this.selectorCanvas.addEventListener('pointermove', this.onPointerMove);
        this.selectorCanvas.addEventListener('pointerup', this.onPointerUp);
        this.selectorCanvas.addEventListener('pointercancel', this.onPointerUp);
        window.addEventListener('pointerup', this.onWindowPointerEnd);
        window.addEventListener('pointercancel', this.onWindowPointerEnd);
        window.addEventListener('scroll', this.onWindowScroll, true);
    }

    // 容器尺寸变化（含 auto 模式下的父容器缩放）时重新测量并失效坐标缓存
    bindResizeObserver() {
        if (typeof ResizeObserver === 'undefined') {
            return;
        }
        this.resizeObserver = new ResizeObserver(() => {
            this.canvasRect = null;
            const prevWidth = this.measuredWidth;
            const prevHeight = this.measuredHeight;
            this.measure();
            // auto 方向跟随容器，测量尺寸变化后按新尺寸重建画布
            if ((this.isAutoWidth && this.measuredWidth !== prevWidth)
                || (this.isAutoHeight && this.measuredHeight !== prevHeight)) {
                this.rebuildCanvas();
            }
        });
        this.resizeObserver.observe(this.surface);
    }

    // 读取容器实际尺寸，供 auto 模式使用
    measure() {
        if (!this.surface || typeof this.surface.getBoundingClientRect !== 'function') {
            return;
        }
        const rect = this.surface.getBoundingClientRect();
        this.measuredWidth = Math.round(rect.width);
        this.measuredHeight = Math.round(rect.height);
    }

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
    }

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
    }

    syncDisabled() {
        const disabled = !!this.options.disabled;
        this.surface.tabIndex = disabled ? -1 : 0;
        this.surface.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        this.element.classList.toggle('is-disabled', disabled);
        if (disabled) {
            this.finishDrag();
        }
    }

    // auto 方向由容器决定尺寸，相应元素改为撑满父级
    syncSizeStyles() {
        const display = this.isAutoWidth || this.isAutoHeight ? 'block' : '';
        [this.element, this.surface].forEach((el) => {
            el.style.display = display;
            el.style.width = this.isAutoWidth ? '100%' : '';
            el.style.height = this.isAutoHeight ? '100%' : '';
        });
    }

    updateAria() {
        const hsv = this.hsv;
        this.surface.setAttribute('aria-valuenow', String(Math.round(hsv.s)));
        this.surface.setAttribute(
            'aria-valuetext',
            '色相 ' + Math.round(hsv.h) + ' 度，饱和度 ' + Math.round(hsv.s)
                + '%，明度 ' + Math.round(hsv.v) + '%'
        );
    }

    // 初始化画布尺寸并重绘色盘与选择器
    rebuildCanvas() {
        this.setupCanvas();
        this.drawSelector();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const width = this.resolvedWidth;
        const height = this.resolvedHeight;
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
        [this.discCanvas, this.selectorCanvas].forEach((canvas) => {
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
        this.discCtx = this.discCanvas.getContext('2d');
        this.selectorCtx = this.selectorCanvas.getContext('2d');
        this.discCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.selectorCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawColorDisc(this.discCtx, this.centerX, this.centerY, this.radius, dpr);
        this.buildSelectorSprite();
        this.canvasRect = null;
    }

    // 把选择器圆环（含投影）预渲染到离屏画布，避免每帧重算 shadowBlur
    buildSelectorSprite() {
        const doc = this.root.ownerDocument || document;
        const outer = this.selectorRadius;
        const offsetY = outer * 0.2;
        const blur = outer * 0.35;
        const size = Math.ceil((outer + blur + offsetY + 1) * 2);
        if (!this.selectorSprite) {
            this.selectorSprite = doc.createElement('canvas');
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
    }

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
        if (this.options.alpha && this.alphaValue < 1) {
            ctx.fillStyle = '#fff';
            ctx.fill();
        }
        ctx.fillStyle = this.currentCssColor;
        ctx.fill();
        ctx.restore();
    }

    onKeyDown(e) {
        if (this.options.disabled) {
            return;
        }
        const step = e.shiftKey ? this.options.keyboardStep * 10 : this.options.keyboardStep;
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
        this.emitChange();
    }

    onPointerDown(e) {
        if (this.options.disabled) {
            return;
        }
        // 只响应主键（鼠标左键/触摸/笔尖），并忽略多指触摸时的第二根及以上手指
        if ((typeof e.button === 'number' && e.button !== 0) || e.isPrimary === false) {
            return;
        }
        e.preventDefault();
        this.canvasRect = this.selectorCanvas.getBoundingClientRect();
        this.dragging = true;
        try {
            this.selectorCanvas.setPointerCapture(e.pointerId);
        } catch (err) {
            // 部分环境下 pointerId 非活跃时会抛错（如合成事件），不影响取色
        }
        this.pickColor(e.clientX, e.clientY);
    }

    onPointerMove(e) {
        if (!this.dragging) {
            return;
        }
        this.pickColor(e.clientX, e.clientY);
    }

    onPointerUp() {
        this.finishDrag();
    }

    // 结束一次选择：提交未执行的更新并派发 change
    // window 上的兜底监听也会调用该方法，此时 dragging 已置否，不会重复派发
    finishDrag() {
        if (!this.dragging) {
            return;
        }
        this.dragging = false;
        this.flushUpdate();
        this.emitChange();
    }

    // 根据触点坐标更新当前颜色（只改变 H/S，V 与 alpha 保留外部值）
    pickColor(clientX, clientY) {
        if (!this.canvasRect) {
            this.canvasRect = this.selectorCanvas.getBoundingClientRect();
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
    }

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
    }

    // 立即提交尚未执行的更新（交互结束时调用）
    flushUpdate() {
        if (!this.rafId) {
            return;
        }
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
        this.drawSelector();
        this.emitInput();
    }

    applyHsv(h, s, v, a) {
        this.hsv = { h: normalizeHue(h), s: clamp(s, 0, 100), v: clamp(v, 0, 100) };
        this.alphaValue = this.options.alpha ? clamp(a === undefined ? 1 : a, 0, 1) : 1;
        this.updateAria();
    }

    // 外部值静默同步（不派发事件），等价于 Vue 版对绑定值的 watch
    applyValue(value) {
        const parsed = parseColor(value, this.options.format);
        const current = { h: this.hsv.h, s: this.hsv.s, v: this.hsv.v, a: this.alphaValue };
        if (!parsed || isSameHsv(parsed, current)) {
            return;
        }
        this.applyHsv(parsed.h, parsed.s, parsed.v, this.options.alpha ? parsed.a : 1);
        this.drawSelector();
    }

    /**
     * 增量更新选项：format / width / height / alpha / disabled / keyboardStep / value
     * - format、alpha 变化后立即按新格式派发一次 input
     * - value 走静默同步，不会派发事件（交互、setColor 才会）
     */
    setOptions(options) {
        if (this.destroyed) {
            return;
        }
        const opts = options || {};
        let emitInput = false;
        let redraw = false;
        if (opts.format !== undefined && opts.format !== this.options.format) {
            this.options.format = opts.format;
            emitInput = true;
        }
        if (opts.alpha !== undefined && !!opts.alpha !== this.options.alpha) {
            this.options.alpha = !!opts.alpha;
            emitInput = true;
            redraw = true;
        }
        if (opts.keyboardStep !== undefined) {
            this.options.keyboardStep = opts.keyboardStep;
        }
        if (opts.disabled !== undefined && !!opts.disabled !== this.options.disabled) {
            this.options.disabled = !!opts.disabled;
            this.syncDisabled();
        }
        let rebuild = false;
        if (opts.width !== undefined && opts.width !== this.options.width) {
            this.options.width = opts.width;
            rebuild = true;
        }
        if (opts.height !== undefined && opts.height !== this.options.height) {
            this.options.height = opts.height;
            rebuild = true;
        }
        if (rebuild) {
            this.syncSizeStyles();
            this.rebuildCanvas();
        }
        if (redraw) {
            this.drawSelector();
        }
        if (opts.value !== undefined) {
            this.applyValue(opts.value);
        }
        if (emitInput) {
            this.emitInput();
        }
    }

    emitInput() {
        this.dispatchEvent(new CustomEvent('input', { detail: this.getColor() }));
    }

    emitChange() {
        this.dispatchEvent(new CustomEvent('change', { detail: this.getColor() }));
    }

    /** 取当前颜色，对象格式为副本 */
    getColor() {
        return cloneColor(formatColor(this.hsv, this.alphaValue, this.options.format, this.options.alpha));
    }

    /** 设置颜色，值需符合当前 format，非法值被忽略；会同时派发 input 与 change */
    setColor(value) {
        if (this.destroyed) {
            return;
        }
        const parsed = parseColor(value, this.options.format);
        if (!parsed) {
            return;
        }
        this.applyHsv(parsed.h, parsed.s, parsed.v, parsed.a);
        this.drawSelector();
        this.emitInput();
        this.emitChange();
    }

    /** 重置为白色 */
    reset() {
        this.setColor(formatColor({ h: 0, s: 0, v: 100 }, 1, this.options.format, this.options.alpha));
    }

    /** 移除事件监听、观察器与生成的 DOM；实例随后不可再使用 */
    destroy() {
        if (this.destroyed) {
            return;
        }
        this.destroyed = true;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.unbindDpr();
        if (this.onWindowPointerEnd) {
            window.removeEventListener('pointerup', this.onWindowPointerEnd);
            window.removeEventListener('pointercancel', this.onWindowPointerEnd);
            window.removeEventListener('scroll', this.onWindowScroll, true);
            this.onWindowPointerEnd = null;
            this.onWindowScroll = null;
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.discCtx = null;
        this.selectorCtx = null;
    }
}
