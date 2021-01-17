<template>
    <section class="overlays-container" :class="{'active': active}">
        <section class="overlays-content">
            <slot></slot>
        </section>
    </section>
</template>

<script>
    export default {
        name: "Overlays",
        props: [
            'active'
        ]
    }
</script>

<style scoped>
    .overlays-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 5;
        background-color: rgba(0, 0, 0, 0);
        pointer-events: none;
        transition: all ease-in-out 0.4s;
    }
    .overlays-container.active {
        background-color: rgba(0, 0, 0, 0.6);
        pointer-events: all;
    }
    .overlays-content {
        display: flex;
        position: relative;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
    }
    .overlays-content * {
        position: absolute;
        width: 100%;
        flex-shrink: 0;
        flex-grow: 0;
    }
</style>