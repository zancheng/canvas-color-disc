import Vue from 'vue';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import CanvasColorDisc from '../src/index';

/**
 * jsdom 不实现 canvas，这里打一个最小 2d 上下文桩，
 * 只保证组件绘制流程能跑通，像素结果由 util.test.js 单独覆盖
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
        clip() {},
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

const mounted = [];

// 画布尺寸与几何参数在 $nextTick 里初始化，挂载后需等一拍再断言
async function mount(props) {
    const vm = new Vue({
        render(h) {
            return h(CanvasColorDisc, { props: props || {} });
        }
    });
    vm.$mount();
    await Vue.nextTick();
    mounted.push(vm);
    return {
        vm,
        component: vm.$children[0]
    };
}

beforeAll(() => {
    installCanvasStub();
    installRectStub();
});

afterEach(() => {
    while (mounted.length) {
        mounted.pop().$destroy();
    }
});

describe('CanvasColorDisc 挂载', () => {
    it('渲染两个画布并设置显示尺寸', async() => {
        const { component } = await mount({ width: 300, height: 200 });
        const canvases = component.$el.querySelectorAll('canvas');
        expect(canvases.length).toBe(2);
        expect(canvases[0].style.width).toBe('300px');
        expect(canvases[0].style.height).toBe('200px');
    });

    it('几何参数按短边计算，圆心居中', async() => {
        const { component } = await mount({ width: 300, height: 200 });
        expect(component.centerX).toBe(150);
        expect(component.centerY).toBe(100);
        // 留白按比例收敛在 8~18，半径 = 短边半径 - 留白
        expect(component.radius).toBeGreaterThan(80);
        expect(component.radius).toBeLessThan(100);
    });
});

describe('v-model 输出格式', () => {
    it('默认输出 rgb 对象', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 } });
        expect(component.outputColor).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('format=hex 输出字符串', async() => {
        const { component } = await mount({ value: '#ff0000', format: 'hex' });
        expect(component.outputColor).toBe('#ff0000');
    });

    it('format=hsv 输出 h/s/v', async() => {
        const { component } = await mount({ value: { h: 0, s: 100, v: 100 }, format: 'hsv' });
        expect(component.outputColor).toEqual({ h: 0, s: 100, v: 100 });
    });

    it('format=hsl 输出 h/s/l', async() => {
        const { component } = await mount({ value: { h: 0, s: 100, l: 50 }, format: 'hsl' });
        expect(component.outputColor).toEqual({ h: 0, s: 100, l: 50 });
    });

    it('alpha=true 时附带 a 分量', async() => {
        const { component } = await mount({
            value: { r: 255, g: 0, b: 0, a: 0.5 },
            format: 'rgb',
            alpha: true
        });
        expect(component.outputColor).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    });

    it('alpha=false 时忽略传入的 a', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0, a: 0.5 }, format: 'rgb' });
        expect(component.outputColor).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('保留明度，灰色不会被拉成纯色', async() => {
        const { component } = await mount({ value: { r: 128, g: 128, b: 128 } });
        expect(component.hsv.v).toBeCloseTo(128 / 255 * 100, 0);
        expect(component.outputColor).toEqual({ r: 128, g: 128, b: 128 });
    });

    it('外部改值后同步内部状态', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 } });
        component.applyPropValue({ r: 0, g: 0, b: 255 });
        await Vue.nextTick();
        expect(component.outputColor).toEqual({ r: 0, g: 0, b: 255 });
    });
});

describe('交互', () => {
    function pointerEvent(type, x, y) {
        const event = new window.Event(type, { bubbles: true });
        event.clientX = x;
        event.clientY = y;
        event.pointerId = 1;
        event.button = 0;
        event.isPrimary = true;
        return event;
    }

    it('按下并抬起后派发 input 与 change', async() => {
        const emitted = { input: [], change: [] };
        const { component } = await mount({ value: { r: 255, g: 255, b: 255 } });
        component.$on('input', (value) => emitted.input.push(value));
        component.$on('change', (value) => emitted.change.push(value));
        const canvas = component.$el.querySelectorAll('canvas')[1];
        canvas.dispatchEvent(pointerEvent('pointerdown', 150 + 60, 150));
        // 取色更新走 requestAnimationFrame，等一帧
        await new Promise((resolve) => requestAnimationFrame(resolve));
        canvas.dispatchEvent(pointerEvent('pointerup', 150 + 60, 150));
        expect(emitted.input.length).toBeGreaterThan(0);
        expect(emitted.change.length).toBe(1);
        // 圆心右侧取到红色系：红通道最高
        expect(emitted.change[0].r).toBeGreaterThan(emitted.change[0].b);
    });

    it('disabled 时不响应指针', async() => {
        const { component } = await mount({ value: { r: 255, g: 255, b: 255 }, disabled: true });
        const canvas = component.$el.querySelectorAll('canvas')[1];
        canvas.dispatchEvent(pointerEvent('pointerdown', 200, 150));
        expect(component.dragging).toBe(false);
        expect(component.hsv.s).toBe(0);
    });

    it('右键（非主键）不触发取色', async() => {
        const { component } = await mount({ value: { r: 255, g: 255, b: 255 } });
        const canvas = component.$el.querySelectorAll('canvas')[1];
        const event = pointerEvent('pointerdown', 200, 150);
        event.button = 2;
        canvas.dispatchEvent(event);
        expect(component.dragging).toBe(false);
    });

    it('多指触摸时第二根手指不接管拖动', async() => {
        const { component } = await mount({ value: { r: 255, g: 255, b: 255 } });
        const canvas = component.$el.querySelectorAll('canvas')[1];
        const event = pointerEvent('pointerdown', 200, 150);
        event.isPrimary = false;
        canvas.dispatchEvent(event);
        expect(component.dragging).toBe(false);
    });
});

describe('键盘操作', () => {
    function keyEvent(key, shiftKey) {
        const event = new window.Event('keydown', { bubbles: true });
        event.key = key;
        event.shiftKey = !!shiftKey;
        return event;
    }

    it('方向键调整色相与饱和度并派发 change', async() => {
        const emitted = [];
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 } });
        component.$on('change', (value) => emitted.push(value));
        const surface = component.$el.querySelector('.disc-surface');
        surface.dispatchEvent(keyEvent('ArrowRight'));
        expect(component.hsv.h).toBeCloseTo(1);
        expect(emitted.length).toBe(1);
        surface.dispatchEvent(keyEvent('ArrowUp'));
        expect(component.hsv.s).toBeCloseTo(100);
    });

    it('按住 Shift 按十倍步进', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 } });
        const surface = component.$el.querySelector('.disc-surface');
        surface.dispatchEvent(keyEvent('ArrowRight', true));
        expect(component.hsv.h).toBeCloseTo(10);
    });

    it('Home / End 把饱和度归零与拉满', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 } });
        const surface = component.$el.querySelector('.disc-surface');
        surface.dispatchEvent(keyEvent('Home'));
        expect(component.hsv.s).toBe(0);
        surface.dispatchEvent(keyEvent('End'));
        expect(component.hsv.s).toBe(100);
    });

    it('无关按键不拦截', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 } });
        const surface = component.$el.querySelector('.disc-surface');
        const event = keyEvent('Tab');
        surface.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
        expect(component.hsv.s).toBeCloseTo(100);
    });

    it('disabled 时忽略键盘', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 }, disabled: true });
        const surface = component.$el.querySelector('.disc-surface');
        expect(surface.getAttribute('tabindex')).toBe('-1');
        surface.dispatchEvent(keyEvent('ArrowRight'));
        expect(component.hsv.h).toBeCloseTo(0);
    });
});

describe('实例方法', () => {
    it('getColor 返回当前颜色副本', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 } });
        const color = component.getColor();
        expect(color).toEqual({ r: 255, g: 0, b: 0 });
        color.r = 0;
        expect(component.outputColor.r).toBe(255);
    });

    it('setColor 更新颜色并派发 change', async() => {
        const emitted = [];
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 } });
        component.$on('change', (value) => emitted.push(value));
        component.setColor({ r: 0, g: 128, b: 255 });
        expect(component.outputColor).toEqual({ r: 0, g: 128, b: 255 });
        expect(emitted.length).toBe(1);
    });

    it('setColor 忽略非法值', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 } });
        component.setColor('not-a-color');
        expect(component.outputColor).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('reset 回到不透明的白色', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 }, format: 'hex' });
        component.reset();
        expect(component.outputColor).toBe('#ffffff');
    });
});

describe('可访问性与自适应', () => {
    it('交互元素带 slider 语义与 aria 文本', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 } });
        const surface = component.$el.querySelector('.disc-surface');
        expect(surface.getAttribute('role')).toBe('slider');
        expect(surface.getAttribute('tabindex')).toBe('0');
        expect(surface.getAttribute('aria-valuetext')).toContain('色相');
        expect(surface.getAttribute('aria-disabled')).toBe('false');
    });

    it('disabled 时标记 aria-disabled', async() => {
        const { component } = await mount({ value: { r: 255, g: 0, b: 0 }, disabled: true });
        const surface = component.$el.querySelector('.disc-surface');
        expect(surface.getAttribute('aria-disabled')).toBe('true');
    });

    it('auto 尺寸下容器样式改为撑满父级', async() => {
        const { component } = await mount({ width: 'auto', height: 200 });
        expect(component.$el.style.width).toBe('100%');
        expect(component.isAutoWidth).toBe(true);
    });
});
