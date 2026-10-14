import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { CanvasColorDiscCore } from '../src/core';

/**
 * jsdom 不实现 canvas，打一个最小 2d 上下文桩，
 * 只保证绘制流程能跑通，像素结果由 util.test.js 单独覆盖
 */
function installCanvasStub() {
    const context = {
        canvas: null,
        createImageData(width, height) {
            return {
                width,
                height,
                data: new Uint8ClampedArray(width * height * 4)
            };
        },
        putImageData() {},
        setTransform() {},
        clearRect() {},
        save() {},
        restore() {},
        beginPath() {},
        arc() {},
        fill() {},
        drawImage() {}
    };
    window.HTMLCanvasElement.prototype.getContext = function() {
        context.canvas = this;
        return context;
    };
}

// 画布在 jsdom 里尺寸恒为 0，取色依赖 rect，这里给一个固定布局
function installRectStub() {
    window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        width: 300,
        height: 300,
        right: 300,
        bottom: 300
    });
}

const created = [];

// 核心直接同步初始化，无需等待渲染帧
function createDisc(options) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const disc = new CanvasColorDiscCore(host, options);
    created.push({ disc, host });
    return { disc, host };
}

// 收集 input / change 事件的 detail
function collectEvents(disc) {
    const events = { input: [], change: [] };
    disc.addEventListener('input', (event) => events.input.push(event.detail));
    disc.addEventListener('change', (event) => events.change.push(event.detail));
    return events;
}

function pointerEvent(type, x, y) {
    const event = new window.Event(type, { bubbles: true });
    event.clientX = x;
    event.clientY = y;
    event.pointerId = 1;
    event.button = 0;
    event.isPrimary = true;
    return event;
}

function keyEvent(key, shiftKey) {
    const event = new window.Event('keydown', { bubbles: true });
    event.key = key;
    event.shiftKey = !!shiftKey;
    return event;
}

beforeAll(() => {
    installCanvasStub();
    installRectStub();
});

afterEach(() => {
    while (created.length) {
        const { disc, host } = created.pop();
        disc.destroy();
        host.remove();
    }
});

describe('CanvasColorDiscCore 挂载', () => {
    it('渲染两个画布并设置显示尺寸', () => {
        const { host } = createDisc({ width: 300, height: 200 });
        expect(host.querySelector('.canvas-color-disc')).toBeTruthy();
        const canvases = host.querySelectorAll('canvas');
        expect(canvases.length).toBe(2);
        expect(canvases[0].style.width).toBe('300px');
        expect(canvases[0].style.height).toBe('200px');
    });

    it('几何参数按短边计算，圆心居中', () => {
        const { disc } = createDisc({ width: 300, height: 200 });
        expect(disc.centerX).toBe(150);
        expect(disc.centerY).toBe(100);
        // 留白按比例收敛在 8~18，半径 = 短边半径 - 留白
        expect(disc.radius).toBeGreaterThan(80);
        expect(disc.radius).toBeLessThan(100);
    });

    it('交互元素带 slider 语义与 aria 文本', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        expect(disc.surface.getAttribute('role')).toBe('slider');
        expect(disc.surface.getAttribute('tabindex')).toBe('0');
        expect(disc.surface.getAttribute('aria-valuetext')).toContain('色相');
        expect(disc.surface.getAttribute('aria-disabled')).toBe('false');
    });

    it('普通容器下样式注入到文档且只注入一次', () => {
        const { disc } = createDisc();
        expect(disc.root).toBeInstanceOf(HTMLElement);
        expect(document.head.querySelectorAll('[data-canvas-color-disc-style]').length).toBe(1);
        createDisc();
        expect(document.head.querySelectorAll('[data-canvas-color-disc-style]').length).toBe(1);
    });

    it('ShadowRoot 容器下样式注入影子树', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const disc = new CanvasColorDiscCore(shadow);
        created.push({ disc, host });
        expect(shadow.querySelector('style')).toBeTruthy();
        expect(shadow.querySelector('.canvas-color-disc')).toBeTruthy();
    });
});

describe('颜色格式', () => {
    it('默认输出 rgb 对象', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        expect(disc.getColor()).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('format=hex 输出字符串', () => {
        const { disc } = createDisc({ value: '#ff0000', format: 'hex' });
        expect(disc.getColor()).toBe('#ff0000');
    });

    it('alpha=true 时附带 a 分量', () => {
        const { disc } = createDisc({
            value: { r: 255, g: 0, b: 0, a: 0.5 },
            format: 'rgb',
            alpha: true
        });
        expect(disc.getColor()).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    });

    it('保留明度，灰色不会被拉成纯色', () => {
        const { disc } = createDisc({ value: { r: 128, g: 128, b: 128 } });
        expect(disc.getColor()).toEqual({ r: 128, g: 128, b: 128 });
    });
});

describe('指针交互', () => {
    it('按下并抬起后派发 input 与 change', async() => {
        const { disc } = createDisc({ value: { r: 255, g: 255, b: 255 } });
        const events = collectEvents(disc);
        disc.selectorCanvas.dispatchEvent(pointerEvent('pointerdown', 210, 150));
        // 取色更新走 requestAnimationFrame，等一帧
        await new Promise((resolve) => requestAnimationFrame(resolve));
        disc.selectorCanvas.dispatchEvent(pointerEvent('pointerup', 210, 150));
        expect(events.input.length).toBeGreaterThan(0);
        expect(events.change.length).toBe(1);
        // 圆心右侧取到红色系：红通道最高
        expect(events.change[0].r).toBeGreaterThan(events.change[0].b);
    });

    it('disabled 时不响应指针', () => {
        const { disc } = createDisc({ value: { r: 255, g: 255, b: 255 }, disabled: true });
        disc.selectorCanvas.dispatchEvent(pointerEvent('pointerdown', 210, 150));
        expect(disc.dragging).toBe(false);
        expect(disc.hsv.s).toBe(0);
    });

    it('右键（非主键）不触发取色', () => {
        const { disc } = createDisc({ value: { r: 255, g: 255, b: 255 } });
        const event = pointerEvent('pointerdown', 210, 150);
        event.button = 2;
        disc.selectorCanvas.dispatchEvent(event);
        expect(disc.dragging).toBe(false);
    });
});

describe('键盘操作', () => {
    it('方向键调整色相并派发 change', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        const events = collectEvents(disc);
        disc.surface.dispatchEvent(keyEvent('ArrowRight'));
        expect(disc.hsv.h).toBeCloseTo(1);
        expect(events.change.length).toBe(1);
    });

    it('按住 Shift 按十倍步进', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        disc.surface.dispatchEvent(keyEvent('ArrowRight', true));
        expect(disc.hsv.h).toBeCloseTo(10);
    });

    it('disabled 时忽略键盘', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 }, disabled: true });
        disc.surface.dispatchEvent(keyEvent('ArrowRight'));
        expect(disc.hsv.h).toBeCloseTo(0);
    });
});

describe('实例方法与选项', () => {
    it('getColor 返回当前颜色副本', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        const color = disc.getColor();
        color.r = 0;
        expect(disc.getColor().r).toBe(255);
    });

    it('setColor 更新颜色并派发 input 与 change', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        const events = collectEvents(disc);
        disc.setColor({ r: 0, g: 128, b: 255 });
        expect(disc.getColor()).toEqual({ r: 0, g: 128, b: 255 });
        expect(events.input.length).toBe(1);
        expect(events.change.length).toBe(1);
    });

    it('setColor 忽略非法值', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        disc.setColor('not-a-color');
        expect(disc.getColor()).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('reset 回到白色', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 }, format: 'hex' });
        disc.reset();
        expect(disc.getColor()).toBe('#ffffff');
    });

    it('setOptions 切换 format 后立即按新格式派发 input', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        const events = collectEvents(disc);
        disc.setOptions({ format: 'hex' });
        expect(disc.getColor()).toBe('#ff0000');
        expect(events.input).toEqual(['#ff0000']);
        expect(events.change.length).toBe(0);
    });

    it('setOptions 修改尺寸后画布同步', () => {
        const { disc } = createDisc({ width: 300, height: 300 });
        disc.setOptions({ width: 200, height: 240 });
        expect(disc.discCanvas.style.width).toBe('200px');
        expect(disc.discCanvas.style.height).toBe('240px');
    });

    it('setOptions 切换 disabled 后标记状态并停止响应', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        disc.setOptions({ disabled: true });
        expect(disc.element.classList.contains('is-disabled')).toBe(true);
        expect(disc.surface.getAttribute('aria-disabled')).toBe('true');
        expect(disc.surface.getAttribute('tabindex')).toBe('-1');
        disc.selectorCanvas.dispatchEvent(pointerEvent('pointerdown', 210, 150));
        expect(disc.dragging).toBe(false);
    });

    it('setOptions 传入 value 为静默同步', () => {
        const { disc } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        const events = collectEvents(disc);
        disc.setOptions({ value: { r: 0, g: 0, b: 255 } });
        expect(disc.getColor()).toEqual({ r: 0, g: 0, b: 255 });
        expect(events.input.length).toBe(0);
        expect(events.change.length).toBe(0);
    });
});

describe('销毁', () => {
    it('destroy 移除 DOM 并停止响应', () => {
        const { disc, host } = createDisc({ value: { r: 255, g: 0, b: 0 } });
        const events = collectEvents(disc);
        disc.destroy();
        expect(host.querySelector('.canvas-color-disc')).toBeNull();
        // 销毁后调用不抛错、不再派发事件
        disc.setColor({ r: 0, g: 0, b: 0 });
        disc.setOptions({ format: 'hex' });
        expect(events.input.length).toBe(0);
        expect(events.change.length).toBe(0);
    });

    it('destroy 可重复调用', () => {
        const { disc } = createDisc();
        disc.destroy();
        expect(() => disc.destroy()).not.toThrow();
    });
});
