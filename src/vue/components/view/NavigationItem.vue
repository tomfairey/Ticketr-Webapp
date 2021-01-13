<template>
    <div class="nav-item-container" :class="{'active': route.path == $route.fullPath || ($route.path && route.path !== '/' && $route.fullPath.startsWith(route.path))}">
        <router-link :to="route.path">
            <div class="nav-item">
                <div class="name">{{ route.name }}</div>
            </div>
        </router-link>
    </div>
</template>

<script>
    import Title from '../text/Title.vue';

    export default {
        name: "NavigationItem",
        components: {
            'Title': Title
        },
        props: [
            'route'
        ]
    }
</script>

<style scoped>
    .nav-item-container {
        display: flex;
        position: relative;
        color: rgba(255, 255, 255, 0.6);
        margin: 14px 0;
        transition: all 0.2s ease-out;
    }
    /* .nav-item-container.active:after {
        content: '';
        position: absolute;
        display: flex;
        justify-self: flex-end;
        align-self: flex-end;
        bottom: -4px;
        left: -28px;
        height: 5px;
        width: calc(100% + 60px);
        border-radius: 8px;
        background-color: red;
    } */
    .nav-item-container.active {
        color: #FFFFFF;
        margin: 12px 0;
    }
    .nav-item-container:nth-of-type(1) {
        margin-right: 22px;
    }
    .nav-item-container a {
        text-decoration: none;
    }
    .nav-item-container .nav-item .name {
        font-family: var(--primary-font);
        font-weight: 900;
        font-size: 28px;
        transition: font-size 0.2s ease-out;
    }
    .nav-item-container.active .nav-item .name {
        font-size: 34px;
    }
</style>