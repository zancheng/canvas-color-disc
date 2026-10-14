/**
 * <canvas-color-disc> 自定义元素
 *
 * 基于 CanvasColorDiscCore + Shadow DOM：样式随核心一起注入影子树，页面无需引入 CSS。
 * attribute / property 与核心选项一一对应，颜色变化通过冒泡的 input / change 事件送出，
 * 因此在 HTML、React、Vue、Angular 等任何环境里都可以当原生标签使用。
 */
import { CanvasColorDiscCore, DEFAULTS } from './core';

export const TAG_NAME = 'canvas-color-disc';

// 非浏览器环境（SSR / Node）降级为空基类，保证模块可被安全引入
const HTMLElementBase = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

// 宿主布局：与核心根节点保持一致的内联行为
const HOST_CSS = ':host { display: inline-block; } :host([hidden]) { display: none; }';

export class CanvasColorDiscElement extends HTMLElementBase {
    static get observedAttributes() {
        return ['value', 'format', 'width', 'height', 'alpha', 'disabled', 'keyboard-step'];
    }

    constructor() {
        super();
        this._core = null;
        this._pendingValue = undefined;
        this._shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        if (this._core) {
            return;
        }
        // 重新插入文档时清掉上一轮的残留节点（核心 DOM 已在 disconnectedCallback 中移除）
        this._shadow.innerHTML = '';
        const doc = this._shadow.ownerDocument;
        const hostStyle = doc.createElement('style');
        hostStyle.textContent = HOST_CSS;
        this._shadow.appendChild(hostStyle);
        this._core = new CanvasColorDiscCore(this._shadow, this._collectOptions());
        this._core.addEventListener('input', (event) => this._forwardEvent('input', event));
        this._core.addEventListener('change', (event) => this._forwardEvent('change', event));
        this._appendPaletteSlot();
    }

    disconnectedCallback() {
        if (!this._core) {
            return;
        }
        // 保留当前颜色，重新插入文档后恢复
        this._pendingValue = this._core.getColor();
        this._core.destroy();
        this._core = null;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue || !this._core) {
            return;
        }
        if (name === 'value') {
            if (newValue !== null) {
                this._core.setOptions({ value: newValue });
            }
            return;
        }
        if (name === 'alpha' || name === 'disabled') {
            this._core.setOptions({ [name]: this._readBooleanAttribute(name) });
            return;
        }
        if (name === 'keyboard-step') {
            this._core.setOptions({
                keyboardStep: newValue === null ? DEFAULTS.keyboardStep : parseFloat(newValue)
            });
            return;
        }
        if (name === 'format') {
            this._core.setOptions({ format: newValue === null ? DEFAULTS.format : newValue });
            return;
        }
        // width / height
        this._core.setOptions({ [name]: newValue === null ? DEFAULTS[name] : newValue });
    }

    /** 当前颜色（对象格式为副本），未连接时返回待应用的初始值 */
    get value() {
        if (this._core) {
            return this._core.getColor();
        }
        return this._pendingValue !== undefined ? this._pendingValue : null;
    }

    // 对象值无法序列化为 attribute，value 只作为 property 保留，不做属性回写
    set value(next) {
        this._pendingValue = next;
        if (this._core) {
            this._core.setOptions({ value: next });
        }
    }

    get format() {
        const attr = this.getAttribute('format');
        return attr === null ? DEFAULTS.format : attr;
    }

    set format(next) {
        this._setStringAttribute('format', next);
    }

    get width() {
        return this._readSizeAttribute('width');
    }

    set width(next) {
        this._setStringAttribute('width', next);
    }

    get height() {
        return this._readSizeAttribute('height');
    }

    set height(next) {
        this._setStringAttribute('height', next);
    }

    get alpha() {
        return this._readBooleanAttribute('alpha');
    }

    set alpha(next) {
        this._setBooleanAttribute('alpha', next);
    }

    get disabled() {
        return this._readBooleanAttribute('disabled');
    }

    set disabled(next) {
        this._setBooleanAttribute('disabled', next);
    }

    get keyboardStep() {
        const attr = this.getAttribute('keyboard-step');
        return attr === null ? DEFAULTS.keyboardStep : parseFloat(attr);
    }

    set keyboardStep(next) {
        if (next === null || next === undefined) {
            this.removeAttribute('keyboard-step');
        } else {
            this.setAttribute('keyboard-step', String(next));
        }
    }

    /** 取当前颜色（对象格式为副本） */
    getColor() {
        return this.value;
    }

    /** 设置颜色，值需符合当前 format，非法值被忽略；会同时派发 input 与 change */
    setColor(value) {
        if (this._core) {
            this._core.setColor(value);
        } else {
            this._pendingValue = value;
        }
    }

    /** 重置为白色 */
    reset() {
        if (this._core) {
            this._core.reset();
        } else {
            this._pendingValue = { ...DEFAULTS.value };
        }
    }

    // palette 插槽：渲染在色盘下方；无内容时隐藏，避免撑出空隙
    _appendPaletteSlot() {
        const doc = this._shadow.ownerDocument;
        const palette = doc.createElement('div');
        palette.className = 'disc-palette';
        const slot = doc.createElement('slot');
        slot.name = 'palette';
        const updateVisibility = () => {
            palette.hidden = slot.assignedNodes().length === 0;
        };
        slot.addEventListener('slotchange', updateVisibility);
        palette.appendChild(slot);
        this._core.element.appendChild(palette);
        updateVisibility();
    }

    // 把核心事件转发为冒泡、可穿透影子树的组件事件
    _forwardEvent(type, event) {
        this.dispatchEvent(new CustomEvent(type, {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }

    // 汇总 attribute 与 property 上的初始值，交给核心
    _collectOptions() {
        const options = {};
        if (this._pendingValue !== undefined) {
            options.value = this._pendingValue;
        } else if (this.hasAttribute('value')) {
            options.value = this.getAttribute('value');
        }
        ['format', 'width', 'height'].forEach((name) => {
            if (this.hasAttribute(name)) {
                options[name] = this.getAttribute(name);
            }
        });
        if (this.hasAttribute('keyboard-step')) {
            options.keyboardStep = parseFloat(this.getAttribute('keyboard-step'));
        }
        options.alpha = this._readBooleanAttribute('alpha');
        options.disabled = this._readBooleanAttribute('disabled');
        return options;
    }

    // boolean attribute 以存在性为准，显式写 false 时视为关闭
    _readBooleanAttribute(name) {
        return this.hasAttribute(name) && this.getAttribute(name) !== 'false';
    }

    _readSizeAttribute(name) {
        const attr = this.getAttribute(name);
        if (attr === null) {
            return DEFAULTS[name];
        }
        return attr === 'auto' ? 'auto' : parseFloat(attr);
    }

    _setStringAttribute(name, next) {
        if (next === null || next === undefined) {
            this.removeAttribute(name);
        } else {
            this.setAttribute(name, String(next));
        }
    }

    _setBooleanAttribute(name, next) {
        if (next) {
            this.setAttribute(name, '');
        } else {
            this.removeAttribute(name);
        }
    }
}

// 本类是否已注册过（规范限制：同一构造函数只能注册一个标签名）
let registered = false;

/**
 * 注册自定义元素，默认标签名 <canvas-color-disc>；
 * 仅在尚未注册过本组件且标签名未被占用时生效，注册成功返回 true。
 * 需要额外标签名时，可继承 CanvasColorDiscElement 后自行 define。
 */
export function defineCustomElement(tagName) {
    const name = tagName || TAG_NAME;
    if (typeof window === 'undefined' || !window.customElements) {
        return false;
    }
    if (registered || window.customElements.get(name)) {
        return false;
    }
    window.customElements.define(name, CanvasColorDiscElement);
    registered = true;
    return true;
}
