/**
 * 框架无关入口：纯 JS 核心 + Web Component
 *
 * 引入即自动注册 <canvas-color-disc> 自定义元素（已存在时跳过），
 * HTML / React / Vue 等环境可直接使用该标签；
 * 也可用 CanvasColorDiscCore 以命令式方式手动挂载到任意容器。
 */
import { CanvasColorDiscCore } from './core';
import { CanvasColorDiscElement, defineCustomElement } from './web-component';

export { CanvasColorDiscCore, CanvasColorDiscElement, defineCustomElement };

// 默认标签随入口自动注册；customElements 缺失（SSR / Node）时静默跳过
defineCustomElement();
