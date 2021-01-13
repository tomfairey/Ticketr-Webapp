<template>
    <div>
        <slot>Ticketr</slot>
    </div>
</template>

<script>
export default {
    name: 'Logo'
}
</script>

<style scoped>
    div {
        font-family: var(--primary-font);
        font-weight: 900;
        font-size: 12rem;
        font-size: 96px;
        text-align: center;
    }
</style>