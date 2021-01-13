<template>
    <section>
        <slot></slot>
    </section>
</template>

<script>
    export default {
        name: "Splash"
    }
</script>

<style scoped>
    section {
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--color-accent);
        width: 100%;
        height: 100%;
    }
</style>