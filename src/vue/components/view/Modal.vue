<template>
    <section class="modal-container">
        <section class="modal-content">
            <div class="heading">{{ heading }}</div>
            <div class="content">
                <p>
                    <slot></slot>
                </p>
            </div>
            <div class="options">
                <v-btn color="var(--color-accent)" @click="truthyResponse">{{ !!truthy ? truthy : "Yes" }}</v-btn>
                <v-btn @click="falseyResponse">{{ !!falsey ? falsey : "No" }}</v-btn>
            </div>
        </section>
    </section>
</template>

<script>
    export default {
        name: "Modal",
        props: [
            'heading',
            'truthy',
            'falsey'
        ],
        methods: {
            truthyResponse: function() {
                this.$emit("truthy");
            },
            falseyResponse: function() {
                this.$emit("falsey");
            }
        },
        computed: {
            
        },
        mounted() {
            const unregisterRouterGuard = this.$router.beforeEach((to, from, next) => {
                this.falseyResponse();
                next(false);
            });

            this.$once('hook:destroyed', () => {
                unregisterRouterGuard();
            });
        }
    }
</script>

<style scoped>
    .modal-container {
        display: flex;
        position: relative;
        min-width: 240px;
        width: max-content;
        max-width: calc(100% - 32px);
        min-height: 120px;
        margin: 16px;
        padding: 4px;
        border-radius: 8px;
        box-shadow: 0px 25px 25px rgba(0, 0, 0, 0.4);
        background-color: #FFFFFF;
        font-family: var(--primary-font);
    }
    .modal-container .modal-content {
        display: flex;
        position: relative;
        flex-direction: column;
        padding: 8px;
    }
    .modal-container .modal-content .heading {
        justify-content: flex-start;
        align-items: flex-start;
        font-size: x-large;
        font-weight: 700;
    }
    .modal-container .modal-content .content {
        flex-shrink: 1;
        justify-content: center;
        align-items: center;
        padding: 4px;
        overflow: auto;
    }
    .modal-container .modal-content .options {
        display: flex;
        justify-content: flex-end;
        align-items: flex-end;
        margin-top: 8px;
    }
    .modal-container .modal-content .options > * {
        justify-content: flex-end;
        margin-left: 8px;
    }
</style>