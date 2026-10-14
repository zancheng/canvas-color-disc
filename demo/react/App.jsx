/**
 * React demo：
 * - React 19 原生写法：自定义元素的属性、事件、对象 property 可直接写在 JSX 上；
 * - ref 桥接写法：兼容 React 18 及以下（事件用 addEventListener，值用 property 回写）。
 *
 * 引入 vanilla 入口即注册 <canvas-color-disc>，样式随 JS 内联注入，无需引 CSS。
 */
import { useEffect, useRef, useState } from 'react';
import '../../src/vanilla';

const HEX_PRESETS = ['#ff0000', '#00ff00', '#0000ff', '#ffffff'];
const RGB_PRESETS = [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 255 }
];

// React 19：非字符串 value 会直接作为 property 赋给自定义元素，无需 ref
function NativePicker() {
    const [color, setColor] = useState({ r: 255, g: 0, b: 0 });

    return (
        <div>
            <h3>React 19 原生写法</h3>
            <p>rgb: {color.r}, {color.g}, {color.b}</p>
            <canvas-color-disc
                width="300"
                height="300"
                value={color}
                oninput={(event) => setColor(event.detail)}
                onchange={(event) => console.log('change:', event.detail)}
            />
            <div className="presets">
                {RGB_PRESETS.map((preset) => (
                    <button
                        key={`${preset.r},${preset.g},${preset.b}`}
                        type="button"
                        title={`rgb(${preset.r}, ${preset.g}, ${preset.b})`}
                        style={{ background: `rgb(${preset.r}, ${preset.g}, ${preset.b})` }}
                        onClick={() => setColor(preset)}
                    />
                ))}
            </div>
        </div>
    );
}

// React 18 及以下：ref 桥接事件与值（等值回写会被组件自动跳过）
function RefPicker() {
    const discRef = useRef(null);
    const [color, setColor] = useState('#0000ff');

    useEffect(() => {
        const disc = discRef.current;
        const handleInput = (event) => setColor(event.detail);
        disc.addEventListener('input', handleInput);
        return () => disc.removeEventListener('input', handleInput);
    }, []);

    useEffect(() => {
        discRef.current.value = color;
    }, [color]);

    return (
        <div>
            <h3>ref 桥接（兼容 React 18）</h3>
            <p>hex: {color}</p>
            <canvas-color-disc ref={discRef} format="hex" width="300" height="300" />
            <div className="presets">
                {HEX_PRESETS.map((preset) => (
                    <button
                        key={preset}
                        type="button"
                        title={preset}
                        style={{ background: preset }}
                        onClick={() => discRef.current.setColor(preset)}
                    />
                ))}
            </div>
        </div>
    );
}

export default function App() {
    return (
        <div id="app">
            <h1>canvas-color-disc（React demo）</h1>
            <p>
                React 19 对自定义元素原生支持（属性、事件、对象 value 直接写 JSX），
                React 18 及以下用 ref 桥接；左侧演示前者，右侧演示后者。
                拖动取色，点击色块通过 setColor / state 回写。
            </p>
            <div className="row">
                <NativePicker />
                <RefPicker />
            </div>
        </div>
    );
}
