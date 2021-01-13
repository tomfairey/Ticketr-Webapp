<template>
    <section class="ticket-card-container" @click="$router.push(`/tickets/${ticket.uuid}`)">
        <div class="ticket-card-contents-container">
            <div class="ticket-card-content-container">
                <div class="ticket-card-content logo">
                    <div class="ticket-card-logo-container">
                        <ResourceRenderer :resource="retailingOperatorLogo" :defaultProperties="{'--background-size': 'contain', '--background-position': 'left top'}"></ResourceRenderer>
                    </div>
                </div>
                <div class="ticket-card-content name">
                    {{ ticket.ticket.name }}
                </div>
                <div class="ticket-card-content expiry">
                    <span class="title">Expire{{ (ticket.expiry.valueOf() > Date.now()) ? 's' : 'd:' }}</span> {{ formatDateString(ticket.expiry) }}
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
        name: "TicketCard",
        components: {
            'ResourceRenderer': ResourceRenderer
        },
        props: [
            'ticket'
        ],
        data() {
            return {
                retailingOperatorLogo: this.ticket.ticket.retailingOperator.logo,
                retailingOperatorImage: this.ticket.ticket.retailingOperator.defaultImage,
                dateDivisions: [
                    { amount: 60, name: 'seconds' },
                    { amount: 60, name: 'minutes' },
                    { amount: 24, name: 'hours' },
                    { amount: 7, name: 'days' },
                    { amount: 4.34524, name: 'weeks' },
                    { amount: 12, name: 'months' },
                    { amount: Number.POSITIVE_INFINITY, name: 'years' }
                ]
            }
        },
        methods: {
            layerBackgroundProperties: function(resource) {
                return Object.assign({}, resource.properties, {'--layer-data': `${resource.resource.dataType == 'url' ? 'url(' : ''}${resource.resource.data}${resource.resource.dataType == 'url' ? ')' : ''}`})
            },
            log: function(x) {
                console.log(x);
                return {};
            },
            formatDateString: function(date) {
                const formatter = new Intl.RelativeTimeFormat(undefined, {
                    numeric: 'auto'
                });
                return this.formatDateStringAgo(formatter, date);
            },
            formatDateStringAgo: function(formatter, date) {
                let duration = (date - new Date()) / 1000;

                for (let i = 0; i <= this.dateDivisions.length; i++) {
                    const division = this.dateDivisions[i];
                    if (Math.abs(duration) < division.amount) {
                        return formatter.format(Math.round(duration), division.name);
                    }
                    duration /= division.amount;
                }
            },
            formatDateStringIn: function(formatter, date) {
                return formatter.format(date, 'days');
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
        min-height: 168px;
        margin: 10px 0;
        padding: 15px;
        box-shadow: 0px 25px 25px rgba(0, 0, 0, 0.4);
        transform-style: preserve-3d;
        perspective: 1000px;
        transition: all 0.2s ease-out;
    }
    .ticket-card-container .ticket-card-contents-container {
        min-height: 168px;
        height: 168px;
        max-height: 168px;        
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