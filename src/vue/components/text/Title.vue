<template>
    <div>
        <slot></slot>
    </div>
</template>

<script>
export default {
    name: 'Title'
}
</script>

<style scoped>
    div {
        font-family: var(--primary-font);
        font-weight: 900;
        font-size: 3rem;
    }
</style>