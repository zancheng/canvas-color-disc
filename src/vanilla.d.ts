import type { ColorFormat, ColorValue } from './index'

/** 色盘选项：构造与 setOptions 共用 */
export interface CanvasColorDiscOptions {
    /** 初始颜色，形状由 format 决定，默认白色 */
    value?: ColorValue
    /** 画布宽度（CSS 像素），'auto' 表示跟随容器，默认 300 */
    width?: number | 'auto'
    /** 画布高度（CSS 像素），'auto' 表示跟随容器，默认 300 */
    height?: number | 'auto'
    /** 颜色格式，默认 rgb */
    format?: ColorFormat
    /** 是否保留并输出 alpha 分量，默认 false */
    alpha?: boolean
    /** 禁用指针与键盘交互，默认 false */
    disabled?: boolean
    /** 方向键步进，按住 Shift 时 ×10，默认 1 */
    keyboardStep?: number
}

/** 颜色事件：input 在颜色变化时实时触发，change 在一次选择结束时触发 */
export type CanvasColorDiscEventType = 'input' | 'change'

/**
 * 框架无关核心：把色盘挂载到容器元素或 ShadowRoot
 *
 * 样式自动注入（ShadowRoot 注入影子树，普通文档只注入一次）；
 * 通过 addEventListener('input' | 'change', (event) => event.detail) 接收颜色。
 */
export declare class CanvasColorDiscCore extends EventTarget {
    constructor(root: Element | ShadowRoot | string, options?: CanvasColorDiscOptions)
    /** 组件根节点（class="canvas-color-disc"），可向其中追加自定义内容 */
    readonly element: HTMLElement
    /** 是否处于拖动取色中 */
    readonly dragging: boolean
    /** 取当前颜色，对象格式为副本 */
    getColor(): ColorValue
    /** 设置颜色，值需符合当前 format，非法值被忽略；会同时派发 input 与 change */
    setColor(value: ColorValue): void
    /** 重置为白色 */
    reset(): void
    /** 增量更新选项；value 为静默同步（不派发事件） */
    setOptions(options: CanvasColorDiscOptions): void
    /** 移除事件监听、观察器与生成的 DOM */
    destroy(): void
}

/**
 * <canvas-color-disc> 自定义元素（Shadow DOM 隔离样式，无需引入 CSS）
 *
 * attribute 与 property 同名：value / format / width / height / alpha / disabled，
 * keyboard-step 对应 property keyboardStep；value 为对象时只能通过 property 设置。
 * 事件 input / change 冒泡且可穿透影子树，detail 为当前颜色。
 */
export declare class CanvasColorDiscElement extends HTMLElement {
    value: ColorValue | null
    format: ColorFormat
    width: number | 'auto'
    height: number | 'auto'
    alpha: boolean
    disabled: boolean
    keyboardStep: number
    getColor(): ColorValue | null
    setColor(value: ColorValue): void
    reset(): void
}

/** 注册自定义元素，默认标签名 canvas-color-disc；已注册或环境不支持时返回 false */
export declare function defineCustomElement(tagName?: string): boolean
