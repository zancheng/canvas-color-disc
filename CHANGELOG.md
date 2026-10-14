# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- 在线试用入口：`demo/vanilla` 页面改为经 CDN 引入的自包含单页，通过 GitHub Pages 部署为在线演示（Live Demo），并新增 StackBlitz 在线编辑器入口；README 顶部加入对应徽章

## [1.4.0] - 2026-10-14

### 新增

- `format` prop：绑定值支持 `rgb` / `hex` / `hsv` / `hsl` 四种格式，对象格式未指定时按字段推断
- `alpha` prop：保留并输出 alpha 分量（0~1，hex 下为 8 位）
- `disabled` prop：禁用指针与键盘交互
- `keyboardStep` prop：方向键步进，按住 Shift 时 ×10
- `width` / `height` 支持 `'auto'`，画布尺寸跟随容器并随容器缩放重绘
- 键盘操作：← / → 调色相，↑ / ↓ 调饱和度，Home / End 归零与拉满
- 可访问性：交互元素可聚焦，带 `role="slider"` 与 `aria-valuetext`
- 实例方法 `getColor()` / `setColor(value)` / `reset()`（Vue 3 下经 `expose` 暴露）
- `palette` 插槽，作用域参数 `color`、`setColor(value)`
- TypeScript 类型声明 `src/index.d.ts`，`package.json` 增加 `types` 字段
- Vue 3 本地 demo（`npm run dev:vue3`）与 `npm test` 单元测试
- 框架无关版本：新增 `canvas-color-disc/vanilla` 入口（`CanvasColorDiscCore` 纯 JS 核心 + `<canvas-color-disc>` Web Component），Shadow DOM 内联样式、引入即注册，HTML / React / Angular 等任意环境可用
- React 本地 demo（`npm run dev:react`，localhost:5175）：同一页面演示 React 19 原生写法与 React 18 ref 桥接两种用法

### 修复

- 拖动过程中页面滚动会让缓存的画布位置失效，导致取色偏移
- `setPointerCapture` 失败时指针在画布外抬起会导致拖动状态卡住（补充 window 级兜底）
- 右键 / 中键与多指触摸的第二根手指会触发取色
- 色盘圆周逐像素二值判定产生锯齿（改为 1 物理像素的透明度渐变）
- 选择器圆环、圆心死区、画布留白写死像素值，小尺寸色盘下比例失调（改为按半径缩放）
- `devicePixelRatio` 变化（跨屏拖动窗口、修改系统缩放）后画布模糊（现在会自动重建）
- 色盘下半区颜色错误：曾按“色盘关于水平轴对称”整行镜像复制下半区，而 HSV 色轮上下镜像点的颜色并不相同（底部 270° 紫色被错显成 90° 黄绿等），现恢复逐像素按真实色相计算，与 1.2.x 及更早版本显示一致
- README 预览图引用的旧图床外链失效：改用仓库内 `preview.png` 并以 jsDelivr 绝对地址引用，GitHub 与 npm 页面均可正常显示

### 变更

- 默认入口 `.` 切换为 Vue 3 构建（`main` / `module` / `style` 字段同步指向 `dist/vue3/`）；Vue 2 项目改用 `canvas-color-disc/vue2` 引入，非 Vue 项目继续使用 `canvas-color-disc/vanilla`
- `package.json` 新增 `unpkg` / `jsdelivr` 字段，指向零依赖的 `dist/vanilla/canvas-color-disc.umd.js`：两个 CDN 的无路径地址（`https://unpkg.com/canvas-color-disc`、`https://cdn.jsdelivr.net/npm/canvas-color-disc`）由此直接解析为该 UMD 文件
- README 的 CDN 引入示例补充 unpkg 与 jsDelivr 镜像地址，并给出锁定版本号（`@1.4.0`）的写法
- 内部状态改为 HSV：明度（V）取自绑定值并原样保留，传入灰色不再被拉成纯色
- 色盘像素按几何参数缓存，尺寸与 dpr 未变时不重算
- 选择器圆环预渲染为离屏 sprite，避免每帧重算 `shadowBlur`
- 工具层拆分为 `src/color.js`（色彩空间与解析）与 `src/util.js`（几何与绘制）
- ESLint 升级到 8.x + `vue-eslint-parser`（移除已废弃的 `babel-eslint`），`semi` 规则统一为 `always`
- Vue 3 的 SFC 编译插件抽到 `config/vue3-sfc.js`，供库构建与 Vue 3 demo 共用
- 删除空的 `example/` 目录

## [1.2.1] - 2026-10-10

### 新增

- 支持 Vue 3：新增 `canvas-color-disc/vue3` 构建入口与双版本 `v-model` 兼容
- 重写 README，补充安装、引入与使用说明

## [1.2.0] 及更早

历史版本未提供变更记录，可参见[提交历史](https://github.com/zancheng/canvas-color-disc/commits)。
