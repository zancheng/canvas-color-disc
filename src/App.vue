<template>
    <div id="app">
        <p>RGB: {{ rgb }}</p>
        <canvas-color-disc
            v-model="rgb"
            :width="420"
            :height="280"
            @change="onChange"
        />
    </div>
</template>

<script>
export default {
    name: 'App',
    data() {
        return {
            rgb: { r: 255, g: 255, b: 255 }
        }
    },
    methods: {
        onChange(rgb) {
            console.log('change:', rgb)
        }
    }
}
</script>

<style>
    html {
        font-family: "Microsoft Sans Serif", Arial, Helvetica, sans-serif
    }
</style>
