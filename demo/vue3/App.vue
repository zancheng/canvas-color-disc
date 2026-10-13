<template>
    <div id="app">
        <p>hex: {{ color }}</p>
        <canvas-color-disc
            v-model="color"
            format="hex"
            :width="420"
            :height="280"
            @change="onChange"
        />
        <div class="presets">
            <button
                v-for="preset in presets"
                :key="preset"
                :style="{ background: preset }"
                @click="color = preset"
            >
                {{ preset }}
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'App',
    data() {
        return {
            color: '#ff0000',
            presets: ['#ff0000', '#00ff00', '#0000ff', '#ffffff']
        };
    },
    methods: {
        onChange(color) {
            console.log('change:', color);
        }
    }
};
</script>
