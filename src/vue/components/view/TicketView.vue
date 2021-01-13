<template>
    <section class="ticket-view-container">
        <section class="ticket-view-navigation-container">
            <div class="ticket-view-navigation-content">
                <div class="ticket-view-navigation-item" @click="$router.go(-1)">
                    <v-icon>mdi-chevron-left</v-icon>
                </div>
            </div>
        </section>
        <section class="ticket-view" v-if="!!ticket">
            <section class="ticket-container">
                <div class="ticket-header-container">
                    <div class="ticket-header-background">
                        <ResourceRenderer v-if="!ticket.activated || ticket.expiry < Date.now()" :resource="ticket.ticket.retailingOperator.defaultImage"></ResourceRenderer>
                        <div class="ticket-header-mask" v-if="ticket.activated && ticket.expiry >= Date.now()">{{ `${ticket.ticket.name} `.repeat(256) }}</div>
                        <div class="ticket-header-text">{{ ticket.ticket.name }}</div>
                    </div>
                    <div class="ticket-header-content" :class="{'active': ticket.activated && ticket.expiry >= Date.now()}">
                        <div class="ticket-header-text">{{ ticket.ticket.name }}</div>
                    </div>
                </div>
                <div class="ticket-body-container">
                    <div class="ticket-body-content" v-if="ticket.expiry < Date.now()">
                        <div class="ticket-body-title">Expired</div>
                        <div class="ticket-body-text">{{ generateTimeString(ticket.expiry) }}</div>
                    </div>
                    <div class="ticket-body-content">
                        <div class="ticket-body-title">Purchased</div>
                        <div class="ticket-body-text">{{ generateTimeString(ticket.created) }}</div>
                    </div>
                    <div class="ticket-body-content">
                        <div class="ticket-body-uid">{{ compressUUID(ticket.uuid) }}</div>
                    </div>
                </div>
            </section>
            <section class="ticket-container" v-if="!!ticket.ticket.terms">
                <div class="ticket-body-container">
                    <div class="ticket-body-content ticket-terms-content">
                        <div class="ticket-terms-title">Terms &amp; Conditions:</div>
                        <div class="ticket-terms-text">
                            {{ ticket.ticket.terms }}
                        </div>
                    </div>
                </div>
            </section>
            <section class="button-container">
                <div class="button-content" v-if="!ticket.activated && ticket.expiry > Date.now()">
                    <v-btn block color="var(--color-accent)">Activate</v-btn>
                </div>
            </section>
        </section>
    </section>
</template>

<script>
    import ResourceRenderer from '../resources/ResourceRenderer.vue';

    export default {
        name: "TicketView",
        components: {
            'ResourceRenderer': ResourceRenderer
        },
        props: [
            'ticket'
        ],
        data() {
            return {
                
            }
        },
        computed: {

        },
        methods: {
            getDateNth: function(d) {
                if (d > 3 && d < 21) return 'th';
                switch (d % 10) {
                    case 1:  return "st";
                    case 2:  return "nd";
                    case 3:  return "rd";
                    default: return "th";
                }
            },
            generateTimeString: function(date) {
                let time = new Intl.DateTimeFormat(undefined, { timeStyle: 'short', hour12: false }).format(date);
                let day = new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(date);
                let month = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date);
                let year = new Intl.DateTimeFormat(undefined, { year: 'numeric' }).format(date);

                return `${time} ${day}${this.getDateNth(day)} ${month} ${year}`;
            },
            compressUUID: function(uuid) {
                // uuid = uuid.replaceAll("-", "").toUpperCase();
                uuid = uuid.split("-");
                uuid = `${uuid[0]}${uuid[2]}${uuid[4]}`.toUpperCase();
                return uuid;
            }
        },
        mounted() {
            // console.log("ticket", this.ticket);
        }
    }
</script>

<style scoped>
    .ticket-view-container {
        display: flex;
        position: absolute;
        flex-direction: column;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: #FFFFFF;
    }
    .ticket-view-container .ticket-view-navigation-container {
        display: flex;
        position: relative;
        flex-shrink: 1;
        margin: 0 12px 6px 12px;
    }
    .ticket-view-container .ticket-view-navigation-container .ticket-view-navigation-content {
        display: flex;
        position: relative;
    }
    .ticket-view-container .ticket-view-navigation-container .ticket-view-navigation-content .ticket-view-navigation-item {
        display: flex;
        position: relative;
        width: 38px;
        height: 38px;
    }
    .ticket-view-container .ticket-view-navigation-container .ticket-view-navigation-content .ticket-view-navigation-item > i {
        position: relative;
        width: 38px;
        height: 38px;
        font-size: 38px;
        color: #000000;
    }
    .ticket-view-container .ticket-view {
        display: flex;
        position: relative;
        flex-grow: 1;
        flex-direction: column;
    }
    .ticket-view-container .ticket-view .ticket-container {
        display: flex;
        position: relative;
        flex-shrink: 1;
        flex-direction: column;
        background-color: rgba(255, 255, 255, 0.8);
        margin: 0 18px 18px 18px;
        /* min-height: calc(100% - 18px); */
        /* height: calc(100% + 18px + 18px + 18px); */
        border-radius: 8px;
        border: 1px #C4C4C4 solid;
        text-align: center;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container {
        display: flex;
        position: relative;
        flex-direction: column;
        justify-content: center;
        min-height: 88px;
        max-height: 88px;
        border-bottom: 1px #C4C4C4 solid;
        overflow: hidden;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-background {
        display: flex;
        position: absolute;
        justify-content: center;
        align-items: center;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        border-radius: 8px 8px 0 0;
        overflow: hidden;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-background, .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-content {
        display: flex;
        align-self: center;
        align-items: center;
        text-align: center;
        overflow: hidden;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-background .ticket-header-text {
        display: flex;
        align-self: center;
        align-items: center;
        white-space: nowrap;
        font-size: min(16vw, 32vh);
        font-family: var(--primary-font);
        font-weight: 700;
        color: rgba(0, 0, 0, 0.4);
        text-align: center;
        z-index: 1;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-background .ticket-header-mask {
        display: flex;
        position: absolute;
        justify-content: center;
        align-items: center;
        align-content: center;
        width: 150vw;
        margin: 0 0 0 -25vw;
        background: -webkit-linear-gradient(top left, orange , yellow, green, cyan, blue, violet);
        background: -o-linear-gradient(bottom right, orange, yellow, green, cyan, blue, violet);
        background: -moz-linear-gradient(bottom right, orange, yellow, green, cyan, blue, violet);
        background: linear-gradient(from bottom right, orange , yellow, green, cyan, blue, violet);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 14px;
        font-size: 14px;
        font-family: var(--primary-font);
        font-weight: 700;
        animation: rainbowSlide 5s ease-in-out infinite;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-content .ticket-header-text {
        display: flex;
        align-self: center;
        align-items: center;
        white-space: nowrap;
        font-size: 32px;
        font-family: var(--primary-font);
        font-weight: 700;
        color: #FFFFFF;
        text-align: center;
        z-index: 1;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-header-container .ticket-header-content.active .ticket-header-text {
        color: #000000;
    }
    @keyframes rainbowSlide {
        to {
            filter: hue-rotate(360deg);
        }
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container {
        display: flex;
        position: relative;
        flex-shrink: 1;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 16px;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content {
        display: flex;
        position: relative;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding: 8px;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content .ticket-body-title {
        position: relative;
        font-family: var(--primary-font);
        font-weight: 700;
        font-size: 18px;
        color: rgba(0, 0, 0, 0.6);
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content .ticket-body-text {
        position: relative;
        font-family: var(--primary-font);
        font-weight: 700;
        font-size: 24px;
        color: #000000;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content .ticket-body-uid {
        display: flex;
        position: relative;
        flex-direction: column;
        justify-content: center;
        font-family: var(--primary-font);
        font-weight: 700;
        font-size: 18px;
        color: #000000;
        min-width: 100%;
        padding: 4px 8px;
        background-color: #C4C4C4;
        border-radius: 10px;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content.ticket-terms-content {
        padding: 0;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content.ticket-terms-content .ticket-terms-title {
        position: relative;
        align-self: flex-start;
        font-family: var(--primary-font);
        font-weight: 700;
        font-size: 24px;
        color: #000000;
        text-align: start;
    }
    .ticket-view-container .ticket-view .ticket-container .ticket-body-container .ticket-body-content.ticket-terms-content .ticket-terms-text {
        position: relative;
        font-family: var(--primary-font);
        font-weight: 600;
        font-size: 18px;
        color: #444444;
        text-align: start;
    }
    .ticket-view-container .ticket-view .button-container {
        display: flex;
        position: relative;
        flex-grow: 1;
        flex-direction: column;
        justify-content: flex-end;
        height: 100%;
        padding: 18px;
    }
    .ticket-view-container .ticket-view .button-container .button-content {
        display: flex;
        position: relative;
        flex-direction: column;
    }
</style>