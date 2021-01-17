<template>
    <section class="ticket-card-container" @click="$emit('click')">
        <div class="ticket-card-contents-container">
            <div class="ticket-card-content-container">
                <div class="ticket-card-content logo">
                    <div class="ticket-card-logo-container">
                        <ResourceRenderer :resource="retailingOperatorLogo" :defaultProperties="{'--background-size': 'contain', '--background-position': 'left top'}"></ResourceRenderer>
                    </div>
                </div>
                <div class="ticket-card-content quantity" v-if="!!quantity">
                    {{ quantity }}
                </div>
                <div class="ticket-card-content name">
                    {{ ticket.name }}
                </div>
                <div class="ticket-card-content name">
                    £{{ ticket.price.toFixed(2) }}
                </div>
            </div>
            <div class="ticket-card-background-container">
                <ResourceRenderer :resource="retailingOperatorImage"></ResourceRenderer>
            </div>
        </div>
    </section>
</template>

<script>
    import ResourceRenderer from '../resources/ResourceRenderer.vue';

    export default {
        name: "BuyTicketCard",
        components: {
            'ResourceRenderer': ResourceRenderer
        },
        props: [
            'ticket',
            'quantity'
        ],
        data() {
            return {
                retailingOperatorLogo: this.ticket.retailingOperator.logo,
                retailingOperatorImage: this.ticket.retailingOperator.defaultImage
            }
        },
        methods: {
            layerBackgroundProperties: function(resource) {
                return Object.assign({}, resource.properties, {'--layer-data': `${resource.resource.dataType == 'url' ? 'url(' : ''}${resource.resource.data}${resource.resource.dataType == 'url' ? ')' : ''}`})
            }
        },
        mounted() {

        }
    }
</script>

<style scoped>
    .ticket-card-container {
        display: flex;
        position: relative;
        flex-direction: column;
        justify-content: flex-start;
        border-radius: 8px;
        overflow: hidden;
        min-height: 146px;
        margin: 10px 0;
        padding: 15px;
        box-shadow: 0px 25px 25px rgba(0, 0, 0, 0.4);
        transform-style: preserve-3d;
        perspective: 1000px;
        transition: all 0.2s ease-out;
    }
    .ticket-card-container .ticket-card-contents-container {
        min-height: 146px;
        height: 146px;
        max-height: 146px;        
    }
    .ticket-card-container .ticket-card-contents-container .ticket-card-content-container {
        display: flex;
        position: relative;
        z-index: 1;
        min-height: 100%;
        flex-direction: column;
        justify-content: flex-end;
    }
    .ticket-card-container .ticket-card-contents-container .ticket-card-content-container .ticket-card-content.logo, .ticket-card-container .ticket-card-contents-container .ticket-card-content-container .ticket-card-content.logo * {
        display: flex;
        position: relative;
        align-self: flex-start;
        margin: 0 auto auto 0;
        width: 180px;
        height: 40px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: left;
    }
    .ticket-card-container .ticket-card-contents-container .ticket-card-content-container .ticket-card-content.quantity, .ticket-card-container .ticket-card-contents-container .ticket-card-content-container .ticket-card-content.quantity * {
        display: flex;
        position: absolute;
        justify-content: center;
        align-items: center;
        top: 0;
        right: 0;
        width: 24px;
        height: 24px;
        font-family: var(--primary-font);
        font-size: 14px;
        font-weight: 600;
        background-color: rgba(255, 255, 255, 0.4);
        color: #FFFFFF;
        border-radius: 100%;
    }
    .ticket-card-container .ticket-card-contents-container .ticket-card-content-container .ticket-card-content.name, .ticket-card-container .ticket-card-contents-container .ticket-card-content-container .ticket-card-content.expiry {
        display: flex;
        margin: 0 auto 0 0;
        font-size: x-large;
        font-family: var(--primary-font);
        font-weight: 700;
        color: #FFFFFF;
    }
    .ticket-card-container .ticket-card-contents-container .ticket-card-content-container .ticket-card-content.expiry span {
        margin-right: 6px;
        color: #999999;
    }
    .ticket-card-container .ticket-card-background-container {
        position: absolute;
        z-index: 0;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        /* background-color: blue; */
    }
</style>