/**
 * 色盘几何换算与绘制
 *
 * 色盘参数模型：H 为色相角度（0~360，0 位于右侧水平方向，逆时针递增），
 * S 为离圆心的半径比例（0~100），V 恒为 100（圆心为白色）。
 */
import { hsvToRgb } from './color';

/**
 * 画布坐标转色盘参数（超出色盘范围时取出圆周上的点）
 * @returns {{h: number, s: number, dist: number}} dist 为到圆心的原始像素距离
 */
export function pointToDisc(x, y, centerX, centerY, radius) {
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let h = -Math.atan2(dy, dx) * 180 / Math.PI;
    if (h < 0) {
        h += 360;
    }
    return {
        h,
        s: radius === 0 ? 0 : Math.min(dist / radius, 1) * 100,
        dist
    };
}

/**
 * 色盘参数转画布坐标
 * @returns {{x: number, y: number}}
 */
export function discToPoint(h, s, centerX, centerY, radius) {
    const radian = -h * Math.PI / 180;
    const dist = s / 100 * radius;
    return {
        x: centerX + Math.cos(radian) * dist,
        y: centerY + Math.sin(radian) * dist
    };
}

// 上一次绘制的像素数据，几何参数未变时直接复用
let discCache = null;

/**
 * 逐像素绘制色盘
 *
 * 相比按角度/半径步进逐条 arc+stroke 的绘制方式（数万次路径调用），
 * 直接写 ImageData 只需一次遍历，性能高一个数量级。
 *
 * 两处优化：色相关于水平轴对称，下半区整行复制即可，省掉一半三角函数与插值；
 * 结果按几何参数缓存，尺寸/dpr 未变时直接 putImageData。
 *
 * 注意：像素坐标为物理像素，dpr 需单独传入。
 * @param {CanvasRenderingContext2D} ctx 已按 dpr 缩放的 2d 上下文
 * @param {number} centerX 圆心逻辑坐标 x
 * @param {number} centerY 圆心逻辑坐标 y
 * @param {number} radius 色盘逻辑半径
 * @param {number} dpr 设备像素比
 */
export function drawColorDisc(ctx, centerX, centerY, radius, dpr) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const cx = centerX * dpr;
    const cy = centerY * dpr;
    const r = radius * dpr;
    const cacheKey = width + ':' + height + ':' + cx + ':' + cy + ':' + r;
    if (discCache && discCache.key === cacheKey) {
        ctx.putImageData(discCache.image, 0, 0);
        return;
    }
    const rSquared = r * r;
    // 圆周最外一圈按到圆周的距离衰减透明度，抵消逐像素判定带来的锯齿
    const fadeStart = r - 1;
    // 镜像行下标需为整数，dpr 或尺寸为小数时退回逐像素计算
    const mirrorBase = cy * 2;
    const canMirror = mirrorBase === Math.round(mirrorBase);
    // 同一色相下 RGB 各通道与饱和度成线性关系，
    // 预计算一圈纯色（S=100）后按半径比例插值即可，避免逐像素做完整 HSV 转换
    const pureR = new Float32Array(360);
    const pureG = new Float32Array(360);
    const pureB = new Float32Array(360);
    for (let i = 0; i < 360; i++) {
        const pure = hsvToRgb(i, 100, 100);
        pureR[i] = pure.r;
        pureG[i] = pure.g;
        pureB[i] = pure.b;
    }
    const image = ctx.createImageData(width, height);
    const data = image.data;
    for (let y = 0; y < height; y++) {
        const dy = y - cy;
        const dySquared = dy * dy;
        if (dySquared > rSquared) {
            continue;
        }
        // 先按圆的横向弦长收窄扫描区间，避免整行逐像素判断
        const halfWidth = Math.sqrt(rSquared - dySquared);
        const xStart = Math.max(0, Math.ceil(cx - halfWidth));
        const xEnd = Math.min(width - 1, Math.floor(cx + halfWidth));
        if (xStart > xEnd) {
            continue;
        }
        const rowStart = (y * width + xStart) * 4;
        const rowLength = (xEnd - xStart + 1) * 4;
        if (canMirror && dy > 0) {
            const mirrorY = mirrorBase - y;
            // 镜像行 dy 为负、必先于当前行计算，可直接整段复制
            if (mirrorY >= 0 && mirrorY < height) {
                const from = (mirrorY * width + xStart) * 4;
                data.copyWithin(rowStart, from, from + rowLength);
                continue;
            }
        }
        for (let x = xStart; x <= xEnd; x++) {
            const index = (y * width + x) * 4;
            const dx = x - cx;
            const dist = Math.sqrt(dx * dx + dySquared);
            const ratio = dist / r;
            let hue = -Math.atan2(dy, dx) * 180 / Math.PI;
            if (hue < 0) {
                hue += 360;
            }
            const slot = Math.round(hue) % 360;
            data[index] = 255 + (pureR[slot] - 255) * ratio;
            data[index + 1] = 255 + (pureG[slot] - 255) * ratio;
            data[index + 2] = 255 + (pureB[slot] - 255) * ratio;
            // 落在 (r-1, r] 环带内的像素按剩余距离渐隐，形成平滑圆周
            data[index + 3] = dist > fadeStart ? (r - dist) * 255 : 255;
        }
    }
    // putImageData 不持有也不修改 image，缓存后可安全复用
    ctx.putImageData(image, 0, 0);
    discCache = { key: cacheKey, image };
}

/**
 * 清空色盘像素缓存（仅供测试使用）
 */
export function clearColorDiscCache() {
    discCache = null;
}
