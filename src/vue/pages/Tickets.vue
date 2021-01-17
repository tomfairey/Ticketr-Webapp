<template>
    <section class="tickets-page">
        <section class="contents-container" ref="pageContent">
            <div class="loadingIndicator">
                <v-progress-circular v-if="isLoading" :size="50" indeterminate color="var(--color-dark-accent)"></v-progress-circular>
            </div>
            <div class="contents">
                <div class="content-container">
                    <div class="content alerts" :class="{'icon-count': basketIconCount > 0}" :style="{'--icon-count': basketIconCount}"> <!--  @click="doLogs" -->
                        <Alert>
                            <template v-slot:icon-start>mdi-information-outline</template>
                            <template v-slot:default>How do I use mobile tickets?</template>
                        </Alert>
                        <Alert @click="$router.push('/tickets/basket')">
                            <template v-slot:icon-start>mdi-cart-outline</template>
                        </Alert>
                    </div>
                </div>
                <!--

                    PAYMENT CARDS

                -->
                <div class="content-container" v-if="activeTickets.length">
                    <div class="content-title">
                        Active Tickets:
                    </div>
                    <div class="content">
                        <TicketCard v-for="(ticket, ticketIndex) in activeTickets" ref="ticket" :key="`active:${ticketIndex}:${ticket.uuid}`" @click="displayTicketView(ticket)" :ticket="ticket"></TicketCard>
                    </div>
                </div>
                <div class="content-container" v-if="ticketsToUse.length">
                    <div class="content-title">
                        Tickets to use:
                    </div>
                    <div class="content">
                        <TicketCard v-for="(ticket, ticketIndex) in ticketsToUse" ref="ticket" :key="`available:${ticketIndex}:${ticket.uuid}`" @click="displayTicketView(ticket)" :ticket="ticket"></TicketCard>
                    </div>
                </div>
                <div class="content-container buy-tickets">
                    <div class="content">
                        <Alert @click="$router.push('/tickets/store')">
                            <template v-slot:icon-start>mdi-qrcode</template>
                            <template v-slot:default>Buy a ticket...</template>
                            <template v-slot:icon-end>mdi-chevron-right</template>
                        </Alert>
                    </div>
                </div>
                <div class="content-container" v-if="expiredTickets.length">
                    <div class="content-title">
                        Expired Tickets:
                    </div>
                    <div class="content">
                        <TicketCard v-for="(ticket, ticketIndex) in expiredTickets" ref="ticket" :key="`expired:${ticketIndex}:${ticket.uuid}`" @click="displayTicketView(ticket)" :ticket="ticket"></TicketCard>
                    </div>
                </div>
            </div>
        </section>
        <div class="overlays-container">
            <div class="message" v-if="!tickets.length">
                When you purchase a ticket or start a single journey, it will show here...
            </div>
    </section>
</template>

<script>
    import Alert from '../components/view/Alert.vue';
    import TicketCard from '../components/view/TicketCard.vue';
    import TicketView from '../components/view/TicketView.vue';

    export default {
        name: "Tickets",
        components: {
            'Alert': Alert,
            'TicketCard': TicketCard,
            'TicketView': TicketView
        },
        data() {
            return {
                isLoading: false,
                pStart: {
                    x: 0,
                    y: 0
                },
                pCurrent: {
                    x: 0,
                    y: 0
                }
            }
        },
        computed: {
            tickets: function() {
                return this.$store.state.profile ? this.$store.state.profile.tickets : [];
            },
            activeTickets: function() {
                return this.tickets.filter(r => r.activated && r.expiry.valueOf() >= Date.now());
            },
            ticketsToUse: function() {
                return this.tickets.filter(r => !r.activated && r.expiry.valueOf() >= Date.now());
            },
            expiredTickets: function() {
                return this.tickets.filter(r => r.expiry.valueOf() < Date.now());
            },
            basketIconCount: function() {
                let basketCount = 0;

                let basket = this.$store.state.basketToUse;
                for(let ticket in basket.tickets) {
                    ticket = basket.tickets[ticket];
                    basketCount += ticket.quantity;
                }

                return basketCount;
            }
        },
        methods: {
            doLogs: function() {
                console.log(this.tickets);
                console.log(this.activeTickets);
                console.log(this.ticketsToUse);
                console.log(this.expiredTickets);
            },
            loading: async function() {
                if(!this.isLoading) {
                    this.isLoading = true;
                    this.$refs['pageContent'].style.transform = `translateY(0px)`;

                    let start = new Date().getTime();

                    await this.$store.commit("setProfile", await this.$store.state.ticketrApi.getProfile(true));
                    await this.$store.commit("setBaskets", await this.$store.state.ticketrApi.getBaskets());
                    await this.$store.commit("setOrders", await this.$store.state.ticketrApi.getOrders());

                    let end = new Date().getTime();

                    this.$toasted.show(`Profile reload took ${(end - start) / 1000}s`, {
                        type: 'info',
                        icon: 'info_outline',
                        theme: "bubble", 
                        position: "bottom-center", 
                        duration: 3000
                    });

                    setTimeout(() => {
                        this.$refs['pageContent'].style.transform = `translateY(-100px)`;
                        this.isLoading = false;
                        if(this.$refs['ticket']) for (const card of this.$refs['ticket']) card.$el.style.transform = `rotateX(0deg)`;
                    }, 500);
                }
            },
            swipeStart: function(e) {
                if (typeof e['targetTouches'] !== "undefined"){
                    let touch = e.targetTouches[0];
                    this.pStart.x = touch.screenX;
                    this.pStart.y = touch.screenY;
                } else {
                    this.pStart.x = e.screenX;
                    this.pStart.y = e.screenY;
                }
            },
            swipeEnd: function(e) {
                if(this.$refs['pageContent'].scrollTop === 0 && !this.isLoading) {
                    if(this.$refs['ticket']) for (const card of this.$refs['ticket']) card.$el.style.transform = `rotateX(0deg)`;
                }
            },
            swipe: function(e) {
                if (typeof e["changedTouches"] !== "undefined") {
                    let touch = e.changedTouches[0];
                    this.pCurrent.x = touch.screenX;
                    this.pCurrent.y = touch.screenY;
                } else {
                    this.pCurrent.x = e.screenX;
                    this.pCurrent.y = e.screenY;
                }
                let changeY = this.pStart.y < this.pCurrent.y ? Math.abs(this.pStart.y - this.pCurrent.y) : 0;
                const rotation = changeY < 100 ? changeY * 30 / 100 : 30;
                if (this.$refs['pageContent'].scrollTop === 0) {
                    if (changeY > 100) this.loading();
                    if(this.$refs['ticket']) for (const card of this.$refs['ticket']) card.$el.style.transform = `rotateX(${rotation}deg)`;
                }
            },
            displayTicketView: function(ticket) {
                this.$router.push(`/tickets/${ticket.uuid}`);
                if (process.env.NODE_ENV !== 'development') if (!window.matchMedia('(display-mode: standalone)').matches) document.documentElement.requestFullscreen();
            }
        },
        mounted() {
            this.$refs['pageContent'].addEventListener("touchstart", e => this.swipeStart(e), false);
            this.$refs['pageContent'].addEventListener("touchmove", e => this.swipe(e), false);
            this.$refs['pageContent'].addEventListener("touchend", e => this.swipeEnd(e), false);
        },
        beforeDestroy() {
            this.$refs['pageContent'].removeEventListener("touchstart", e => this.swipeStart(e), false);
            this.$refs['pageContent'].removeEventListener("touchmove", e => this.swipe(e), false);
            this.$refs['pageContent'].removeEventListener("touchend", e => this.swipeEnd(e), false);
        }
    }
</script>

<style scoped>
    .loadingIndicator {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100px;
    }
    .tickets-page {
        display: flex;
        flex-direction: column;
        position: relative;
        width: 100%;
        height: 100%;
    }
    .contents-container {
        position: relative;
        min-height: calc(100vh + 100px);
        padding: calc(92px + 4px) 4px 0 4px;
        overflow: auto;
        transform: translateY(-100px);
        transition: all 0.2s ease-in-out;
    }
    .contents-container .contents {
        display: flex;
        position: relative;
        flex-direction: column;
        padding: 4px;
        margin-bottom: 4px;
        min-height: calc(100% - 92px - 8px - 4px);
    }
    .content-container {
        position: relative;
        margin: 0 4px;
    }
    .content-container .content.alerts {
        display: flex;
        overflow-y: auto;
    }
    .content-container .content.alerts.icon-count:after {
        counter-reset: icon-count var(--icon-count);
        content: counter(icon-count);
        display: flex;
        position: absolute;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        right: 0;
        font-family: var(--primary-font);
        background-color: var(--color-dark-accent);
        color: #FFFFFF;
        border-radius: 8px;
    }
    .content-container .content.alerts > *:not(:last-of-type) {
        flex-grow: 1;
    }
    .content-container.buy-tickets {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        flex-grow: 1;
        justify-self: flex-end;
        margin-top: auto;
    }
    .content-container:not(:nth-of-type(1)) {
        margin-top: 20px;
    }
    .content-container .content-title {
        font-size: 18px;
        font-family: var(--primary-font);
        font-weight: 700;
    }
    .overlays-container {
        display: flex;
        position: absolute;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        top: 92px;
        right: 0;
        bottom: 0;
        left: 0;
        pointer-events: none;
    }
    .overlays-container .message {
        display: flex;
        align-items: center;
        font-family: var(--primary-font);
        font-size: 18px;
        font-weight: 700;
        text-align: center;
        color: #444444;
    }

    @media only screen and (min-width: 768px) {
        .content-container .content {
            flex-basis: auto;
            flex-wrap: nowrap;
        }
        .content-container .content .ticket-card-container {
            display: inline-flex;
            width: 400px;
            margin: 10px;
        }
    }
</style>