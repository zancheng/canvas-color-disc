import { beforeEach, describe, expect, it } from 'vitest';
import {
    clearColorDiscCache,
    discToPoint,
    drawColorDisc,
    pointToDisc
} from '../src/util';

/**
 * drawColorDisc 只依赖 canvas 的像素缓冲，
 * 这里用最小桩替代真实 canvas，避免测试需要 DOM 环境
 */
function createContextStub(width, height) {
    const stub = {
        canvas: { width, height },
        image: null,
        createImageData(w, h) {
            return {
                width: w,
                height: h,
                data: new Uint8ClampedArray(w * h * 4)
            };
        },
        putImageData(img) {
            stub.image = img;
        }
    };
    return stub;
}

function pixelAt(image, x, y) {
    const index = (y * image.width + x) * 4;
    return {
        r: image.data[index],
        g: image.data[index + 1],
        b: image.data[index + 2],
        a: image.data[index + 3]
    };
}

describe('pointToDisc', () => {
    const centerX = 100;
    const centerY = 100;
    const radius = 100;

    it('按逆时针方向取色相，0 度位于圆心右侧', () => {
        expect(pointToDisc(centerX + 10, centerY, centerX, centerY, radius).h).toBeCloseTo(0);
        expect(pointToDisc(centerX, centerY - 10, centerX, centerY, radius).h).toBeCloseTo(90);
        expect(pointToDisc(centerX - 10, centerY, centerX, centerY, radius).h).toBeCloseTo(180);
        expect(pointToDisc(centerX, centerY + 10, centerX, centerY, radius).h).toBeCloseTo(270);
    });

    it('饱和度取到圆心的距离比例', () => {
        expect(pointToDisc(centerX + 50, centerY, centerX, centerY, radius).s).toBeCloseTo(50);
        expect(pointToDisc(centerX, centerY, centerX, centerY, radius).s).toBeCloseTo(0);
    });

    it('超出色盘时饱和度收敛到 100 并保留原始距离', () => {
        const disc = pointToDisc(centerX + 150, centerY, centerX, centerY, radius);
        expect(disc.s).toBe(100);
        expect(disc.dist).toBeCloseTo(150);
    });
});

describe('discToPoint', () => {
    it('与 pointToDisc 可往返', () => {
        const centerX = 100;
        const centerY = 100;
        const radius = 80;
        const point = discToPoint(90, 50, centerX, centerY, radius);
        expect(point.x).toBeCloseTo(centerX);
        expect(point.y).toBeCloseTo(centerY - 40);
        const disc = pointToDisc(point.x, point.y, centerX, centerY, radius);
        expect(disc.h).toBeCloseTo(90);
        expect(disc.s).toBeCloseTo(50);
    });
});

describe('drawColorDisc', () => {
    // 逻辑半径取非整数，使圆周落在像素中心之间，便于验证抗锯齿
    const dpr = 2;
    const center = 50;
    const radius = 48.25;
    const physicalRadius = radius * dpr;

    function render() {
        const stub = createContextStub(200, 200);
        drawColorDisc(stub, center, center, radius, dpr);
        return stub.image;
    }

    // 缓存命中会跳过计算，这里保证每个用例都走完整绘制路径
    beforeEach(() => {
        clearColorDiscCache();
    });

    it('圆心为白色', () => {
        const pixel = pixelAt(render(), 100, 100);
        expect(pixel).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    });

    it('色盘外不写入像素', () => {
        const pixel = pixelAt(render(), 0, 0);
        expect(pixel).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    });

    it('盘内像素不透明，且颜色沿半径由白过渡到纯色', () => {
        const image = render();
        const near = pixelAt(image, 100, 90);
        const far = pixelAt(image, 100, 10);
        expect(near.a).toBe(255);
        expect(far.a).toBe(255);
        // 同一色相下越靠近圆心越接近白色（正上方为绿色，取会衰减的蓝通道）
        expect(far.b).toBeLessThan(near.b);
    });

    it('色相按角度分布：正上方偏绿', () => {
        const pixel = pixelAt(render(), 100, 60);
        expect(pixel.g).toBe(255);
        expect(pixel.g).toBeGreaterThan(pixel.r);
        expect(pixel.g).toBeGreaterThan(pixel.b);
    });

    it('圆周最外一圈做透明度渐变', () => {
        const image = render();
        const edgeX = 100 + Math.floor(physicalRadius);
        const edge = pixelAt(image, edgeX, 100);
        expect(edge.a).toBeGreaterThan(0);
        expect(edge.a).toBeLessThan(255);
        // 再往内的相邻像素应完全不透明
        expect(pixelAt(image, edgeX - 1, 100).a).toBe(255);
    });

    // 色相关于水平轴对称：镜像复制优化必须与逐像素计算结果一致
    it('上下半区关于圆心水平行对称', () => {
        const image = render();
        for (let offset = 1; offset <= 80; offset += 7) {
            expect(pixelAt(image, 120, 100 + offset)).toEqual(pixelAt(image, 120, 100 - offset));
        }
    });

    it('几何参数不变时复用缓存，结果一致', () => {
        const first = render();
        const stub = createContextStub(200, 200);
        drawColorDisc(stub, center, center, radius, dpr);
        // 命中缓存时不再新建 ImageData，直接复用上一次的数据
        expect(stub.image.data).toEqual(first.data);
    });

    it('几何参数变化后重新计算', () => {
        render();
        const stub = createContextStub(200, 200);
        drawColorDisc(stub, center, center, radius - 10, dpr);
        const inside = pixelAt(stub.image, 100, 100);
        const outside = pixelAt(stub.image, 100, 100 - Math.round((radius - 4) * dpr));
        expect(inside.a).toBe(255);
        // 缩小半径后，原圆周外侧的像素应为空
        expect(outside.a).toBe(0);
    });
});
