import type { DefineComponent } from 'vue'

/** 绑定值的格式 */
export type ColorFormat = 'rgb' | 'hex' | 'hsv' | 'hsl'

/** rgb 格式：通道 0~255，开启 alpha 时附带 a（0~1） */
export interface RgbColor {
    r: number
    g: number
    b: number
    a?: number
}

/** hsv 格式：h 0~360，s/v 0~100 */
export interface HsvColor {
    h: number
    s: number
    v: number
    a?: number
}

/** hsl 格式：h 0~360，s/l 0~100 */
export interface HslColor {
    h: number
    s: number
    l: number
    a?: number
}

/** hex 格式：#rgb / #rgba / #rrggbb / #rrggbbaa */
export type HexColor = string

export type ColorValue = RgbColor | HsvColor | HslColor | HexColor

export interface CanvasColorDiscProps {
    /** 当前颜色，Vue 2 下配合 v-model 使用 */
    value?: ColorValue
    /** 当前颜色，Vue 3 下配合 v-model 使用 */
    modelValue?: ColorValue
    /** 画布宽度（CSS 像素），'auto' 表示跟随容器 */
    width?: number | 'auto'
    /** 画布高度（CSS 像素），'auto' 表示跟随容器 */
    height?: number | 'auto'
    /** 绑定值格式，默认 rgb */
    format?: ColorFormat
    /** 是否保留并输出 alpha 分量，默认 false */
    alpha?: boolean
    /** 禁用指针与键盘交互，默认 false */
    disabled?: boolean
    /** 方向键步进（饱和度百分点 / 色相度数），按住 Shift 时 ×10，默认 1 */
    keyboardStep?: number
}

/** 通过 ref 调用的实例方法（Vue 2 下直接从 $refs 取到） */
export interface CanvasColorDiscExpose {
    /** 取当前颜色（对象格式为副本） */
    getColor(): ColorValue
    /** 设置颜色，值需符合当前 format；非法值被忽略 */
    setColor(value: ColorValue): void
    /** 重置为白色 */
    reset(): void
}

/**
 * 色盘取色组件
 *
 * Vue 2 与 Vue 3 的 props 完全一致，因此共用一份声明；
 * 区别只在入口路径（Vue 3 用 `canvas-color-disc`，Vue 2 用 `canvas-color-disc/vue2`）。
 */
declare const CanvasColorDisc: DefineComponent<CanvasColorDiscProps> & {
    install(app: unknown): void
} & CanvasColorDiscExpose

export default CanvasColorDisc
