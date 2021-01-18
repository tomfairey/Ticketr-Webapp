<template>
    <section class="store-container">
        <section class="navigation-container">
            <div class="navigation-content">
                <div class="navigation-item icon start" @click="$router.go(-1)">
                    <v-icon>mdi-chevron-left</v-icon>
                </div>
                <div class="navigation-item text center">
                    <div class="title">Store</div>
                </div>
                <div class="navigation-item icon end">
                </div>
            </div>
        </section>
        <section class="store-content">
            <div class="tickets-container" v-if="!loading && !error">
                <div class="ticket-container" v-for="(ticket, ticketIndex) in tickets" :key="`buy:${ticketIndex}:${ticket.uuid}`">
                    <BuyTicketCard :ticket="ticket" :quantity="!!basket.get(ticket) ? basket.get(ticket).quantity : 0" @click="addToBasket(ticket)"></BuyTicketCard>
                </div>
            </div>
            <div class="tickets-container skeleton" v-if="loading && !error">
                <div class="ticket-container" v-for="i in 14" :key="`skel:${i}`">
                    <div class="skeleton-ticket">
                        <div class="name"></div>
                        <div class="price"></div>
                    </div>
                </div>
            </div>
        </section>
    </section>
</template>

<script>
    import BuyTicketCard from './BuyTicketCard.vue';

    export default {
        name: "Store",
        components: {
            'BuyTicketCard': BuyTicketCard
        },
        data() {
            return {
                tickets: [],
                baskets: this.$store.state.baskets,
                basket: this.$store.state.basketToUse,
                loading: true,
                error: false
            }
        },
        methods: {
            log(...args) {
                console.log(args);
            },
            getTickets: async function() {
                this.loading = true;

                try {
                    this.tickets = await this.$store.state.ticketrApi.getTickets();
                } catch(e) {
                    // There was an error, prompt to check connection and retry
                    this.error = true;
                } finally {
                    this.loading = false;
                }
            },
            addToBasket: async function(ticket) {
                this.loading = true;
                await this.basket.add(ticket);
                this.loading = false;
            }
        },
        mounted() {
            this.getTickets();
        }
    }
</script>

<style scoped>
    .store-container {
        display: flex;
        position: absolute;
        flex-direction: column;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: #FFFFFF;
        overflow: hidden;
    }
    .store-container .navigation-container {
        display: flex;
        position: absolute;
        z-index: 2;
        width: 100%;
        height: 60px;
        align-items: flex-start;
        background-color: var(--color-accent);
        border-radius: 0% 0% 50% 50% / 0% 0% 10% 10%;
        transition: all 0.3s ease-in-out;
    }
    .store-container .navigation-container .navigation-content {
        display: flex;
        width: 100%;
        height: 56px;
        padding: 4px;
    }
    .store-container .navigation-container .navigation-content .navigation-item {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: #FFFFFF;
    }
    .store-container .navigation-container .navigation-content .navigation-item.start {
        justify-self: flex-start;
        justify-content: flex-start;
        flex-shrink: 1;
    }
    .store-container .navigation-container .navigation-content .navigation-item.center {
        justify-self: center;
        justify-content: center;
        flex-grow: 1;
    }
    .store-container .navigation-container .navigation-content .navigation-item.end {
        justify-self: flex-end;
        justify-content: flex-end;
        flex-shrink: 1;
    }
    .store-container .navigation-container .navigation-content .navigation-item.text {
        /* flex-grow: 1; */
        font-family: var(--primary-font);
        font-weight: 500;
        font-size: 18px;
    }
    .store-container .navigation-container .navigation-content .navigation-item.icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 38px;
    }
    .store-container .navigation-container .navigation-content .navigation-item.icon > * {
        font-size: 30px;
        color: inherit;
    }
    .store-container .store-content {
        display: flex;
        position: relative;
        flex-direction: column;
        width: 100%;
        min-height: 100%;
        padding: 62px 4px 4px;
        overflow-y: auto;
    }
    .store-container .store-content .tickets-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 4px 8px;
    }
    .store-container .store-content .tickets-container .ticket-container {
        padding: 0 4px;
        min-width: 400px;
        width: 400px;
        max-width: 400px;
    }
    .store-container .store-content .tickets-container .ticket-container .skeleton-ticket {
        display: flex;
        position: relative;
        flex-direction: column;
        justify-content: flex-start;
        border-radius: 8px;
        overflow: hidden;
        min-height: 182px;
        margin: 12px 0;
        padding: 15px;
        background-color: rgba(0, 0, 0, 0.1);
        box-shadow: 0px 12px 25px rgba(0, 0, 0, 0.3);
    }
    .store-container .store-content .tickets-container .ticket-container .skeleton-ticket .name, .store-container .store-content .tickets-container .ticket-container .skeleton-ticket .price {
        overflow: hidden;
        position: absolute;
        bottom: 15px;
        border-radius: 4px;
        background-color: rgba(0, 0, 0, 0.1);
    }
    .store-container .store-content .tickets-container .ticket-container .skeleton-ticket .name {
        width: 260px;
        height: 42px;
        bottom: 52px;
    }
    .store-container .store-content .tickets-container .ticket-container .skeleton-ticket .price {
        width: 120px;
        height: 30px;
    }
    .store-container .store-content .tickets-container .ticket-container .skeleton-ticket::after, .store-container .store-content .tickets-container .ticket-container .skeleton-ticket .name::after, .store-container .store-content .tickets-container .ticket-container .skeleton-ticket .price::after {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        transform: translateX(-100%);
        background-image: linear-gradient(90deg, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0.4) 20%, rgba(255, 255, 255, 0.7) 60%, rgba(255, 255, 255, 0));
        animation: shimmer 2s ease-in-out infinite;
        content: '';
    }
    @keyframes shimmer {
        to {
            transform: translateX(100%);
        }
    }
</style>