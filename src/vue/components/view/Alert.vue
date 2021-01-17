<template>
    <section class="alert-container" @click="click">
        <div class="alert-contents" :class="{'start-padding': !this.$slots['icon-start'] && !!this.$slots.default, 'end-padding': !this.$slots['icon-end'] && !!this.$slots.default}">
            <div class="alert-content-container icon start" v-if="!!this.$slots['icon-start']">
                <div class="alert-content">
                    <v-icon>
                        <slot name="icon-start"></slot>
                    </v-icon>
                </div>
            </div>
            <div class="alert-content-container text" v-if="!!this.$slots.default">
                <div class="alert-content">
                    <slot></slot>
                </div>
            </div>
            <div class="alert-content-container icon end" v-if="!!this.$slots['icon-end']">
                <div class="alert-content">
                    <v-icon>
                        <slot name="icon-end"></slot>
                    </v-icon>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
    export default {
        name: "Alert",
        data() {
            return {

            }
        },
        methods: {
            click: function() {
                this.$emit("click");
            }
        }
    }
</script>

<style scoped>
    .alert-container {
        position: relative;
        outline: none;        
        background-color: #EEEEEE;
        color: #444444;
        border: 1px solid #BBBBBB;
        border-radius: 8px;
        min-height: 48px;
        margin: 8px;
    }
    .alert-contents {
        display: flex;
    }
    .alert-contents.start-padding {
        padding-left: 32px;
    }
    .alert-contents.end-padding {
        padding-right: 32px;
    }
    .alert-content-container.icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 44px;
        height: 44px;
        margin: 2px;
    }
    .alert-content-container.icon i {
        width: 32px;
        height: 32px;
    }
    .alert-content-container.text {
        position: relative;
        flex-grow: 1;
        font-size: 18px;
        font-weight: 700;
        font-family: var(--primary-font);
        line-height: 48px;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .alert-contents .alert-content-container.text:after {
        content: '';
        position: absolute;
        width: calc(100% - 2px);
        height: calc(100% - 2px);
        top: 0;
        margin: 1px;
        border-radius: 8px;
        background: linear-gradient(to right, #EEEEEE00 85%, #EEEEEEFF 100%);
    }
    .alert-contents.end-padding .alert-content-container.text:after {
        left: 32px;
    }
</style>