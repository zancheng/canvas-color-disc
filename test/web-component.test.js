import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
// 引入入口即自动注册 <canvas-color-disc>
import { CanvasColorDiscCore, CanvasColorDiscElement, defineCustomElement } from '../src/vanilla';

// jsdom 不实现 canvas，打一个最小 2d 上下文桩（同 component.test.js）
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

function createDiscElement(attributes) {
    const el = document.createElement('canvas-color-disc');
    Object.keys(attributes || {}).forEach((name) => {
        el.setAttribute(name, attributes[name]);
    });
    document.body.appendChild(el);
    created.push(el);
    return el;
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

beforeAll(() => {
    installCanvasStub();
    installRectStub();
});

afterEach(() => {
    while (created.length) {
        const el = created.pop();
        el.remove();
    }
});

describe('自定义元素注册', () => {
    it('引入入口即自动注册', () => {
        expect(customElements.get('canvas-color-disc')).toBe(CanvasColorDiscElement);
    });

    it('已注册时 defineCustomElement 返回 false', () => {
        expect(defineCustomElement()).toBe(false);
        // 同一构造函数只能注册一个标签名（Custom Elements 规范），换名注册会被跳过
        expect(defineCustomElement('color-disc-test')).toBe(false);
    });

    it('未注册过时可注册指定标签名', async() => {
        vi.resetModules();
        const fresh = await import('../src/web-component');
        expect(fresh.defineCustomElement('fresh-color-disc')).toBe(true);
        expect(customElements.get('fresh-color-disc')).toBe(fresh.CanvasColorDiscElement);
        // 注册过一次后再调用返回 false
        expect(fresh.defineCustomElement()).toBe(false);
    });

    it('子类可注册到其他标签名', () => {
        class CustomDisc extends CanvasColorDiscElement {}
        customElements.define('custom-color-disc', CustomDisc);
        expect(customElements.get('custom-color-disc')).toBe(CustomDisc);
    });
});

describe('挂载与属性', () => {
    it('影子树内渲染两个画布与样式', () => {
        const el = createDiscElement({ width: '300', height: '200' });
        const canvases = el.shadowRoot.querySelectorAll('canvas');
        expect(canvases.length).toBe(2);
        expect(canvases[0].style.width).toBe('300px');
        expect(canvases[0].style.height).toBe('200px');
        // 宿主布局样式 + 组件样式都注入在影子树里
        expect(el.shadowRoot.querySelectorAll('style').length).toBeGreaterThan(0);
    });

    it('attribute 初始化颜色与格式', () => {
        const el = createDiscElement({ format: 'hex', value: '#ff0000' });
        expect(el.format).toBe('hex');
        expect(el.getColor()).toBe('#ff0000');
    });

    it('property 设置对象颜色并回写 attribute', () => {
        const el = createDiscElement();
        el.value = { r: 0, g: 0, b: 255 };
        expect(el.getColor()).toEqual({ r: 0, g: 0, b: 255 });
        el.format = 'hex';
        expect(el.getAttribute('format')).toBe('hex');
        expect(el.getColor()).toBe('#0000ff');
    });

    it('boolean 与数字属性以 attribute 为准', () => {
        const el = createDiscElement();
        expect(el.alpha).toBe(false);
        el.alpha = true;
        expect(el.hasAttribute('alpha')).toBe(true);
        el.alpha = false;
        expect(el.hasAttribute('alpha')).toBe(false);
        el.setAttribute('keyboard-step', '5');
        expect(el.keyboardStep).toBe(5);
        el.keyboardStep = 2;
        expect(el.getAttribute('keyboard-step')).toBe('2');
    });

    it('运行中修改 width 生效', () => {
        const el = createDiscElement();
        el.width = 200;
        expect(el.getAttribute('width')).toBe('200');
        expect(el.shadowRoot.querySelectorAll('canvas')[0].style.width).toBe('200px');
    });

    it('disabled 标记到交互元素', () => {
        const el = createDiscElement({ disabled: '' });
        const surface = el.shadowRoot.querySelector('.disc-surface');
        expect(surface.getAttribute('tabindex')).toBe('-1');
        expect(surface.getAttribute('aria-disabled')).toBe('true');
        el.removeAttribute('disabled');
        expect(surface.getAttribute('tabindex')).toBe('0');
    });
});

describe('事件与方法', () => {
    it('交互派发冒泡的 change 事件', async() => {
        const el = createDiscElement({ width: '300', height: '300' });
        const received = [];
        document.body.addEventListener('change', (event) => received.push(event.detail));
        const canvas = el.shadowRoot.querySelector('.disc-selector');
        canvas.dispatchEvent(pointerEvent('pointerdown', 210, 150));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        canvas.dispatchEvent(pointerEvent('pointerup', 210, 150));
        expect(received.length).toBe(1);
        // 圆心右侧取到红色系：红通道最高
        expect(received[0].r).toBeGreaterThan(received[0].b);
    });

    it('setColor 与 reset 生效', () => {
        const el = createDiscElement({ format: 'hex' });
        el.setColor('#00ff00');
        expect(el.getColor()).toBe('#00ff00');
        el.reset();
        expect(el.getColor()).toBe('#ffffff');
    });

    it('palette 插槽渲染在影子树中', () => {
        const el = document.createElement('canvas-color-disc');
        const extra = document.createElement('span');
        extra.setAttribute('slot', 'palette');
        extra.textContent = '预设色';
        el.appendChild(extra);
        document.body.appendChild(el);
        created.push(el);
        expect(el.shadowRoot.querySelector('slot[name="palette"]')).toBeTruthy();
    });

    it('移出文档再插入时保留颜色', () => {
        const el = createDiscElement({ format: 'hex' });
        el.setColor('#3366ff');
        el.remove();
        document.body.appendChild(el);
        expect(el.getColor()).toBe('#3366ff');
    });
});

describe('导出', () => {
    it('核心类可直接命令式使用', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const disc = new CanvasColorDiscCore(host, { value: { r: 255, g: 0, b: 0 } });
        expect(disc.getColor()).toEqual({ r: 255, g: 0, b: 0 });
        disc.destroy();
        host.remove();
    });
});
