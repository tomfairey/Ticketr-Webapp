<template>
    <div class="nav-content" :class="{'large': $route.fullPath == '/'}">
        <div class="nav-items-container">
            <slot></slot>
            <div class="tabIndicator"></div>
            <div class="nav-item-container profile" :class="{'active': $route.fullPath == '/profile'}">
                <router-link to="/profile">
                    <div class="nav-profile-image">
                        <div class="profileImage">{{ profileImage ? '' : profileInitial }}</div>
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "Navigation",
        computed: {
            profile: function() {
                return this.$store.state.profile;
            },
            profileImage: function() {
                try {
                    return this.$store.state.profile.image;
                } catch(e) {
                    return false;
                }
            },
            profileInitial: function() {
                return this.$store.state.profile.name.split("")[0];
            }
        }
    }
</script>

<style>
    .nav-item-container:nth-of-type(1).active ~ .tabIndicator {
        left: 0;
    }
    .nav-item-container:nth-of-type(2).active ~ .tabIndicator {
        left: 96px;
    }
</style>

<style scoped>
    .nav-content {
        display: flex;
        width: 100%;
        height: 92px;
        align-items: flex-start;
        background-color: var(--color-accent);
        border-radius: 0% 0% 50% 50% / 0% 0% 10% 10%;
        transition: all 0.3s ease-in-out;
    }
    .nav-content.large {
        height: 204px;
        border-radius: 0% 0% 15% 85% / 0% 0% 2% 30%;
    }
    .nav-items-container {
        display: flex;
        width: 100%;
        height: 92px;
        align-items: flex-end;
        padding: 12px 2px 14px 24px;
    }
    .nav-item-container a {
        text-decoration: none;
    }
    .nav-item-container.profile {
        display: flex;
        position: relative;
        align-self: flex-end;
        width: 48px;
        height: 48px;
        margin: auto 16px auto auto;
        transition: all 0.2s ease-out;
    }
    .nav-item-container.profile .nav-profile-image {
        display: flex;
        position: relative;
        justify-content: center;
        align-items: center;
        width: 48px;
        height: 48px;
        border-radius: 100%;
        border: 2px solid #FFFFFF;
        overflow: hidden;
    }
    .nav-item-container.profile .nav-profile-image .profileImage {
        display: flex;
        position: relative;
        justify-content: center;
        align-items: center;
        width: 48px;
        height: 48px;
        font-family: var(--primary-font);
        font-weight: 700;
        font-size: 28px;
        color: #FFFFFF;
        background-color: var(--color-dark-accent);
    }

    .tabIndicator {
        position: absolute;
        margin-left: 8px;
        margin-left: 20px;
        top: 64px;
        width: 60px;
        height: 3px;
        background-color: var(--color-dark-accent);
        border-radius: 8px;
        transition: left 0.2s ease-out;
    }
</style>