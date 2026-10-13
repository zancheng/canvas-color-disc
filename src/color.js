/**
 * 颜色空间转换与格式化
 *
 * 组件内部统一以 HSV（h 0~360、s/v 0~100）+ alpha（0~1）保存颜色：
 * 色盘本身就是 HSV 模型，用 HSV 做权威状态可避免 RGB 往返带来的精度损失。
 */

// #rgb / #rgba / #rrggbb / #rrggbbaa
const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function normalizeHue(h) {
    const hue = typeof h === 'number' && !Number.isNaN(h) ? h : 0;
    return ((hue % 360) + 360) % 360;
}

export function normalizeAlpha(a) {
    return typeof a === 'number' && !Number.isNaN(a) ? clamp(a, 0, 1) : 1;
}

function round(value, digits) {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
}

function toHexPart(value) {
    const hex = clamp(Math.round(value), 0, 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

/**
 * HSV 转 RGB
 * @param {number} h 色相 0~360
 * @param {number} s 饱和度 0~100
 * @param {number} v 明度 0~100
 * @returns {{r: number, g: number, b: number}} 0~255
 */
export function hsvToRgb(h, s, v) {
    const hue = normalizeHue(h);
    const saturation = clamp(s, 0, 100) / 100;
    const value = clamp(v, 0, 100) / 100;
    const sector = Math.floor(hue / 60);
    const fraction = hue / 60 - sector;
    const p = value * (1 - saturation);
    const q = value * (1 - saturation * fraction);
    const t = value * (1 - saturation * (1 - fraction));
    let r = 0;
    let g = 0;
    let b = 0;
    switch (sector) {
    case 0:
        r = value;
        g = t;
        b = p;
        break;
    case 1:
        r = q;
        g = value;
        b = p;
        break;
    case 2:
        r = p;
        g = value;
        b = t;
        break;
    case 3:
        r = p;
        g = q;
        b = value;
        break;
    case 4:
        r = t;
        g = p;
        b = value;
        break;
    default:
        r = value;
        g = p;
        b = q;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 * RGB 转 HSV
 * @param {number} r 0~255
 * @param {number} g 0~255
 * @param {number} b 0~255
 * @returns {{h: number, s: number, v: number}} h 0~360，s/v 0~100
 */
export function rgbToHsv(r, g, b) {
    const red = clamp(r, 0, 255) / 255;
    const green = clamp(g, 0, 255) / 255;
    const blue = clamp(b, 0, 255) / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    let h = 0;
    if (delta !== 0) {
        if (max === red) {
            h = 60 * (((green - blue) / delta) % 6);
        } else if (max === green) {
            h = 60 * ((blue - red) / delta + 2);
        } else {
            h = 60 * ((red - green) / delta + 4);
        }
        if (h < 0) {
            h += 360;
        }
    }
    return {
        h,
        s: max === 0 ? 0 : (delta / max) * 100,
        v: max * 100
    };
}

/**
 * HSV 转 HSL
 * @returns {{h: number, s: number, l: number}} h 0~360，s/l 0~100
 */
export function hsvToHsl(h, s, v) {
    const saturation = clamp(s, 0, 100) / 100;
    const value = clamp(v, 0, 100) / 100;
    const l = value * (1 - saturation / 2);
    const s2 = l === 0 || l === 1 ? 0 : (value - l) / Math.min(l, 1 - l);
    return {
        h: normalizeHue(h),
        s: s2 * 100,
        l: l * 100
    };
}

/**
 * HSL 转 HSV
 * @returns {{h: number, s: number, v: number}} h 0~360，s/v 0~100
 */
export function hslToHsv(h, s, l) {
    const saturation = clamp(s, 0, 100) / 100;
    const lightness = clamp(l, 0, 100) / 100;
    const value = lightness + saturation * Math.min(lightness, 1 - lightness);
    const saturation2 = value === 0 ? 0 : 2 * (1 - lightness / value);
    return {
        h: normalizeHue(h),
        s: saturation2 * 100,
        v: value * 100
    };
}

/**
 * RGB 转 hex 字符串
 * @param {{r: number, g: number, b: number}} rgb 0~255
 * @param {number|null} alpha 0~1，传入时输出 8 位 hex
 */
export function rgbToHex(rgb, alpha) {
    const hex = '#' + toHexPart(rgb.r) + toHexPart(rgb.g) + toHexPart(rgb.b);
    return alpha === null || alpha === undefined
        ? hex
        : hex + toHexPart(alpha * 255);
}

/**
 * hex 字符串转 RGB，格式非法时返回 null
 * @returns {{r: number, g: number, b: number, a: number}|null} a 为 0~1
 */
export function hexToRgb(hex) {
    const match = HEX_PATTERN.exec(String(hex).trim());
    if (!match) {
        return null;
    }
    let value = match[1];
    if (value.length < 6) {
        value = value.split('').map((char) => char + char).join('');
    }
    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
        a: value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1
    };
}

/**
 * 把外部传入的颜色值解析为内部 HSV 表示
 *
 * 字符串一律按 hex 解析；对象的分支由 format 决定，
 * 未显式指定 format 时按字段推断（{r,g,b} / {h,s,v} / {h,s,l}）。
 * @param {object|string} value 外部颜色值
 * @param {string} format 'rgb' | 'hex' | 'hsv' | 'hsl'
 * @returns {{h: number, s: number, v: number, a: number}|null}
 */
export function parseColor(value, format) {
    if (typeof value === 'string') {
        const rgb = hexToRgb(value);
        if (!rgb) {
            return null;
        }
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        return { h: hsv.h, s: hsv.s, v: hsv.v, a: rgb.a };
    }
    if (!value || typeof value !== 'object') {
        return null;
    }
    const has = (key) => typeof value[key] === 'number' && !Number.isNaN(value[key]);
    if (format === 'hsv' || (has('h') && has('s') && has('v'))) {
        return {
            h: normalizeHue(value.h),
            s: clamp(value.s, 0, 100),
            v: clamp(value.v, 0, 100),
            a: normalizeAlpha(value.a)
        };
    }
    if (format === 'hsl' || (has('h') && has('s') && has('l'))) {
        const hsv = hslToHsv(value.h, value.s, value.l);
        return { h: hsv.h, s: hsv.s, v: hsv.v, a: normalizeAlpha(value.a) };
    }
    if (has('r') && has('g') && has('b')) {
        const hsv = rgbToHsv(value.r, value.g, value.b);
        return { h: hsv.h, s: hsv.s, v: hsv.v, a: normalizeAlpha(value.a) };
    }
    return null;
}

/**
 * 把内部 HSV 表示输出为外部颜色值
 * @param {{h: number, s: number, v: number}} hsv
 * @param {number} alpha 0~1
 * @param {string} format 'rgb' | 'hex' | 'hsv' | 'hsl'
 * @param {boolean} withAlpha 是否输出 alpha 分量
 */
export function formatColor(hsv, alpha, format, withAlpha) {
    const a = round(normalizeAlpha(alpha), 3);
    if (format === 'hex') {
        return rgbToHex(hsvToRgb(hsv.h, hsv.s, hsv.v), withAlpha ? a : null);
    }
    if (format === 'hsv') {
        const result = { h: round(hsv.h, 2), s: round(hsv.s, 2), v: round(hsv.v, 2) };
        if (withAlpha) {
            result.a = a;
        }
        return result;
    }
    if (format === 'hsl') {
        const hsl = hsvToHsl(hsv.h, hsv.s, hsv.v);
        const result = { h: round(hsl.h, 2), s: round(hsl.s, 2), l: round(hsl.l, 2) };
        if (withAlpha) {
            result.a = a;
        }
        return result;
    }
    const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    const result = { r: rgb.r, g: rgb.g, b: rgb.b };
    if (withAlpha) {
        result.a = a;
    }
    return result;
}

/**
 * 比较两组内部 HSV 表示是否一致（用于判断外部值变化是否需要同步）
 */
export function isSameHsv(a, b) {
    return !!a && !!b && a.h === b.h && a.s === b.s && a.v === b.v && a.a === b.a;
}
