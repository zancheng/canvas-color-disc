import { describe, expect, it } from 'vitest';
import {
    formatColor,
    hexToRgb,
    hslToHsv,
    hsvToHsl,
    hsvToRgb,
    isSameHsv,
    parseColor,
    rgbToHex,
    rgbToHsv
} from '../src/color';

describe('hsvToRgb', () => {
    it('转换三原色', () => {
        expect(hsvToRgb(0, 100, 100)).toEqual({ r: 255, g: 0, b: 0 });
        expect(hsvToRgb(120, 100, 100)).toEqual({ r: 0, g: 255, b: 0 });
        expect(hsvToRgb(240, 100, 100)).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('饱和度为 0 时按明度输出灰度', () => {
        expect(hsvToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
        expect(hsvToRgb(180, 0, 50)).toEqual({ r: 128, g: 128, b: 128 });
        expect(hsvToRgb(180, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('色相越界时归一化到 0~360', () => {
        expect(hsvToRgb(360, 100, 100)).toEqual(hsvToRgb(0, 100, 100));
        expect(hsvToRgb(-120, 100, 100)).toEqual(hsvToRgb(240, 100, 100));
        expect(hsvToRgb(720, 100, 100)).toEqual(hsvToRgb(0, 100, 100));
    });

    it('饱和度与明度越界时收敛到 0~100', () => {
        expect(hsvToRgb(0, -20, 100)).toEqual(hsvToRgb(0, 0, 100));
        expect(hsvToRgb(0, 150, 100)).toEqual(hsvToRgb(0, 100, 100));
        expect(hsvToRgb(0, 100, 150)).toEqual(hsvToRgb(0, 100, 100));
    });
});

describe('rgbToHsv', () => {
    it('转换无彩色', () => {
        expect(rgbToHsv(255, 255, 255)).toEqual({ h: 0, s: 0, v: 100 });
        expect(rgbToHsv(0, 0, 0)).toEqual({ h: 0, s: 0, v: 0 });
    });

    it('转换三原色', () => {
        expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 100, v: 100 });
        expect(rgbToHsv(0, 255, 0)).toEqual({ h: 120, s: 100, v: 100 });
        expect(rgbToHsv(0, 0, 255)).toEqual({ h: 240, s: 100, v: 100 });
    });

    // 色盘只用到 V=100，需保证 HSV -> RGB -> HSV 能还原色相与饱和度
    it('与 hsvToRgb 在 V=100 时可往返（允许量化误差）', () => {
        for (let h = 0; h < 360; h += 10) {
            [60, 100].forEach((s) => {
                const rgb = hsvToRgb(h, s, 100);
                const back = rgbToHsv(rgb.r, rgb.g, rgb.b);
                expect(back.v).toBe(100);
                expect(Math.abs(back.s - s)).toBeLessThanOrEqual(1);
                // 色相差需按圆周距离计算，避免 359 与 0 被判为大偏差
                const diff = Math.min(Math.abs(back.h - h), 360 - Math.abs(back.h - h));
                expect(diff).toBeLessThanOrEqual(1.5);
            });
        }
    });
});

describe('hsvToHsl / hslToHsv', () => {
    it('转换纯色与黑白', () => {
        expect(hsvToHsl(0, 100, 100)).toEqual({ h: 0, s: 100, l: 50 });
        expect(hsvToHsl(120, 100, 100)).toEqual({ h: 120, s: 100, l: 50 });
        expect(hsvToHsl(0, 0, 100)).toEqual({ h: 0, s: 0, l: 100 });
        expect(hsvToHsl(0, 0, 0)).toEqual({ h: 0, s: 0, l: 0 });
    });

    it('可往返', () => {
        for (let h = 0; h < 360; h += 15) {
            [25, 50, 75, 100].forEach((s) => {
                [20, 50, 80].forEach((v) => {
                    const hsl = hsvToHsl(h, s, v);
                    const back = hslToHsv(hsl.h, hsl.s, hsl.l);
                    expect(Math.abs(back.h - h)).toBeLessThanOrEqual(1);
                    expect(Math.abs(back.s - s)).toBeLessThanOrEqual(1);
                    expect(Math.abs(back.v - v)).toBeLessThanOrEqual(1);
                });
            });
        }
    });
});

describe('rgbToHex / hexToRgb', () => {
    it('输出 6 位小写 hex', () => {
        expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
        expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
        expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
        expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
    });

    it('传入 alpha 时输出 8 位 hex', () => {
        expect(rgbToHex({ r: 255, g: 0, b: 0 }, 0)).toBe('#ff000000');
        expect(rgbToHex({ r: 255, g: 0, b: 0 }, 1)).toBe('#ff0000ff');
    });

    it('解析 3/4/6/8 位 hex', () => {
        expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
        expect(hexToRgb('f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
        expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
        expect(hexToRgb('#ff000080').a).toBeCloseTo(128 / 255);
    });

    it('非法 hex 返回 null', () => {
        expect(hexToRgb('#12345')).toBeNull();
        expect(hexToRgb('rgb(1,2,3)')).toBeNull();
        expect(hexToRgb('')).toBeNull();
    });

    it('与 hsvToRgb 可往返', () => {
        const rgb = hsvToRgb(210, 80, 100);
        expect(hexToRgb(rgbToHex(rgb))).toEqual({ r: rgb.r, g: rgb.g, b: rgb.b, a: 1 });
    });
});

describe('parseColor', () => {
    it('解析 rgb 对象', () => {
        const parsed = parseColor({ r: 255, g: 0, b: 0 }, 'rgb');
        expect(parsed.h).toBeCloseTo(0);
        expect(parsed.s).toBeCloseTo(100);
        expect(parsed.v).toBeCloseTo(100);
        expect(parsed.a).toBe(1);
    });

    it('解析 hex 字符串', () => {
        const parsed = parseColor('#00ff00', 'hex');
        expect(parsed.h).toBeCloseTo(120);
        expect(parsed.v).toBeCloseTo(100);
    });

    it('按 format 区分 hsv 与 hsl', () => {
        const hsv = parseColor({ h: 0, s: 100, v: 50 }, 'hsv');
        expect(hsv.v).toBeCloseTo(50);
        const hsl = parseColor({ h: 0, s: 100, l: 50 }, 'hsl');
        expect(hsl.v).toBeCloseTo(100);
        expect(hsl.s).toBeCloseTo(100);
    });

    it('未指定 format 时按字段推断', () => {
        expect(parseColor({ r: 0, g: 0, b: 255 }, 'rgb').h).toBeCloseTo(240);
        expect(parseColor({ h: 90, s: 50, v: 100 }, 'rgb').h).toBeCloseTo(90);
        // hsl(90, 50%, 40%) 对应 v = l + s * min(l, 1 - l) = 60
        expect(parseColor({ h: 90, s: 50, l: 40 }, 'rgb').v).toBeCloseTo(60);
    });

    it('读取并收敛 alpha', () => {
        expect(parseColor({ r: 0, g: 0, b: 0, a: 0.5 }, 'rgb').a).toBe(0.5);
        expect(parseColor({ r: 0, g: 0, b: 0, a: 3 }, 'rgb').a).toBe(1);
        expect(parseColor({ r: 0, g: 0, b: 0, a: -1 }, 'rgb').a).toBe(0);
    });

    it('非法值返回 null', () => {
        expect(parseColor(null, 'rgb')).toBeNull();
        expect(parseColor(42, 'rgb')).toBeNull();
        expect(parseColor({}, 'rgb')).toBeNull();
        expect(parseColor('not-a-color', 'hex')).toBeNull();
    });
});

describe('formatColor', () => {
    const hsv = { h: 0, s: 100, v: 100 };

    it('按 format 输出对应结构', () => {
        expect(formatColor(hsv, 1, 'rgb', false)).toEqual({ r: 255, g: 0, b: 0 });
        expect(formatColor(hsv, 1, 'hex', false)).toBe('#ff0000');
        expect(formatColor(hsv, 1, 'hsv', false)).toEqual({ h: 0, s: 100, v: 100 });
        expect(formatColor({ h: 0, s: 100, v: 100 }, 1, 'hsl', false)).toEqual({ h: 0, s: 100, l: 50 });
    });

    it('开启 alpha 时附带 a 分量', () => {
        expect(formatColor(hsv, 0.5, 'rgb', true)).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
        expect(formatColor(hsv, 0.5, 'hex', true)).toBe('#ff000080');
        expect(formatColor(hsv, 0.5, 'hsv', true).a).toBe(0.5);
        expect(formatColor(hsv, 0.5, 'hsl', true).a).toBe(0.5);
    });

    it('保留明度，使外部值可无损往返', () => {
        const parsed = parseColor({ r: 128, g: 128, b: 128 }, 'rgb');
        expect(parsed.v).toBeCloseTo(128 / 255 * 100, 0);
        expect(formatColor(parsed, parsed.a, 'rgb', false)).toEqual({ r: 128, g: 128, b: 128 });
    });
});

describe('isSameHsv', () => {
    it('比较四个分量', () => {
        const base = { h: 10, s: 20, v: 30, a: 1 };
        expect(isSameHsv(base, { h: 10, s: 20, v: 30, a: 1 })).toBe(true);
        expect(isSameHsv(base, { h: 11, s: 20, v: 30, a: 1 })).toBe(false);
        expect(isSameHsv(base, { h: 10, s: 20, v: 30, a: 0.5 })).toBe(false);
        expect(isSameHsv(base, null)).toBe(false);
    });
});
