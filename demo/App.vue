<template>
    <div id="app">
        <p>RGB: {{ rgb }}</p>
        <canvas-color-disc
            v-model="rgb"
            :width="420"
            :height="280"
            @change="onChange"
        >
            <!-- 色板插槽：用 setColor 回写当前颜色 -->
            <template #palette="{ setColor }">
                <button
                    v-for="preset in presets"
                    :key="preset.label"
                    class="preset"
                    :style="{ background: preset.css }"
                    @click="setColor(preset.value)"
                >
                    {{ preset.label }}
                </button>
            </template>
        </canvas-color-disc>
        <p>
            <label>
                <input v-model="disabled" type="checkbox">
                禁用色盘
            </label>
        </p>
        <canvas-color-disc
            v-model="rgb"
            :width="160"
            :height="160"
            :disabled="disabled"
        />
    </div>
</template>

<script>
export default {
    name: 'App',
    data() {
        return {
            rgb: { r: 255, g: 255, b: 255 },
            disabled: false,
            presets: [
                { label: '红', css: '#ff0000', value: { r: 255, g: 0, b: 0 } },
                { label: '绿', css: '#00ff00', value: { r: 0, g: 255, b: 0 } },
                { label: '蓝', css: '#0000ff', value: { r: 0, g: 0, b: 255 } },
                { label: '白', css: '#ffffff', value: { r: 255, g: 255, b: 255 } }
            ]
        };
    },
    methods: {
        onChange(rgb) {
            console.log('change:', rgb);
        }
    }
};
</script>

<style>
    html {
        font-family: "Microsoft Sans Serif", Arial, Helvetica, sans-serif
    }

    .preset {
        margin-right: 8px;
        border: 1px solid #ccc;
        cursor: pointer;
    }
</style>
