/**
 * 色盘工具函数
 *
 * 色盘参数模型：H 为色相角度（0~360，0 位于右侧水平方向，逆时针递增），
 * S 为离圆心的半径比例（0~100），V 恒为 100（圆心为白色）。
 */

/**
 * HSV 转 RGB
 * @param {number} h 色相 0~360
 * @param {number} s 饱和度 0~100
 * @param {number} v 明度 0~100
 * @returns {{r: number, g: number, b: number}} 0~255
 */
export function hsvToRgb(h, s, v) {
    const hue = ((h % 360) + 360) % 360
    const saturation = s / 100
    const value = v / 100
    const sector = Math.floor(hue / 60)
    const fraction = hue / 60 - sector
    const p = value * (1 - saturation)
    const q = value * (1 - saturation * fraction)
    const t = value * (1 - saturation * (1 - fraction))
    let r = 0
    let g = 0
    let b = 0
    switch (sector) {
    case 0:
        r = value
        g = t
        b = p
        break
    case 1:
        r = q
        g = value
        b = p
        break
    case 2:
        r = p
        g = value
        b = t
        break
    case 3:
        r = p
        g = q
        b = value
        break
    case 4:
        r = t
        g = p
        b = value
        break
    default:
        r = value
        g = p
        b = q
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    }
}

/**
 * RGB 转 HSV
 * @param {number} r 0~255
 * @param {number} g 0~255
 * @param {number} b 0~255
 * @returns {{h: number, s: number, v: number}} h 0~360，s/v 0~100
 */
export function rgbToHsv(r, g, b) {
    const red = r / 255
    const green = g / 255
    const blue = b / 255
    const max = Math.max(red, green, blue)
    const min = Math.min(red, green, blue)
    const delta = max - min
    let h = 0
    if (delta !== 0) {
        if (max === red) {
            h = 60 * (((green - blue) / delta) % 6)
        } else if (max === green) {
            h = 60 * ((blue - red) / delta + 2)
        } else {
            h = 60 * ((red - green) / delta + 4)
        }
        if (h < 0) {
            h += 360
        }
    }
    return {
        h,
        s: max === 0 ? 0 : (delta / max) * 100,
        v: max * 100
    }
}

/**
 * 画布坐标转色盘参数（超出色盘范围时取出圆周上的点）
 * @returns {{h: number, s: number, dist: number}} dist 为到圆心的原始像素距离
 */
export function pointToDisc(x, y, centerX, centerY, radius) {
    const dx = x - centerX
    const dy = y - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)
    let h = -Math.atan2(dy, dx) * 180 / Math.PI
    if (h < 0) {
        h += 360
    }
    return {
        h,
        s: radius === 0 ? 0 : Math.min(dist / radius, 1) * 100,
        dist
    }
}

/**
 * 色盘参数转画布坐标
 * @returns {{x: number, y: number}}
 */
export function discToPoint(h, s, centerX, centerY, radius) {
    const radian = -h * Math.PI / 180
    const dist = s / 100 * radius
    return {
        x: centerX + Math.cos(radian) * dist,
        y: centerY + Math.sin(radian) * dist
    }
}

/**
 * 逐像素绘制色盘
 *
 * 相比按角度/半径步进逐条 arc+stroke 的绘制方式（数万次路径调用），
 * 直接写 ImageData 只需一次遍历，性能高一个数量级。
 * 注意：像素坐标为物理像素，dpr 需单独传入。
 * @param {CanvasRenderingContext2D} ctx 已按 dpr 缩放的 2d 上下文
 * @param {number} centerX 圆心逻辑坐标 x
 * @param {number} centerY 圆心逻辑坐标 y
 * @param {number} radius 色盘逻辑半径
 * @param {number} dpr 设备像素比
 */
export function drawColorDisc(ctx, centerX, centerY, radius, dpr) {
    const canvas = ctx.canvas
    const width = canvas.width
    const height = canvas.height
    const cx = centerX * dpr
    const cy = centerY * dpr
    const r = radius * dpr
    const rSquared = r * r
    // 同一色相下 RGB 各通道与饱和度成线性关系，
    // 预计算一圈纯色（S=100）后按半径比例插值即可，避免逐像素做完整 HSV 转换
    const pureColors = new Array(360)
    for (let i = 0; i < 360; i++) {
        pureColors[i] = hsvToRgb(i, 100, 100)
    }
    const image = ctx.createImageData(width, height)
    const data = image.data
    for (let y = 0; y < height; y++) {
        const dy = y - cy
        const dySquared = dy * dy
        for (let x = 0; x < width; x++) {
            const dx = x - cx
            const distSquared = dx * dx + dySquared
            if (distSquared > rSquared) {
                continue
            }
            const index = (y * width + x) * 4
            const ratio = Math.sqrt(distSquared) / r
            let hue = -Math.atan2(dy, dx) * 180 / Math.PI
            if (hue < 0) {
                hue += 360
            }
            const pure = pureColors[Math.round(hue) % 360]
            data[index] = 255 + (pure.r - 255) * ratio
            data[index + 1] = 255 + (pure.g - 255) * ratio
            data[index + 2] = 255 + (pure.b - 255) * ratio
            data[index + 3] = 255
        }
    }
    ctx.putImageData(image, 0, 0)
}
